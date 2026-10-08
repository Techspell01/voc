// A wall of sticky notes. Speak, and the new note writes itself onto a sticky.
import { useState } from 'react';
import { BusyBars } from '../components/bits.jsx';
import { clock, useRecorder } from '../lib/useRecorder.js';
import { Btn, Circle, ScreenHead } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import { PendingSticky, StickyNote } from '../components/Sticky.jsx';
import RecordFab from '../components/RecordPanel.jsx';
import { copy } from '../lib/share.js';
import { removeNote } from '../lib/store.js';
import { engineName } from '../components/NoteView.jsx';

export default function Notes({ notes, live, setLive, onAudio, onAppend, busy, error, canHear, go }) {
  const [open, setOpen] = useState(null);
  const [q, setQ] = useState('');
  const [heard, setHeard] = useState(false);
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState('');
  const rec = useRecorder(blob => onAppend(open, { blob }));
  const stickies = notes.filter(n => n.kind === 'sticky');
  const opened = stickies.find(n => n.id === open);
  const pending = busy?.kind === 'note' ? busy.stage : null;

  if (opened) {
    const text = [opened.result.title, opened.result.text].filter(Boolean).join('\n\n');
    return (
      <>
        <ScreenHead title="Note" onBack={() => { setOpen(null); setHeard(false); }}
          right={<Circle icon="trash" tone="dark" label="Delete this note" onClick={() => { removeNote(opened.id); setOpen(null); }} />} />
        <div className="wall-one">
          <StickyNote key={opened.id + (live?.id === opened.id ? live.from : '')} note={opened} big
            live={live?.id === opened.id} liveFrom={live?.from ?? 0} onWritten={() => setLive(null)} />
        </div>

        {/* say or type more: only the new lines get written onto the note */}
        <div className="composer add-more">
          <Circle icon={rec.recording ? 'stop' : 'mic'} tone="yellow" label={rec.recording ? 'Stop and add' : 'Say more'}
            disabled={(!canHear && !rec.recording) || !!busy} onClick={rec.toggle} />
          <div className="field">
            {busy?.kind === 'append'
              ? <span className="inline-status"><BusyBars /> {busy.stage}…</span>
              : rec.recording
                ? <span className="inline-status"><span className="rec-dot" /> {clock(rec.secs)} · say what to add</span>
                : <input value={more} onChange={e => setMore(e.target.value)} placeholder="Add to this note…" aria-label="Add to this note"
                    onKeyDown={e => { if (e.key === 'Enter' && more.trim()) { onAppend(opened.id, { text: more.trim() }); setMore(''); } }} />}
            {more.trim() && !rec.recording && !busy && (
              <Circle icon="up" tone="ice" label="Add to note" onClick={() => { onAppend(opened.id, { text: more.trim() }); setMore(''); }} />
            )}
          </div>
        </div>
        {(error || rec.error) && !busy && <div className="err" role="alert">{Icon.alert(18)}<span>{error || rec.error}</span></div>}
        <div className="btns">
          <Btn icon={copied ? 'check' : 'copy'} onClick={async () => { if (await copy(text)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }}>{copied ? 'Copied' : 'Copy'}</Btn>
          <Btn icon="share" tone="ghost" onClick={async () => { if (navigator.share) { try { await navigator.share({ text }); } catch { /* closed */ } } else copy(text); }}>Share</Btn>
          <Btn icon="eye" tone="ghost" onClick={() => setHeard(h => !h)}>{heard ? 'Hide' : 'What I said'}</Btn>
        </div>
        {heard && (
          <section className="card night-card">
            <p className="ml">{opened.transcript}</p>
            <p className="small muted" style={{ marginTop: 8 }}>{opened.stt ? `heard by ${opened.stt} · ` : ''}written by {engineName(opened.engine)}</p>
          </section>
        )}
      </>
    );
  }

  const needle = q.trim().toLowerCase();
  const shown = stickies.filter(n => !needle || [n.result.title, n.result.text, n.transcript].some(s => (s ?? '').toLowerCase().includes(needle)));

  return (
    <>
      <ScreenHead title="Notes" />
      {stickies.length > 3 && (
        <div className="field" style={{ marginTop: 10 }}>
          <span className="icon">{Icon.search(18)}</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your notes" aria-label="Search notes" />
        </div>
      )}
      {!stickies.length && !pending && (
        <section className="card night-card">
          <h2 className="card-title">Speak a note</h2>
          <p className="desc muted">Tap the yellow mic and talk, in Malayalam or Manglish. When you stop, your note writes itself onto a sticky, in English.</p>
          {!canHear && <div className="btns"><Btn tone="light" icon="edit" onClick={() => go('new', null, 'note')}>Type a note instead</Btn></div>}
        </section>
      )}
      <div className="wall">
        {pending && <PendingSticky stage={pending} />}
        {shown.map(n => (
          <StickyNote key={n.id} note={n} live={live?.id === n.id && !live.from} onWritten={() => setLive(null)} onOpen={() => setOpen(n.id)} />
        ))}
      </div>
      <RecordFab tone="yellow" what="note" label="Speak a note" disabled={!canHear || !!busy} onAudio={blob => onAudio(blob, 'voice', 'note')} error={busy ? '' : error} />
    </>
  );
}
