import { useRef, useState } from 'react';
import { BusyBars, Btn, Chip, Circle, COLORS, Pill } from '../components/bits.jsx';
import { Icon, Logo } from '../components/Icons.jsx';
import { MAX_SEC } from '../lib/recorder.js';
import { useSettings } from '../lib/store.js';
import { clock, useRecorder } from '../lib/useRecorder.js';

// Home makes one thing: an email. Notes are made in the Notes section and lists in
// Orders, each with its own mic, so nothing is chosen here any more.
const MAIL = {
  title: <>Speak an<br />email</>,
  desc: 'Say it in Malayalam or Manglish. Voc writes it in English, ready for Gmail.',
  button: 'Record your email',
  placeholder: 'Rahul sir-nu mail…',
  examples: [
    ['Leave request', 'Rahul sir-nu oru mail ayakkanam. Nale njan office-il varilla, Ammede doctor appointment und. Report njan mattannal raavile ayachu tharam. Leave approve cheyyanam.'],
    ['Supplier', 'Supplier-nu mail ayakkanam. Kazhinja aazhcha order cheytha 50 bag cement innum vannilla. Velliyazhcha munpu ethikkanam, illenkil order cancel cheyyum.'],
  ],
};
const REPLY_TONES = ['', 'sage'];

function greeting(now = new Date()) {
  const h = (now.getUTCHours() + 5.5) % 24;
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function New({ onAudio, onText, busy, error, canHear, status, go, today }) {
  const [text, setText] = useState('');
  const fileRef = useRef(null);
  const joined = !!useSettings().android;
  const r = useRecorder(blob => onAudio(blob, 'voice', 'email'));

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onText(t, 'typed', 'email');
    setText('');
  }

  const day = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const working = busy?.kind === 'email';

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

      {working ? (
        <section className="card tone t-violet rec-card" aria-live="polite">
          <div className="card-top"><span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}><BusyBars /></span></div>
          <h2 className="card-title">{busy.stage}…</h2>
          <p className="desc">Malayalam, English, both at once: Voc is on it.</p>
        </section>
      ) : r.recording ? (
        <section className="card tone t-violet rec-card" aria-live="polite">
          <div className="card-top">
            <div className="grow"><Chip dot={COLORS.coral}>recording · max {MAX_SEC / 60} min</Chip></div>
            <Circle icon="stop" tone="dark" label="Stop" onClick={r.stop} />
          </div>
          <div className="timer">{clock(r.secs)}</div>
          <div className="bars" aria-hidden="true">{r.bars.map((v, i) => <span key={i} style={{ height: `${8 + v * 84}px` }} />)}</div>
          <Btn block icon="stop" onClick={r.stop}>Stop and write it</Btn>
        </section>
      ) : (
        <section className="card tone t-violet rec-card">
          <div className="card-top">
            <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon.mail(22)}</span>
            <div className="grow" />
            <Circle icon="file" label="Open an audio file" disabled={!canHear} onClick={() => fileRef.current?.click()} />
          </div>
          <h2 className="card-title">{MAIL.title}</h2>
          <p className="desc">{MAIL.desc}</p>
          <Btn block onClick={r.start} disabled={!canHear || !!busy}><span className="rec-dot" />{canHear ? MAIL.button : 'Speech needs the server'}</Btn>
        </section>
      )}
      <input ref={fileRef} className="hidden-input" type="file" accept="audio/*,.opus,.ogg,.m4a,.amr" tabIndex={-1}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onAudio(f, 'file', 'email'); }} />

      {(error || r.error) && <div className="err" role="alert">{Icon.alert(18)}<span>{error || r.error}</span></div>}

      <section className="card night-card">
        <h2 className="card-title">Or type it</h2>
        <p className="desc muted">Paste a WhatsApp message, in Manglish or Malayalam.</p>
        <div className="chips">
          {MAIL.examples.map(([label, sample], i) => (
            <button key={label} type="button" className={`reply ${REPLY_TONES[i % REPLY_TONES.length]}`} onClick={() => setText(sample)}>Try: {label.toLowerCase()}</button>
          ))}
        </div>
        <div className="composer">
          <Circle icon="plus" tone="coral" label="Open an audio file" disabled={!canHear} onClick={() => fileRef.current?.click()} />
          <div className="field">
            <textarea value={text} rows={Math.min(6, Math.max(1, Math.ceil(text.length / 34)))} placeholder={MAIL.placeholder} aria-label="Message in Manglish"
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); submit(); } }} />
            {text.trim()
              ? <Circle icon="up" tone="ice" label="Write it" disabled={!!busy} onClick={submit} />
              : <span className="icon">{Icon.wave(20)}</span>}
          </div>
        </div>
      </section>

      <button type="button" className="card tone t-cream promo" onClick={() => go('translate')}>
        <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon.wave(22)}</span>
        <span className="grow">
          <span className="small">Malayalam · Hindi · Manglish</span>
          <span className="card-title">Say your reply in English</span>
        </span>
        <span className="circle dark" aria-hidden="true">{Icon.arrow(20)}</span>
      </button>

      {!joined && (
        <button type="button" className="card tone t-mint promo" onClick={() => go('android')}>
          <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon.phone(22)}</span>
          <span className="grow">
            <span className="small">Coming to Google Play</span>
            <span className="card-title">Get the Android app early</span>
          </span>
          <span className="circle dark" aria-hidden="true">{Icon.arrow(20)}</span>
        </button>
      )}
    </>
  );
}
