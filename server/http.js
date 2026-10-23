// Shared bits for the api/ functions (Vercel web-standard handlers).
export const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

// Optional: set APP_KEY to stop strangers spending your free quota. The app asks
// for it once and sends it as x-app-key.
export function denied(request, env) {
  if (!env.APP_KEY) return null;
  return request.headers.get('x-app-key') === env.APP_KEY ? null : json({ error: 'key', message: 'This Voc needs an access code.' }, 401);
}

// A speed bump for scripts: per-IP, per-route, in memory. Vercel may run several
// instances (each with its own memory), so this is not a wall; the size caps below
// and APP_KEY are what really protect the quota.
const buckets = new Map();
export function limited(request, name, max = 30, windowMs = 60_000) {
  const forwarded = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown';
  const now = Date.now();
  const key = `${name}:${ip}`;
  let b = buckets.get(key);
  if (!b || now - b.start >= windowMs) {
    if (buckets.size > 2000) for (const [k, v] of buckets) if (now - v.start >= windowMs) buckets.delete(k);
    b = { start: now, n: 0 };
    buckets.set(key, b);
  }
  b.n += 1;
  if (b.n <= max) return null;
  const wait = Math.ceil((b.start + windowMs - now) / 1000);
  return new Response(JSON.stringify({ error: 'busy', message: 'Too many requests just now. Try again in a minute.' }), {
    status: 429,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'retry-after': String(wait) },
  });
}

// Refuse a body before buffering it, when the size is already declared.
export function tooLarge(request, max) {
  const len = Number(request.headers.get('content-length') ?? 0);
  return Number.isFinite(len) && len > max ? json({ error: 'size', message: 'That request is too big.' }, 413) : null;
}

// Provider errors stay in the server log; people see a plain reason.
export function failure(err, what) {
  const errors = err.errors ?? [];
  console.error(what, errors.map(e => `${e.provider} ${e.status} ${e.detail}`).join(' | ') || err.message);
  if (!errors.length) return json({ error: 'setup', message: `No ${what} service is set up on the server yet.` }, 503);
  if (errors.every(e => e.status === 429)) return json({ error: 'busy', message: 'The free service is busy right now. Try again in a minute.' }, 503);
  return json({ error: 'failed', message: `Couldn't reach the ${what} service. Try again.` }, 502);
}
