// The rule-based extractor: Manglish text in, order items / to-dos / events out.
// It needs no network, so it is the offline mode and the baseline the LLM mode
// is measured against (see scripts/eval.mjs).
import { annotate } from './normalize.js';
import { resolveWhen } from './when.js';
import { PERSON_DISPLAY } from './lexicon.js';

// Malayalam is verb-final, so a finite verb ends a clause even when speech-to-text
// gives no punctuation: "paal venam current bill adakkanam" is two clauses.
const FINITE_ORDER = /^(venam|venum|veenam|vennam|vende|tharanam|tharu|tharumo|thero|ayakkanam|ayakku|edukkanam|edukku|edutho|edutholu|kittumo|undo|vaanganam|vaangikkanam|vanganam|vangikkanam|medikkanam|konduvaranam|deliver|ethikkanam|ethikku|ethikkamo)$/;
const FINITE_EVENT = /^(und|undu|undallo|varum|varunnund|ethum|ethanam|nadakkum|thudangum|aanu|anu)$/;
const FINITE_TODO = /(anam|enam|kkane|ane|alle|aruthu|enda|anda|ikku|kku|yyu|nokku)$/;
const TAIL = /^(ketto|keto|tto|alle|ok|okay|sheri|please|pls|plz|chetta|chettaa|chechi|mole|mone)$/;

// Verbs that make a task even when an event word is around ("meeting-nu file kondu varanam").
const TASK_VERBS = new Set(['Bring', 'Take', 'Send', 'Give', 'Pay', 'Call', 'Buy', 'Keep ready', 'Get ready', 'Check', 'Remind', 'Write', 'Keep', 'Change', 'Open', 'Pick up', 'Drop']);
const VISIT_VERBS = new Set(['Go to', 'Meet', 'Come']);
const PERSON_TASKS = new Set(['Call', 'Tell', 'Pay', 'Close', 'Remind', 'Meet', 'Pick up', 'Drop', 'Go to', 'Come', 'Write']);
const SHOP_VERBS = new Set(['', 'Buy', 'Bring', 'Keep ready', 'Send', 'Pick up', 'Take']);
// Delivery words: "nale raavile ethikkanam" after an order sets when to deliver it.
const DELIVER = /^(ethikkanam|ethikku|ethikkamo|ethichu|deliver|delivery|venam|venum|ayakkanam|ayakku|tharanam|tharu|edukkam)$/;
const ENGLISH_VERB = /^(call|pay|send|check|buy|remind)$/;
const PAY_WORDS = /bill|fee|rent|money|emi|loan|tax|premium|insurance|chitty|kuri|due/i;
const POSSESSIVE = /(yude|inte|ude|nte|de)$/;
const DATIVE = /(ykku|ikku|kku|kk)$/;

const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const words = (tokens, from, to) => tokens.slice(from, to + 1).filter(t => !t.punct).map(t => t.raw).join(' ');

function isTail(t) {
  const e = t.entry ?? {};
  return TAIL.test(t.low) || e.day !== undefined || e.weekday !== undefined || e.daypart !== undefined;
}

function isFinite(t) {
  const e = t.entry ?? {};
  const low = t.low;
  if (e.cancel || e.neg) return true;
  if (e.order && FINITE_ORDER.test(low)) return true;
  if (e.eventVerb && FINITE_EVENT.test(low)) return true;
  if (e.todo !== undefined && FINITE_TODO.test(low)) return true;
  return false;
}

// Sentences split on punctuation and "pinne"/"ennittu"; inside a sentence, after each finite verb.
function splitClauses(tokens) {
  const clauses = [];
  let cur = [];
  let sentence = 0;
  const push = () => { if (cur.length) clauses.push({ tokens: cur, sentence }); cur = []; };
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.covered !== undefined) { cur.push(t); continue; }
    if (t.punct && t.low !== ',' && t.low !== ':') { push(); sentence++; continue; }
    if (t.punct) { cur.push(t); continue; }
    if (t.entry?.split && !t.entry.item) { push(); sentence++; continue; }
    cur.push(t);
    // include the covered tokens of a multi-word verb, then any "ketto"
    let j = i + (t.span ?? 1) - 1;
    if (isFinite(t) || (t.span > 1 && t.entry?.todo !== undefined)) {
      for (let k = i + 1; k <= j; k++) cur.push(tokens[k]);
      // afterthoughts stay with their verb: "file submit cheyyanam, nale ketto"
      while (tokens[j + 1] && !tokens[j + 1].punct && isTail(tokens[j + 1])) cur.push(tokens[++j]);
      i = j;
      push();
    }
  }
  push();
  return clauses;
}

