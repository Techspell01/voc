// Speech in Malayalam (or Manglish, or another Indian language) -> an English
// email, or a short English note for a sticky. The model translates meaning; the
// prompt carries a small calendar so "nale" and "adutha velliyazhcha" become the
// right dates without the model doing date arithmetic.
import { addDays, weekday } from '../src/lib/manglish/when.js';
import { hasMalayalam, transliterate } from '../src/lib/manglish/translit.js';
import { askJSON, parseJSON } from './llm.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ML = ['njayar', 'thinkal', 'chovva', 'budhan', 'vyazham', 'velli', 'shani'];
const nice = d => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

function calendar(today) {
  const lines = [`today (innu): ${nice(today)}`, `tomorrow (nale): ${nice(addDays(today, 1))}`, `day after tomorrow (mattannal): ${nice(addDays(today, 2))}`];
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, i);
    lines.push(`this coming ${DAYS[weekday(d)]} (${ML[weekday(d)]}azhcha): ${nice(d)}`);
  }
  return lines.join('\n');
}

const SPEECH = `The speaker talks in Malayalam, Manglish (Malayalam and English mixed) or another Indian language. The text comes from speech-to-text, so expect missing punctuation and misheard words; read for meaning.

Malayalam that is easy to get wrong:
- Parts of the day: raavile = morning, uchakku = around noon, uchakazhinju = afternoon, vaikunneram / vaikittu = evening, rathri = night. Keep them exactly: "mattannal raavile" is the morning of the day after tomorrow, not "by night".
- Family: Amma = mother, Achan = father, Chettan / Chechi = elder brother / sister, Aniyan / Aniyathi = younger brother / sister, Mon / Mol = son / daughter. The endings -de, -ude, -nte, -inte mean 's: "Ammede doctor appointment" is the speaker's mother's appointment, not the speaker's own.
- Verbs: venam = need / want, varilla = won't come, pattilla = can't, ayachu tharam = will send, cheyyanam = must do / please do, ariyikkanam = please inform, kshamikkanam = sorry / please excuse.`;

const spoken = text => `Voice note:\n${text}${hasMalayalam(text) ? `\n\nRomanised: ${transliterate(text)}` : ''}`;

export function emailPrompt({ today, name, tone }) {
  return `You write emails in English for someone who dictated what they want to say. ${SPEECH}

Dates, for reading "nale", weekdays and so on:
${calendar(today)}

Return JSON only: {"to_name": string or null, "to_email": string or null, "subject": string, "body": string}

- body: the full email in natural Indian English, ${tone === 'friendly' ? 'warm and friendly but still polite' : 'polite and professional'}. Start with a greeting ("Dear Rahul," / "Hi Rahul," / "Dear Sir/Madam," when no name is given), then the message in short paragraphs, then a sign-off ("Regards,") followed by ${name ? `the sender's name, ${name}` : 'no name (the sender will add it)'}.
- Translate the meaning, never word by word. Keep every fact the speaker gave: names, numbers, amounts (₹), dates, times, places. Write dates as "Friday, 9 October".
- Never invent facts, reasons, promises or details that weren't said. If the speaker addresses the email to someone ("Rahul sir-nu", "manager-ine"), use that in the greeting and to_name.
- subject: short and specific, at most 8 words.
- to_email only if an email address was spelled out.`;
}

export function notePrompt({ today }) {
  return `You turn a voice note into a short written note in English, for a sticky note. ${SPEECH}

Dates, for reading "nale", weekdays and so on:
${calendar(today)}

Return JSON only: {"title": string, "text": string}

- title: 2 to 5 words saying what the note is about.
- text: the speaker's points in clear, simple English. One point per line; start lines with "- " when there are several points. Keep names, numbers, amounts and times. Write dates as "Fri 9 Oct".
- Translate the meaning. Add nothing the speaker didn't say. Keep it short: a sticky note, not an essay.`;
}

const str = v => (typeof v === 'string' ? v.trim() : '');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkEmail(raw) {
  const j = parseJSON(raw);
  const body = str(j.body);
  if (!body) throw new Error('no email body');
  return { toName: str(j.to_name) || null, to: EMAIL.test(str(j.to_email)) ? str(j.to_email) : '', subject: str(j.subject) || 'Hello', body };
}
function checkNote(raw) {
  const j = parseJSON(raw);
  const text = str(j.text);
  if (!text) throw new Error('no note text');
  return { title: str(j.title) || text.split('\n')[0].slice(0, 40), text };
}

export async function writeEmail(text, { today, env, name = '', tone = 'formal', only } = {}) {
  const r = await askJSON({ system: emailPrompt({ today, name, tone }), user: spoken(text), env, only, check: checkEmail });
  return { result: r.value, engine: r.provider, ms: r.ms };
}

export function appendPrompt({ today }) {
  return `You add to an existing sticky note, from a new voice note. ${SPEECH}

Dates, for reading "nale", weekdays and so on:
${calendar(today)}

Return JSON only: {"add": string}

- add: only the new points, in clear simple English, written the way the existing note is written (one point per line; start lines with "- " if the note does).
- Don't repeat anything already on the note. If the speaker changes something already there, write the change as a new line ("- Bank: Saturday instead of Friday").
- Translate the meaning. Add nothing the speaker didn't say. Keep it short.`;
}

function checkAdd(raw) {
  const add = str(parseJSON(raw).add);
  if (!add) throw new Error('nothing to add');
  return { add };
}

export async function addToNote(note, text, { today, env, only } = {}) {
  const user = `Existing note:
${note.title ? `${note.title}
` : ''}${note.text}

${spoken(text)}`;
  const r = await askJSON({ system: appendPrompt({ today }), user, env, only, check: checkAdd });
  return { result: r.value, engine: r.provider, ms: r.ms };
}

export async function writeNote(text, { today, env, only } = {}) {
  const r = await askJSON({ system: notePrompt({ today }), user: spoken(text), env, only, check: checkNote });
  return { result: r.value, engine: r.provider, ms: r.ms };
}

const HOW = {
  formal: 'Make it more formal and polite.',
  friendly: 'Make it warmer and more friendly, still polite.',
  shorter: 'Make it shorter: keep every fact, cut every extra word.',
  detail: 'Make it clearer and a little more complete, using only facts already in the email or the voice note. Add nothing new.',
};

export async function rewriteEmail(email, how, { today, env, name = '', original = '' } = {}) {
  const system = `${emailPrompt({ today, name, tone: how === 'friendly' ? 'friendly' : 'formal' })}\n\nYou are now editing an email you wrote. ${HOW[how] ?? HOW.formal} Return the same JSON shape.`;
  const user = `${original ? `${spoken(original)}\n\n` : ''}Current email:\nSubject: ${email.subject}\n\n${email.body}`;
  const r = await askJSON({ system, user, env, check: checkEmail });
  return { result: { ...r.value, to: r.value.to || email.to || '' }, engine: r.provider, ms: r.ms };
}
