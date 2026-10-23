// Say your reply in Malayalam, Hindi or Manglish and get it in English, ready to
// paste into WhatsApp. Nothing is saved and nothing appears in Notes or Orders.
import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { BusyBars, Btn, Chip, Circle, COLORS, ScreenHead } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import { MAX_SEC } from '../lib/recorder.js';
import { copy, whatsappUrl } from '../lib/share.js';
import { clock, useRecorder } from '../lib/useRecorder.js';

const TONES = ['', 'sage', 'yellow'];
const EXAMPLES = [
  ['Hindi', 'Kal main tumhe 10 baje call karunga, usse pehle report bhej dunga.'],
  ['Manglish', 'Nale raavile 10 manikku office-il varum, lunch box set cheyyanam.'],
  ['Hinglish', 'Main kal office late aaunga, 11 baje tak pahunch jaunga.'],
];

export default function Translate({ busy, error, canHear, go, onAudio, onText, result, onClear }) {
  const [text, setText] = useState('');
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const r = useRecorder(blob => onAudio(blob, 'voice', 'translate'));
  const working = !!busy && busy.kind === 'translate';
  const inApp = Capacitor.isNativePlatform();
  const lastCopied = useRef('');

  // The English reply goes on the clipboard the moment it arrives, so all that is
  // left is to paste it into the chat. A browser may refuse the copy without a tap
  // first, and then the Copy button below is still there.
  useEffect(() => {
    const t = result?.text ?? '';
    if (!t || t === lastCopied.current) return;
    lastCopied.current = t;
    copy(t).then(ok => {
      if (!ok) return;
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }, [result]);

  function submit() {
    const t = text.trim();
    if (!t || working) return;
    onText(t, 'typed', 'translate');
    setText('');
  }

  async function doCopy() {
    const ok = await copy(result?.text ?? '');
    setCopied(ok);
    if (ok) setTimeout(() => setCopied(false), 1600);
  }

  const canShare = typeof navigator !== 'undefined' && !!navigator.share;
  async function share() {
    try { await navigator.share({ text: result?.text ?? '' }); } catch { /* dismissed */ }
  }

  return (
    <>
      <ScreenHead title="Translate" onBack={() => go('new')} />

      {working ? (
        <section className="card tone t-ice rec-card" aria-live="polite">
          <div className="card-top"><span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}><BusyBars /></span></div>
          <h2 className="card-title">{busy.stage}…</h2>
          <p className="desc">Malayalam, Hindi, Manglish: Voc is on it.</p>
        </section>
      ) : r.recording ? (
        <section className="card tone t-ice rec-card" aria-live="polite">
          <div className="card-top">
            <div className="grow"><Chip dot={COLORS.coral}>recording · max {MAX_SEC / 60} min</Chip></div>
            <Circle icon="stop" tone="dark" label="Stop" onClick={r.stop} />
          </div>
          <div className="timer">{clock(r.secs)}</div>
          <div className="bars" aria-hidden="true">{r.bars.map((v, i) => <span key={i} style={{ height: `${8 + v * 84}px` }} />)}</div>
          <Btn block icon="stop" onClick={r.stop}>Stop and translate it</Btn>
        </section>
      ) : (
        <section className="card tone t-ice rec-card">
          <div className="card-top">
            <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon.wave(22)}</span>
            <div className="grow" />
            <Circle icon="file" label="Open an audio file" disabled={!canHear} onClick={() => fileRef.current?.click()} />
          </div>
          <h2 className="card-title">Say your<br />reply</h2>
          <p className="desc">Say it in Malayalam, Hindi or Manglish. Voc writes it in English, ready to paste.</p>
          <Btn block onClick={r.start} disabled={!canHear || working}><span className="rec-dot" />{canHear ? 'Say your reply' : 'Speech needs the server'}</Btn>
        </section>
      )}
      <input ref={fileRef} className="hidden-input" type="file" accept="audio/*,.opus,.ogg,.m4a,.amr" tabIndex={-1}
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onAudio(f, 'file', 'translate'); }} />

      {(error || r.error) && <div className="err" role="alert">{Icon.alert(18)}<span>{error || r.error}</span></div>}

      {result && (
        <section className="card tone t-mint" aria-live="polite">
          <div className="card-top">
            <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon.check(22)}</span>
            <div className="grow">
              <div className="small">{result.from ? `Said in ${result.from}` : 'English reply'}</div>
              <div className="card-title">Send this</div>
            </div>
            <Circle icon="trash" label="Clear the translation" onClick={onClear} />
          </div>
          <p className="translate-out">{result.text}</p>
          {result.said && <p className="note-line muted">{result.stt ? 'You said: ' : 'You typed: '}{result.said}</p>}
          {result.fallback && <p className="note-line muted">{result.fallback}</p>}
          <div className="btns">
            <Btn icon="send" tone="light" href={whatsappUrl(result.text)}>WhatsApp</Btn>
            <Btn icon="copy" tone="light" onClick={doCopy}>{copied ? 'Copied' : 'Copy'}</Btn>
            {canShare && <Btn icon="share" tone="light" onClick={share}>Share</Btn>}
          </div>
        </section>
      )}

      <section className="card night-card">
        <h2 className="card-title">Or type it</h2>
        <p className="desc muted">A message you got in Hindi or Manglish, to read in English.</p>
        <div className="chips">
          {EXAMPLES.map(([label, sample], i) => (
            <button key={label} type="button" className={`reply ${TONES[i % TONES.length]}`} onClick={() => setText(sample)}>Try: {label.toLowerCase()}</button>
          ))}
        </div>
        <div className="composer">
          <Circle icon="plus" tone="coral" label="Open an audio file" disabled={!canHear} onClick={() => fileRef.current?.click()} />
          <div className="field">
            <textarea value={text} rows={Math.min(6, Math.max(1, Math.ceil(text.length / 34)))} placeholder="Kal main tumhe 10 baje…" aria-label="Message to translate"
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); submit(); } }} />
            {text.trim()
              ? <Circle icon="up" tone="ice" label="Translate it" disabled={working} onClick={submit} />
              : <span className="icon">{Icon.wave(20)}</span>}
          </div>
        </div>
        <p className="note-line muted">Nothing is kept: this is only a translation.</p>
      </section>

      {inApp && (
        <section className="card night-card">
          <h2 className="card-title">Talk into WhatsApp itself</h2>
          <p className="desc muted">With the Voc keyboard on, you can speak while the chat box is open and the English reply is written straight into it.</p>
          <ul className="plain small">
            <li>Phone Settings → Keyboard → On-screen keyboard → Voc keyboard, and turn it on.</li>
            <li>In any chat, open the keyboard switcher and choose <b>Voc keyboard</b>.</li>
            <li>Tap <b>Tap to speak</b>, say your reply in Malayalam, Hindi or Manglish, then tap Stop.</li>
          </ul>
          <p className="note-line muted">The keyboard only hears you while you hold it open, and keeps nothing.</p>
        </section>
      )}
    </>
  );
}
