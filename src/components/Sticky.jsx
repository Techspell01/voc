// Sticky notes. A new one writes itself in, letter by letter, in handwriting.
import { useEffect, useState } from 'react';
import { Icon } from './Icons.jsx';
import { BusyBars } from './bits.jsx';
import { ago } from '../lib/format.js';

const TONES = ['yellow', 'ice', 'mint', 'coral', 'violet', 'cream'];
const hash = s => [...String(s)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7) >>> 0;
export const stickyLook = id => ({ tone: TONES[hash(id) % TONES.length], tilt: ((hash(`${id}t`) % 7) - 3) * 0.7 });

// Graphemes, so a Malayalam conjunct appears whole rather than half-drawn.
export const graphemes = text => (typeof Intl !== 'undefined' && Intl.Segmenter
  ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(s => s.segment)
  : [...text]);

// `from`: graphemes already on the paper (an addition writes only the new part).
export function LiveText({ text, live, from = 0, onDone }) {
  const parts = graphemes(text);
  const start = Math.min(from, parts.length);
  const [n, setN] = useState(live ? start : parts.length);
  useEffect(() => {
    if (!live || matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(parts.length); if (live) onDone?.(); return; }
    let i = start;
    setN(i);
    // about 3-4 seconds whatever the length, never faster than a quick hand
    const step = Math.max(12, Math.min(42, 3600 / Math.max(1, parts.length - start)));
    const t = setInterval(() => {
      i += 1;
      setN(i);
      if (i >= parts.length) { clearInterval(t); onDone?.(); }
    }, step);
    return () => clearInterval(t);
  }, [text, live, start]);
  return <>{parts.slice(0, n).join('')}{n < parts.length && <span className="pen" aria-hidden="true" />}</>;
}

export function StickyNote({ note, live, liveFrom = 0, big, onOpen, onWritten }) {
  const { tone, tilt } = stickyLook(note.id);
  const r = note.result ?? {};
  const title = r.title || '';
  const text = r.text || note.transcript;
  // a hand writes the title first, then the note
  const [part, setPart] = useState(live && title && !liveFrom ? 'title' : 'body');
  const Tag = onOpen ? 'button' : 'article';
  return (
    <Tag type={onOpen ? 'button' : undefined} className={`sticky s-${tone}${live ? ' new' : ''}${big ? ' big' : ''}`}
      style={{ '--tilt': `${big ? 0 : tilt}deg` }} onClick={onOpen} aria-label={onOpen ? `Open note: ${title || text.slice(0, 40)}` : undefined}>
      <span className="tape" aria-hidden="true" />
      {title && <h3 className="hand s-title"><LiveText text={title} live={live && !liveFrom} onDone={() => setPart('body')} /></h3>}
      <p className={`hand s-body${r.spoken ? ' ml' : ''}`}>
        {part === 'body' ? <LiveText text={text} live={live} from={liveFrom} onDone={onWritten} /> : null}
      </p>
      <span className="s-foot"><span>{ago(note.at)}</span>{r.spoken ? <span>as spoken</span> : null}</span>
    </Tag>
  );
}

// The note while it's still being heard and written.
export function PendingSticky({ stage }) {
  return (
    <div className="sticky s-yellow pending" style={{ '--tilt': '-1.5deg' }} aria-live="polite">
      <span className="tape" aria-hidden="true" />
      <p className="hand s-title">{stage}…</p>
      <div className="pending-pen">{Icon.pen(26)}<BusyBars /></div>
    </div>
  );
}
