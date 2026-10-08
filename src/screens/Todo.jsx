// Every open to-do and upcoming date from all notes: a week strip, then by day.
import { useState } from 'react';
import { Btn, Check, Chip, Circle, COLORS, ScreenHead, SelectPill } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import { dayText, timeText } from '../lib/format.js';
import { addDays } from '../lib/manglish/when.js';
import { googleCalendarUrl } from '../lib/share.js';
import { toggleDone } from '../lib/store.js';

export function agenda(notes, today, kind = 'all') {
  const rows = [];
  for (const note of notes) {
    if (kind !== 'events') for (const t of note.result?.todos ?? []) rows.push({ kind: 'todo', key: `${note.id}-${t.id}`, note, x: t, done: !!note.done?.[t.id] });
    if (kind !== 'todos') for (const e of note.result?.events ?? []) rows.push({ kind: 'event', key: `${note.id}-${e.id}`, note, x: e, done: e.date < today });
  }
  const by = (a, b) => (a.x.date ?? '9999').localeCompare(b.x.date ?? '9999') || (a.x.time ?? '99').localeCompare(b.x.time ?? '99');
  const open = rows.filter(r => !r.done).sort(by);
  const tomorrow = addDays(today, 1);
  return {
    open,
    overdue: open.filter(r => r.x.date && r.x.date < today),
    today: open.filter(r => r.x.date === today),
    tomorrow: open.filter(r => r.x.date === tomorrow),
    later: open.filter(r => r.x.date && r.x.date > tomorrow),
    someday: open.filter(r => !r.x.date),
    done: rows.filter(r => r.done && r.kind === 'todo').slice(0, 12),
    openCount: open.length,
  };
}

function Row({ r, today, showDay }) {
  const day = showDay ? dayText(r.x.date, today) : '';
  const time = timeText(r.x.time, r.x.approx);
  const when = [day, time].filter(Boolean).join(', ');
  if (r.kind === 'event') {
    return (
      <div className="row">
        <span className="icon-dot" style={{ width: 28, height: 28, background: COLORS.ink, color: '#fff' }}>{Icon.calendar(15)}</span>
        <div className="main"><div className="name">{r.x.title}</div>{when && <div className="said">{when}</div>}</div>
        <Circle small icon="arrow" size={16} label="Add to Google Calendar" href={googleCalendarUrl(r.x)} />
      </div>
    );
  }
  return (
    <div className={`row${r.done ? ' done' : ''}`}>
      <Check checked={r.done} onChange={() => toggleDone(r.note.id, r.x.id)} label={r.x.title} />
      <div className="main"><div className="name">{r.x.title}</div>{when && <div className="said">{when}</div>}</div>
    </div>
  );
}

export default function Todo({ notes, today, go }) {
  const [kind, setKind] = useState('all');
  const [picked, setPicked] = useState(null);
  const a = agenda(notes, today, kind);
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  const count = d => a.open.filter(r => r.x.date === d).length;

  const groups = picked
    ? [[dayText(picked, today), a.open.filter(r => r.x.date === picked), false, 't-yellow']]
    : [
      ['Overdue', a.overdue, true, 't-coral'],
      ['Today', a.today, false, 't-yellow'],
      ['Tomorrow', a.tomorrow, false, 't-ice'],
      ['Coming up', a.later, true, 'night-card'],
      ['Any time', a.someday, false, 't-cream'],
      ['Done', a.done, true, 't-mint'],
    ].filter(([, rows]) => rows.length);

  return (
    <>
      <ScreenHead title="To-do" right={<SelectPill label="Show" value={kind} onChange={setKind}
        options={[['all', 'all'], ['todos', 'to-dos'], ['events', 'dates']]} />} />

      <section className="card tone t-violet">
        <div className="card-top">
          <h2 className="card-title grow">This<br />week</h2>
          <Chip dot={COLORS.ink}>{a.openCount} open</Chip>
        </div>
        <div className="week">
          {week.map(d => {
            const n = count(d);
            const label = new Date(`${d}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
            return (
              <button key={d} type="button" aria-pressed={picked === d} aria-label={`${dayText(d, today)}: ${n} open`}
                onClick={() => setPicked(p => (p === d ? null : d))}>
                <span className="day">{label}</span>
                <span className={`num${n ? '' : ' none'}${d === today ? ' today' : ''}`}>{n || '·'}</span>
              </button>
            );
          })}
        </div>
      </section>

      {groups.length === 0 && (
        <section className="card night-card">
          <h2 className="card-title">{picked ? 'Nothing that day' : 'Nothing due'}</h2>
          <p className="desc muted">To-dos and dates from your notes collect here, sorted by day.</p>
          {!picked && <div className="btns"><Btn tone="light" icon="mic" onClick={() => go('new')}>Record a note</Btn></div>}
        </section>
      )}

      {groups.map(([title, rows, showDay, tone]) => (
        <section key={title} className={`card ${tone === 'night-card' ? 'night-card' : `tone ${tone}`}`}>
          <div className="card-top">
            <h2 className="card-title grow">{title}</h2>
            <Chip dot={tone === 't-coral' ? COLORS.ink : COLORS.coral}>{rows.length}</Chip>
          </div>
          <div className="rows">{rows.map(r => <Row key={r.key} r={r} today={today} showDay={showDay} />)}</div>
        </section>
      ))}
    </>
  );
}
