import { describe, expect, it } from 'vitest';
import { searchTerm, storeById } from './stores.js';
import { gmailUrl } from '../components/EmailCard.jsx';

describe('shop online search terms', () => {
  it('searches the product, with the pack size when there is one', () => {
    expect(searchTerm({ name: 'Matta rice', qty: 5, unit: 'kg', said: '5 kilo matta ari', known: true })).toBe('matta rice 5 kg');
    expect(searchTerm({ name: 'Egg', qty: 10, unit: null, said: 'pathu mutta', known: true })).toBe('egg');
    expect(searchTerm({ name: 'Milk', qty: 2, unit: 'packet', said: '2 packet milma', known: true })).toBe('milma milk');
  });
  it('uses the brand people named', () => {
    expect(searchTerm({ name: 'Noodles', qty: 2, unit: 'packet', said: '2 packet maggi', known: true })).toBe('maggi noodles');
    expect(searchTerm({ name: 'Lays', qty: 3, unit: null, said: 'moonu Lays', known: false })).toBe('lays');
    expect(searchTerm({ name: 'Oats', qty: 1, unit: 'kg', said: 'oru kilo oats', known: true })).toBe('oats 1 kg');
  });
  it('builds store search links', () => {
    expect(storeById('blinkit').search('maggi noodles')).toBe('https://blinkit.com/s/?q=maggi%20noodles');
    expect(storeById('nope').id).toBe('blinkit');
  });
});

describe('email hand-off', () => {
  it('opens Gmail compose with the fields filled', () => {
    const u = new URL(gmailUrl({ to: 'rahul@example.com', subject: 'Leave on 9 Oct', body: 'Dear Rahul,\n\nThanks' }));
    expect(u.searchParams.get('view')).toBe('cm');
    expect(u.searchParams.get('to')).toBe('rahul@example.com');
    expect(u.searchParams.get('su')).toBe('Leave on 9 Oct');
    expect(u.searchParams.get('body')).toBe('Dear Rahul,\n\nThanks');
  });
});

import { BLOCKED } from '../../server/carts.js';
describe('cart agent safety', () => {
  it('withholds every ordering, checkout and payment tool', () => {
    for (const name of ['place_order', 'checkout', 'create_checkout', 'complete_checkout', 'make_payment', 'pay_now', 'cancel_order', 'track_order', 'get_orders'])
      expect(BLOCKED.test(name), name).toBe(true);
    for (const name of ['search_products', 'search_catalog', 'update_cart', 'get_cart', 'create_cart', 'get_saved_addresses', 'lookup_catalog'])
      expect(BLOCKED.test(name), name).toBe(false);
  });
});
