// An email written from speech: editable To / Subject / Body on ruled paper,
// one-tap rewrites, and hand-off to Gmail or the phone's mail app.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Btn, Circle, COLORS } from './bits.jsx';
import { Icon } from './Icons.jsx';
import { copy } from '../lib/share.js';
import { updateNote } from '../lib/store.js';
import { engineName } from './NoteView.jsx';
import { ago } from '../lib/format.js';

const REWRITES = [['formal', 'More formal', ''], ['friendly', 'Friendlier', 'sage'], ['shorter', 'Shorter', 'yellow'], ['detail', 'Clearer', '']];

export const gmailUrl = e => `https://mail.google.com/mail/?${new URLSearchParams({ view: 'cm', fs: '1', to: e.to ?? '', su: e.subject ?? '', body: e.body ?? '' })}`;
export const mailtoUrl = e => `mailto:${encodeURIComponent(e.to ?? '')}?subject=${encodeURIComponent(e.subject ?? '')}&body=${encodeURIComponent(e.body ?? '')}`;

export default function EmailCard({ note, onRewrite, busy }) {
  const [e, setE] = useState(note.result);
  const [heard, setHeard] = useState(false);
  const [copied, setCopied] = useState(false);
  const bodyRef = useRef(null);
  useEffect(() => { setE(note.result); }, [note.result]);
  // the body grows with its text, so the whole email shows without an inner scroll
  // (again once the web font has loaded: it wraps differently from the fallback)
  useLayoutEffect(() => {
    const fit = () => {
      const t = bodyRef.current;
      if (t) { t.style.height = 'auto'; t.style.height = `${t.scrollHeight + 4}px`; }
    };
    fit();
    document.fonts?.ready.then(fit);
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [e.body]);
  const edit = patch => setE(x => ({ ...x, ...patch }));
  const save = () => updateNote(note.id, { result: e });

  async function doCopy() {
    if (await copy(`Subject: ${e.subject}\n\n${e.body}`)) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }
  async function share() {
    if (navigator.share) { try { await navigator.share({ title: e.subject, text: e.body }); return; } catch { /* closed */ } }
    doCopy();
  }

  return (
    <section className="card tone t-cream mail-card">
      <div className="card-top">
        <span className="icon-sq" style={{ background: COLORS.violet, color: '#161616' }}>{Icon.mail(22)}</span>
        <div className="grow">
          <h2 className="card-title">{e.toName ? `For ${e.toName}` : 'Your email'}</h2>
          <div className="small muted">{ago(note.at)} · written by {engineName(note.engine)}</div>
        </div>
        <Circle icon="arrow" tone="dark" label="Open in Gmail" href={gmailUrl(e)} />
      </div>

      <label className="mail-row"><span>To</span>
        <input value={e.to ?? ''} onChange={x => edit({ to: x.target.value })} onBlur={save} type="email" inputMode="email"
          placeholder={e.toName ? `${e.toName}'s email` : 'name@example.com'} aria-label="To" /></label>
      <label className="mail-row"><span>Subject</span>
        <input value={e.subject} onChange={x => edit({ subject: x.target.value })} onBlur={save} aria-label="Subject" /></label>
      <textarea ref={bodyRef} className="mail-body" value={e.body} onChange={x => edit({ body: x.target.value })} onBlur={save}
        rows={8} aria-label="Email body" />

      <div className="btns">
        <Btn icon="send" href={gmailUrl(e)}>Open in Gmail</Btn>
        <Circle icon="mail" tone="ghost" label="Open in my mail app" href={mailtoUrl(e)} />
        <Circle icon={copied ? 'check' : 'copy'} tone="ghost" label={copied ? 'Copied' : 'Copy'} onClick={doCopy} />
        <Circle icon="share" tone="ghost" label="Share" onClick={share} />
      </div>

      {onRewrite && (
        <div className="chips" style={{ marginTop: 14 }}>
          {REWRITES.map(([how, label, tone]) => (
            <button key={how} type="button" className={`reply ${tone}`} disabled={busy} onClick={() => { save(); onRewrite(note.id, e, how); }}>{label}</button>
          ))}
        </div>
      )}

      <button type="button" className="heard-toggle" onClick={() => setHeard(h => !h)} aria-expanded={heard}>
        {Icon.eye(16)} {heard ? 'Hide' : 'Show'} what you said
      </button>
      {heard && <p className={`heard ml`}>{note.transcript}</p>}
    </section>
  );
}
