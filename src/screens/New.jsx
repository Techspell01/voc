import { useRef, useState } from 'react';
import { BusyBars, Btn, Chip, Circle, COLORS, Pill } from '../components/bits.jsx';
import { Icon, Logo } from '../components/Icons.jsx';
import NoteView from '../components/NoteView.jsx';
import { MAX_SEC } from '../lib/recorder.js';
import { clock, useRecorder } from '../lib/useRecorder.js';

// What you can say, and what Voc makes of it.
const MODES = {
  email: {
    label: 'Email', icon: 'mail', tone: 't-violet', color: COLORS.violet,
    title: <>Speak an<br />email</>, desc: 'Say it in Malayalam or Manglish. Voc writes it in English, ready for Gmail.',
    button: 'Record your email', placeholder: 'Rahul sir-nu mail…',
    examples: [
      ['Leave request', 'Rahul sir-nu oru mail ayakkanam. Nale njan office-il varilla, Ammede doctor appointment und. Report njan mattannal raavile ayachu tharam. Leave approve cheyyanam.'],
      ['Supplier', 'Supplier-nu mail ayakkanam. Kazhinja aazhcha order cheytha 50 bag cement innum vannilla. Velliyazhcha munpu ethikkanam, illenkil order cancel cheyyum.'],
    ],
  },
  note: {
    label: 'Note', icon: 'sticky', tone: 't-yellow', color: COLORS.yellow,
    title: <>Speak a<br />note</>, desc: 'Talk it out. It writes itself onto a sticky note, in clear English.',
    button: 'Record a note', placeholder: 'nale bank-il pokanam…',
    examples: [
      ['Errands', 'Nale raavile bank-il pokanam, light bill adakkanam, pinne Ammakku 500 roopa kodukkanam.'],
      ['Idea', 'App-il oru dark mode venam, pinne WhatsApp share button koode add cheyyanam. Velliyazhcha demo und.'],
    ],
  },
  lists: {
    label: 'Lists', icon: 'list', tone: 't-coral', color: COLORS.coral,
    title: <>Say it in<br />Manglish</>, desc: 'Shop orders, errands, meetings. Voc sorts them into lists, to-dos and calendar dates.',
    button: 'Record a voice note', placeholder: 'randu kilo ari venam…',
    examples: [
      ['Shop order', 'Chetta, randu kilo ari, arakilo cheriya ulli, pathu mutta, oru litre velichenna venam. Nale raavile ethikkanam.'],
      ['Family', 'Nale raavile 10 manikku Ammede doctor appointment und, reports eduthu vekkanam. Current bill adakkanam, pinne Achane vilikkanam.'],
      ['Work', 'Rahul, velliyazhcha 3 manikku client meeting und, presentation ready aakkanam. GST file cheyyanam 20th-nu munpu.'],
    ],
  },
};
const REPLY_TONES = ['', 'sage', 'yellow'];

function greeting(now = new Date()) {
  const h = (now.getUTCHours() + 5.5) % 24;
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function New({ mode, setMode, onAudio, onText, onReread, busy, error, note, today, canHear, status, go }) {
  const [text, setText] = useState('');
  const fileRef = useRef(null);
  const m = MODES[mode] ?? MODES.email;
  const r = useRecorder(blob => onAudio(blob, 'voice', mode));

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onText(t, 'typed', mode);
    setText('');
  }

  const day = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const working = busy && (busy.kind === mode || busy.kind === 'lists');

  return (
    <>
      <header className="head">
        <Logo size={44} />
        <div className="grow">
          <div>{greeting()}!</div>
          <div className="small muted">{day}</div>
        </div>
        <Circle icon="gear" label="Settings" onClick={() => go('settings')} />
      </header>
      <div className="gap" />
      <Pill wide onClick={() => go('settings')} label="Services">{status}</Pill>

      <div className="modes" role="radiogroup" aria-label="What to make">
        {Object.entries(MODES).map(([id, x]) => (
          <button key={id} type="button" role="radio" aria-checked={mode === id} className="mode" style={{ '--mode': x.color }}
            disabled={r.recording} onClick={() => setMode(id)}>
            <span className="ic">{Icon[x.icon](18)}</span>
            <span className="name">{x.label}</span>
          </button>
        ))}
      </div>

      {working ? (
        <section className={`card tone ${m.tone} rec-card`} aria-live="polite">
          <div className="card-top"><span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}><BusyBars /></span></div>
          <h2 className="card-title">{busy.stage}…</h2>
          <p className="desc">Malayalam, English, both at once: Voc is on it.</p>
        </section>
      ) : r.recording ? (
        <section className={`card tone ${m.tone} rec-card`} aria-live="polite">
          <div className="card-top">
            <div className="grow"><Chip dot={COLORS.coral}>recording · max {MAX_SEC / 60} min</Chip></div>
            <Circle icon="stop" tone="dark" label="Stop" onClick={r.stop} />
          </div>
          <div className="timer">{clock(r.secs)}</div>
          <div className="bars" aria-hidden="true">{r.bars.map((v, i) => <span key={i} style={{ height: `${8 + v * 84}px` }} />)}</div>
          <Btn block icon="stop" onClick={r.stop}>Stop and {mode === 'lists' ? 'read' : 'write'} it</Btn>
        </section>
      ) : (
        <section className={`card tone ${m.tone} rec-card`}>
          <div className="card-top">
            <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon[m.icon](22)}</span>
            <div className="grow" />
            <Circle icon="file" label="Open an audio file" disabled={!canHear} onClick={() => fileRef.current?.click()} />
          </div>
          <h2 className="card-title">{m.title}</h2>
          <p className="desc">{m.desc}</p>
          <Btn block onClick={r.start} disabled={!canHear || !!busy}><span className="rec-dot" />{canHear ? m.button : 'Speech needs the server'}</Btn>
        </section>
      )}
      <input ref={fileRef} className="hidden-input" type="file" accept="audio/*,.opus,.ogg,.m4a,.amr" tabIndex={-1}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onAudio(f, 'file', mode); }} />

      {(error || r.error) && <div className="err" role="alert">{Icon.alert(18)}<span>{error || r.error}</span></div>}

      <section className="card night-card">
        <h2 className="card-title">Or type it</h2>
        <p className="desc muted">Paste a WhatsApp message, in Manglish or Malayalam.</p>
        <div className="chips">
          {m.examples.map(([label, sample], i) => (
            <button key={label} type="button" className={`reply ${REPLY_TONES[i % 3]}`} onClick={() => setText(sample)}>Try: {label.toLowerCase()}</button>
          ))}
        </div>
        <div className="composer">
          <Circle icon="plus" tone="coral" label="Open an audio file" disabled={!canHear} onClick={() => fileRef.current?.click()} />
          <div className="field">
            <textarea value={text} rows={Math.min(6, Math.max(1, Math.ceil(text.length / 34)))} placeholder={m.placeholder} aria-label="Message in Manglish"
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); submit(); } }} />
            {text.trim()
              ? <Circle icon="up" tone="ice" label={mode === 'lists' ? 'Read it' : 'Write it'} disabled={!!busy} onClick={submit} />
              : <span className="icon">{Icon.wave(20)}</span>}
          </div>
        </div>
        {mode === 'lists' && <p className="note-line muted">Android: in WhatsApp, long-press a voice note, Share, then Voc (after Add to Home screen).</p>}
      </section>

      {mode === 'lists' && note && !busy && <NoteView key={note.id + note.at + (note.engine ?? '')} note={note} today={today} onReread={t => onReread(note.id, t)} busy={!!busy} />}
    </>
  );
}
