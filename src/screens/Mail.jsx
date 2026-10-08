// Emails written from speech: a list of drafts, one open draft, and a mic to dictate another.
import { useEffect, useState } from 'react';
import { Btn, Circle, COLORS, ScreenHead } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import EmailCard from '../components/EmailCard.jsx';
import RecordFab from '../components/RecordPanel.jsx';
import { BusyBars } from '../components/bits.jsx';
import { ago } from '../lib/format.js';
import { removeNote } from '../lib/store.js';

export default function Mail({ notes, open, setOpen, onAudio, onRewrite, busy, error, canHear, go }) {
  const emails = notes.filter(n => n.kind === 'email');
  const opened = emails.find(n => n.id === open);
  useEffect(() => { if (open && !opened) setOpen(null); }, [open, opened]);

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
          <p className="desc small">Tap the mic below to start.</p>
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
      {!canHear && <div className="gap" />}
      {!canHear && <Btn tone="light" icon="edit" onClick={() => go('new', null, 'email')}>Type an email instead</Btn>}
      <RecordFab tone="violet" what="email" label="Speak an email" disabled={!canHear || !!busy} onAudio={blob => onAudio(blob, 'voice', 'email')} error={busy ? '' : error} />
    </>
  );
}
