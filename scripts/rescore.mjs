// Re-scores saved runs with the current scorer and labels, without calling any model.
//   node scripts/rescore.mjs                 every file in eval/results
//   node scripts/rescore.mjs holdout         only files whose name contains "holdout"
import { readFileSync, readdirSync } from 'node:fs';
import { scoreCase, summarise } from '../eval/score.js';

const filter = process.argv[2] ?? '';
const sets = {};
for (const name of ['cases', 'holdout']) {
  sets[name] = Object.fromEntries(readFileSync(new URL(`../eval/${name}.jsonl`, import.meta.url), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).map(c => [c.id, c]));
}
const dir = new URL('../eval/results/', import.meta.url);
const pct = v => (v == null ? '  –' : `${v.toFixed(0).padStart(3)}%`);
for (const file of readdirSync(dir).filter(f => f.endsWith('.json') && !f.includes('audio') && f.includes(filter)).sort()) {
  const run = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
  const set = sets[run.set ?? (file.includes('holdout') ? 'holdout' : 'cases')];
  const results = run.results.map(r => {
    const s = scoreCase(set[r.id], r.output);
    if (r.output.error) { s.problems.unshift(`error: ${r.output.error}`); s.exact = false; s.loose = false; }
    return s;
  });
  const s = summarise(results);
  console.log(`${file.padEnd(52)} fully right ${pct(s.exact)}  forgiving type ${pct(s.loose)}  items F1 ${pct(s.items.f1)}  qty ${pct(s.items.qty)}  errors ${s.errors}`);
}
