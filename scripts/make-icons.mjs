// PWA icons: five sound-wave bars (Voc = voice) on a coral disc, on charcoal.
import sharp from 'sharp';
const BARS = '<rect x="3.4" y="9" width="3.2" height="6" rx="1.6"/><rect x="7.9" y="5" width="3.2" height="14" rx="1.6"/><rect x="12.4" y="2" width="3.2" height="20" rx="1.6"/><rect x="16.9" y="6" width="3.2" height="12" rx="1.6"/><rect x="21.4" y="9.5" width="3.2" height="5" rx="1.6"/>';
const svg = scale => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1D1D1D"/>
  <circle cx="256" cy="256" r="${190 * scale}" fill="#F2705F"/>
  <g transform="translate(${256 - 14 * 8.6 * scale} ${256 - 12 * 8.6 * scale}) scale(${8.6 * scale})" fill="#161616">${BARS}</g>
</svg>`);
const out = [['pwa-192.png', 192, 1], ['pwa-512.png', 512, 1], ['pwa-maskable-512.png', 512, 0.78], ['apple-touch-icon.png', 180, 1]];
for (const [name, size, scale] of out) await sharp(svg(scale)).resize(size, size).png().toFile(`public/${name}`);
console.log('icons written');