function personName(e, low) {
  const p = e.person;
  return PERSON_DISPLAY[p] ?? cap(p);
}

// Render the content words of a clause in English where we know them.
function phrase(tokens, skip) {
  const out = [];
  const forWhom = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.punct || t.covered !== undefined || skip.has(i)) continue;
    const e = t.entry ?? {};
    const suffix = t.suffix ?? '';
    if (t.low === 'ninnu' && out.length) { out.splice(out.length - 1, 1, `from ${out[out.length - 1]}`); continue; }
    if (e.person) {
      const name = personName(e, t.low);
      if (POSSESSIVE.test(suffix)) out.push(`${name}'s`);
      else if (DATIVE.test(suffix)) forWhom.push(name);
      else out.push(name);
    } else if (e.noun !== undefined && !e.item) {
      if (e.noun) out.push(e.noun);
    } else if (e.item) out.push(e.item.name.toLowerCase());
    else if (e.filler || e.split || e.eventVerb || e.order || e.cancel || e.todo !== undefined || e.clock || e.daypart) continue;
    else if (e.event) out.push(t.low);
    else if (t.num !== undefined || e.num !== undefined) out.push(t.raw);
    else if (!e.unit) {
      const m = POSSESSIVE.exec(t.low);
      if (m && t.low.length - m[0].length >= 3 && !/^[A-Z]/.test(t.raw) && !t.digits) out.push(`${cap(t.low.slice(0, -m[0].length))}'s`);
      else out.push(t.raw);
    } else out.push(t.raw);
  }
  return { text: out.join(' ').replace(/\s+/g, ' ').trim(), forWhom };
}

// --- items -----------------------------------------------------------------

function elements(tokens, used) {
  const seq = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.covered !== undefined) continue;
    if (t.punct) { seq.push({ k: 'P', i }); continue; }
    if (used.has(i)) { seq.push({ k: 'X', i }); continue; }
    const e = t.entry ?? {};
    if (e.qtyUnit) seq.push({ k: 'QU', v: e.qtyUnit[0], u: e.qtyUnit[1], i });
    else if (e.item && !(e.num !== undefined && !t.suffix && isQtyNext(tokens, i))) seq.push({ k: 'I', item: e.item, said: words(tokens, i, i + (t.span ?? 1) - 1), i });
    else if (t.num !== undefined || e.num !== undefined) {
      const v = t.num ?? e.num;
      const prev = seq[seq.length - 1];
      // "irupathu anju" = 25, "2 1/2" = 2.5, "oru kilo ara" = 1.5 kg
      if (prev?.k === 'Q' && ((prev.v % 10 === 0 && prev.v >= 20 && v < 10 && v >= 1) || (v < 1 && prev.v >= 1))) { prev.v += v; continue; }
      if (prev?.k === 'U' && seq[seq.length - 2]?.k === 'Q' && v < 1) { seq[seq.length - 2].v += v; continue; }
      seq.push({ k: 'Q', v, weak: !!e.weak && !t.digits, i });
    } else if (e.unit) seq.push({ k: 'U', u: e.unit, i });
    else if (isContent(t)) seq.push({ k: 'W', raw: t.raw, low: t.low, i });
    else seq.push({ k: 'X', i });
  }
  // a weak number ("oru", "aaru", "kaal") only counts next to a unit, item or word
  return seq.filter((el, n) => {
    if (el.k !== 'Q' || !el.weak) return true;
    const nx = seq[n + 1]?.k;
    return nx === 'U' || nx === 'I' || nx === 'W';
  });
}

