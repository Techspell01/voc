// Sign up to test the Android app. Opened from Home, Settings, or the link to share:
// usevoc.vercel.app/android. Google Play needs 12+ testers for 14 days before launch.
import { useState } from 'react';
import { Btn, Chip, COLORS, ScreenHead } from '../components/bits.jsx';
import { Icon } from '../components/Icons.jsx';
import { joinAndroidTest } from '../lib/api.js';
import { setSettings, useSettings } from '../lib/store.js';

export default function Android({ go }) {
  const s = useSettings();
  const [email, setEmail] = useState(s.android?.email ?? '');
  const [name, setName] = useState(s.name ?? '');
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [again, setAgain] = useState(false);
  const joined = s.android && !again;

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await joinAndroidTest({ email, name, website: trap });
      setSettings({ android: { email: email.trim().toLowerCase(), at: new Date().toISOString() } });
      setAgain(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ScreenHead title="Android app" onBack={() => go('new')} />

      <section className="card tone t-mint">
        <div className="card-top">
          <span className="icon-dot" style={{ background: COLORS.ink, color: '#fff' }}>{Icon.phone(22)}</span>
          <div className="grow" />
          <Chip dot={COLORS.coral}>coming to Google Play</Chip>
        </div>
        <h2 className="card-title big-title">Get Voc on Android early</h2>
        <p className="desc">Before a new app can go on the Play Store, Google asks for at least 12 people to test it for 14 days. Join them and you get Voc on Android first.</p>

        {joined ? (
          <div className="joined" role="status">
            <div className="joined-head">{Icon.check(20)}<b>You're on the list</b></div>
            <p className="small">When the test opens, the Play Store link goes to <b>{s.android.email}</b>.</p>
            <Btn tone="ghost" onClick={() => setAgain(true)}>Use a different email</Btn>
          </div>
        ) : (
          <form className="join" onSubmit={submit} noValidate>
            <label className="small" htmlFor="t-email">Your Gmail address</label>
            <input id="t-email" className="code" type="email" inputMode="email" autoComplete="email" required
              placeholder="you@gmail.com" value={email} onChange={e => setEmail(e.target.value)} />
            <p className="hint">The Google account on your phone's Play Store.</p>
            <label className="small" htmlFor="t-name">Your name <span className="muted">(optional)</span></label>
            <input id="t-name" className="code" autoComplete="name" maxLength={60} value={name} onChange={e => setName(e.target.value)} />
            {/* Left empty by people; bots fill it in. */}
            <input className="trap" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" value={trap} onChange={e => setTrap(e.target.value)} />
            {error && <div className="err" role="alert">{Icon.alert(18)}<span>{error}</span></div>}
            <Btn block type="submit" disabled={busy || !email.trim()}>{busy ? 'Joining…' : 'Join the Android test'}</Btn>
          </form>
        )}
      </section>

      <section className="card night-card">
        <h2 className="card-title">What testing means</h2>
        <ul className="plain">
          <li>You get an email with a Play Store link. Open it on your Android phone and install Voc.</li>
          <li>Keep it installed for 14 days. Use it whenever you like: that is all Google needs.</li>
          <li>Reply to that email with anything Voc gets wrong, especially Malayalam words it misses.</li>
        </ul>
        <p className="note-line muted">Your email is used only to add you to the test on Google Play and send you the link.</p>
        <p className="note-line muted">On an iPhone? Voc already works in Safari: tap Share, then Add to Home Screen.</p>
      </section>
    </>
  );
}
