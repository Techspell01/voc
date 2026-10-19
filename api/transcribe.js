// POST audio/wav (16 kHz mono, <= 30 s) -> { text, provider }
// ?lang=auto asks for language detection instead of the Manglish prompt.
import { transcribe } from '../server/transcribe.js';
import { denied, failure, json } from '../server/http.js';

const MAX_BYTES = 3 * 1024 * 1024;

export async function POST(request) {
  const env = process.env;
  const no = denied(request, env);
  if (no) return no;
  const audio = new Uint8Array(await request.arrayBuffer());
  if (!audio.length) return json({ error: 'empty', message: 'No audio received.' }, 400);
  if (audio.length > MAX_BYTES) return json({ error: 'size', message: 'That piece of audio is too long.' }, 413);
  // request.url may be absolute (Vercel) or a path (the dev server): read either.
  const query = request.url.includes('?') ? request.url.slice(request.url.indexOf('?')) : '';
  const lang = new URLSearchParams(query).get('lang') === 'auto' ? 'auto' : undefined;
  try {
    return json(await transcribe(audio, { env, lang }));
  } catch (err) {
    return failure(err, 'speech-to-text');
  }
}

export function OPTIONS() { return new Response(null, { status: 204 }); }