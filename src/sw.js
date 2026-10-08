/// Service worker: offline app shell, plus the Android share target.
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html'), { denylist: [/^\/api\//, /^\/share-target/] }));

// WhatsApp -> long-press a voice note -> Share -> Voc. Android POSTs the file
// here; it waits in a cache until the app opens and picks it up (src/lib/shared.js).
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'POST' || url.pathname !== '/share-target') return;
  event.respondWith((async () => {
    const form = await event.request.formData();
    const cache = await caches.open('voc-share');
    const file = form.get('audio');
    if (file && typeof file !== 'string') {
      await cache.put('/shared/audio', new Response(file, { headers: { 'content-type': file.type || 'audio/ogg', 'x-name': encodeURIComponent(file.name || '') } }));
    } else await cache.delete('/shared/audio');
    const text = ['title', 'text', 'url'].map(k => form.get(k)).filter(v => typeof v === 'string' && v.trim()).join('\n');
    if (text) await cache.put('/shared/text', new Response(text)); else await cache.delete('/shared/text');
    return Response.redirect('/?shared=1', 303);
  })());
});
