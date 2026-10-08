// Any audio the phone can play (WhatsApp .opus, a recording, an .m4a) ->
// 16 kHz mono WAV pieces of at most 28 s, cut at the quietest moment so a word
// isn't split. Every speech-to-text service accepts this, and Sarvam needs <= 30 s.
const RATE = 16000;

export async function decode(blob) {
  const data = await blob.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  try {
    const decoded = await ctx.decodeAudioData(data);
    const off = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * RATE)), RATE);
    const src = off.createBufferSource();
    src.buffer = decoded;
    src.connect(off.destination);
    src.start();
    const out = await off.startRendering();
    return out.getChannelData(0);
  } finally {
    ctx.close?.();
  }
}

const rms = (pcm, from, to) => {
  let s = 0;
  for (let i = from; i < to; i++) s += pcm[i] * pcm[i];
  return Math.sqrt(s / Math.max(1, to - from));
};

export function split(pcm, maxSec = 28, searchSec = 8) {
  const max = maxSec * RATE;
  const frame = RATE / 10;
  const parts = [];
  let start = 0;
  while (pcm.length - start > max) {
    let best = start + max;
    let quiet = Infinity;
    for (let at = start + max - searchSec * RATE; at + frame <= start + max; at += frame / 2) {
      const r = rms(pcm, at, at + frame);
      if (r < quiet) { quiet = r; best = at + frame / 2; }
    }
    parts.push(pcm.subarray(start, best));
    start = best;
  }
  parts.push(pcm.subarray(start));
  return parts.filter(p => p.length > RATE / 4);
}

export function wav(pcm) {
  const buf = new ArrayBuffer(44 + pcm.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, RATE, true); v.setUint32(28, RATE * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buf], { type: 'audio/wav' });
}

export async function toWavChunks(blob) {
  const pcm = await decode(blob);
  const seconds = pcm.length / RATE;
  return { chunks: split(pcm).map(wav), seconds };
}
