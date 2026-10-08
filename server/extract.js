// Transcript -> actions with an LLM, checked by the rule engine.
// The model decides what is an order, a to-do or an event and writes English
// titles. Code then does what models get wrong: date arithmetic ("adutha
// velliyazhcha" from today), unit names, and canonical item names from the lexicon.
import { annotate } from '../src/lib/manglish/normalize.js';
import { extract } from '../src/lib/manglish/parse.js';
import { resolveWhen, weekday } from '../src/lib/manglish/when.js';
import { UNITS } from '../src/lib/manglish/lexicon.js';
import { transliterate, hasMalayalam } from '../src/lib/manglish/translit.js';
import { askJSON } from './llm.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const UNIT_IDS = Object.keys(UNITS);

export function systemPrompt(today) {
  return `You turn voice notes and WhatsApp messages from Kerala into actions. They are in Manglish: Malayalam mixed with English, in Malayalam script or romanised, often without punctuation, often from speech-to-text with mistakes.

Today is ${DAYS[weekday(today)]} ${today} (India).

Return JSON only, in this shape:
{"items":[{"name":"","said":"","qty":null,"unit":null}],
 "order_when":null,
 "todos":[{"title":"","said":"","when":null,"date":null,"time":null}],
 "events":[{"title":"","said":"","when":null,"date":null,"time":null}]}

items: things to buy or supply: a shop order, or a shopping list for family ("vaangikko", "venam", "ayakku", "edukkanam").
- qty is a number or null if not said. unit is one of ${UNIT_IDS.join(', ')}, or null.
- Numbers: oru/onnu 1, randu 2, moonu 3, naalu 4, anju 5, aaru 6, ezhu 7, ettu 8, ompathu 9, pathu 10, nooru 100. ara = half, kaal = quarter, mukkaal = three quarters, onnara = 1.5, arakilo = 0.5 kg.
- "nooru roopaykku X" means 100 rupees worth of X: qty 100, unit "₹". ennam = piece, kettu = bundle, kuppi = bottle, cover = packet.
- Use plain English names: Onion (savala, ulli), Shallots (cheriya ulli), Rice (ari), Matta rice, Sugar (panchasara), Curry leaves, Coconut oil (velichenna), Sardine (mathi, chaala), Egg (mutta), Milk (paal, milma), Toothpaste ("Colgate paste"). Keep a brand-only item as said ("Surf excel").
- Leave out items the speaker cancels ("venda", "cancel cheyyu") and anything said only as an example or alternative.
- order_when: when the order must be delivered or picked up, as {"said":"","date":null,"time":null}, or null. Delivery and pickup lines ("nale raavile ethikkanam", "vaikunneram vannu edukkam", "12 manikku munpu venam") belong here, never in todos.

events: something that happens on a day or at a time: meeting, appointment, wedding, function, exam, a visit, someone arriving.
todos: something a person must do: call, pay, give, bring, keep ready, submit, book, check. Something to do at a set time is still a todo.
- Titles are short English: "Call Achan", "Pay electricity bill", "Keep Amma's reports ready", "Amma's doctor appointment". Keep kinship words as said: Amma, Achan, Chettan, Chechi, Ammamma, Appuppan, Kunju, Mol, Mon.
- when: the speaker's exact words for the day and time (e.g. "nale vaikunneram 5 manikku"), or null.
- date (YYYY-MM-DD) and time (24-hour HH:MM): your reading of "when". nale = tomorrow, mattannal = day after tomorrow, innu = today; njayar Sun, thinkal Mon, chovva Tue, budhan Wed, vyazham Thu, velli Fri, shani Sat (often with -azhcha); "adutha velliyazhcha" = Friday next week. raavile = morning, uchakku = noon, vaikunneram / vaikittu = evening, rathri = night. "anju manikku" = 5 o'clock, "anchara" = 5:30. A bare hour from 1 to 6 means pm unless the morning is meant.

"said" copies the speaker's words for that action. Skip greetings, chit-chat and news that needs nothing done. Use empty lists when nothing is actionable.`;
}

