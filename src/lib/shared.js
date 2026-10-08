// Picks up what Android shared into the app (see src/sw.js), once.
let taken = false;
export async function takeShared() {
  if (taken || !('caches' in window)) return null;
  taken = true;
  const cache = await caches.open('voc-share');
  const [audio, text] = await Promise.all([cache.match('/shared/audio'), cache.match('/shared/text')]);
  await Promise.all([cache.delete('/shared/audio'), cache.delete('/shared/text')]);
  if (!audio && !text) return null;
  return {
    audio: audio ? await audio.blob() : null,
    name: audio ? decodeURIComponent(audio.headers.get('x-name') ?? '') : '',
    text: text ? await text.text() : '',
  };
}
