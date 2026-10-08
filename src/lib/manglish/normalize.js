// Tokens and lexicon lookup. Manglish has no fixed spelling, so every word is
// reduced to a skeleton before lookup: double letters collapse, aspirates drop,
// "ee"->"i", and a final half-u goes ("randu" = "rand", "takkali" = "thakkali").
import { transliterate } from './translit.js';
import * as L from './lexicon.js';

export function skel(word) {
  let w = word.toLowerCase().replace(/[^a-z0-9₹]/g, '');
  if (!w || /^[\d₹]/.test(w)) return w;
  w = w.replace(/ck/g, 'k').replace(/c(?!h)/g, 'k').replace(/q/g, 'k').replace(/x/g, 'ks')
    .replace(/ph/g, 'f').replace(/w/g, 'v').replace(/zh/g, 'z').replace(/([kgtdbjp])h/g, '$1')
    .replace(/ee/g, 'i').replace(/oo/g, 'u').replace(/(.)\1+/g, '$1');
  if (w.length >= 4) w = w.replace(/([^aeiou])u$/, '$1');
  return w;
}

// Case endings and clitics that glue onto nouns: paal-um (and milk), amma-ye
// (Amma, object), school-il (at school), meeting-nu (for the meeting).
const SUFFIXES = [
  'yudeyum', 'inteyum', 'nteyum', 'ilum', 'yilum', 'yum', 'vum', 'um', 'yude', 'ude', 'inte', 'nte', 'de',
  'ykku', 'kku', 'ikku', 'kk', 'yil', 'il', 'ilu', 'ine', 'ye', 'ne', 'ninu', 'inu', 'nu', 'yo', 'o',
  'ayi', 'aayi', 'aanu', 'anu', 'aam', 's', 'e',
];

function entryFor(map, key) {
  let e = map.get(key);
  if (!e) map.set(key, e = {});
  return e;
}

let INDEX = null;
let MAXN = 1;
function index() {
  if (INDEX) return INDEX;
  const m = new Map();
  const add = (phrase, fn) => {
    const parts = phrase.split(/\s+/).map(skel).filter(Boolean);
    MAXN = Math.max(MAXN, parts.length);
    fn(entryFor(m, parts.join(' ')));
    if (parts.length > 1) fn(entryFor(m, parts.join('')));   // "cheriyaulli" said as one word
  };
  for (const [w, v] of Object.entries(L.NUMBERS)) add(w, e => { e.num ??= v; if (L.WEAK_NUMBERS.has(w)) e.weak = true; });
  for (const [unit, words] of Object.entries(L.UNITS)) for (const w of words) add(w, e => { e.unit ??= unit; });
  for (const [w, [q, u]] of Object.entries(L.QTY_UNITS)) add(w, e => { e.qtyUnit = [q, u]; });
  for (const [name, cat, words] of L.ITEMS) for (const w of words) add(w, e => { e.item ??= { name, cat }; });
  for (const [w, d] of Object.entries(L.DAY_OFFSETS)) add(w, e => { e.day = d; });
  for (const [w, d] of Object.entries(L.WEEKDAYS)) add(w, e => { e.weekday = d; });
  for (const [w, d] of Object.entries(L.MONTHS)) add(w, e => { e.month = d; });
  for (const [w, d] of Object.entries(L.DAYPARTS)) add(w, e => { e.daypart = d; });
  for (const w of L.CLOCK_WORDS) add(w, e => { e.clock = w; });
  for (const w of L.NEXT_WORDS) add(w, e => { e.next = true; });
  for (const w of L.WEEK_WORDS) add(w, e => { e.week = true; });
  for (const w of L.MONTH_WORDS) add(w, e => { e.monthWord = true; });
  for (const w of L.DATE_WORDS) add(w, e => { e.dateWord = true; });
  for (const w of L.ORDER_WORDS) add(w, e => { e.order = true; });
  for (const w of L.CANCEL_WORDS) add(w, e => { e.cancel = true; });
  for (const w of L.NEG_WORDS) add(w, e => { e.neg = true; });
  for (const [w, v] of Object.entries(L.TODO_VERBS)) add(w, e => { e.todo ??= v; });
  for (const w of L.EVENT_WORDS) add(w, e => { e.event = true; });
  for (const w of L.EVENT_VERBS) add(w, e => { e.eventVerb = true; });
  for (const w of L.SPLITTERS) add(w, e => { e.split = true; });
  for (const w of L.PEOPLE) add(w, e => { e.person = w; });
  for (const [w, v] of Object.entries(L.NOUNS)) add(w, e => { e.noun ??= v; });
  for (const w of L.FILLERS) add(w, e => { e.filler = true; });
  INDEX = m;
  return m;
}