function isQtyNext(tokens, i) {
  const n = tokens[i + 1]?.entry;
  return !!(n && (n.unit || n.item));
}

function isContent(t) {
  const e = t.entry;
  if (!e) return /\p{L}/u.test(t.raw);
  return false;
}

const SUFFIX_UM = /(yum|vum|um)$/;
function unknownName(run) {
  const name = run.map(w => w.raw).join(' ').replace(/[-]/g, ' ');
  const trimmed = run.length && SUFFIX_UM.test(run[run.length - 1].low) && run[run.length - 1].low.length > 4
    ? name.replace(/(yum|vum|um)$/i, '') : name;
  return cap(trimmed);
}

function segmentItems(tokens, used, orderish) {
  const seq = elements(tokens, used);
  const items = [];
  const firstQ = seq.findIndex(el => el.k === 'Q' || el.k === 'QU' || (el.k === 'U' && el.u === '₹'));
  const firstI = seq.findIndex(el => el.k === 'I');
  // "randu kilo ari" (quantity first) or "ari randu kilo" (item first): one style per clause
  const qtyFirst = firstQ !== -1 && (firstI === -1 || firstQ < firstI);
  let pending = null;   // a quantity waiting for its item: { v, u, from }
  let last = null;
  let desc = null;      // unknown words right before an item: "Colgate paste"
  const end = i => i + (tokens[i].span ?? 1) - 1;
  const give = (it, p) => {
    if (!p) return;
    it.qty = p.v ?? null; it.unit = p.u ?? null;
    it.from = Math.min(it.from, p.from); it.to = Math.max(it.to, p.to ?? p.from);
  };
  const grow = (it, i) => { it.to = Math.max(it.to, end(i)); };

  for (let n = 0; n < seq.length; n++) {
    const el = seq[n];
    if (el.k !== 'W' && el.k !== 'I') desc = null;
    if (el.k === 'Q') {
      if (pending && pending.u === '₹' && pending.v == null) { pending.v = el.v; pending.to = end(el.i); continue; }
      if (!qtyFirst && last && last.qty == null) { last.qty = el.v; grow(last, el.i); continue; }
      if (pending && last && last.qty == null) give(last, pending);
      pending = { v: el.v, u: null, from: el.i, to: end(el.i) };
    } else if (el.k === 'QU') {
      if (!qtyFirst && last && last.qty == null) { last.qty = el.v; last.unit = el.u; grow(last, el.i); continue; }
      pending = { v: el.v, u: el.u, from: el.i, to: end(el.i) };
    } else if (el.k === 'U') {
      if (pending && !pending.u) { pending.u = el.u; pending.to = end(el.i); }
      else if (el.u === '₹') pending = { v: null, u: '₹', from: el.i, to: el.i };
      else if (last && last.qty != null && !last.unit) { last.unit = el.u; grow(last, el.i); }
    } else if (el.k === 'I') {
      const it = { name: el.item.name, cat: el.item.cat, qty: null, unit: null, from: desc ?? el.i, to: end(el.i), known: true };
      desc = null;
      if (pending) { give(it, pending); pending = null; }
      items.push(it); last = it;
    } else if (el.k === 'W' && orderish) {
      const run = [el];
      while (seq[n + 1]?.k === 'W' && run.length < 3) run.push(seq[++n]);
      const nx = seq[n + 1]?.k;
      if (nx === 'I') { desc = el.i; continue; }
      const withQty = qtyFirst ? pending : (nx === 'Q' || nx === 'QU');
      if (!withQty) continue;
      const it = { name: unknownName(run), cat: 'other', qty: null, unit: null, from: el.i, to: end(run[run.length - 1].i), known: false };
      if (qtyFirst) { give(it, pending); pending = null; }
      items.push(it); last = it;
    }
  }
  if (pending && last && last.qty == null) give(last, pending);
  return items.map(({ from, to, ...it }) => ({ ...it, said: words(tokens, from, to) }));
}

// --- clauses -> actions -----------------------------------------------------

