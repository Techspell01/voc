import { useEffect, useState } from 'react';
import New from './screens/New.jsx';
import Mail from './screens/Mail.jsx';
import Notes from './screens/Notes.jsx';
import Todo, { agenda } from './screens/Todo.jsx';
import Orders, { openOrders } from './screens/Orders.jsx';
import Settings from './screens/Settings.jsx';
import Android from './screens/Android.jsx';
import Translate from './screens/Translate.jsx';
import { Icon } from './components/Icons.jsx';
import { addNote, getNotes, setSettings, updateNote, useNotes, useSettings } from './lib/store.js';
import { fillOrder, finishLink } from './lib/cartlink.js';
import { addToNote, addToList, hearAudio, readNote, rewriteEmail, translateReply, writeEmail, writeNote } from './lib/pipeline.js';
import { graphemes } from './components/Sticky.jsx';
import { status } from './lib/api.js';
import { takeShared } from './lib/shared.js';
import { todayIST } from './lib/manglish/when.js';

const TABS = [['new', 'Home', 'mic'], ['mail', 'Mail', 'mail'], ['notes', 'Notes', 'sticky'], ['todo', 'To-do', 'list'], ['orders', 'Orders', 'bag']];
const ROUTES = new Set([...TABS.map(t => t[0]), 'settings', 'android', 'translate']);
const LIGHT = new Set(['notes', 'todo', 'settings']);   // sage screens; the rest are charcoal
const cap = s => (s ? s[0].toUpperCase() + s.slice(1) : s);

// usevoc.vercel.app/android is the link to share for the Android test: it opens that screen.
if (location.pathname === '/android') history.replaceState(null, '', '/#android');

