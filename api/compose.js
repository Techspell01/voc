// POST { kind: 'email' | 'note' | 'append' | 'rewrite', text, today, name?, tone?, email?, how?, note? }
//   -> { result, engine }
import { addToNote, rewriteEmail, writeEmail, writeNote } from '../server/compose.js';
import { denied, failure, json } from '../server/http.js';
import { todayIST } from '../src/lib/manglish/when.js';

export async function POST(request) {
  const env = process.env;
  const no = denied(request, env);
  if (no) return no;
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad', message: 'Bad request.' }, 400); }
  const today = /^\d{4}-\d{2}-\d{2}$/.test(b?.today) ? b.today : todayIST();
  const text = String(b?.text ?? '').trim();
  const name = String(b?.name ?? '').slice(0, 60);
  if (text.length > 6000) return json({ error: 'size', message: 'That note is too long.' }, 413);
  try {
    if (b?.kind === 'rewrite') {
      const email = { subject: String(b?.email?.subject ?? ''), body: String(b?.email?.body ?? ''), to: String(b?.email?.to ?? '') };
      if (!email.body.trim()) return json({ error: 'empty', message: 'Nothing to rewrite.' }, 400);
      return json(await rewriteEmail(email, String(b?.how ?? 'formal'), { today, env, name, original: text }));
    }
    if (!text) return json({ error: 'empty', message: 'Nothing to write from.' }, 400);
    if (b?.kind === 'email') return json(await writeEmail(text, { today, env, name, tone: b?.tone === 'friendly' ? 'friendly' : 'formal' }));
    if (b?.kind === 'note') return json(await writeNote(text, { today, env }));
    if (b?.kind === 'append') {
      const note = { title: String(b?.note?.title ?? '').slice(0, 200), text: String(b?.note?.text ?? '').slice(0, 6000) };
      return json(await addToNote(note, text, { today, env }));
    }
    return json({ error: 'bad', message: 'Unknown kind.' }, 400);
  } catch (err) {
    return failure(err, 'writing');
  }
}
