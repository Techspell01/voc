// Order lists from every note: tick items as you pack, send the list back on WhatsApp.
import { useState } from 'react';
import { Btn, Check, Chip, Circle, COLORS, ScreenHead, SelectPill } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import { SOURCE } from '../components/NoteView.jsx';
import OrderRows from '../components/OrderRows.jsx';
import { ago, qtyText, whenText } from '../lib/format.js';
import { copy, orderText, whatsappUrl } from '../lib/share.js';
import { toggleDone, updateNote } from '../lib/store.js';

export const openOrders = notes => notes.filter(n => n.result?.items?.length && !n.orderDone);
const TONES = ['t-yellow', 't-ice', 't-mint', 't-violet'];

function Order({ note, tone, today }) {
  const [copied, setCopied] = useState(false);
  const items = note.result.items;
  const order = note.result.order;
  const packed = items.filter(it => note.done?.[it.id]).length;
  const text = orderText(items, order, today);
  const finished = !!note.orderDone;
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
    </section>
  );
}

export default function Orders({ notes, today, go }) {
  const [show, setShow] = useState('open');
  const withItems = notes.filter(n => n.result?.items?.length);
  const open = withItems.filter(n => !n.orderDone);
  const list = show === 'open' ? open : show === 'done' ? withItems.filter(n => n.orderDone) : withItems;
  const toPack = open.reduce((n, o) => n + o.result.items.filter(it => !o.done?.[it.id]).length, 0);
  const dueToday = open.filter(o => o.result.order?.date && o.result.order.date <= today).length;

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

      {list.length === 0 && (
        <section className="card night-card">
          <h2 className="card-title">{show === 'done' ? 'Nothing done yet' : 'No orders yet'}</h2>
          <p className="desc muted">When a note asks for things ("randu kilo ari venam"), its list shows up here. Tick items as you pack, then send the list back on WhatsApp.</p>
          {show !== 'done' && <div className="btns"><Btn tone="light" icon="mic" onClick={() => go('new')}>Record an order</Btn></div>}
        </section>
      )}
      {list.map((note, i) => <Order key={note.id} note={note} tone={TONES[i % TONES.length]} today={today} />)}
    </>
  );
}
