// Talking to our own api/ functions. Every failure becomes a plain message.
import { getSettings } from './store.js';

export class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

async function request(path, init = {}, timeoutMs = 60000) {
  const key = getSettings().appKey;
  let res;
  try {
    res = await fetch(path, {
      ...init,
      headers: { ...(init.headers ?? {}), ...(key ? { 'x-app-key': key } : {}) },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new ApiError(navigator.onLine === false ? 'You are offline.' : 'Could not reach Voc.', 'network');
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message ?? 'Something went wrong.', data?.error ?? 'failed');
  return data;
}

export const status = () => request('/api/status', {}, 8000);

export const transcribeChunk = wavBlob => request('/api/transcribe', {
  method: 'POST', headers: { 'content-type': 'audio/wav' }, body: wavBlob,
});

export const extractRemote = (text, today) => request('/api/extract', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, today }),
}, 45000);

export const composeRemote = body => request('/api/compose', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}, 50000);

// Filling a store cart can take a minute: one search per item, then the cart.
export const cartRemote = body => request('/api/cart', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}, 240000);

// Android test sign-up: no access code needed, it spends no AI quota.
export const joinAndroidTest = body => request('/api/testers', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}, 15000);
