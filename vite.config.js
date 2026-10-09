import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// In dev, serve api/*.js (Vercel functions) from the Vite server, with .env.local
// loaded, so `npm run dev` is the whole app. Vercel runs the same files in production.
function devApi() {
  return {
    name: 'voc-dev-api',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''));
      server.middlewares.use(async (req, res, next) => {
        const m = /^\/api\/([a-z-]+)(?:[?#]|$)/.exec(req.url ?? '');
        if (!m) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
          const handler = mod[req.method];
          if (!handler) { res.statusCode = 405; res.end(); return; }
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const headers = {};
          for (const h of ['content-type', 'x-app-key', 'user-agent']) if (req.headers[h]) headers[h] = req.headers[h];
          const request = new Request(`http://localhost${req.url}`, {
            method: req.method, headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    devApi(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      // og.png is only for link previews, and the IndexNow key file is for search engines: no need to cache them
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], globIgnores: ['og.png'] },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Voc',
        short_name: 'Voc',
        description: 'Say it in Manglish: voice notes and WhatsApp messages become to-dos, calendar dates and order lists.',
        theme_color: '#1D1D1D',
        background_color: '#1D1D1D',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Android: WhatsApp voice note -> Share -> Voc. src/sw.js receives the POST.
        share_target: {
          action: '/share-target',
          method: 'POST',
          enctype: 'multipart/form-data',
          params: {
            title: 'title',
            text: 'text',
            url: 'url',
            files: [{ name: 'audio', accept: ['audio/*', '.opus', '.ogg', '.m4a', '.mp3', '.aac', '.wav', '.amr'] }],
          },
        },
      },
    }),
  ],
  server: { port: 3200 },
  preview: { port: 3200 },
  test: { include: ['src/**/*.test.js', 'eval/**/*.test.js', 'server/**/*.test.js'] },
});
