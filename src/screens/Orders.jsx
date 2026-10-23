// Order lists from every note: tick items as you pack, send the list back on WhatsApp.
// This is where a list is made now: speak an order (or type it) right here.
import { useState } from 'react';
import { Btn, BusyBars, Chip, Circle, COLORS, ScreenHead, SelectPill } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import { SOURCE } from '../lib/labels.js';
import OrderRows from '../components/OrderRows.jsx';
import RecordFab from '../components/RecordPanel.jsx';
import { clock, useRecorder } from '../lib/useRecorder.js';
import { ago, whenText } from '../lib/format.js';
import { copy, orderText, whatsappUrl } from '../lib/share.js';
import { toggleDone, updateNote } from '../lib/store.js';

export const openOrders = notes => notes.filter(n => n.result?.items?.length && !n.orderDone);
const TONES = ['t-yellow', 't-ice', 't-mint', 't-violet'];

function Order({ note, tone, today, onEdit, busy }) {
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState('');
  const rec = useRecorder(blob => onEdit?.(note.id, { blob }));
  const items = note.result.items;
  const order = note.result.order;
  const packed = items.filter(it => note.done?.[it.id]).length;
  const text = orderText(items, order, today);
  const finished = !!note.orderDone;
  const addMore = t => { onEdit?.(note.id, { text: t }); setMore(''); };

  return (
    <section className={`card ${finished ? 'night-card' : `tone ${tone}`}`}>
      <div className="card-top">
        <span className="icon-sq">{Icon.bag(22)}</span>
        <div className="grow">
          <h2 className="card-title">{finished ? 'Done' : 'Order'}</h2>
          <div className="small muted">{ago(note.at)} · {SOURCE[note.source] ?? note.source}</div>
        </div>
        <Circle icon="arrow" label="Send on WhatsApp" href={whatsappUrl(text)} />
      </div>
      <div className="chips">
        <Chip dot={packed === items.length ? COLORS.mint : COLORS.coral}>{packed}/{items.length} packed</Chip>
        {order && <Chip dot={COLORS.violet}>deliver {whenText(order, today)}</Chip>}
      </div>
      <OrderRows note={note} items={items} finished={finished} />
      <div className="btns">
        {!finished && <Btn icon="send" href={whatsappUrl(text)}>WhatsApp</Btn>}
        <Circle icon={copied ? 'check' : 'copy'} tone="ghost" label={copied ? 'Copied' : 'Copy the list'}
          onClick={async () => { if (await copy(text)) { setCopied(true); setTimeout(() => setCopied(false), 1500); } }} />
        {finished
          ? <Btn tone="ghost" onClick={() => updateNote(note.id, { orderDone: false })}>Reopen</Btn>
          : <Btn tone="ghost" icon="check" onClick={() => updateNote(note.id, { orderDone: true })}>Done</Btn>}
      </div>

      {/* more items: say them or type them, and only the new ones are added */}
      {!finished && (
        <div className="composer add-more">
          <Circle icon={rec.recording ? 'stop' : 'mic'} tone="coral" label={rec.recording ? 'Stop and add' : 'Add items by voice'}
            disabled={!rec.recording && !!busy} onClick={rec.toggle} />
          <div className="field">
            {rec.recording
              ? <span className="inline-status"><span className="rec-dot" /> {clock(rec.secs)} · say the new items</span>
              : <input value={more} onChange={e => setMore(e.target.value)} placeholder="Add more items…" aria-label="Add more items to this order"
                  onKeyDown={e => { if (e.key === 'Enter' && more.trim()) { e.preventDefault(); addMore(more.trim()); } }} />}
            {more.trim() && !rec.recording && !busy && (
              <Circle icon="up" tone="ice" label="Add these items" onClick={() => addMore(more.trim())} />
            )}
          </div>
        </div>
      )}
      {rec.error && <div className="err" role="alert">{Icon.alert(18)}<span>{rec.error}</span></div>}
    </section>
  );
}

export default function Orders({ notes, today, go, onAudio, onText, onEdit, busy, error, canHear = true }) {
  const [show, setShow] = useState('open');
  const [text, setText] = useState('');
  const withItems = notes.filter(n => n.result?.items?.length);
  const open = withItems.filter(n => !n.orderDone);
  const list = show === 'open' ? open : show === 'done' ? withItems.filter(n => n.orderDone) : withItems;
  const toPack = open.reduce((n, o) => n + o.result.items.filter(it => !o.done?.[it.id]).length, 0);
  const dueToday = open.filter(o => o.result.order?.date && o.result.order.date <= today).length;

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onText(t, 'typed', 'lists');
    setText('');
  }

  return (
    <>
      <ScreenHead title="Orders" right={<SelectPill label="Show" value={show} onChange={setShow}
        options={[['open', 'open'], ['done', 'done'], ['all', 'all']]} />} />

      <section className="card tone t-coral">
        <div className="card-top">
          <h2 className="card-title grow">Open<br />orders</h2>
          <span className="chip" style={{ background: COLORS.ink, color: '#fff' }}>{open.length}</span>
        </div>
        <div className="gap" />
        <div className="inner">
          <div className="small">Items to pack</div>
          <div className="big">{toPack}</div>
        </div>
        <div className="inner">
          <div className="small">Due today or late</div>
          <div className="big">{dueToday}</div>
        </div>
      </section>

      {busy?.kind === 'lists' && (
        <section className="card tone t-ice" aria-live="polite">
          <div className="card-top"><span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}><BusyBars /></span></div>
          <h2 className="card-title">{busy.stage}…</h2>
          <p className="desc">Voc is sorting it into items, to-dos and dates.</p>
        </section>
      )}

      {list.length === 0 && (
        <section className="card night-card">
          <h2 className="card-title">{show === 'done' ? 'Nothing done yet' : 'No orders yet'}</h2>
          <p className="desc muted">Say it here: "randu kilo ari, oru litre velichenna venam". Voc sorts it into a list for you to pack and send back on WhatsApp.</p>
          {show !== 'done' && (
            <div className="composer">
              <span className="icon">{Icon.wave(20)}</span>
              <div className="field">
                <input value={text} onChange={e => setText(e.target.value)} placeholder="Or type it: randu kilo ari venam…" aria-label="List to write"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
                {text.trim() && <Circle icon="up" tone="ice" label="Write the list" disabled={!!busy} onClick={submit} />}
              </div>
            </div>
          )}
        </section>
      )}
      {list.map((note, i) => <Order key={note.id} note={note} tone={TONES[i % TONES.length]} today={today} onEdit={onEdit} busy={busy} />)}

      <RecordFab tone="coral" what="order" label="Speak an order" disabled={!canHear || !!busy}
        onAudio={blob => onAudio(blob, 'voice', 'lists')} error={busy ? '' : error} />
    </>
  );
}