export default function App() {
  const notes = useNotes();
  const settings = useSettings();
  const [tab, setTab] = useState(() => (ROUTES.has(location.hash.slice(1)) ? location.hash.slice(1) : 'new'));
  const [openMail, setOpenMail] = useState(null);
  const [live, setLive] = useState(null);           // { id, from }: the sticky that is writing itself
  const [busy, setBusy] = useState(null);           // { kind, stage }
  const [translation, setTranslation] = useState(null);   // the last Translate reply: { result, said, ... }
  const [error, setError] = useState('');
  const [server, setServer] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const today = todayIST();

  const go = id => setTab(id);

  useEffect(() => {
    history.replaceState(null, '', tab === 'new' ? location.pathname : `#${tab}`);
    document.body.classList.toggle('light', LIGHT.has(tab));
    window.scrollTo(0, 0);
  }, [tab]);
  useEffect(() => {
    let alive = true;
    let timer;
    // A dropped status call must not leave every mic dead until a reload: unknown
    // reads as "try it" (the recording itself will say if the server is away), and
    // we keep asking in the background until an answer arrives.
    const check = () => status()
      .then(s => { if (alive) setServer(s); })
      .catch(() => {
        if (!alive) return;
        setServer(null);
        if (navigator.onLine) timer = setTimeout(check, 6000);
      });
    check();
    const on = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) { clearTimeout(timer); check(); }
    };
    addEventListener('online', on);
    addEventListener('offline', on);
    return () => { alive = false; clearTimeout(timer); removeEventListener('online', on); removeEventListener('offline', on); };
  }, []);

  // Back from Zepto / Instamart sign-in (/zepto-callback): finish it, then fill that order's cart.
  useEffect(() => {
    finishLink().then(r => {
      if (!r) return;
      setTab('orders');
      setSettings({ store: r.store });
      const note = getNotes().find(n => n.id === r.noteId);
      if (r.error) { if (note) updateNote(note.id, { cart: { store: r.store, status: 'error', message: r.error } }); return; }
      if (note) fillOrder(note, r.store);
    }).catch(err => setError(err.message || 'Sign-in failed.'));
  }, []);

  // WhatsApp -> Share -> Voc lands here as /?shared=1 (always read as lists: orders, errands)
  useEffect(() => {
    if (!new URLSearchParams(location.search).has('shared')) return;
    history.replaceState(null, '', '/');
    takeShared().then(s => {
      if (s?.audio) handleAudio(s.audio, 'shared', 'lists');
      else if (s?.text) handleText(s.text, 'shared', 'lists');
    });
  }, []);

  // Where each kind of note goes once it's written: notes to the Notes section,
  // lists to Orders (or To-do when the note only made to-dos and dates).
  function show(kind, id, out) {
    if (kind === 'email') { setOpenMail(id); setTab('mail'); }
    else if (kind === 'note') { setLive({ id, from: 0 }); setTab('notes'); }
    else setTab(out?.result?.items?.length ? 'orders' : 'todo');
  }

  async function write(kind, transcript, stage) {
    if (kind === 'email') return writeEmail(transcript, stage);
    if (kind === 'note') return writeNote(transcript, stage);
    return readNote(transcript, stage);
  }
  const stored = kind => (kind === 'note' ? 'sticky' : kind);   // notes are stored as stickies

  async function handleAudio(blob, source, kind = 'email') {
    setError('');
    const stage = s => setBusy({ kind, stage: s });
    if (kind === 'note' && tab !== 'notes') setTab('notes');
    try {
      const heard = await hearAudio(blob, stage, kind === 'translate' ? { lang: 'auto' } : undefined);
      if (kind === 'translate') {
        const out = await translateReply(heard.transcript, stage);
        setTranslation({ ...out.result, engine: out.engine, fallback: out.fallback ?? null, said: heard.transcript, stt: heard.provider, typed: false });
        return;
      }
      const out = await write(kind, heard.transcript, stage);
      show(kind, addNote({ kind: stored(kind), source, transcript: heard.transcript, stt: heard.provider, seconds: heard.seconds, ...out }), out);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  async function handleText(text, source, kind = 'email') {
    setError('');
    const stage = s => setBusy({ kind, stage: s });
    try {
      if (kind === 'translate') {
        const out = await translateReply(text, stage);
        setTranslation({ ...out.result, engine: out.engine, fallback: out.fallback ?? null, said: text, stt: null, typed: true });
        return;
      }
      const out = await write(kind, text, stage);
      show(kind, addNote({ kind: stored(kind), source, transcript: text, ...out }), out);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  // More for an existing sticky: hear it (or take the typed text), write just the new lines, append them live.
  async function appendNote(id, { blob, text }) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setError('');
    const stage = s => setBusy({ kind: 'append', stage: s });
    try {
      const said = blob ? (await hearAudio(blob, stage)).transcript : text;
      const out = await addToNote(note, said, stage);
      const old = note.result?.text ?? note.transcript;
      updateNote(id, n => ({ result: { ...n.result, text: `${old}
${out.add}` }, transcript: `${n.transcript}
${said}`, editedAt: new Date().toISOString() }));
      setLive({ id, from: graphemes(`${old}
`).length });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  // More for an existing list: hear it (or take the typed text), keep only the new items.
  async function appendList(id, { blob, text }) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    setError('');
    const stage = s => setBusy({ kind: 'lists', stage: s });
    try {
      const said = blob ? (await hearAudio(blob, stage)).transcript : text;
      const out = await addToList(note, said, stage);
      const add = out.result ?? {};
      updateNote(id, n => {
        const r = n.result ?? {};
        const merge = (old = [], more = [], p) => [...old, ...more.map((x, i) => ({ ...x, id: `${p}${old.length + i}` }))];
        return {
          result: {
            ...r,
            items: merge(r.items, add.items, 'i'),
            todos: merge(r.todos, add.todos, 't'),
            events: merge(r.events, add.events, 'e'),
            order: add.order ?? r.order,
          },
          transcript: `${n.transcript}\n${said}`,
          editedAt: new Date().toISOString(),
        };
      });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  async function rewrite(id, email, how) {
    setError('');
    const note = notes.find(n => n.id === id);
    try {
      const out = await rewriteEmail(email, how, note?.transcript ?? '', s => setBusy({ kind: 'email', stage: s }));
      updateNote(id, { result: out.result, engine: out.engine, at: new Date().toISOString() });
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }
  const counts = { todo: agenda(notes, today).openCount, orders: openOrders(notes).length };
  // The mic only needs the network. The status call is advice, never a switch:
  // a slow or failed /api/status must not leave every microphone dead.
  const canHear = online;
  const reader = settings.engine === 'offline' || !server?.llm?.length || !online ? 'offline reader' : `writing by ${cap(server.llm[0])}`;
  const statusLine = !online ? 'Offline · typed lists still work'
    : !server ? 'Connecting…'
      : `${server.stt?.length ? `Speech by ${cap(server.stt[0])}` : 'Speech off'} · ${reader}`;
  const shared = { notes, today, busy, error, canHear, go };

  return (
    <>
      <main className={`screen${LIGHT.has(tab) ? ' light' : ''}`}>
        {tab === 'new' && <New {...shared} onAudio={handleAudio} onText={handleText} status={statusLine} result={translation} onClear={() => setTranslation(null)} />}
        {tab === 'mail' && <Mail {...shared} open={openMail} setOpen={setOpenMail} onAudio={handleAudio} onText={handleText} onRewrite={rewrite} />}
        {tab === 'notes' && <Notes {...shared} live={live} setLive={setLive} onAudio={handleAudio} onText={handleText} onAppend={appendNote} />}
        {tab === 'todo' && <Todo notes={notes} today={today} go={go} />}
        {tab === 'orders' && <Orders notes={notes} today={today} go={go} onAudio={handleAudio} onText={handleText} onEdit={appendList} />}
        {tab === 'settings' && <Settings notes={notes} server={server} go={go} />}
        {tab === 'android' && <Android go={go} />}
        {tab === 'translate' && <Translate {...shared} onAudio={handleAudio} onText={handleText} result={translation} onClear={() => setTranslation(null)} />}
      </main>
      <nav className="tabbar" aria-label="Sections">
        {TABS.map(([id, label, icon]) => (
          <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} aria-label={label} title={label} onClick={() => go(id)}>
            {Icon[icon](22)}
            {counts[id] ? <span className="badge">{counts[id]}</span> : null}
          </button>
        ))}
      </nav>
      <p className="credit">Created by Harinand</p>
    </>
  );
}
