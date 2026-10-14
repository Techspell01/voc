// One note: what was heard (a chat bubble), Voc's reply, then the order
// list, to-dos and calendar entries as coloured cards.
import { useState } from 'react';
import { BusyBars, Btn, Check, Chip, Circle, COLORS } from './bits.jsx';
import OrderRows from './OrderRows.jsx';
import { Icon, Logo } from './Icons.jsx';
import { dayText, qtyText, timeText, whenText } from '../lib/format.js';
import { copy, download, googleCalendarUrl, icsFile, orderText, whatsappUrl } from '../lib/share.js';
import { toggleDone } from '../lib/store.js';
import { clock, useRecorder } from '../lib/useRecorder.js';
import { hasMalayalam } from '../lib/manglish/translit.js';

export const SOURCE = { voice: 'voice note', file: 'audio file', shared: 'shared from WhatsApp', typed: 'typed' };
export const engineName = e => (e?.startsWith('ai:') ? `AI · ${e.slice(3)[0].toUpperCase()}${e.slice(4)}` : 'offline parser');
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Reply({ r, today }) {
  const items = r.items?.length ?? 0;
  const todos = r.todos?.length ?? 0;
  const events = r.events?.length ?? 0;
  if (!items && !todos && !events) {
    return <>Nothing to do in this one. If I misheard a word, tap <span className="hl ice">fix a word</span>.</>;
  }
  const parts = [];
  if (items) parts.push(<span key="i"><span className="hl yellow">{plural(items, 'item')}</span> to get{r.order ? <>, by <span className="hl">{whenText(r.order, today)}</span></> : null}</span>);
  if (todos) parts.push(<span key="t"><span className="hl violet">{plural(todos, 'to-do')}</span></span>);
  if (events) parts.push(<span key="e"><span className="hl ice">{plural(events, 'date')}</span> for the calendar</span>);
  return <>Got it! {parts.reduce((acc, p, n) => [...acc, n ? (n === parts.length - 1 ? ' and ' : ', ') : null, p], [])}.</>;
}

