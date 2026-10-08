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

// Provider errors stay in the server log; people see a plain reason.
export function failure(err, what) {
  const errors = err.errors ?? [];
  console.error(what, errors.map(e => `${e.provider} ${e.status} ${e.detail}`).join(' | ') || err.message);
  if (!errors.length) return json({ error: 'setup', message: `No ${what} service is set up on the server yet.` }, 503);
  if (errors.every(e => e.status === 429)) return json({ error: 'busy', message: 'The free service is busy right now. Try again in a minute.' }, 503);
  return json({ error: 'failed', message: `Couldn't reach the ${what} service. Try again.` }, 502);
}
