// Notes live only on this phone (localStorage). Audio is never stored: once a
// note is transcribed, only its text and the actions read from it are kept.
import { useSyncExternalStore } from 'react';

const NOTES = 'voc.notes.v1';
const SETTINGS = 'voc.settings.v1';
const listeners = new Set();

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode or full: keep in memory */ }
}

let notes = read(NOTES, []);
// name: signs your emails. tone: formal | friendly. noteLang: english | spoken (keep the words as said).
let settings = { engine: 'auto', appKey: '', name: '', tone: 'formal', noteLang: 'english', ...read(SETTINGS, {}) };
const emit = () => listeners.forEach(l => l());
const subscribe = l => { listeners.add(l); return () => listeners.delete(l); };

export const useNotes = () => useSyncExternalStore(subscribe, () => notes);
export const useSettings = () => useSyncExternalStore(subscribe, () => settings);
export const getSettings = () => settings;
export const getNotes = () => notes;

function save(next) { notes = next; write(NOTES, notes); emit(); }

export function addNote(note) {
  const n = { id: `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, at: new Date().toISOString(), done: {}, ...note };
  save([n, ...notes]);
  return n.id;
}
export function updateNote(id, patch) {
  save(notes.map(n => (n.id === id ? { ...n, ...(typeof patch === 'function' ? patch(n) : patch) } : n)));
}
export function toggleDone(id, actionId) {
  updateNote(id, n => ({ done: { ...n.done, [actionId]: !n.done?.[actionId] } }));
}
export function removeNote(id) { save(notes.filter(n => n.id !== id)); }
export function clearNotes() { save([]); }
export function setSettings(patch) { settings = { ...settings, ...patch }; write(SETTINGS, settings); emit(); }
