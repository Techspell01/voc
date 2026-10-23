import puppeteer from 'puppeteer-core';
const out = process.argv[2];
const VARIANTS = [
  ['hero-square', 1200, 1200, 'linkedin-1-hero-1200x1200'],
  ['c1-email', 1080, 1350, 'linkedin-2-email-1080x1350'],
  ['c2-notes', 1080, 1350, 'linkedin-3-sticky-notes-1080x1350'],
  ['c3-shop', 1080, 1350, 'linkedin-4-shopping-1080x1350'],
  ['c4-eval', 1080, 1350, 'linkedin-5-results-1080x1350'],
  ['hero-wide', 1600, 900, 'x-1-hero-1600x900'],
  ['x-email', 1600, 900, 'x-2-email-1600x900'],
  ['x-notes', 1600, 900, 'x-3-sticky-notes-1600x900'],
  ['x-shop', 1600, 900, 'x-4-shopping-1600x900'],
];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message));
page.on('requestfailed', r => errs.push('failed ' + r.url()));
for (const [v, w, h, name] of VARIANTS) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:3200/marketing/promo.html?v=${v}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 20000 });
  await new Promise(r => setTimeout(r, 300));
  const el = await page.$(`[data-v="${v}"]`);
  await el.screenshot({ path: `${out}/${name}.png` });
}
console.log(errs.join('\n') || 'rendered 9 images');
await browser.close();
