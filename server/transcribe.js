// Speech -> Manglish text. The phone sends 16 kHz mono WAV chunks of at most
// 28 s (Sarvam's real-time limit is 30 s), so every provider gets the same input.
import { call, firstOf, setting, sttProviders } from './providers.js';

// Same output shape from every provider: Malayalam words in Malayalam script,
// English words in English, numbers as digits. parse.js transliterates the rest.
const GEMINI_PROMPT = `Transcribe this voice note word for word. The speaker is from Kerala and mixes Malayalam and English (Manglish).
Write Malayalam words in Malayalam script and English words in English letters, exactly as spoken. English words said in a Malayalam accent are still English: write meeting, report, client, presentation, gas, book, bill, packet, kilo, doctor, appointment in English letters. Do not translate. Write numbers, quantities and times as digits.
Return only the transcript. If there is no speech, return an empty string.`;

const EXT = { 'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'audio/ogg': 'ogg' };

const providers = {
  async sarvam(audio, env, mime) {
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mime }), `note.${EXT[mime] ?? 'wav'}`);
    form.append('model', setting(env, 'SARVAM_MODEL'));
    form.append('mode', 'codemix');           // English words stay in English letters
    form.append('language_code', env.SARVAM_LANGUAGE || 'ml-IN');
    const data = await call('sarvam', 'https://api.sarvam.ai/speech-to-text', {
      method: 'POST', headers: { 'api-subscription-key': env.SARVAM_API_KEY }, body: form,
    }, 30000, env);
    return data.transcript ?? '';
  },

  async gemini(audio, env, mime) {
    const body = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: GEMINI_PROMPT }, { inlineData: { mimeType: mime, data: Buffer.from(audio).toString('base64') } }] }],
      generationConfig: { temperature: 0 },
    });
    const ask = model => call('gemini', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY }, body,
    }, 45000, env);
    let data;
    try {
      data = await ask(setting(env, 'GEMINI_STT_MODEL'));
    } catch (err) {
      if (!err.transient || !setting(env, 'GEMINI_STT_FALLBACK')) throw err;
      data = await ask(setting(env, 'GEMINI_STT_FALLBACK'));
    }
    return (data.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('').trim();
  },

  async groq(audio, env, mime) {
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mime }), `note.${EXT[mime] ?? 'wav'}`);
    form.append('model', setting(env, 'GROQ_STT_MODEL'));
    form.append('language', 'ml');
    form.append('response_format', 'json');
    form.append('temperature', '0');
    const data = await call('groq', 'https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { authorization: `Bearer ${env.GROQ_API_KEY}` }, body: form,
    }, 30000, env);
    return (data.text ?? '').trim();
  },
};

export const STT_NAMES = Object.keys(providers);

export async function transcribe(audio, { env, only, mime = 'audio/wav' } = {}) {
  const list = only ? [only].filter(p => sttProviders(env).includes(p)) : sttProviders(env);
  const t0 = Date.now();
  // a 28 s chunk normally takes 3-6 s; past 15 s the next service starts in parallel
  const hedgeMs = Number(env.STT_HEDGE_MS ?? 15000);
  const { provider, value } = await firstOf(list, p => providers[p](audio, env, mime), { hedgeMs });
  return { text: value, provider, ms: Date.now() - t0 };
}
