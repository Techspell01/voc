// Dates and times in Manglish: "nale vaikunneram anchara manikku" -> tomorrow 17:30.
// Works on annotated tokens so the parser knows which words were the "when"
// and can leave them out of titles. Dates are plain 'YYYY-MM-DD' strings and all
// arithmetic is done on UTC midnights, so the phone's time zone never shifts a day.

const MS_DAY = 86400000;
export const toDate = s => new Date(`${s}T00:00:00Z`);
export const fmtDate = d => d.toISOString().slice(0, 10);
export const addDays = (s, n) => fmtDate(new Date(toDate(s).getTime() + n * MS_DAY));
export const weekday = s => toDate(s).getUTCDay();

// Today in Kerala, whatever the device or server clock says.
export function todayIST(now = new Date()) {
  return fmtDate(new Date(now.getTime() + 5.5 * 3600000));
}

const pad = n => String(n).padStart(2, '0');

function nextWeekday(today, wd, nextWeek) {
  const cur = weekday(today);
  if (nextWeek) {
    // "adutha velliyazhcha": that day in next calendar week (weeks start Monday)
    const toMonday = ((8 - cur) % 7) || 7;
    return addDays(today, toMonday + ((wd + 6) % 7));
  }
  return addDays(today, ((wd - cur + 7) % 7) || 7);
}

// The next time this day of the month comes round (this month, else the next).
function dayOfMonth(today, day, month, nextMonth) {
  const t = toDate(today);
  let y = t.getUTCFullYear();
  let m = month ?? t.getUTCMonth() + 1;
  if (nextMonth && !month) { m += 1; if (m > 12) { m = 1; y += 1; } }
  const make = () => `${y}-${pad(m)}-${pad(day)}`;
  if (make() < today) {
    if (month) y += 1;
    else if (++m > 12) { m = 1; y += 1; }
  }
  const s = make();
  return fmtDate(toDate(s)) === s ? s : null;   // drops 31 Feb and friends
}

const ORDINAL = /^((th|st|nd|rd)(nu|nnu|ne|e|il|inu)?|nu|nnu|aam|am)$/;

