// GET -> which services this server can use (names only, never keys).
import { llmProviders, sttProviders } from '../server/providers.js';
import { json } from '../server/http.js';

export function GET() {
  const env = process.env;
  return json({ stt: sttProviders(env), llm: llmProviders(env), locked: !!env.APP_KEY });
}
