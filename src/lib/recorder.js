// Microphone recording with a live level for the meter. Stops by itself at MAX_SEC.
export const MAX_SEC = 180;

const TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm'];

export async function startRecording({ onLevel, onStop }) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  const mimeType = TYPES.find(t => window.MediaRecorder?.isTypeSupported?.(t));
  const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const parts = [];
  rec.ondataavailable = e => e.data.size && parts.push(e.data);

  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  ctx.createMediaStreamSource(stream).connect(analyser);
  const data = new Uint8Array(analyser.fftSize);
  let raf = 0;
  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (const x of data) peak = Math.max(peak, Math.abs(x - 128));
    onLevel?.(Math.min(1, peak / 90));
    raf = requestAnimationFrame(tick);
  };
  tick();

  const started = Date.now();
  const limit = setTimeout(() => stop(), MAX_SEC * 1000);
  let done = false;
  const finished = new Promise(resolve => {
    rec.onstop = () => {
      cancelAnimationFrame(raf);
      clearTimeout(limit);
      stream.getTracks().forEach(t => t.stop());
      ctx.close?.();
      const blob = new Blob(parts, { type: rec.mimeType || mimeType || 'audio/webm' });
      resolve(blob);
      onStop?.(blob, (Date.now() - started) / 1000);
    };
  });
  rec.start(250);

  function stop() {
    if (done) return finished;
    done = true;
    if (rec.state !== 'inactive') rec.stop();
    return finished;
  }
  function cancel() {
    rec.onstop = () => { cancelAnimationFrame(raf); clearTimeout(limit); stream.getTracks().forEach(t => t.stop()); ctx.close?.(); };
    done = true;
    if (rec.state !== 'inactive') rec.stop();
  }
  return { stop, cancel, started };
}
