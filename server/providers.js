// The model services Voc can use, and the keys that switch them on.
// Gemini and Groq have free tiers; Sarvam (built for Indian code-mixed speech) gives ₹100 of credit,
// so it is the backup for both steps: used when the free services are down, busy or over quota.
// Keys only ever live on the server (.env.local locally, Vercel env in production).

export const DEFAULTS = {
  SARVAM_MODEL: 'saaras:v3',
  GEMINI_STT_MODEL: 'gemini-3.5-flash',
  // when 3.5 Flash is overloaded (503). Not 3.5 Flash-Lite: it drifts into Tamil script on Malayalam.
  GEMINI_STT_FALLBACK: 'gemini-3.1-flash-lite',
  GEMINI_MODEL: 'gemini-3.5-flash-lite',
  GROQ_MODEL: 'openai/gpt-oss-120b',
  GROQ_STT_MODEL: 'whisper-large-v3',
  SARVAM_LLM_MODEL: 'sarvam-105b',
};
const KEYS = { sarvam: 'SARVAM_API_KEY', gemini: 'GEMINI_API_KEY', groq: 'GROQ_API_KEY' };

export const setting = (env, name) => env[name] || DEFAULTS[name];

function order(env, listVar, fallback) {
  const wanted = (env[listVar] || fallback).split(',').map(s => s.trim()).filter(Boolean);
  return wanted.filter(p => env[KEYS[p]]);
}
// Speech-to-text: Gemini (free), then Sarvam. Sarvam may well be the more accurate
// on real Manglish; once `npm run eval:audio` shows it, STT_PROVIDERS=sarvam,gemini
// makes it first. Groq's Whisper is opt-in only (STT_PROVIDERS=...,groq): asked for
// Malayalam it writes the sounds in Gurmukhi (Punjabi) script, which nothing downstream can read.
export const sttProviders = env => order(env, 'STT_PROVIDERS', 'gemini,sarvam');
// Reading the transcript into actions.
// Gemini first: in the eval it read Malayalam numbers better than Groq's gpt-oss (eval/results).
export const llmProviders = env => order(env, 'LLM_PROVIDERS', 'gemini,groq,sarvam');

export class ProviderError extends Error {
  constructor(provider, status, detail) {
    super(`${provider} ${status}`);
    this.provider = provider;
    this.status = status;
    this.detail = String(detail ?? '').slice(0, 300);
    // worth trying the next provider: rate limits, overload, timeouts
    this.transient = status === 429 || status >= 500 || status === 0;
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// How long a 429 asks us to wait: the Retry-After header, or "try again in 487.5ms" / "retry in 12s" in the body.
function retryAfter(res, body) {
  const h = Number(res.headers.get('retry-after'));
  if (h > 0) return h * 1000;
  const m = /(?:try again|retry) in ([\d.]+)\s*(ms|s)/i.exec(body);
  return m ? Math.ceil(+m[1] * (m[2] === 'ms' ? 1 : 1000)) : 2000;
}

// Free tiers rate-limit per minute, so a 429 is waited out once or twice
// (up to RETRY_WAIT_MS in total, short by default so the app stays snappy).
export async function call(provider, url, init, timeoutMs = 30000, env = process.env) {
  let budget = Number(env?.RETRY_WAIT_MS ?? 6000);
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      // a dropped connection ("fetch failed") is tried again, within the wait budget; a timeout isn't
      const wait = [800, 3000, 8000][attempt];
      if (wait && err.name !== 'TimeoutError' && wait <= budget) { budget -= wait; await sleep(wait); continue; }
      throw new ProviderError(provider, 0, err.message);
    }
    if (res.ok) return res.json();
    const body = await res.text().catch(() => '');
    // 429 rate limit: wait as told. 503 "high demand": a short pause sometimes clears it.
    const wait = res.status === 429 ? retryAfter(res, body) + 250 : res.status === 503 ? 2000 * (attempt + 1) : 0;
    if (wait && attempt < 4 && wait <= budget) { budget -= wait; await sleep(wait); continue; }
    throw new ProviderError(provider, res.status, body);
  }
}

// Try each provider in turn; the first answer wins. A provider that fails hands
// over at once. With hedgeMs, one that is merely slow (Gemini under "high demand"
// took 37 s on 2026-10-08) gets company: after hedgeMs the next provider starts too,
// and whichever answers first is used.
export function firstOf(providers, fn, { hedgeMs = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let next = 0;
    let running = 0;
    let settled = false;
    let timer = null;
    const finish = () => {
      settled = true;
      clearTimeout(timer);
      const err = new Error(errors.length ? 'all providers failed' : 'no provider configured');
      err.errors = errors;
      reject(err);
    };
    const launch = () => {
      if (settled) return;
      if (next >= providers.length) { if (!running) finish(); return; }
      const p = providers[next++];
      running++;
      clearTimeout(timer);
      if (hedgeMs > 0 && next < providers.length) timer = setTimeout(launch, hedgeMs);
      Promise.resolve().then(() => fn(p)).then(
        value => { if (!settled) { settled = true; clearTimeout(timer); resolve({ provider: p, value }); } },
        err => { running--; errors.push(err); if (!settled) launch(); },
      );
    };
    launch();
  });
}