export function stripSuffix(low) {
  const out = [];
  for (const s of SUFFIXES) {
    if (low.length - s.length >= 3 && low.endsWith(s)) out.push(low.slice(0, -s.length));
  }
  return out;
}

// Look up the longest lexicon phrase starting at token i.
export function lookup(tokens, i) {
  const m = index();
  for (let n = Math.min(MAXN, tokens.length - i); n >= 1; n--) {
    const span = tokens.slice(i, i + n);
    if (span.some(t => t.punct)) continue;
    const head = span.slice(0, -1).map(t => t.sk);
    const last = span[n - 1];
    const exact = m.get([...head, last.sk].join(' '));
    if (exact) return { entry: exact, n, suffix: '' };
    for (const stem of stripSuffix(last.low)) {
      // the stem's last vowel shifts before a suffix: uppu + um = uppum, amma + de = ammede
      const tries = [stem];
      if (/[^aeiou]$/.test(stem)) tries.push(stem + 'u', stem + 'a');
      if (/e$/.test(stem)) tries.push(stem.slice(0, -1) + 'a');
      if (/(ath|th)$/.test(stem)) tries.push(stem.replace(/t?th$/, 'm'));   // ambalam -> ambalathil
      for (const s of tries) {
        const e = m.get([...head, skel(s)].join(' '));
        if (e) return { entry: e, n, suffix: last.low.slice(stem.length) };
      }
    }
  }
  return null;
}

const TOKEN_RE = /\d+(?:[:.]\d+)?(?:\/\d+)?|₹|[\p{L}\p{M}'’]+|[.,!?;:\n]/gu;

export function tokenize(text) {
  const latin = transliterate(String(text ?? ''))
    .replace(/(\d)(?=[\p{L}₹])/gu, '$1 ')            // 2kg -> 2 kg, 5manikku -> 5 manikku
    .replace(/(\p{L})(?=\d)/gu, '$1 ')                // rs50 -> rs 50
    .replace(/(\p{L})-(?=\p{L})/gu, '$1');            // school-il -> schoolil
  const tokens = [];
  for (const m of latin.matchAll(TOKEN_RE)) {
    const raw = m[0];
    const punct = /^[.,!?;:\n]$/.test(raw);
    const low = raw.toLowerCase().replace(/[’']/g, '');
    tokens.push({ raw, low, sk: punct ? '' : skel(low), punct, start: m.index, end: m.index + raw.length });
  }
  return { latin, tokens };
}

// Tag every token with what the lexicon knows about it. Multi-word phrases tag
// their first token with `span` = number of tokens covered.
export function annotate(text) {
  const { latin, tokens } = tokenize(text);
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.punct) continue;
    if (/^\d/.test(t.low)) {
      t.digits = true;
      t.num = t.low.includes('/') ? fraction(t.low) : parseFloat(t.low);
      continue;
    }
    if (t.low === '₹') { t.entry = { unit: '₹' }; t.span = 1; continue; }
    const hit = lookup(tokens, i);
    if (hit) {
      t.entry = hit.entry;
      t.span = hit.n;
      t.suffix = hit.suffix;
      for (let k = 1; k < hit.n; k++) tokens[i + k].covered = i;
      i += hit.n - 1;
    }
  }
  return { latin, tokens };
}

function fraction(s) {
  const [a, b] = s.split('/').map(Number);
  return b ? a / b : a;
}
