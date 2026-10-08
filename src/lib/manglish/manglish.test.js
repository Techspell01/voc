import { describe, expect, it } from 'vitest';
import { transliterate } from './translit.js';
import { skel } from './normalize.js';
import { annotate } from './normalize.js';
import { resolveWhen, addDays, todayIST } from './when.js';
import { extract } from './parse.js';

const TODAY = '2026-10-08';   // a Thursday
const when = s => resolveWhen(annotate(s).tokens, TODAY);

describe('transliterate', () => {
  it('writes Malayalam the way Manglish is typed', () => {
    expect(transliterate('രണ്ട് കിലോ തക്കാളി')).toBe('randu kilo thakkaali');
    expect(transliterate('നാളെ രാവിലെ')).toBe('naale raavile');
    expect(transliterate('എന്റെ പത്ത് മുട്ട')).toBe('ente pathu mutta');
    expect(transliterate('വാങ്ങണം')).toBe('vaanganam');
    expect(transliterate('പാൽ ഉണ്ട്')).toBe('paal undu');
  });
  it('leaves English words alone', () => {
    expect(transliterate('നാളെ meeting ഉണ്ട്')).toBe('naale meeting undu');
    expect(transliterate('carrot and onion')).toBe('carrot and onion');
  });
});

describe('skel', () => {
  it('merges spelling variants', () => {
    expect(skel('thakkali')).toBe(skel('takkali'));
    expect(skel('naale')).toBe(skel('nale'));
    expect(skel('randu')).toBe(skel('rand'));
    expect(skel('kaal')).toBe(skel('call'));   // why "kaal kilo" needs isVerb()
  });
});

describe('resolveWhen', () => {
  it('handles relative days, weekdays and parts of the day', () => {
    expect(when('nale vaikunneram anchara manikku')).toMatchObject({ date: '2026-10-09', time: '17:30' });
    expect(when('mattannal raavile 6 manikku')).toMatchObject({ date: '2026-10-10', time: '06:00' });
    expect(when('velliyazhcha')).toMatchObject({ date: '2026-10-09', time: null });
    expect(when('adutha velliyazhcha')).toMatchObject({ date: '2026-10-16' });
    expect(when('nale raavile')).toMatchObject({ date: '2026-10-09', time: '09:00', approx: true });
  });
  it('reads a bare 1-6 as pm and 7-11 as am', () => {
    expect(when('anju manikku').time).toBe('17:00');
    expect(when('10 manikku').time).toBe('10:00');
    expect(when('rathri 9 manikku').time).toBe('21:00');
    expect(when('7 pm').time).toBe('19:00');
  });
  it('reads days of the month', () => {
    expect(when('15th theethi').date).toBe('2026-10-15');
    expect(when('7-aam theethi').date).toBe('2026-11-07');     // the 7th has passed
    expect(when('adutha masam 5-aam theethi').date).toBe('2026-11-05');
    expect(when('20 October').date).toBe('2026-10-20');
  });
  it('tells "6-nu" (six o\'clock) from "31-nu" (the 31st)', () => {
    expect(when('today evening 6 nu munne')).toMatchObject({ date: TODAY, time: '18:00' });
    expect(when('31-nu munpu').date).toBe('2026-10-31');
  });
  it('knows today in Kerala', () => {
    expect(todayIST(new Date('2026-10-08T20:00:00Z'))).toBe('2026-10-09');   // 1:30 am IST
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('extract', () => {
  const run = s => extract(s, { today: TODAY });
  it('reads a shop order with Malayalam quantities', () => {
    const r = run('Chetta, randu kilo ari, arakilo cheriya ulli, kaal kilo mulakupodi, pathu mutta venam');
    expect(r.items.map(i => [i.name, i.qty, i.unit])).toEqual([
      ['Rice', 2, 'kg'], ['Shallots', 0.5, 'kg'], ['Chilli powder', 0.25, 'kg'], ['Egg', 10, null],
    ]);
    expect(r.todos).toEqual([]);
  });
  it('reads item-first orders and rupee amounts', () => {
    const r = run('thakkali onnara kilo, nooru roopaykku kariveppila');
    expect(r.items.map(i => [i.name, i.qty, i.unit])).toEqual([['Tomato', 1.5, 'kg'], ['Curry leaves', 100, '₹']]);
  });
  it('drops cancelled items', () => {
    const r = run('randu kilo panchasara, oru dozen mutta. mutta venda');
    expect(r.items.map(i => i.name)).toEqual(['Sugar']);
  });
  it('splits on verbs when speech-to-text gives no punctuation', () => {
    const r = run('current bill adakkanam achane vilikkanam');
    expect(r.todos.map(t => t.title)).toEqual(['Pay electricity bill', 'Call Achan']);
  });
  it('makes events and to-dos with dates', () => {
    const r = run('nale raavile 10 manikku ammede doctor appointment und, reports eduthu vekkanam');
    expect(r.events).toMatchObject([{ title: "Amma's doctor appointment", date: '2026-10-09', time: '10:00' }]);
    expect(r.todos).toMatchObject([{ title: 'Keep reports ready', date: '2026-10-09' }]);
  });
  it('sets the delivery time from a follow-up line', () => {
    const r = run('ari 5 kilo venam. nale raavile ethikkanam');
    expect(r.order).toMatchObject({ date: '2026-10-09', time: '09:00' });
  });
  it('ignores chit-chat and "will call" news', () => {
    expect(run('ok chetta')).toMatchObject({ items: [], todos: [], events: [] });
    expect(run('oru 5 minute kazhinju call cheyyam')).toMatchObject({ todos: [] });
  });
  it('works on Malayalam script', () => {
    const r = run('നാളെ രാവിലെ 10 മണിക്ക് meeting ഉണ്ട്. രണ്ട് കിലോ തക്കാളി വാങ്ങണം');
    expect(r.events).toMatchObject([{ title: 'Meeting', date: '2026-10-09', time: '10:00' }]);
    expect(r.items).toMatchObject([{ name: 'Tomato', qty: 2, unit: 'kg' }]);
  });
});
