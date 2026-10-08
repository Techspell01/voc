// Linking Voc to a Zepto or Instamart account (OAuth with PKCE, on the store's own
// sign-in page) and filling that account's cart from an order list. Tokens stay in
// this phone's storage. The stores currently accept sign-ins only for Voc running on
// localhost; the live site needs their approval first.
import { cartRemote } from './api.js';
import { qtyText } from './format.js';
import { searchTerm } from './stores.js';
import { updateNote } from './store.js';

const KEY = 'voc.carts.v1';
const JOB = 'voc.cartjob';
export const CART_STORES = new Set(['zepto', 'instamart']);
export const canLink = () => ['localhost', '127.0.0.1'].includes(location.hostname);

const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) ?? {}; } catch { return {}; } };
const write = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
const save = (store, patch) => write({ ...read(), [store]: { ...read()[store], ...patch } });
export const isLinked = store => !!read()[store]?.refreshToken || !!read()[store]?.accessToken;
export const unlink = store => { const all = read(); delete all[store]; write(all); };

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = n => b64url(crypto.getRandomValues(new Uint8Array(n)));

// Off to the store's sign-in page; finishLink() picks up when it sends us back.
export async function link(store, noteId) {
  const redirectUri = `${location.origin}/${store}-callback`;
  let saved = read()[store];
  if (!saved?.clientId || saved.redirectUri !== redirectUri) {
    const r = await cartRemote({ action: 'register', store, redirectUri });
    saved = { clientId: r.clientId, redirectUri, authorize: r.authorize, scope: r.scope, resource: r.resource };
    save(store, saved);
  }
  const verifier = random(48);
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  const state = random(16);
  sessionStorage.setItem(JOB, JSON.stringify({ store, state, verifier, noteId }));
  location.assign(`${saved.authorize}?${new URLSearchParams({
    response_type: 'code', client_id: saved.clientId, redirect_uri: redirectUri, code_challenge: challenge,
    code_challenge_method: 'S256', scope: saved.scope, state, resource: saved.resource,
  })}`);
}

export async function finishLink() {
  const m = /^\/(zepto|instamart)-callback\/?$/.exec(location.pathname);
  if (!m) return null;
  const store = m[1];
  const p = new URLSearchParams(location.search);
  let job = null;
  try { job = JSON.parse(sessionStorage.getItem(JOB)); } catch { /* none */ }
  sessionStorage.removeItem(JOB);
  history.replaceState(null, '', '/#orders');
  if (p.get('error') || !job || job.state !== p.get('state') || !p.get('code')) {
    return { store, noteId: job?.noteId, error: p.get('error') === 'access_denied' ? 'Sign-in was cancelled.' : 'Sign-in didn\'t finish. Try again.' };
  }
  const saved = read()[store];
  const t = await cartRemote({ action: 'token', store, code: p.get('code'), verifier: job.verifier, clientId: saved.clientId, redirectUri: saved.redirectUri });
  save(store, { accessToken: t.access_token, refreshToken: t.refresh_token, expiresAt: Date.now() + (t.expires_in ?? 3600) * 1000 });
  return { store, noteId: job.noteId };
}

async function token(store, force = false) {
  const s = read()[store];
  if (!force && s?.accessToken && Date.now() < (s.expiresAt ?? 0) - 60000) return s.accessToken;
  if (!s?.refreshToken) throw Object.assign(new Error('Sign in again.'), { code: 'auth' });
  const t = await cartRemote({ action: 'refresh', store, refreshToken: s.refreshToken, clientId: s.clientId });
  save(store, { accessToken: t.access_token, refreshToken: t.refresh_token ?? s.refreshToken, expiresAt: Date.now() + (t.expires_in ?? 3600) * 1000 });
  return t.access_token;
}

// Fill the store's cart from an order note; progress and the result live on the note.
export async function fillOrder(note, store) {
  const items = (note.result?.items ?? []).filter(it => !note.done?.[it.id])
    .map(it => ({ name: it.name, amount: qtyText(it.qty, it.unit), said: it.said, term: searchTerm(it) }));
  const at = new Date().toISOString();
  updateNote(note.id, { cart: { store, status: 'filling', at, count: items.length } });
  const run = async force => cartRemote({ action: 'fill', store, token: await token(store, force), items });
  try {
    let r;
    try { r = await run(false); } catch (err) { if (err.code !== 'auth') throw err; r = await run(true); }
    updateNote(note.id, { cart: { store, status: 'done', at, added: r.added, missing: r.missing, note: r.note } });
  } catch (err) {
    if (err.code === 'auth') unlink(store);
    updateNote(note.id, { cart: { store, status: 'error', at, message: err.code === 'auth' ? 'Sign in again to fill the cart.' : err.message } });
  }
}
