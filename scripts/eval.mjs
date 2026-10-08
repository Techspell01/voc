// Text eval: runs every labelled note through an engine and scores it.
//   npm run eval                 rules only (offline, instant)
//   npm run eval -- --llm        rules and the LLM engine side by side
//   npm run eval -- --llm --only=llm --save=prompt-v2
//   npm run eval -- --set=holdout   the held-out notes; never tune the parser on these
//   npm run eval -- --llm --provider=gemini --pace=4500   one provider, paced for its free tier
// Results go to eval/results/<date>-<engine>[-label].json so runs can be compared.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { extract } from '../src/lib/manglish/parse.js';
import { scoreCase, summarise } from '../eval/score.js';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const TODAY = '2026-10-08';   // every case is written as if said on Thursday 8 Oct 2026
const SET = args.set === 'holdout' ? 'holdout' : 'cases';
const cases = readFileSync(new URL(`../eval/${SET}.jsonl`, import.meta.url), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))
  .filter(c => !args.case || c.id.startsWith(args.case));

const engines = { rules: async c => extract(c.text, { today: c.today ?? TODAY }) };
if (args.llm) {
  const { extractWithLLM } = await import('../server/extract.js');
  // free tiers allow a few calls a minute, so the eval waits out rate limits (up to 2 min per note)
  const env = { ...process.env, RETRY_WAIT_MS: process.env.RETRY_WAIT_MS ?? '120000' };
  const only = typeof args.provider === 'string' ? args.provider : undefined;
  engines.llm = async c => (await extractWithLLM(c.text, { today: c.today ?? TODAY, env, only })).result;
}
const label = args.provider && args.llm ? `-${args.provider}` : '';
const pick = args.only ? Object.fromEntries(Object.entries(engines).filter(([k]) => k === args.only)) : engines;

const fmt = v => (v == null ? '   –' : `${v.toFixed(0).padStart(3)}%`);
const runs = {};
for (const [name, run] of Object.entries(pick)) {
  const results = [];
  const t0 = Date.now();
  for (const [k, c] of cases.entries()) {
    // --pace=4500 keeps under a free tier's requests-per-minute (Gemini Flash-Lite: 15)
    if (name === 'llm' && args.pace && k) await new Promise(r => setTimeout(r, +args.pace));
    let out;
    try { out = await run(c); } catch (err) {
      const why = err.errors?.map(e => `${e.provider} ${e.status}`).join(', ');
      out = { items: [], todos: [], events: [], error: why ? `${err.message} (${why})` : String(err.message ?? err) };
    }
    const r = scoreCase(c, out);
    if (out.error) r.problems.unshift(`error: ${out.error}`), r.exact = false;
    if (args.verbose && out.error) console.error(c.id, out.error);
    r.output = out;
    results.push(r);
  }
  runs[name] = { results, summary: summarise(results), ms: Date.now() - t0 };
}

for (const [name, { results, summary: s, ms }] of Object.entries(runs)) {
  console.log(`\n== ${name}  (${s.notes} notes, ${(ms / 1000).toFixed(1)}s)`);
  console.log(`  notes fully right   ${fmt(s.exact)}   (to-do/event mix-ups forgiven: ${fmt(s.loose)})${s.errors ? `   ${s.errors} service errors` : ''}`);
  console.log(`  items     P ${fmt(s.items.precision)}  R ${fmt(s.items.recall)}  F1 ${fmt(s.items.f1)}  qty+unit ${fmt(s.items.qty)}`);
  console.log(`  to-dos    P ${fmt(s.todos.precision)}  R ${fmt(s.todos.recall)}  F1 ${fmt(s.todos.f1)}  date ${fmt(s.todos.date)}  time ${fmt(s.todos.time)}`);
  console.log(`  events    P ${fmt(s.events.precision)}  R ${fmt(s.events.recall)}  F1 ${fmt(s.events.f1)}  date ${fmt(s.events.date)}  time ${fmt(s.events.time)}`);
  console.log(`  order date/time     ${fmt(s.orderWhen)}`);
  const byDomain = {};
  for (const r of results) (byDomain[r.domain] ??= []).push(r);
  console.log('  by domain: ' + Object.entries(byDomain).map(([d, rs]) => `${d} ${rs.filter(r => r.exact).length}/${rs.length}`).join(' · '));
  if (!args.quiet) for (const r of results.filter(r => !r.exact)) console.log(`  ✗ ${r.id}: ${r.problems.join('; ')}`);
}

if (args.save !== undefined) {
  mkdirSync(new URL('../eval/results/', import.meta.url), { recursive: true });
  for (const [name, run] of Object.entries(runs)) {
    const tag = (name === 'llm' ? label : '') + (args.save === true ? '' : `-${args.save}`);
    const file = new URL(`../eval/results/${new Date().toISOString().slice(0, 10)}-${SET}-${name}${tag}.json`, import.meta.url);
    writeFileSync(file, JSON.stringify({ engine: name, set: SET, today: TODAY, summary: run.summary, results: run.results }, null, 2));
    console.log(`saved ${file.pathname}`);
  }
}
