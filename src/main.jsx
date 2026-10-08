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
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