// "kaal kilo" is a quarter kilo, not "call"; English "call" is a task only as
// "call cheyyanam" ("zoom call und" is an event, "call cheyyam" is just news).
function isVerb(toks, i) {
  const t = toks[i];
  const e = t.entry;
  if (e.num !== undefined && isQtyNext(toks, i)) return false;
  if (ENGLISH_VERB.test(t.low)) {
    const nx = toks.slice(i + 1).find(n => !n.punct && n.covered === undefined);
    return !!nx && nx.entry?.todo === '' && /^(cheyy|cheyth)/.test(nx.low);
  }
  return true;
}

function analyse(clause, today) {
  const toks = clause.tokens;
  const when = resolveWhen(toks, today);
  const used = when?.used ?? new Set();
  const f = { order: false, cancel: false, eventNoun: false, eventVerb: false, verb: null, verbIdx: [], items: 0, qtyUnit: false };
  toks.forEach((t, i) => {
    if (t.punct || t.covered !== undefined || used.has(i)) return;
    const e = t.entry ?? {};
    if (e.order) f.order = true;
    if (e.cancel) f.cancel = true;
    if (e.neg) f.neg = true;
    if (e.eventVerb) f.eventVerb = true;
    if (e.item) f.items++;
    if (e.unit || e.qtyUnit) f.qtyUnit = true;
    if (e.event && !(e.todo !== undefined && isVerb(toks, i))) f.eventNoun = true;
    if (e.todo !== undefined && !e.item && isVerb(toks, i)) {
      f.verbIdx.push(i);
      if (e.todo && !f.verb) f.verb = e.todo;   // the first verb leads: "plumber-ne vilichu ... parayanam" = Call
      else if (f.verb === null) f.verb = '';
    }
    if (e.order && DELIVER.test(t.low)) f.deliver = true;
  });
  return { when, used, f };
}

function todoTitle(toks, used, f) {
  const skip = new Set([...used, ...f.verbIdx]);
  let verb = f.verb || '';
  // "<English verb> cheyyanam": file submit cheyyanam -> Submit file
  const doIdx = f.verbIdx.find(i => toks[i].entry.todo === '' && /^(cheyy|cheyth)/.test(toks[i].low));
  if (!verb && doIdx !== undefined) {
    for (let k = doIdx - 1; k >= 0; k--) {
      const t = toks[k];
      if (t.punct || t.covered !== undefined) continue;
      if (/^[a-z]+$/i.test(t.raw) && !(t.entry?.person)) { verb = cap(t.low); skip.add(k); }
      break;
    }
  }
  const { text, forWhom } = phrase(toks, skip);
  let obj = text;
  if (forWhom.length) obj = `${obj} for ${forWhom.join(' and ')}`.trim();
  if (verb === 'Pay' && !PAY_WORDS.test(obj) && toks.some(t => /^adakk/.test(t.low))) verb = 'Close';
  let title;
  if (!verb) title = obj;
  else if (verb === 'Keep ready' || verb === 'Get ready') title = `${verb.split(' ')[0]} ${obj} ready`;
  else title = `${verb} ${obj}`;
  return cap(title.replace(/\s+/g, ' ').trim());
}

function eventTitle(toks, used) {
  const skip = new Set(used);
  const { text, forWhom } = phrase(toks, skip);
  let title = text;
  if (forWhom.length) title = `${title} for ${forWhom.join(' and ')}`.trim();
  return cap(title) || 'Event';
}

function mergeItems(list) {
  const out = [];
  for (const it of list) {
    const same = out.find(o => o.name === it.name && (o.unit === it.unit || o.qty == null || it.qty == null));
    if (!same) { out.push({ ...it }); continue; }
    if (same.qty == null) { same.qty = it.qty; same.unit = it.unit; }
    else if (it.qty != null && same.unit === it.unit) same.qty = +(same.qty + it.qty).toFixed(3);
    same.said = same.said === it.said ? same.said : `${same.said}; ${it.said}`;
  }
  return out;
}

