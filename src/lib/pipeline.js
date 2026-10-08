// Voice note -> transcript -> actions. The rule parser always runs on the phone,
// so there is an answer even offline; the server's AI reader replaces it when it
// can be reached and the person hasn't chosen offline mode.
import { extract } from './manglish/parse.js';
import { todayIST } from './manglish/when.js';
import { toWavChunks } from './audio.js';
import { composeRemote, extractRemote, transcribeChunk } from './api.js';
import { getSettings } from './store.js';

export async function hearAudio(blob, onStage) {
  onStage?.('decoding audio');
  let chunks, seconds;
  try {
    ({ chunks, seconds } = await toWavChunks(blob));
  } catch {
    throw new Error("This phone couldn't open that audio file.");
  }
  if (!chunks.length) throw new Error('No speech in that recording.');
  const texts = [];
  let provider = null;
  for (let i = 0; i < chunks.length; i++) {
    onStage?.(chunks.length > 1 ? `listening ${i + 1}/${chunks.length}` : 'listening');
    const r = await transcribeChunk(chunks[i]);
    texts.push(r.text);
    provider = r.provider;
  }
  const transcript = texts.join(' ').replace(/\s+/g, ' ').trim();
  if (!transcript) throw new Error("Couldn't hear any words in that note.");
  return { transcript, provider, seconds };
}

export async function readNote(text, onStage) {
  const today = todayIST();
  const rules = extract(text, { today });
  if (getSettings().engine === 'offline') return { result: rules, engine: 'rules', today };
  onStage?.('reading');
  try {
    const r = await extractRemote(text, today);
    return { result: r.result, engine: `ai:${r.engine}`, today };
  } catch (err) {
    return { result: rules, engine: 'rules', today, fallback: err.message };
  }
}

// Speech -> an English email. Needs the AI reader: there's no offline translation.
export async function writeEmail(text, onStage) {
  const { name, tone } = getSettings();
  onStage?.('writing your email');
  const r = await composeRemote({ kind: 'email', text, today: todayIST(), name, tone });
  return { result: r.result, engine: `ai:${r.engine}` };
}

export async function rewriteEmail(email, how, original, onStage) {
  onStage?.('rewriting');
  const r = await composeRemote({ kind: 'rewrite', email, how, text: original, today: todayIST(), name: getSettings().name });
  return { result: r.result, engine: `ai:${r.engine}` };
}

// Speech -> a sticky note. Offline, or with "as spoken", the note keeps the words as said.
export async function writeNote(text, onStage) {
  const { noteLang, engine } = getSettings();
  const asSpoken = () => ({ result: { title: '', text, spoken: true }, engine: 'as spoken' });
  if (noteLang === 'spoken' || engine === 'offline') return asSpoken();
  onStage?.('writing your note');
  try {
    const r = await composeRemote({ kind: 'note', text, today: todayIST() });
    return { result: r.result, engine: `ai:${r.engine}` };
  } catch (err) {
    return { ...asSpoken(), fallback: err.message };
  }
}

// More for an existing sticky: just the new lines, in the note's own style.
export async function addToNote(note, text, onStage) {
  const { noteLang, engine } = getSettings();
  const raw = () => ({ add: text, engine: 'as spoken' });
  if (noteLang === 'spoken' || engine === 'offline' || note.result?.spoken) return raw();
  onStage?.('adding to your note');
  try {
    const r = await composeRemote({ kind: 'append', text, today: todayIST(), note: { title: note.result?.title ?? '', text: note.result?.text ?? note.transcript } });
    return { add: r.result.add, engine: `ai:${r.engine}` };
  } catch (err) {
    return { ...raw(), fallback: err.message };
  }
}
