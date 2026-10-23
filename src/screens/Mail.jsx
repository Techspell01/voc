// Emails written from speech: a list of drafts, one open draft, and a mic to dictate another.
import { useEffect, useState } from 'react';
import { Circle, COLORS, ScreenHead } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import EmailCard from '../components/EmailCard.jsx';
import RecordFab from '../components/RecordPanel.jsx';
import { BusyBars } from '../components/bits.jsx';
import { ago } from '../lib/format.js';
import { removeNote } from '../lib/store.js';

export default function Mail({ notes, open, setOpen, onAudio, onText, onRewrite, busy, error, canHear }) {
  const [draft, setDraft] = useState('');
  const emails = notes.filter(n => n.kind === 'email');
  const opened = emails.find(n => n.id === open);
  useEffect(() => { if (open && !opened) setOpen(null); }, [open, opened]);

  function submit() {
    const t = draft.trim();
    if (!t || busy) return;
    onText(t, 'typed', 'email');
    setDraft('');
  }

  const writing = busy?.kind === 'email' ? (
    <section className="card tone t-violet" aria-live="polite">
      <div className="card-top"><span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}><BusyBars /></span></div>
      <h2 className="card-title" style={{ marginTop: 14 }}>{busy.stage}…</h2>
      <p className="desc">Speak in Malayalam: the email comes out in English.</p>
    </section>
  ) : null;

  if (opened) {
    return (
      <>
        <ScreenHead title="Email" onBack={() => setOpen(null)}
          right={<Circle icon="trash" tone="ghost" label="Delete this email" onClick={() => { removeNote(opened.id); setOpen(null); }} />} />
        {writing}
        <EmailCard key={opened.id + opened.at} note={opened} onRewrite={onRewrite} busy={!!busy} />
      </>
    );
  }

  return (
    <>
      <ScreenHead title="Mail" />
      <p className="small muted" style={{ marginTop: 4 }}>Speak in Malayalam or Manglish. Voc writes the email in English.</p>
      {writing}
      {!emails.length && !writing && (
        <section className="card tone t-violet">
          <span className="icon-sq">{Icon.mail(22)}</span>
          <h2 className="card-title" style={{ marginTop: 16 }}>Speak an<br />email</h2>
          <p className="desc">"Rahul sir-nu mail ayakkanam, nale leave venam, Ammede doctor appointment und…" becomes a polite English email, ready for Gmail.</p>
          <p className="desc small">Tap the mic below, or type it.</p>
        </section>
      )}
      {emails.map(n => (
        <section key={n.id} className="card night-card">
          <div className="card-top">
            <span className="icon-dot" style={{ background: COLORS.violet }}>{Icon.mail(20)}</span>
            <div className="grow">
              <h2 className="card-title" style={{ fontSize: 22 }}>{n.result.subject}</h2>
              <p className="desc muted clamp">{n.result.body.replace(/\n+/g, ' ')}</p>
            </div>
            <Circle icon="arrow" label="Open email" onClick={() => setOpen(n.id)} />
          </div>
          <div className="chips">
            <span className="tag yellow">{ago(n.at)}</span>
            {n.result.toName && <span className="tag violet">to {n.result.toName}</span>}
            {n.result.to && <span className="tag ice">{n.result.to}</span>}
          </div>
        </section>
      ))}
      <section className="card night-card">
        <h2 className="card-title">Or type it</h2>
        <p className="desc muted">A message in Manglish or Malayalam; Voc writes the email in English.</p>
        <div className="composer">
          <div className="field">
            <textarea value={draft} rows={Math.min(6, Math.max(1, Math.ceil(draft.length / 34)))} placeholder="Rahul sir-nu mail…" aria-label="Message for the email"
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) { e.preventDefault(); submit(); } }} />
            {draft.trim()
              ? <Circle icon="up" tone="ice" label="Write the email" disabled={!!busy} onClick={submit} />
              : <span className="icon">{Icon.wave(20)}</span>}
          </div>
        </div>
      </section>
      <RecordFab tone="violet" what="email" label="Speak an email" disabled={!canHear || !!busy} onAudio={blob => onAudio(blob, 'voice', 'email')} error={busy ? '' : error} />
    </>
  );
}
