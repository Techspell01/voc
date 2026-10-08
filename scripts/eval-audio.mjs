// Voice eval: speech -> transcript -> actions, per speech-to-text provider.
//   npm run eval:audio                      every configured provider, rule reader
//   npm run eval:audio -- --llm             also the AI reader on each transcript
//   npm run eval:audio -- --stt=gemini
// The clips are synthesised with Microsoft's free Malayalam neural voices
// (pip install edge-tts; TTS_PYTHON=path/to/python if it lives in a venv) into
// eval/audio/, so this measures clean speech. Real
// WhatsApp notes are noisier: add your own as eval/audio/<id>.mp3 with a line in
// eval/audio.jsonl ("say" = what was actually said) to test them the same way.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { transcribe } from '../server/transcribe.js';
import { extractWithLLM } from '../server/extract.js';
import { sttProviders } from '../server/providers.js';
import { extract } from '../src/lib/manglish/parse.js';
import { transliterate } from '../src/lib/manglish/translit.js';
import { skel } from '../src/lib/manglish/normalize.js';
import { scoreCase, summarise } from '../eval/score.js';

const args = Object.fromEntries(process.argv.slice(2).map(a => a.replace(/^--/, '').split('=')).map(([k, v]) => [k, v ?? true]));
const TODAY = '2026-10-08';
const env = { ...process.env, RETRY_WAIT_MS: '120000' };
const dir = new URL('../eval/audio/', import.meta.url);
mkdirSync(dir, { recursive: true });
const cases = readFileSync(new URL('../eval/audio.jsonl', import.meta.url), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));

for (const c of cases) {
  const file = new URL(`${c.id}.mp3`, dir);
  if (existsSync(file)) continue;
  execFileSync(process.env.TTS_PYTHON || 'python', ['-m', 'edge_tts', '--voice', c.voice, '--text', c.say, '--write-media', file.pathname.replace(/^\/([A-Z]:)/, '$1')]);
  console.log(`synthesised ${c.id}`);
}

// Character error rate on romanised skeletons, so script and spelling choices don't count as errors.
const flat = s => transliterate(s).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(skel).join(' ');
function cer(ref, hyp) {
  const a = flat(ref), b = flat(hyp);
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return a.length ? d[a.length][b.length] / a.length : 0;
}

const providers = typeof args.stt === 'string' ? [args.stt] : sttProviders(env);
const pct = v => (v == null ? '  –' : `${v.toFixed(0).padStart(3)}%`);
const report = {};
for (const p of providers) {
  const rows = [];
  for (const c of cases) {
    const audio = readFileSync(new URL(`${c.id}.mp3`, dir));
    let heard = '';
    try { heard = (await transcribe(audio, { env, only: p, mime: 'audio/mpeg' })).text; } catch (e) { heard = ''; console.error(p, c.id, e.errors?.map(x => `${x.status} ${x.detail.slice(0, 120)}`).join(' | ')); }
    const row = { id: c.id, heard, cer: cer(c.say, heard), rules: scoreCase(c, extract(heard, { today: TODAY })) };
    if (args.llm && heard) {
      try { row.llm = scoreCase(c, (await extractWithLLM(heard, { today: TODAY, env, only: 'gemini' })).result); } catch (e) {
        row.llm = scoreCase(c, { items: [], todos: [], events: [] });
        row.llm.problems.unshift(`AI error: ${e.errors?.map(x => `${x.provider} ${x.status}`).join(', ') ?? e.message}`);
      }
    }
    rows.push(row);
    if (args.verbose) console.log(`${p} ${c.id} cer ${(row.cer * 100).toFixed(0)}%  ${heard}`);
  }
  const meanCer = rows.reduce((n, r) => n + r.cer, 0) / rows.length;
  const rules = summarise(rows.map(r => r.rules));
  const llm = args.llm ? summarise(rows.map((r, n) => r.llm ?? scoreCase(cases[n], { items: [], todos: [], events: [] }))) : null;
  report[p] = { cer: meanCer, rules: rules.exact, llm: llm?.exact ?? null, rows };
  console.log(`\n== ${p}: char error ${pct(meanCer * 100)}  notes fully right: rules ${pct(rules.exact)}${llm ? `  AI ${pct(llm.exact)}` : ''}`);
  for (const r of rows) if (!r.rules.exact || (r.llm && !r.llm.exact)) console.log(`  ✗ ${r.id} (cer ${(r.cer * 100).toFixed(0)}%) "${r.heard}"\n      rules: ${r.rules.problems.join('; ') || 'ok'}${r.llm ? `\n      AI: ${r.llm.problems.join('; ') || 'ok'}` : ''}`);
}
mkdirSync(new URL('../eval/results/', import.meta.url), { recursive: true });
writeFileSync(new URL(`../eval/results/${new Date().toISOString().slice(0, 10)}-audio.json`, import.meta.url), JSON.stringify(report, null, 2));
