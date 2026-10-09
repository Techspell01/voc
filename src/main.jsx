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
