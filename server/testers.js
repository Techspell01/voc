// Sign-ups for the Android test. Google Play makes a new personal account run a
// closed test with 12+ testers for 14 days before an app can go public, so the
// web app collects them first. Each email is one private blob, named by its
// hash, so signing up twice just updates the same row.
import { createHash, timingSafeEqual } from 'node:crypto';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// -> { email, name } | { error } | { bot: true }
export function checkSignup(body) {
  if (!body || typeof body !== 'object') return { error: 'Send your email address.' };
  if (typeof body.website === 'string' && body.website.trim()) return { bot: true };   // the hidden field only bots fill
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email) return { error: 'Type your email address.' };
  if (email.length > 254 || !EMAIL.test(email)) return { error: "That email address doesn't look right." };
  const name = typeof body.name === 'string' ? body.name.replace(/\s+/g, ' ').trim().slice(0, 60) : '';
  return { email, name };
}

export const phoneOf = ua => (/android/i.test(ua) ? 'Android' : /iphone|ipad|ipod/i.test(ua) ? 'iPhone' : 'Other');

export const blobName = email => `testers/${createHash('sha256').update(email).digest('hex').slice(0, 32)}.json`;

export function sameKey(given, key) {
  if (!key || typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

const cell = v => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));

// Oldest first, ready to paste into Play Console's tester list.
export function toCsv(rows) {
  const sorted = [...rows].sort((a, b) => String(a.joined).localeCompare(String(b.joined)));
  return ['email,name,phone,joined', ...sorted.map(r => [r.email, r.name ?? '', r.phone ?? '', String(r.joined ?? '').slice(0, 10)].map(cell).join(','))].join('\n') + '\n';
}
