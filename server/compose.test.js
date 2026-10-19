import { describe, expect, it } from 'vitest';
import { checkTranslate, translatePrompt } from './compose.js';

describe('translating a reply', () => {
  it('asks for one short English message, with no invented facts', () => {
    const p = translatePrompt({ today: '2026-10-19' });
    expect(p).toMatch(/Return JSON only: \{"text": string, "from": string\}/);
    expect(p).toMatch(/Never invent anything that wasn't said/);
    expect(p).toMatch(/no greeting, no sign-off/);
    expect(p).toMatch(/Hindi/);
    expect(p).toMatch(/today \(innu\): Monday, 19 October/);
    expect(p).toMatch(/Malayalam/);
  });

  it('takes the answer with the words trimmed', () => {
    expect(checkTranslate('```json\n{"text":"  I will call you at 10 am.  ","from":" Hindi "}\n```'))
      .toEqual({ text: 'I will call you at 10 am.', from: 'Hindi' });
    expect(checkTranslate('{"text":"See you tomorrow"}')).toEqual({ text: 'See you tomorrow', from: null });
  });

  it('turns away an answer with nothing to send', () => {
    expect(() => checkTranslate('{"from":"Hindi"}')).toThrow(/no translation/);
    expect(() => checkTranslate('not json at all')).toThrow();
  });
});
