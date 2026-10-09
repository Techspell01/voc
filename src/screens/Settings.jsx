// Settings and privacy, opened from the gear on Home.
import { useState } from 'react';
import { Btn, ScreenHead, Seg } from '../components/bits.jsx';
import { clearNotes, setSettings, useSettings } from '../lib/store.js';

const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

export default function Settings({ notes, server, go }) {
  const s = useSettings();
  const [sure, setSure] = useState(false);
  return (
    <>
      <ScreenHead title="Settings" onBack={() => go('new')} />

      <section className="card tone t-violet">
        <h2 className="card-title">Email</h2>
        <label className="small" htmlFor="name" style={{ display: 'block', marginTop: 12 }}>Your name, to sign emails</label>
        <input id="name" className="code" value={s.name} onChange={e => setSettings({ name: e.target.value })} placeholder="e.g. Harinand" autoComplete="name" style={{ marginTop: 6 }} />
        <div className="small" style={{ marginTop: 14 }}>Tone</div>
        <div style={{ marginTop: 6 }}>
          <Seg label="Email tone" value={s.tone} onChange={tone => setSettings({ tone })} options={[['formal', 'Formal'], ['friendly', 'Friendly']]} />
        </div>
      </section>

      <section className="card tone t-yellow">
        <h2 className="card-title">Sticky notes</h2>
        <div className="small" style={{ marginTop: 12 }}>Write my notes in</div>
        <div style={{ marginTop: 6 }}>
          <Seg label="Note language" value={s.noteLang} onChange={noteLang => setSettings({ noteLang })} options={[['english', 'English'], ['spoken', 'As I said them']]} />
        </div>
        <p className="desc muted">{s.noteLang === 'english' ? 'Malayalam and Manglish are turned into short, clear English.' : 'Notes keep your own words, in Malayalam or Manglish.'}</p>
      </section>

      <section className="card tone t-cream">
        <h2 className="card-title">Reader</h2>
        <div style={{ marginTop: 10 }}>
          <Seg label="Reader" value={s.engine} onChange={engine => setSettings({ engine })} options={[['auto', 'AI when online'], ['offline', 'Offline only']]} />
        </div>
        <p className="desc muted">{s.engine === 'offline'
          ? 'Typed notes never leave this phone. Emails and voice still need the AI.'
          : `Speech: ${server?.stt?.map(cap).join(', then ') || 'not set up'}. Writing: ${server?.llm?.map(cap).join(', then ') || 'not set up'}. A slow or failed service hands over to the next.`}</p>
        {server?.locked && (
          <>
            <label className="small" htmlFor="code" style={{ display: 'block', marginTop: 12 }}>Access code</label>
            <input id="code" className="code" type="password" value={s.appKey} onChange={e => setSettings({ appKey: e.target.value })} style={{ marginTop: 6 }} />
          </>
        )}
        <div className="btns">
          {sure
            ? <><Btn icon="trash" onClick={() => { clearNotes(); setSure(false); }}>Delete all {notes.length}</Btn><Btn tone="ghost" onClick={() => setSure(false)}>Cancel</Btn></>
            : <Btn tone="ghost" icon="trash" disabled={!notes.length} onClick={() => setSure(true)}>Delete everything</Btn>}
        </div>
      </section>

      <section className="card tone t-mint">
        <h2 className="card-title">Android app</h2>
        <p className="desc">{s.android ? `You're on the test list as ${s.android.email}. The Play Store link comes by email when the test opens.` : 'Voc is coming to Google Play. Join the test to get it first.'}</p>
        <div className="btns"><Btn icon="phone" onClick={() => go('android')}>{s.android ? 'Change email' : 'Get the Android app early'}</Btn></div>
      </section>

      <section className="card tone t-ice">
        <h2 className="card-title">Privacy</h2>
        <ul className="plain">
          <li>Emails, notes, to-dos and orders are kept only on this phone. No account needed.</li>
          <li>Voice goes to the speech service to be written down, then dropped. Audio is never stored.</li>
          <li>Gemini's free tier may use what it's sent to improve Google's products. For private or customer data, use a paid key.</li>
          <li>Visits are counted with Vercel Web Analytics: no cookies, and never what you say or write.</li>
          <li>If you join the Android test, your email is kept only to invite you on Google Play.</li>
        </ul>
      </section>
    </>
  );
}
