import { describe, expect, it } from 'vitest';
import { blobName, checkSignup, phoneOf, sameKey, toCsv } from './testers.js';

describe('Android test sign-ups', () => {
  it('takes a tidy email and name', () => {
    expect(checkSignup({ email: '  Anu.K@Gmail.com ', name: '  Anu   K ' })).toEqual({ email: 'anu.k@gmail.com', name: 'Anu K' });
    expect(checkSignup({ email: 'a@b.in' })).toEqual({ email: 'a@b.in', name: '' });
  });

  it('turns away bad emails with a plain reason', () => {
    expect(checkSignup({ email: '' }).error).toMatch(/Type your email/);
    for (const email of ['anu', 'anu@gmail', 'anu @gmail.com', '@gmail.com', `${'a'.repeat(250)}@gmail.com`]) {
      expect(checkSignup({ email }).error).toMatch(/doesn't look right/);
    }
    expect(checkSignup(null).error).toBeTruthy();
  });

  it('quietly drops bots that fill the hidden field', () => {
    expect(checkSignup({ email: 'a@b.in', website: 'http://spam' })).toEqual({ bot: true });
  });

  it('keeps one row per email', () => {
    expect(blobName('a@b.in')).toBe(blobName('a@b.in'));
    expect(blobName('a@b.in')).not.toBe(blobName('c@b.in'));
    expect(blobName('a@b.in')).toMatch(/^testers\/[0-9a-f]{32}\.json$/);
  });

  it('reads the phone from the browser', () => {
    expect(phoneOf('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('Android');
    expect(phoneOf('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)')).toBe('iPhone');
    expect(phoneOf('')).toBe('Other');
  });

  it('checks the admin key', () => {
    expect(sameKey('abc', 'abc')).toBe(true);
    expect(sameKey('abd', 'abc')).toBe(false);
    expect(sameKey('abc', undefined)).toBe(false);
    expect(sameKey(null, 'abc')).toBe(false);
  });

  it('writes CSV oldest first, quoting commas', () => {
    const csv = toCsv([
      { email: 'b@b.in', name: 'B, Jr', phone: 'Android', joined: '2026-10-10T05:00:00Z' },
      { email: 'a@b.in', name: '', phone: 'iPhone', joined: '2026-10-09T05:00:00Z' },
    ]);
    expect(csv).toBe('email,name,phone,joined\na@b.in,,iPhone,2026-10-09\nb@b.in,"B, Jr",Android,2026-10-10\n');
  });
});
