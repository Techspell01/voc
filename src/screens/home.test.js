// Home makes an email; notes and lists are made in their own sections.
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import New from './New.jsx';
import Orders from './Orders.jsx';
import Todo from './Todo.jsx';

const base = {
  busy: null, error: '', canHear: true, status: 'Speech by Gemini · writing by Gemini',
  go() {}, onAudio() {}, onText() {}, onEdit() {}, today: '2026-10-21',
};
const render = (Screen, props = {}) => renderToStaticMarkup(createElement(Screen, { ...base, ...props }));

describe('the Home screen', () => {
  it('asks for an email, and offers the translator', () => {
    const html = render(New);
    expect(html).toContain('Speak an');
    expect(html).toContain('Record your email');
    expect(html).toContain('Say your reply in English');
  });

  it('no longer offers Note or Lists', () => {
    const html = render(New);
    expect(html).not.toContain('Speak a note');
    expect(html).not.toContain('Say it in<br/>Manglish');
    expect(html).not.toContain('role="radio"');
  });
});

describe('the Orders screen', () => {
  it('is where a list is spoken, with a typed way in too', () => {
    const html = render(Orders, { notes: [] });
    expect(html).toContain('Speak an order');
    expect(html).toContain('No orders yet');
    expect(html).toContain('Or type it');
  });

  it('adds more to an existing order in place', () => {
    const note = { id: 'n1', at: new Date().toISOString(), source: 'voice', result: { items: [{ id: 'i0', name: 'Rice', qty: 2, unit: 'kg' }] }, done: {} };
    const html = render(Orders, { notes: [note] });
    expect(html).toContain('Add more items');
    expect(html).toContain('Rice');
  });
});

describe('the To-do screen', () => {
  it('sends you to Orders to record a list', () => {
    expect(render(Todo, { notes: [] })).toContain('Record a list');
  });
});
