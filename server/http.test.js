import { describe, expect, it } from 'vitest';
import { limited, tooLarge } from './http.js';

const fake = headers => ({ headers: new Headers(headers) });

describe('api guards', () => {
  it('stops a burst from one address', async () => {
    const r = fake({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' });
    expect(limited(r, 'test-burst', 2)).toBeNull();
    expect(limited(r, 'test-burst', 2)).toBeNull();
    const no = limited(r, 'test-burst', 2);
    expect(no.status).toBe(429);
    expect(no.headers.get('retry-after')).toBeTruthy();
    expect((await no.json()).error).toBe('busy');
  });

  it('counts each address separately', () => {
    expect(limited(fake({ 'x-forwarded-for': '198.51.100.1' }), 'test-sep', 1)).toBeNull();
    expect(limited(fake({ 'x-forwarded-for': '198.51.100.2' }), 'test-sep', 1)).toBeNull();
  });

  it('refuses a body that says it is too big, before reading it', () => {
    expect(tooLarge(fake({ 'content-length': '999999' }), 1024).status).toBe(413);
    expect(tooLarge(fake({}), 1024)).toBeNull();
  });
});
