// POST { text, today } -> { result, engine }. The phone falls back to the
// offline rule parser itself when this fails.
import { extractWithLLM } from '../server/extract.js';
import { denied, failure, json } from '../server/http.js';
import { todayIST } from '../src/lib/manglish/when.js';

export async function POST(request) {
  const env = process.env;
  const no = denied(request, env);
  if (no) return no;
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad', message: 'Bad request.' }, 400); }
  const text = String(body?.text ?? '').trim();
  if (!text) return json({ error: 'empty', message: 'Nothing to read.' }, 400);
  if (text.length > 4000) return json({ error: 'size', message: 'That note is too long.' }, 413);
  const today = /^\d{4}-\d{2}-\d{2}$/.test(body?.today) ? body.today : todayIST();
  try {
    return json(await extractWithLLM(text, { today, env }));
  } catch (err) {
    return failure(err, 'reading');
  }
}