export function extract(text, { today }) {
  const { latin, tokens } = annotate(text);
  const clauses = splitClauses(tokens);
  let items = [];
  const todos = [];
  const events = [];
  let order = null;
  let orderMode = false;
  let lastSentence = -1;
  let sentenceWhen = null;
  let last = null;   // { action, sentence }: the action an afterthought belongs to

  const remember = (action, clause) => { last = { action, sentence: clause.sentence }; return action; };
  const setOrderWhen = when => {
    order ??= { date: null, time: null, approx: false };
    if (when && !order.date) Object.assign(order, { date: when.date, time: when.time, approx: !!when.approx });
    return order;
  };

  for (const clause of clauses) {
    const toks = clause.tokens;
    const said = latin.slice(toks.find(t => !t.punct)?.start ?? 0, toks[toks.length - 1].end).replace(/^[\s,]+|[\s,]+$/g, '');
    if (!said) continue;
    if (clause.sentence !== lastSentence) { sentenceWhen = null; lastSentence = clause.sentence; }
    const { when, used, f } = analyse(clause, today);
    if (when?.date) sentenceWhen = when;
    const strongTask = f.verb && TASK_VERBS.has(f.verb);

    if (f.neg && !f.order) continue;   // "nale class illa"
    if (f.cancel) {
      const gone = segmentItems(toks, used, true).map(i => i.name);
      items = items.filter(i => !gone.includes(i.name));
      continue;
    }
    const orderish = orderMode || f.order || f.qtyUnit || f.items > 0;
    const found = f.items || f.qtyUnit || orderMode || f.order ? segmentItems(toks, used, orderish) : [];

    // a verbless afterthought in the same sentence ("..., mattannal raavile",
    // "6.30-nte trainil") fills in the time of the action before it
    if (when && f.verb === null && !f.eventVerb && !f.deliver && !found.length && last && last.sentence === clause.sentence) {
      const a = last.action;
      if (!a.date || (when.date !== today && a.date === today)) a.date = when.date;
      if (!a.time && when.time) { a.time = when.time; a.approx = !!when.approx; }
      continue;
    }

    // a person-task with no shop items: call / pay / give / pick up ...
    const shopping = found.length > 0 && (f.verb === null || SHOP_VERBS.has(f.verb) || (f.order && !PERSON_TASKS.has(f.verb)))
      && (!PERSON_TASKS.has(f.verb) || found.some(i => i.known));
    if (shopping && !(f.eventNoun && when?.time && !f.order)) {
      items.push(...found);
      orderMode = true;
      remember(setOrderWhen(when), clause);
      continue;
    }
    if ((f.eventNoun || f.eventVerb) && when?.date && !strongTask) {
      events.push(remember({ title: eventTitle(toks, new Set([...used, ...f.verbIdx])), said, date: when.date, time: when.time, approx: !!when.approx }, clause));
      continue;
    }
    if (f.verb && VISIT_VERBS.has(f.verb) && when?.time) {
      events.push(remember({ title: todoTitle(toks, used, f), said, date: when.date, time: when.time, approx: !!when.approx }, clause));
      continue;
    }
    // "nale raavile ethikkanam" after an order: when to deliver it
    if (orderMode && f.deliver && !found.length && !f.verb) {
      remember(setOrderWhen(when), clause);
      continue;
    }
    if (f.verb !== null) {
      const due = when ?? sentenceWhen;
      const title = todoTitle(toks, used, f);
      if (title) todos.push(remember({ title, said, date: due?.date ?? null, time: due?.time ?? null }, clause));
      continue;
    }
    if (when?.date && f.eventNoun) {
      events.push(remember({ title: eventTitle(toks, used), said, date: when.date, time: when.time, approx: !!when.approx }, clause));
    }
  }
  if (order && !order.date && !order.time) order = null;

  items = mergeItems(items).map((it, n) => ({ id: `i${n}`, ...it }));
  return {
    items,
    todos: todos.map(({ approx, ...t }, n) => ({ id: `t${n}`, ...t })),
    events: events.map((e, n) => ({ id: `e${n}`, ...e })),
    order,
    latin,
  };
}
