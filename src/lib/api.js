// Talking to our own api/ functions. Every failure becomes a plain message.
import { getSettings } from './store.js';
import { Capacitor } from '@capacitor/core';

// In the Android app there is no local server, so call the live backend.
// On the website this stays empty and the relative /api/... paths work as before.
const API_BASE = Capacitor.isNativePlatform() ? 'https://usevoc.vercel.app' : '';

export class ApiError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

async function request(path, init = {}, timeoutMs = 60000) {
  const key = getSettings().appKey;
  let res;
  try {
   res = await fetch(API_BASE + path, {
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

// { lang: 'auto' } asks the speech service to work out Malayalam / Hindi / English
// itself (the Translate screen). Every other screen keeps the Manglish prompt.
export const transcribeChunk = (wavBlob, { lang } = {}) => request(lang ? `/api/transcribe?lang=${encodeURIComponent(lang)}` : '/api/transcribe', {
  method: 'POST', headers: { 'content-type': 'audio/wav' }, body: wavBlob,
});

export const extractRemote = (text, today) => request('/api/extract', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, today }),
}, 45000);

// More for an existing list: the server gets the list so far, and returns only the new items.
export const appendListRemote = (text, today, existing) => request('/api/extract', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text, today, existing }),
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