// tokens: annotated tokens of one clause. Returns null when nothing time-like is there.
export function resolveWhen(tokens, today) {
  const c = { offset: null, weekday: null, nextWd: false, nextWeek: false, nextMonth: false, dom: null, month: null, hour: null, minute: 0, hint: null, part: null };
  const used = new Set();
  const e = i => tokens[i]?.entry ?? {};
  const isNext = i => i >= 0 && !!e(i).next;

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.punct || t.covered !== undefined) continue;
    const en = t.entry ?? {};
    const span = t.span ?? 1;
    const mark = (from, to = from) => { for (let k = from; k <= to; k++) if (k >= 0) used.add(k); };
    const markSelf = () => mark(i, i + span - 1);

    if (en.day !== undefined && c.offset === null) { c.offset = en.day; markSelf(); if (t.low === 'tonight') { c.part ??= '20:00'; c.hint ??= 'pm'; } continue; }
    if (en.weekday !== undefined && c.weekday === null) { c.weekday = en.weekday; c.nextWd = isNext(i - 1); markSelf(); if (c.nextWd) mark(i - 1); continue; }
    if (en.week && isNext(i - 1)) { c.nextWeek = true; mark(i - 1, i); continue; }
    if (en.monthWord && isNext(i - 1)) { c.nextMonth = true; mark(i - 1, i); continue; }
    if (en.daypart) { if (!c.part) { c.part = en.daypart[0]; c.hint ??= en.daypart[1]; } markSelf(); continue; }
    if (en.month && c.month === null && en.num === undefined && en.item === undefined) {
      // only a month name next to a number ("15 October", "October 15")
      const near = [tokens[i - 1], tokens[i + 1]].some(n => n?.digits || n?.entry?.num !== undefined);
      if (near) { c.month = en.month; markSelf(); }
      continue;
    }
    if (en.clock && (t.low === 'am' || t.low === 'pm')) { c.hint = t.low; markSelf(); continue; }

    if (t.num === undefined && en.num === undefined) continue;
    const value = t.num ?? en.num;
    const nextT = tokens[i + span];
    const nextE = nextT?.entry ?? {};
    const raw = t.low;

    // 15/10 (day/month). "1/2", "3/4" stay quantities.
    const dm = /^(\d{1,2})\/(\d{1,2})$/.exec(raw);
    if (dm && c.dom === null && (+dm[1] > 4 || +dm[2] > 4) && +dm[2] <= 12 && !nextE.unit) {
      c.dom = +dm[1]; c.month = +dm[2]; markSelf(); continue;
    }
    // 15th, 15-aam theethi, 15 October, pathinanjaam theethi
    if (c.dom === null && Number.isInteger(value) && value >= 1 && value <= 31) {
      // "20th-nu" and "31-nu" are dates; "6-nu" is six o'clock
      const ordinalNext = nextT && !nextT.punct && ORDINAL.test(nextT.low) && !(nextT.low === 'am' && !e(i + span + 1).dateWord)
        && !(/^n+u$/.test(nextT.low) && value <= 12);
      const spelled = t.suffix === 'aam' || t.suffix === 'am';
      const monthNear = nextE.month || e(i - 1).month;
      if ((t.digits && (ordinalNext || monthNear || nextE.dateWord)) || (spelled && (nextE.dateWord || nextE.month)) || (!t.digits && nextE.dateWord && !spelled && value > 0)) {
        c.dom = value; markSelf();
        let k = i + span;
        if (ordinalNext) mark(k++);
        if (tokens[k]?.entry?.dateWord) mark(k++);
        if (tokens[k]?.entry?.month) { c.month = tokens[k].entry.month; mark(k); }
        if (e(i - 1).month) { c.month = e(i - 1).month; mark(i - 1); }
        continue;
      }
    }
    // 5:30, 5.30, 5 manikku, anchara manikku, 7 pm
    const colon = /^(\d{1,2})[:.](\d{2})$/.exec(raw);
    const clockNext = nextE.clock !== undefined || (!!t.digits && /^n+u$/.test(nextT?.low ?? '') && value <= 12);
    if (colon && (clockNext || raw.includes(':') || !nextE.unit)) {
      c.hour = +colon[1]; c.minute = +colon[2]; markSelf();
      if (clockNext) { mark(i + span); if (nextT.low === 'am' || nextT.low === 'pm') c.hint = nextT.low; }
      continue;
    }
    if (clockNext && value > 0 && value <= 24) {
      c.hour = Math.floor(value); c.minute = Math.round((value % 1) * 60);
      markSelf(); mark(i + span);
      if (nextT.low === 'am' || nextT.low === 'pm') c.hint = nextT.low;
    }
  }

  let date = null;
  let approx = false;
  if (c.dom !== null) date = dayOfMonth(today, c.dom, c.month, c.nextMonth);
  else if (c.offset !== null) date = addDays(today, c.offset);
  else if (c.weekday !== null) date = nextWeekday(today, c.weekday, c.nextWd);
  else if (c.nextWeek) { date = nextWeekday(today, 1, true); approx = true; }
  else if (c.nextMonth) { date = dayOfMonth(today, 1, null, true); approx = true; }

  let time = null;
  if (c.hour !== null) {
    let h = c.hour;
    if (c.hint === 'pm' && h < 12) h += 12;
    else if (c.hint === 'am' && h === 12) h = 0;
    else if (c.hint === 'noon' && h >= 1 && h <= 5) h += 12;
    else if (!c.hint && h >= 1 && h <= 6) h += 12;   // "anju manikku" is 5 pm, not 5 am
    time = `${pad(h % 24)}:${pad(c.minute)}`;
  } else if (c.part) {
    time = c.part;
    approx = true;
  }
  if (date === null && time === null) return null;
  if (date === null) date = today;
  // sure: the hour came with am/pm or a part of day, not the 1-6 = pm guess
  return { date, time, approx, sure: c.hour !== null && c.hint !== null, used };
}
