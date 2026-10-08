// One way to ask any of the AI services for JSON: Gemini first (free), then Groq
// (free), then Sarvam (₹100 of credit). A service that fails hands over at once;
// one that is slower than LLM_HEDGE_MS gets the next one started alongside, and
// the first good answer wins. `check` turns raw text into the caller's result and
// throws if it's unusable, which also hands over to the next service.
import { call, firstOf, llmProviders, ProviderError, setting } from './providers.js';

const services = {
  async gemini(system, user, env) {
    const model = setting(env, 'GEMINI_MODEL');
    const data = await call('gemini', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' },
      }),
    }, 30000, env);
    return (data.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('');
  },
  async groq(system, user, env) {
    const data = await call('groq', 'https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: setting(env, 'GROQ_MODEL'),
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' },
        temperature: 0,
        reasoning_effort: env.GROQ_REASONING || 'low',
      }),
    }, 30000, env);
    return data.choices?.[0]?.message?.content ?? '';
  },
  // Last in line by default: Sarvam's free offer is ₹100 of credit, not a free tier.
  async sarvam(system, user, env) {
    const data = await call('sarvam', 'https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'api-subscription-key': env.SARVAM_API_KEY },
      body: JSON.stringify({
        model: setting(env, 'SARVAM_LLM_MODEL'),
        messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        reasoning_effort: 'low',
        max_tokens: 4096,   // reasoning counts toward this; 4096 is the Starter plan's cap
      }),
    }, 45000, env);
    const content = data.choices?.[0]?.message?.content ?? '';
    if (!content.trim()) throw new ProviderError('sarvam', 0, 'empty answer (reasoning used up max_tokens)');
    return content;
  },
};

export const parseJSON = raw => JSON.parse(String(raw).trim().replace(/^```(?:json)?\s*|\s*```$/g, ''));

export async function askJSON({ system, user, env, only, check = parseJSON }) {
  const list = only ? [only].filter(p => llmProviders(env).includes(p)) : llmProviders(env);
  const hedgeMs = Number(env.LLM_HEDGE_MS ?? 5000);   // a reply normally takes 1-3 s
  const t0 = Date.now();
  const { provider, value } = await firstOf(list, async p => check(await services[p](system, user, env)), { hedgeMs });
  return { provider, value, ms: Date.now() - t0 };
}
