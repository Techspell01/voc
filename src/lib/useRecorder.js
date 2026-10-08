// Recording state for any screen: elapsed time, a rolling level history for the
// waveform, and stop -> onDone(blob). The 3-minute limit also ends in onDone.
import { useEffect, useRef, useState } from 'react';
import { startRecording } from './recorder.js';

export const BARS = 22;

export function useRecorder(onDone) {
  const [rec, setRec] = useState(null);
  const [secs, setSecs] = useState(0);
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState('');
  const level = useRef(0);
  const live = useRef(null);
  const byUser = useRef(false);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => {
      setSecs((Date.now() - rec.started) / 1000);
      setLevels(l => [...l.slice(-(BARS - 1)), level.current]);
    }, 110);
    return () => clearInterval(t);
  }, [rec]);
  useEffect(() => () => live.current?.cancel(), []);

  async function start() {
    setError('');
    try {
      byUser.current = false;
      const r = await startRecording({
        onLevel: v => { level.current = v; },
        onStop: blob => {          // the time limit stopped it: send what was recorded
          if (byUser.current) return;
          live.current = null;
          setRec(null);
          if (blob.size > 0) done.current(blob);
        },
      });
      live.current = r;
      setLevels([]);
      setSecs(0);
      setRec(r);
    } catch {
      setError('Microphone blocked. Allow it in the browser settings, or type instead.');
    }
  }

  async function stop() {
    if (!rec) return;
    byUser.current = true;
    live.current = null;
    const r = rec;
    setRec(null);
    const blob = await r.stop();
    if (blob.size > 0) done.current(blob);
  }

  function cancel() {
    live.current?.cancel();
    live.current = null;
    setRec(null);
  }

  const bars = Array.from({ length: BARS }, (_, i) => levels[i - (BARS - levels.length)] ?? 0);
  return { recording: !!rec, secs, bars, error, start, stop, cancel, toggle: () => (rec ? stop() : start()) };
}

export const clock = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
