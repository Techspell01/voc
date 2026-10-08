// The items of an order, with round checks, and a "Shop online" mode: pick an app
// (Blinkit, Zepto...), tap each item to find it there, add it, come back and tick it.
import { useState } from 'react';
import { BusyBars, Btn, Check, Circle } from './bits.jsx';
import { Icon } from './Icons.jsx';
import { qtyText } from '../lib/format.js';
import { STORES, searchTerm, storeById } from '../lib/stores.js';
import { setSettings, toggleDone, useSettings } from '../lib/store.js';
import { CART_STORES, canLink, fillOrder, isLinked, link } from '../lib/cartlink.js';

export default function OrderRows({ note, items, finished, showSaid }) {
  const settings = useSettings();
  const [shopping, setShopping] = useState(!!note.cart);
  const [linking, setLinking] = useState('');
  const store = storeById(settings.store);
  const done = note.done ?? {};
  const left = items.filter(it => !done[it.id]).length;

  return (
    <>
      <div className="rows">
        {items.map(it => {
          const ticked = !!done[it.id] || finished;
          return (
            <div key={it.id} className={`row${ticked ? ' done' : ''}`}>
              <Check checked={ticked} onChange={() => toggleDone(note.id, it.id)} label={`${shopping ? 'Added' : 'Packed'} ${it.name}`} />
              <div className="main">
                <div className="name">{it.name}</div>
                {showSaid && it.said && it.said.toLowerCase() !== it.name.toLowerCase() && <div className="said">{it.said}</div>}
              </div>
              <div className="qty">{qtyText(it.qty, it.unit)}</div>
              {shopping && !ticked && (
                <Circle small tone="dark" icon="search" size={16} label={`Find ${it.name} on ${store.name}`} href={store.search(searchTerm(it))} />
              )}
            </div>
          );
        })}
      </div>

      {!finished && !shopping && (
        <div className="btns" style={{ marginTop: 10 }}>
          <Btn tone="ghost" icon="bag" onClick={() => setShopping(true)}>Shop online</Btn>
        </div>
      )}
      {shopping && (
        <div className="shop-panel">
          <div className="small">Shop on</div>
          <div className="store-chips" role="radiogroup" aria-label="Shop on">
            {STORES.map(s => (
              <button key={s.id} type="button" role="radio" aria-checked={store.id === s.id} className="store-chip"
                style={{ '--store': s.color }} onClick={() => setSettings({ store: s.id })}>{s.name}</button>
            ))}
          </div>
          {CART_STORES.has(store.id) && <CartFill note={note} store={store} linking={linking} setLinking={setLinking} />}
          <p className="small" style={{ marginTop: 8 }}>
            {CART_STORES.has(store.id) ? 'Or tap' : 'Tap'} {Icon.search(12)} to find each item in {store.name} and add it, then tick it here.
            {left === 0 ? ' All added: open your cart to pay.' : ` ${left} to go.`}
          </p>
          <div className="btns">
            <Btn icon="arrow" href={store.home}>Open {store.name} cart</Btn>
            <Btn tone="ghost" onClick={() => setShopping(false)}>Done</Btn>
          </div>
        </div>
      )}
    </>
  );
}

// Zepto / Instamart: sign in once, then Voc puts every item in that account's cart.
function CartFill({ note, store, linking, setLinking }) {
  const cart = note.cart?.store === store.id ? note.cart : null;
  if (!canLink()) {
    return (
      <p className="small cart-note">
        Voc can fill your {store.name} cart in one go when it runs on a laptop (npm run dev). On this site it is waiting for {store.name} to approve it.
      </p>
    );
  }
  async function go() {
    setLinking('');
    if (isLinked(store.id)) return fillOrder(note, store.id);
    try { await link(store.id, note.id); } catch (err) { setLinking(err.message); }
  }
  return (
    <div className="cart-fill">
      {cart?.status === 'filling'
        ? <p className="cart-busy"><BusyBars /> Adding {cart.count} item{cart.count === 1 ? '' : 's'} to your {store.name} cart…</p>
        : <Btn icon="bag" block onClick={go}>{isLinked(store.id) ? `Add all to ${store.name} cart` : `Sign in to ${store.name} and add all`}</Btn>}
      {linking && <p className="small cart-error">{linking}</p>}
      {cart?.status === 'error' && <p className="small cart-error">{cart.message}</p>}
      {cart?.status === 'done' && (
        <div className="cart-result">
          <div className="small"><b>In your {store.name} cart</b></div>
          {(cart.added ?? []).map((a, i) => (
            <div key={i} className="cart-line">{Icon.check(14)} <span><b>{a.product}</b>{a.quantity > 1 ? ` × ${a.quantity}` : ''}{a.price ? ` · ${a.price}` : ''}<span className="said"> for {a.item}</span></span></div>
          ))}
          {cart.missing?.length > 0 && <div className="cart-line miss">Not found: {cart.missing.join(', ')}</div>}
          {cart.note && <div className="cart-line miss">{cart.note}</div>}
          <div className="btns">
            <Btn icon="arrow" href={store.home}>Open {store.name} to pay</Btn>
          </div>
          <p className="small" style={{ marginTop: 6 }}>Check the cart before you pay. Voc never orders or pays for you.</p>
        </div>
      )}
    </div>
  );
}