export default function NoteView({ note, today, onReread, onEdit, canHear, busy }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.transcript);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [more, setMore] = useState('');
  const rec = useRecorder(blob => onEdit?.({ blob }));
  const r = note.result ?? { items: [], todos: [], events: [] };
  const done = note.done ?? {};
  const items = r.items ?? [];
  const ml = hasMalayalam(note.transcript);
  const text = orderText(items, r.order, today);
  const packed = items.filter(it => done[it.id]).length;
  const hasList = items.length > 0 || (r.todos?.length ?? 0) > 0 || (r.events?.length ?? 0) > 0;

  async function doCopy() {
    if (await copy(text)) { setCopied(true); setTimeout(() => setCopied(false), 1500); }
  }

  return (
    <>
      <div className="chat">
        <div className={`bubble me${ml ? ' ml' : ''}`}>
          {note.transcript}
          {ml && r.latin && <div className="roman">{r.latin}</div>}
        </div>
        <div className="msg">
          <Logo size={30} />
          <div className="bubble bot"><Reply r={r} today={today} /></div>
        </div>
        <div className="replies">
          {onReread && <button type="button" className="reply" onClick={() => { setDraft(note.transcript); setEditing(e => !e); }}>Fix a word</button>}
          {onEdit && hasList && <button type="button" className={`reply sage`} aria-pressed={adding} onClick={() => setAdding(a => !a)}>{adding ? 'Done' : 'Add more items'}</button>}
          {items.length > 0 && <a className="reply yellow" href={whatsappUrl(text)} target="_blank" rel="noreferrer">Send the list on WhatsApp</a>}
        </div>
        <p className="small muted" style={{ textAlign: 'right' }}>
          {[SOURCE[note.source], note.stt ? `heard by ${note.stt}` : null, `read by ${engineName(note.engine)}`].filter(Boolean).join(' · ')}
          {note.fallback ? ` (AI unavailable: ${note.fallback.replace(/\.$/, '')})` : ''}
        </p>
      </div>

      {/* Edit: say or type more, and only the new items join the list */}
      {adding && (
        <div className="composer add-more">
          <Circle icon={rec.recording ? 'stop' : 'mic'} tone="yellow" label={rec.recording ? 'Stop and add' : 'Say more'}
            disabled={(!canHear && !rec.recording) || !!busy} onClick={rec.toggle} />
          <div className="field">
            {busy
              ? <span className="inline-status"><BusyBars /> {busy.stage}…</span>
              : rec.recording
                ? <span className="inline-status"><span className="rec-dot" /> {clock(rec.secs)} · say what to add</span>
                : <input value={more} onChange={e => setMore(e.target.value)} placeholder="Add more items…" aria-label="Add more items"
                    onKeyDown={e => { if (e.key === 'Enter' && more.trim()) { onEdit?.({ text: more.trim() }); setMore(''); } }} />}
            {more.trim() && !rec.recording && !busy && (
              <Circle icon="up" tone="ice" label="Add to list" onClick={() => { onEdit?.({ text: more.trim() }); setMore(''); }} />
            )}
          </div>
        </div>
      )}
      {rec.error && <div className="err" role="alert">{Icon.alert(18)}<span>{rec.error}</span></div>}

      {editing && (
        <div className="composer">
          <div className="field">
            <textarea value={draft} rows={3} onChange={e => setDraft(e.target.value)} aria-label="Fix the transcript" autoFocus />
            <Circle icon="up" tone="ice" label="Read again" disabled={busy || !draft.trim()}
              onClick={() => { setEditing(false); onReread?.(draft.trim()); }} />
          </div>
        </div>
      )}

      <div className="gap" />

      {items.length > 0 && (
        <section className="card tone t-yellow">
          <div className="card-top">
            <span className="icon-sq">{Icon.bag(22)}</span>
            <div className="grow">
              <h2 className="card-title">Order list</h2>
              <div className="chips">
                <Chip dot={COLORS.ink}>{packed}/{items.length} packed</Chip>
                {r.order && <Chip dot={COLORS.coral}>deliver {whenText(r.order, today)}</Chip>}
              </div>
            </div>
            <Circle icon="arrow" label="Send on WhatsApp" href={whatsappUrl(text)} />
          </div>
          <OrderRows note={note} items={items} showSaid />
          <div className="btns">
            <Btn icon="send" href={whatsappUrl(text)}>Send on WhatsApp</Btn>
            <Btn icon="copy" tone="ghost" onClick={doCopy}>{copied ? 'Copied' : 'Copy'}</Btn>
          </div>
        </section>
      )}

      {r.todos?.length > 0 && (
        <section className="card tone t-violet">
          <div className="card-top">
            <span className="icon-sq">{Icon.list(22)}</span>
            <div className="grow">
              <h2 className="card-title">To-do</h2>
              <div className="chips"><Chip dot={COLORS.ink}>{plural(r.todos.length, 'task')}</Chip></div>
            </div>
          </div>
          <div className="rows">
            {r.todos.map(t => (
              <div key={t.id} className={`row${done[t.id] ? ' done' : ''}`}>
                <Check checked={!!done[t.id]} onChange={() => toggleDone(note.id, t.id)} label={t.title} />
                <div className="main">
                  <div className="name">{t.title}</div>
                  {t.date && <div className="said">{whenText(t, today)}</div>}
                </div>
                {t.date && <Circle small icon="calendar" size={16} label="Remind me in Google Calendar" href={googleCalendarUrl(t)} />}
              </div>
            ))}
          </div>
        </section>
      )}

      {r.events?.length > 0 && (
        <section className="card tone t-ice">
          <div className="card-top">
            <span className="icon-sq">{Icon.calendar(22)}</span>
            <div className="grow">
              <h2 className="card-title">Calendar</h2>
              <div className="chips"><Chip dot={COLORS.violet}>{plural(r.events.length, 'date')}</Chip></div>
            </div>
            {r.events.length > 1 && <Circle icon="down" label="Add all to calendar (.ics)" onClick={() => download('voc.ics', icsFile(r.events), 'text/calendar')} />}
          </div>
          <div className="rows">
            {r.events.map(e => (
              <div key={e.id} className="row">
                <div style={{ minWidth: 78 }}>
                  <div className="when">{e.time ? timeText(e.time, e.approx).toUpperCase() : 'ALL DAY'}</div>
                  <div className="said">{dayText(e.date, today)}</div>
                </div>
                <div className="main"><div className="name">{e.title}</div></div>
                <Circle small icon="arrow" size={16} label="Add to Google Calendar" href={googleCalendarUrl(e)} />
                <Circle small tone="dark" icon="down" size={16} label="Download .ics"
                  onClick={() => download(`${e.title.replace(/[^\w]+/g, '-').toLowerCase() || 'event'}.ics`, icsFile([e]), 'text/calendar')} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