// What the rule parser found, handed to the model as hints: the lexicon knows
// Kerala item names and Malayalam numbers better than a general model does.
export function hints(text, today) {
  const r = extract(text, { today });
  const lines = [];
  for (const it of r.items) lines.push(`item: ${it.name}${it.qty != null ? ` ${it.qty}${it.unit ? ` ${it.unit}` : ''}` : ''} ("${it.said}")`);
  const seen = new Set();
  for (const x of [...r.todos, ...r.events, ...(r.order ? [r.order] : [])]) {
    if (!x.date) continue;
    const key = `${x.date} ${x.time ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    lines.push(`date: ${x.date}${x.time ? ` ${x.time}${x.approx ? ' (rough, from a part of day)' : ''}` : ''}${x.said ? ` for "${x.said}"` : ''}`);
  }
  return lines;
}

function userPrompt(text, today, env) {
  const roman = hasMalayalam(text) ? `\n\nRomanised: ${transliterate(text)}` : '';
  const h = env.LLM_HINTS === 'off' ? [] : hints(text, today);
  const hint = h.length
    ? `\n\nA Manglish dictionary read these (names and quantities are usually right; it can miss things and does not know what is a to-do or an event):\n${h.map(l => `- ${l}`).join('\n')}`
    : '';
  return `Note:\n${text}${roman}${hint}`;
}

// --- checking the model's answer ------------------------------------------------

const DELIVERY = /ethik|ethich|deliver|vannu edukk|ayakk|ayach/i;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const str = v => (typeof v === 'string' ? v.trim() : '');
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() && !isNaN(+v) ? +v : null);

// Our resolver for the date (deterministic); the model's time when ours was only a guess.
function settle(x, today) {
  const llmDate = DATE.test(str(x?.date)) ? str(x.date) : null;
  const llmTime = TIME.test(str(x?.time)) ? str(x.time) : null;
  const phrase = str(x?.when);
  const ours = phrase ? resolveWhen(annotate(phrase).tokens, today) : null;
  const date = ours?.date && (ours.date !== today || !llmDate) ? ours.date : llmDate ?? ours?.date ?? null;
  let time = llmTime;
  if (ours?.time && (ours.sure || !llmTime) && !(ours.approx && llmTime)) time = ours.time;
  return { date, time, approx: !!(ours?.approx && time === ours?.time) };
}

function unitId(u) {
  const s = str(u).toLowerCase();
  if (!s) return null;
  if (UNIT_IDS.includes(s)) return s;
  for (const [id, words] of Object.entries(UNITS)) if (words.includes(s)) return id;
  return null;
}

// "savala" or "onions" -> "Onion" when the lexicon knows the word. Failing an
// exact match, the head noun decides: "Broiler chicken" -> Chicken, "Hamam soap" -> Soap.
function canonical(name, said) {
  for (const s of [name, said]) {
    const words = annotate(s).tokens.filter(t => !t.punct && t.covered === undefined);
    if (words.length === 1 && words[0].entry?.item) return words[0].entry.item;
  }
  // otherwise, one known item among the words: "Broiler chicken curry cut", "Shampoo sachet"
  const words = annotate(name).tokens.filter(t => !t.punct && t.covered === undefined);
  const found = [...new Map(words.filter(t => t.entry?.item).map(t => [t.entry.item.name, t.entry.item])).values()];
  return found.length === 1 ? found[0] : null;
}

// A unit the model left inside the name: "Shampoo sachet" -> packet.
function unitInName(name) {
  const words = annotate(name).tokens.filter(t => !t.punct && t.covered === undefined);
  const units = words.filter(t => t.entry?.unit && !t.entry.item).map(t => t.entry.unit);
  return units.length === 1 ? units[0] : null;
}
const CANCELLED = /\b(venda|vendaa)\b|\bcancel/i;   // whole words: "vendakka" is okra

export function clean(raw, today) {
  const j = typeof raw === 'string' ? JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, '')) : raw;
  const items = (Array.isArray(j.items) ? j.items : []).map(it => {
    const name = str(it?.name);
    const said = str(it?.said) || name;
    if (!name || CANCELLED.test(said)) return null;   // "mutta venda" kept by mistake
    const known = canonical(name, said);
    const qty = num(it?.qty);
    let unit = unitId(it?.unit);
    if (!unit && known) unit = unitInName(name);
    return { name: known?.name ?? name[0].toUpperCase() + name.slice(1), said, cat: known?.cat ?? 'other', qty: unit && qty == null ? 1 : qty, unit, known: !!known };
  }).filter(Boolean).map((it, n) => ({ id: `i${n}`, ...it }));
  const todos = (Array.isArray(j.todos) ? j.todos : []).filter(t => str(t?.title)).map((t, n) => {
    const { date, time } = settle(t, today);
    return { id: `t${n}`, title: str(t.title), said: str(t.said), date, time };
  });
  const events = (Array.isArray(j.events) ? j.events : []).filter(e => str(e?.title)).map((e, n) => {
    const { date, time, approx } = settle(e, today);
    return { id: `e${n}`, title: str(e.title), said: str(e.said), date: date ?? today, time, approx };
  });
  let order = null;
  if (j.order_when && typeof j.order_when === 'object') {
    const o = settle({ when: j.order_when.said ?? j.order_when.when, date: j.order_when.date, time: j.order_when.time }, today);
    if (o.date || o.time) order = { date: o.date, time: o.time, approx: o.approx };
  }
  // A delivery line the model filed as a to-do ("Bring items" from "nale raavile
  // ethikkanam") is the order's delivery time instead.
  const kept = todos.filter(t => {
    if (!items.length || !DELIVERY.test(t.said) || !/\b(deliver|bring|send|items?|order|pick)\b/i.test(t.title)) return true;
    if (!order && (t.date || t.time)) order = { date: t.date, time: t.time, approx: false };
    return false;
  }).map((t, n) => ({ ...t, id: `t${n}` }));
  return { items, todos: kept, events, order };
}

export async function extractWithLLM(text, { today, env, only } = {}) {
  const r = await askJSON({ system: systemPrompt(today), user: userPrompt(text, today, env), env, only, check: raw => clean(raw, today) });
  return { result: { ...r.value, latin: transliterate(text) }, engine: r.provider, ms: r.ms };
}
