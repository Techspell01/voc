// The Translate screen renders on its own: no network, no microphone.
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import Translate from './Translate.jsx';

const base = { busy: null, error: '', canHear: true, go() {}, onAudio() {}, onText() {}, onClear() {} };
const render = props => renderToStaticMarkup(createElement(Translate, { ...base, ...props }));

describe('the Translate screen', () => {
  it('opens on the record card and says what it is for', () => {
    const html = render({});
    expect(html).toContain('Translate');
    expect(html).toContain('Say your reply');
    expect(html).toContain('Malayalam, Hindi or Manglish');
    expect(html).toContain('Or type it');
    expect(html).not.toContain('Send this');
  });

  it('shows the English reply, with the words said and a way out', () => {
    const html = render({ result: { text: 'Call me at 10 am.', from: 'Hindi', said: 'Kal 10 baje call karunga', stt: 'gemini', fallback: null } });
    expect(html).toContain('Said in Hindi');
    expect(html).toContain('Call me at 10 am.');
    expect(html).toContain('You said: Kal 10 baje call karunga');
    expect(html).toContain('https://wa.me/?text=Call%20me%20at%2010%20am.');
    expect(html).toContain('Copy');
  });

  it('keeps the words as they were when there is nothing to show but them', () => {
    const html = render({ result: { text: 'hello', from: null, said: 'hello', stt: 'gemini', fallback: 'You are offline.' } });
    expect(html).toContain('English reply');
    expect(html).toContain('You are offline.');
  });

  it('says what it is doing while it translates', () => {
    const html = render({ busy: { kind: 'translate', stage: 'translating' } });
    expect(html).toContain('translating');
    expect(html).not.toContain('Say your reply');
  });

  it('brings up a plain reason when something went wrong', () => {
    const html = render({ error: "Couldn't hear any words in that note." });
    expect(html).toContain('role="alert"');
    expect(html).toContain("Couldn&#x27;t hear any words in that note.");
  });
});
