// POST audio/wav (16 kHz mono, <= 30 s) -> { text, provider }
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
  try {
    return json(await transcribe(audio, { env }));
  } catch (err) {
    return failure(err, 'speech-to-text');
  }
}
