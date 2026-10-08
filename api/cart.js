// POST { action: 'register' | 'token' | 'refresh' | 'fill', store, ... }
// Sign-in with Zepto / Instamart and filling their cart. Tokens live on the phone;
// this function only passes them through.
import { exchange, fillCart, refresh, register, STORES } from '../server/carts.js';
import { denied, json } from '../server/http.js';

export async function POST(request) {
  const env = process.env;
  const no = denied(request, env);
  if (no) return no;
  let b;
  try { b = await request.json(); } catch { return json({ error: 'bad', message: 'Bad request.' }, 400); }
  const store = String(b?.store ?? '');
  if (!STORES[store]) return json({ error: 'bad', message: 'Unknown store.' }, 400);
  try {
    if (b.action === 'register') return json(await register(store, String(b.redirectUri ?? '')));
    if (b.action === 'token') return json(await exchange(store, b));
    if (b.action === 'refresh') return json(await refresh(store, b));
    if (b.action === 'fill') {
      if (!env.GEMINI_API_KEY) return json({ error: 'setup', message: 'Cart filling needs the Gemini key on the server.' }, 503);
      const items = (Array.isArray(b.items) ? b.items : []).slice(0, 30).map(it => ({
        name: String(it.name ?? '').slice(0, 80), amount: String(it.amount ?? '').slice(0, 40), said: String(it.said ?? '').slice(0, 120), term: String(it.term ?? '').slice(0, 80),
      })).filter(it => it.name);
      if (!items.length) return json({ error: 'empty', message: 'No items to add.' }, 400);
      return json(await fillCart(store, { token: String(b.token ?? ''), items, env }));
    }
    return json({ error: 'bad', message: 'Unknown action.' }, 400);
  } catch (err) {
    if (err.name === 'McpAuthError') return json({ error: 'auth', message: `Sign in to ${STORES[store].name} again.` }, 401);
    console.error('cart', store, b.action, err.message);
    return json({ error: 'failed', message: err.message || 'Something went wrong with the store.' }, 502);
  }
}
