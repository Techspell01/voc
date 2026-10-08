// Filling a real cart in Zepto or Swiggy Instamart through their official MCP
// servers. The user signs in on the store's own page (OAuth with PKCE, phone + OTP);
// Voc only holds the token on the phone and passes it through. An AI agent uses the
// store's tools to search each item and put the best match in the cart.
//
// Voc never orders or pays: it doesn't ask for order or checkout permission, and any
// tool whose name looks like ordering, checkout or payment is withheld from the agent.
// As of 2026-10-09 both stores accept sign-in redirects to http://localhost only;
// usevoc.vercel.app needs each store to approve it (Zepto: GitHub issue; Swiggy: Builders Club).
import { openMcp, resultText } from './mcp.js';
import { call, setting } from './providers.js';

export const STORES = {
  zepto: {
    name: 'Zepto',
    mcp: 'https://mcp.zepto.co.in/mcp',
    resource: 'https://mcp.zepto.co.in',
    auth: 'https://auth.zepto.co.in',
    // no order or checkout scopes, on purpose
    scope: 'tools:read tools:write dev.ucp.shopping.cart:manage dev.ucp.shopping.catalog.search:read dev.ucp.shopping.catalog.lookup:read dev.ucp.common.location.search:read dev.ucp.common.location.lookup:read',
  },
  instamart: {
    name: 'Instamart',
    mcp: 'https://mcp.swiggy.com/im',
    resource: 'https://mcp.swiggy.com',
    auth: 'https://mcp.swiggy.com/auth',
    scope: 'mcp:tools',
  },
};

export const BLOCKED = /checkout|order|pay|place|cancel|track|refund|wallet|coupon|tip/i;

async function form(url, params) {
  const res = await fetch(url, {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: new URLSearchParams(params), signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error_description || data.error || `sign-in failed (${res.status})`);
  return data;
}

export async function register(storeId, redirectUri) {
  const s = STORES[storeId];
  const res = await fetch(`${s.auth}/register`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      client_name: 'Voc (voice notes)', redirect_uris: [redirectUri], grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'], token_endpoint_auth_method: 'none', scope: s.scope,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.client_id) {
    const notAllowed = /redirect/i.test(`${data.error} ${data.message ?? ''}`);
    throw new Error(notAllowed ? `${s.name} hasn't approved this web address yet.` : `${s.name} sign-in setup failed.`);
  }
  return { clientId: data.client_id, authorize: `${s.auth}/authorize`, scope: s.scope, resource: s.resource };
}

export const exchange = (storeId, { code, verifier, clientId, redirectUri }) => form(`${STORES[storeId].auth}/token`, {
  grant_type: 'authorization_code', code, code_verifier: verifier, client_id: clientId, redirect_uri: redirectUri, resource: STORES[storeId].resource,
});
export const refresh = (storeId, { refreshToken, clientId }) => form(`${STORES[storeId].auth}/token`, {
  grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, resource: STORES[storeId].resource,
});

// --- the cart agent ---------------------------------------------------------------

function instructions(store) {
  return `You fill the user's ${store} cart from their shopping list, using ${store}'s own tools.

- Never place an order, check out or pay. Only look things up and change the cart. The user pays in the ${store} app.
- If the tools need a delivery address or location first, use the user's saved default address (look it up with the address or location tools). If there is none, stop and say so in "note".
- Search for every list item; you may call several searches at once. For each, choose the single best product: the same thing the user asked for, the brand they named if any, in stock, the pack size closest to what they asked. Prefer the common everyday pack.
- Quantity: the number of packs that makes up the asked amount (2 kg rice with a 1 kg pack: 2; half a kilo with a 500 g pack: 1; 10 eggs: the closest egg pack). If no amount was given, 1. Never add more than needed.
- Add every chosen product to the cart. If the cart tool replaces the whole cart, read the cart first and send what's there plus the new items.
- Skip what you can't find. Don't substitute something different.

When done, reply with only this JSON:
{"added":[{"item":"<list item>","product":"<product name>","quantity":1,"price":"<₹ if shown>"}],"missing":["<list item>"],"note":"<one short sentence if the user must do something, else empty>"}`;
}

function shoppingList(items) {
  return `Shopping list:\n${items.map(it => `- ${it.name}${it.amount ? `: ${it.amount}` : ''}${it.said ? ` (said: "${it.said}")` : ''}${it.term ? ` [search hint: ${it.term}]` : ''}`).join('\n')}`;
}

function summary(text) {
  const m = /\{[\s\S]*\}/.exec(text ?? '');
  try {
    const j = JSON.parse(m?.[0] ?? '');
    return { added: Array.isArray(j.added) ? j.added : [], missing: Array.isArray(j.missing) ? j.missing : [], note: String(j.note ?? '') };
  } catch {
    return { added: [], missing: [], note: String(text ?? '').slice(0, 300) };
  }
}

const schema = s => {
  const { $schema, ...rest } = s ?? {};
  return Object.keys(rest).length ? rest : { type: 'object', properties: {} };
};

export async function fillCart(storeId, { token, items, env, mcp: injected }) {
  const store = STORES[storeId];
  const mcp = injected ?? await openMcp(store.mcp, token);
  const tools = (await mcp.list()).filter(t => !BLOCKED.test(t.name));
  const allowed = new Set(tools.map(t => t.name));
  const model = env.CART_MODEL || setting(env, 'GEMINI_MODEL');
  const declarations = tools.map(t => ({ name: t.name, description: String(t.description ?? '').slice(0, 1000), parametersJsonSchema: schema(t.inputSchema) }));
  const contents = [{ role: 'user', parts: [{ text: shoppingList(items) }] }];
  const log = [];

  for (let step = 0; step < 24; step++) {
    const data = await call('gemini', `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instructions(store.name) }] },
        contents,
        tools: [{ functionDeclarations: declarations }],
        generationConfig: { temperature: 0 },
      }),
    }, 60000, { ...env, RETRY_WAIT_MS: env.RETRY_WAIT_MS ?? '20000' });
    const content = data.candidates?.[0]?.content;
    if (!content?.parts?.length) throw new Error('The assistant gave no answer.');
    contents.push(content);   // as returned, so Gemini's thought signatures go back with it
    const calls = content.parts.filter(p => p.functionCall).map(p => p.functionCall);
    if (!calls.length) return { ...summary(content.parts.map(p => p.text ?? '').join('')), steps: log };

    const replies = [];
    for (const fc of calls) {
      let response;
      if (!allowed.has(fc.name)) response = { error: 'Not allowed: Voc only searches and fills the cart. The user orders and pays in the app.' };
      else {
        try {
          const r = await mcp.call(fc.name, fc.args ?? {});
          response = { result: resultText(r).slice(0, 9000), ...(r?.isError ? { isError: true } : {}) };
        } catch (err) {
          if (err.name === 'McpAuthError') throw err;
          response = { error: err.message };
        }
      }
      log.push({ tool: fc.name, ok: !response.error && !response.isError });
      replies.push({ functionResponse: { name: fc.name, ...(fc.id ? { id: fc.id } : {}), response } });
    }
    contents.push({ role: 'user', parts: replies });
  }
  throw new Error('Filling the cart took too many steps.');
}
