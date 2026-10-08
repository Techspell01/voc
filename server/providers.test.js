import { afterEach, describe, expect, it, vi } from 'vitest';
import { extractWithLLM } from './extract.js';
import { transcribe } from './transcribe.js';
import { llmProviders, sttProviders } from './providers.js';

const KEYS = { GEMINI_API_KEY: 'g', GROQ_API_KEY: 'q', SARVAM_API_KEY: 's', RETRY_WAIT_MS: '0' };
const reply = (status, body) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

// Route each service's URL to a canned answer, and record the order they were tried in.
function services(routes) {
  const tried = [];
  vi.stubGlobal('fetch', async url => {
    const name = /googleapis/.test(url) ? 'gemini' : /groq/.test(url) ? 'groq' : 'sarvam';
    tried.push(name);
    return routes[name]();
  });
  return tried;
}
afterEach(() => vi.unstubAllGlobals());

describe('provider order', () => {
  it('uses only services with a key, Sarvam last', () => {
    expect(llmProviders(KEYS)).toEqual(['gemini', 'groq', 'sarvam']);
    expect(sttProviders(KEYS)).toEqual(['gemini', 'sarvam']);
    expect(llmProviders({ GEMINI_API_KEY: 'g' })).toEqual(['gemini']);
  });
});

describe('fallback to Sarvam', () => {
  it('reads the note with Sarvam when Gemini is overloaded and Groq is rate-limited', async () => {
    const tried = services({
      gemini: () => reply(503, 'This model is currently experiencing high demand'),
      groq: () => reply(429, 'Rate limit reached. Please try again in 30s.'),
      sarvam: () => reply(200, { choices: [{ message: { content: JSON.stringify({ items: [{ name: 'Rice', said: 'randu kilo ari', qty: 2, unit: 'kg' }], todos: [], events: [] }) } }] }),
    });
    const r = await extractWithLLM('randu kilo ari venam', { today: '2026-10-08', env: KEYS });
    expect(r.engine).toBe('sarvam');
    expect(r.result.items).toMatchObject([{ name: 'Rice', qty: 2, unit: 'kg' }]);
    expect(tried).toEqual(['gemini', 'groq', 'sarvam']);
  });

  it('transcribes with Sarvam when both Gemini speech models fail', async () => {
    const tried = services({
      gemini: () => reply(503, 'high demand'),
      sarvam: () => reply(200, { transcript: 'randu kilo ari venam' }),
    });
    const r = await transcribe(new Uint8Array([1, 2, 3]), { env: KEYS });
    expect(r).toMatchObject({ provider: 'sarvam', text: 'randu kilo ari venam' });
    expect(tried).toEqual(['gemini', 'gemini', 'sarvam']);   // 3.5 Flash, then 3.1 Flash-Lite, then Sarvam
  });

  it('asks the next reader too when Gemini is merely slow, and takes the first answer', async () => {
    const answer = { choices: [{ message: { content: JSON.stringify({ items: [{ name: 'Milk', said: 'paal', qty: 1, unit: 'packet' }], todos: [], events: [] }) } }] };
    const tried = services({
      gemini: () => new Promise(r => setTimeout(() => r(reply(200, { candidates: [] })), 300)),
      groq: () => reply(200, answer),
    });
    const r = await extractWithLLM('oru packet paal', { today: '2026-10-08', env: { ...KEYS, SARVAM_API_KEY: '', LLM_HEDGE_MS: '50' } });
    expect(r.engine).toBe('groq');
    expect(tried).toEqual(['gemini', 'groq']);
  });

  it('gives up with every reason when all three fail', async () => {
    services({ gemini: () => reply(503, 'busy'), groq: () => reply(500, 'down'), sarvam: () => reply(403, 'invalid_api_key_error') });
    await expect(extractWithLLM('paal venam', { today: '2026-10-08', env: KEYS }))
      .rejects.toMatchObject({ errors: [{ provider: 'gemini', status: 503 }, { provider: 'groq', status: 500 }, { provider: 'sarvam', status: 403 }] });
  });
});
