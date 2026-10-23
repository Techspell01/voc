import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import '@fontsource/caveat/500.css';
import '@fontsource/caveat/700.css';
import '@fontsource/noto-sans-malayalam/malayalam-400.css';
import '@fontsource/noto-sans-malayalam/malayalam-700.css';
import './styles.css';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';

// Visits only, with no cookies. The address is sent without its ?query or #screen, so
// sign-in codes (/zepto-callback?code=) and share links never reach the analytics.
const bare = event => ({ ...event, url: event.url.split(/[?#]/)[0] });

createRoot(document.getElementById('root')).render(<StrictMode><App /><Analytics beforeSend={bare} /></StrictMode>);

// A page that is already open keeps running the JS it loaded with, even after the
// new service worker takes over. Reload once when a different build takes charge,
// or a fix deployed today never reaches an open tab or an installed app.
if ('serviceWorker' in navigator) {
  let had = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (had) location.reload();
    had = true;
  });
}
