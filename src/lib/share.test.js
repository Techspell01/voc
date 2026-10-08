import { describe, expect, it } from 'vitest';
import { qtyText, timeText, whenText } from './format.js';
import { googleCalendarUrl, icsFile, orderText } from './share.js';
import { clean } from '../../server/extract.js';
import { scoreCase } from '../../eval/score.js';

describe('format', () => {
  it('says quantities the way shops do', () => {
    expect(qtyText(0.5, 'kg')).toBe('½ kg');
    expect(qtyText(1.5, 'kg')).toBe('1½ kg');
    expect(qtyText(100, '₹')).toBe('₹100 worth');
    expect(qtyText(2, 'packet')).toBe('2 packets');
    expect(qtyText(10, null)).toBe('10');
  });
  it('says times and days plainly', () => {
    expect(timeText('17:30')).toBe('5:30 pm');
    expect(timeText('09:00', true)).toBe('morning');
    expect(whenText({ date: '2026-10-09', time: '10:00' }, '2026-10-08')).toBe('tomorrow, 10 am');
  });
});

describe('share', () => {
  it('writes a WhatsApp order', () => {
    const text = orderText([{ name: 'Rice', qty: 2, unit: 'kg' }, { name: 'Egg', qty: 10, unit: null }], { date: '2026-10-09', time: '09:00', approx: true }, '2026-10-08');
    expect(text).toBe('*Order* (2 items)\n1. Rice - 2 kg\n2. Egg - 10\n\nDeliver: tomorrow, morning');
  });
  it('builds calendar entries in Kerala time', () => {
    expect(googleCalendarUrl({ title: 'Meeting', date: '2026-10-09', time: '17:30' })).toContain('dates=20261009T173000%2F20261009T183000&ctz=Asia%2FKolkata');
    const ics = icsFile([{ title: 'Meeting', date: '2026-10-09', time: '17:30' }, { title: 'Wedding', date: '2026-10-12', time: null }]);
    expect(ics).toContain('DTSTART:20261009T120000Z');          // 17:30 IST
    expect(ics).toContain('DTSTART;VALUE=DATE:20261012');
  });
});

describe('LLM answer checking', () => {
  it('recomputes dates, names and units, and keeps delivery lines off the to-do list', () => {
    const r = clean(JSON.stringify({
      items: [{ name: 'savala', said: 'randu kilo savala', qty: 2, unit: 'kilo' }, { name: 'Broiler chicken', qty: '1', unit: 'kg' }],
      order_when: null,
      todos: [{ title: 'Bring items', said: 'nale raavile ethikkanam', when: 'nale raavile', date: '2026-10-10', time: '09:00' }],
      events: [
        // our date beats the model's; the model's am/pm is kept when ours would only be a guess
        { title: 'Meeting', when: 'adutha velliyazhcha 7 manikku', date: '2026-10-09', time: '19:00' },
        // "raavile" makes our 10:00 certain, so it beats the model's 22:00
        { title: 'Class', when: 'nale raavile 10 manikku', date: '2026-10-09', time: '22:00' },
      ],
    }), '2026-10-08');
    expect(r.items.map(i => [i.name, i.qty, i.unit])).toEqual([['Onion', 2, 'kg'], ['Chicken', 1, 'kg']]);
    expect(r.todos).toEqual([]);
    expect(r.order).toMatchObject({ date: '2026-10-09' });
    expect(r.events[0]).toMatchObject({ date: '2026-10-16', time: '19:00' });
    expect(r.events[1]).toMatchObject({ date: '2026-10-09', time: '10:00' });
  });
});

describe('cancelled items', () => {
  it('drops "mutta venda" but keeps vendakka (okra)', () => {
    const r = clean(JSON.stringify({ items: [{ name: 'Egg', said: 'mutta venda' }, { name: 'Okra', said: 'vendakka arakilo', qty: 0.5, unit: 'kg' }], todos: [], events: [] }), '2026-10-08');
    expect(r.items.map(i => i.name)).toEqual(['Okra']);
  });
});

describe('eval scoring', () => {
  it('treats ½ kg and 500 g as the same', () => {
    const r = scoreCase({ id: 'x', items: [['Sugar', 0.5, 'kg']] }, { items: [{ name: 'Sugar', qty: 500, unit: 'g' }], todos: [], events: [] });
    expect(r.exact).toBe(true);
  });
});
