// Scores one extraction against a labelled case (eval/cases.jsonl).
// Items match on name (a regex, so unknown brands can be "Surf.*"); quantity
// counts as right when value and unit agree after converting kg/g and L/ml.
// To-dos and events match when their title contains the case's keyword regex.

const BASE = { kg: ['g', 1000], g: ['g', 1], l: ['ml', 1000], ml: ['ml', 1] };
const norm = (q, u) => {
  if (q == null) return [null, u === 'piece' ? null : u ?? null];
  const b = BASE[u];
  return b ? [Math.round(q * b[1] * 1000) / 1000, b[0]] : [q, u === 'piece' ? null : u ?? null];
};
const sameQty = (a, b) => {
  const [qa, ua] = norm(a.qty, a.unit);
  const [qb, ub] = norm(b.qty, b.unit);
  return qa === qb && ua === ub;
};

function matchList(expected, predicted, test) {
  const used = new Set();
  const pairs = [];
  for (const e of expected) {
    const k = predicted.findIndex((p, i) => !used.has(i) && test(e, p));
    if (k !== -1) { used.add(k); pairs.push([e, predicted[k]]); } else pairs.push([e, null]);
  }
  const extra = predicted.filter((_, i) => !used.has(i));
  return { pairs, extra };
}

export function scoreCase(c, out) {
  const r = { id: c.id, domain: c.domain, problems: [] };
  const expItems = (c.items ?? []).map(([name, qty, unit]) => ({ name, qty, unit }));
  const im = matchList(expItems, out.items ?? [], (e, p) => new RegExp(`^(${e.name})$`, 'i').test(p.name));
  r.items = { exp: expItems.length, got: (out.items ?? []).length, tp: 0, qtyOk: 0 };
  for (const [e, p] of im.pairs) {
    if (!p) { r.problems.push(`missed item ${e.name}`); continue; }
    r.items.tp++;
    if (sameQty(e, p)) r.items.qtyOk++;
    else r.problems.push(`qty ${e.name}: want ${e.qty} ${e.unit ?? ''}, got ${p.qty} ${p.unit ?? ''}`);
  }
  for (const p of im.extra) r.problems.push(`extra item ${p.name}`);

  for (const kind of ['todos', 'events']) {
    const exp = c[kind] ?? [];
    const got = out[kind] ?? [];
    const m = matchList(exp, got, (e, p) => new RegExp(e.kw, 'i').test(p.title ?? ''));
    const s = { exp: exp.length, got: got.length, tp: 0, dateChecks: 0, dateOk: 0, timeChecks: 0, timeOk: 0 };
    for (const [e, p] of m.pairs) {
      if (!p) { r.problems.push(`missed ${kind.slice(0, -1)} /${e.kw}/`); continue; }
      s.tp++;
      if (e.date !== undefined) {
        s.dateChecks++;
        if (p.date === e.date) s.dateOk++; else r.problems.push(`${kind.slice(0, -1)} /${e.kw}/ date: want ${e.date}, got ${p.date}`);
      }
      if (e.time !== undefined) {
        s.timeChecks++;
        if (p.time === e.time) s.timeOk++; else r.problems.push(`${kind.slice(0, -1)} /${e.kw}/ time: want ${e.time}, got ${p.time}`);
      }
    }
    for (const p of m.extra) r.problems.push(`extra ${kind.slice(0, -1)} "${p.title}"`);
    r[kind] = s;
  }

  r.order = { checks: 0, ok: 0 };
  if (c.order) {
    r.order.checks = 1;
    const o = out.order ?? {};
    if (o.date === c.order.date && (c.order.time === undefined || o.time === c.order.time)) r.order.ok = 1;
    else r.problems.push(`order when: want ${c.order.date} ${c.order.time ?? ''}, got ${o.date ?? '-'} ${o.time ?? ''}`);
  }
  r.exact = r.problems.length === 0;

  // Loose: the same, except a to-do filed as an event (or back) still counts.
  // Many misses are that judgement call ("Pick up Chettan, 6 am": task or appointment?).
  const exp = [...(c.todos ?? []), ...(c.events ?? [])];
  const got = [...(out.todos ?? []), ...(out.events ?? [])];
  const lm = matchList(exp, got, (e, p) => new RegExp(e.kw, 'i').test(p.title ?? ''));
  const actionsOk = lm.extra.length === 0 && lm.pairs.every(([e, p]) => p && (e.date === undefined || p.date === e.date) && (e.time === undefined || p.time === e.time));
  const itemsOk = !r.problems.some(x => /item|qty/.test(x));
  r.loose = actionsOk && itemsOk && r.order.ok === r.order.checks && !r.problems.some(x => x.startsWith('error'));
  return r;
}

const pct = (a, b) => (b ? (100 * a) / b : null);
const f1 = (p, r) => (p == null || r == null || p + r === 0 ? null : (2 * p * r) / (p + r));

export function summarise(results) {
  const sum = (path) => results.reduce((n, r) => n + path(r), 0);
  const items = { tp: sum(r => r.items.tp), exp: sum(r => r.items.exp), got: sum(r => r.items.got), qtyOk: sum(r => r.items.qtyOk) };
  const kind = k => ({
    tp: sum(r => r[k].tp), exp: sum(r => r[k].exp), got: sum(r => r[k].got),
    dateOk: sum(r => r[k].dateOk), dateChecks: sum(r => r[k].dateChecks),
    timeOk: sum(r => r[k].timeOk), timeChecks: sum(r => r[k].timeChecks),
  });
  const todos = kind('todos');
  const events = kind('events');
  const ip = pct(items.tp, items.got), ir = pct(items.tp, items.exp);
  const tp = pct(todos.tp, todos.got), tr = pct(todos.tp, todos.exp);
  const ep = pct(events.tp, events.got), er = pct(events.tp, events.exp);
  return {
    notes: results.length,
    exact: pct(results.filter(r => r.exact).length, results.length),
    loose: pct(results.filter(r => r.loose).length, results.length),
    errors: results.filter(r => r.problems.some(x => x.startsWith('error'))).length,
    items: { precision: ip, recall: ir, f1: f1(ip, ir), qty: pct(items.qtyOk, items.tp) },
    todos: { precision: tp, recall: tr, f1: f1(tp, tr), date: pct(todos.dateOk, todos.dateChecks), time: pct(todos.timeOk, todos.timeChecks) },
    events: { precision: ep, recall: er, f1: f1(ep, er), date: pct(events.dateOk, events.dateChecks), time: pct(events.timeOk, events.timeChecks) },
    orderWhen: pct(sum(r => r.order.ok), sum(r => r.order.checks)),
  };
}
