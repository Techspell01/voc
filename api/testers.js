// POST { email, name?, website? } -> { ok }: join the Android test (no access code needed).
// GET ?key=TESTERS_KEY -> the sign-ups as CSV, for Play Console's tester list.
// Emails sit in the private Vercel Blob store "voc-testers" (BLOB_READ_WRITE_TOKEN).
import { get, list, put } from '@vercel/blob';
import { json } from '../server/http.js';
import { blobName, checkSignup, phoneOf, sameKey, toCsv } from '../server/testers.js';

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return json({ error: 'setup', message: "Sign-ups aren't open yet. Try again later." }, 503);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad', message: 'Bad request.' }, 400); }
  const s = checkSignup(b);
  if (s.error) return json({ error: 'invalid', message: s.error }, 400);
  if (s.bot) return json({ ok: true });
  const row = { email: s.email, name: s.name, phone: phoneOf(request.headers.get('user-agent') ?? ''), joined: new Date().toISOString() };
  try {
    await put(blobName(s.email), JSON.stringify(row), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  } catch (err) {
    console.error('testers put', err.message);
    return json({ error: 'failed', message: "Couldn't save that. Try again in a minute." }, 502);
  }
  return json({ ok: true });
}

export async function GET(request) {
  if (!sameKey(new URL(request.url).searchParams.get('key'), process.env.TESTERS_KEY)) return json({ error: 'key', message: 'Not found.' }, 404);
  const rows = [];
  let cursor;
  do {
    const page = await list({ prefix: 'testers/', limit: 1000, cursor });
    for (const blob of page.blobs) {
      const got = await get(blob.pathname, { access: 'private', useCache: false });
      if (got?.statusCode === 200) rows.push(await new Response(got.stream).json().catch(() => ({ email: blob.pathname })));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return new Response(toCsv(rows), { headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
}
