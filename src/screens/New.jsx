import { Circle, Pill } from '../components/bits.jsx';
import { Icon, Logo } from '../components/Icons.jsx';
import TranslateBox from '../components/TranslateBox.jsx';
import { useSettings } from '../lib/store.js';

// Home is the translator: say a reply in Malayalam, Hindi or Manglish and get it in
// English. Email is made in the Mail section, notes in Notes, lists in Orders.
function greeting(now = new Date()) {
  const h = (now.getUTCHours() + 5.5) % 24;
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function New({ onAudio, onText, busy, error, canHear, status, go, today, result, onClear }) {
  const joined = !!useSettings().android;
  const day = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

  return (
    <>
      <header className="head">
        <Logo size={44} />
        <div className="grow">
          <div>{greeting()}!</div>
          <div className="small muted">{day}</div>
        </div>
        <Circle icon="gear" label="Settings" onClick={() => go('settings')} />
      </header>
      <div className="gap" />
      <Pill wide onClick={() => go('settings')} label="Services">{status}</Pill>

      <TranslateBox busy={busy} error={error} canHear={canHear} onAudio={onAudio} onText={onText} result={result} onClear={onClear} />

      {!joined && (
        <button type="button" className="card tone t-mint promo" onClick={() => go('android')}>
          <span className="icon-dot" style={{ background: 'var(--ink)', color: '#fff' }}>{Icon.phone(22)}</span>
          <span className="grow">
            <span className="small">Coming to Google Play</span>
            <span className="card-title">Get the Android app early</span>
          </span>
          <span className="circle dark" aria-hidden="true">{Icon.arrow(20)}</span>
        </button>
      )}
    </>
  );
}
