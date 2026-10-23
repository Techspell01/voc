// Clean app screenshots for the promo images, from seeded notes (no AI calls).
import puppeteer from 'puppeteer-core';
const out = process.argv[2];
const now = Date.now();
const iso = m => new Date(now - m * 60000).toISOString();
const NOTES = [
  { id: 'nemail1', at: iso(2), done: {}, kind: 'email', source: 'voice', stt: 'gemini', seconds: 14, engine: 'ai:gemini',
    transcript: 'രാഹുൽ സാറിന് ഒരു മെയിൽ അയക്കണം. നാളെ ഞാൻ ഓഫീസിൽ വരില്ല, അമ്മേടെ ഡോക്ടർ appointment ഉണ്ട്. Report തിങ്കളാഴ്ച രാവിലെ അയച്ചു തരാം. Leave approve ചെയ്യണം.',
    result: { toName: 'Rahul', to: 'rahul@company.in', subject: 'Leave on Saturday, 10 October',
      body: "Dear Rahul,\n\nI will not be able to come to the office tomorrow, Saturday, 10 October, as I have my mother's doctor appointment.\n\nI will send the report on Monday morning, 12 October.\n\nKindly approve my leave.\n\nRegards,\nHarinand" } },
  { id: 'nsticky-a', at: iso(5), done: {}, kind: 'sticky', source: 'voice', engine: 'ai:gemini', transcript: '…', result: { title: 'Bank and bills', text: '- Go to the bank on Saturday morning\n- Pay the electricity bill\n- Give ₹500 to Amma\n- Book gas' } },
  { id: 'nsticky-b', at: iso(30), done: {}, kind: 'sticky', source: 'voice', engine: 'ai:gemini', transcript: '…', result: { title: 'App ideas', text: '- Dark mode\n- WhatsApp share button\n- Demo on Fri 9 Oct' } },
  { id: 'nsticky-c', at: iso(90), done: {}, kind: 'sticky', source: 'voice', engine: 'ai:gemini', transcript: '…', result: { title: 'Onam list', text: '- Book the sadya for 12\n- New mundu for Achan\n- Pookalam flowers' } },
  { id: 'nsticky-d', at: iso(200), done: {}, kind: 'sticky', source: 'voice', engine: 'ai:gemini', transcript: '…', result: { title: 'Call back', text: '- Ravi, about the site visit\n- Plumber, motor check' } },
  { id: 'norder1', at: iso(8), done: { i0: true }, kind: 'lists', source: 'voice', stt: 'gemini', engine: 'ai:gemini',
    transcript: 'Chetta, randu kilo matta ari, 2 packet maggi, oru kilo oats, 2 packet milma, pathu mutta venam. Nale raavile ethikkanam.',
    result: { latin: '', items: [
      { id: 'i0', name: 'Matta rice', said: 'randu kilo matta ari', cat: 'staple', qty: 2, unit: 'kg', known: true },
      { id: 'i1', name: 'Noodles', said: '2 packet maggi', cat: 'bakery', qty: 2, unit: 'packet', known: true },
      { id: 'i2', name: 'Oats', said: 'oru kilo oats', cat: 'staple', qty: 1, unit: 'kg', known: true },
      { id: 'i3', name: 'Milk', said: '2 packet milma', cat: 'dairy', qty: 2, unit: 'packet', known: true },
      { id: 'i4', name: 'Egg', said: 'pathu mutta', cat: 'dairy', qty: 10, unit: null, known: true },
    ], todos: [], events: [], order: { date: null, time: '09:00', approx: true } } },
  { id: 'ntodo1', at: iso(60), done: {}, kind: 'lists', source: 'voice', engine: 'ai:gemini', transcript: '…',
    result: { items: [], order: null,
      todos: [{ id: 't0', title: "Keep Amma's reports ready", date: null, time: null }, { id: 't1', title: 'Call Achan', date: null, time: null }, { id: 't2', title: 'Pay electricity bill', date: null, time: null }],
      events: [{ id: 'e0', title: "Amma's doctor appointment", date: null, time: '10:00', approx: false }, { id: 'e1', title: 'Client meeting', date: null, time: '15:00', approx: false }] } },
];
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
await page.goto('http://localhost:3200/', { waitUntil: 'networkidle0' });
await page.evaluate(notes => {
  const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 29.5 * 3600000).toISOString().slice(0, 10);
  for (const n of notes) {
    if (n.result?.order) n.result.order.date = tomorrow;
    for (const e of n.result?.events ?? []) e.date = today;
    for (const t of n.result?.todos ?? []) t.date = t.title === 'Call Achan' ? null : tomorrow;
  }
  localStorage.clear();
  localStorage.setItem('voc.notes.v1', JSON.stringify(notes));
  localStorage.setItem('voc.settings.v1', JSON.stringify({ name: 'Harinand', mode: 'email', store: 'blinkit' }));
}, NOTES);
const shot = async (name, prep, full = false) => {
  await page.reload({ waitUntil: 'networkidle0' });
  await prep?.();
  await new Promise(r => setTimeout(r, 700));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
};
const tab = label => page.$eval(`nav button[aria-label="${label}"]`, b => b.click());
await shot('s-home');
await shot('s-email', async () => { await tab('Mail'); await new Promise(r => setTimeout(r, 300)); await page.$eval('button[aria-label="Open email"]', b => b.click()); });
await shot('s-notes', async () => { await tab('Notes'); });
await shot('s-sticky', async () => { await tab('Notes'); await new Promise(r => setTimeout(r, 300)); await page.$eval('button.sticky', b => b.click()); });
await shot('s-orders', async () => {
  await tab('Orders'); await new Promise(r => setTimeout(r, 300));
  await (await page.$('xpath/.//button[contains(., "Shop online")]')).evaluate(b => b.click());
  await page.evaluate(() => document.querySelector('.t-yellow, .t-ice, .t-mint').scrollIntoView({ block: 'start' }));
});
await shot('s-todo', async () => { await tab('To-do'); });
// order card alone, for close-ups (no floating tab bar over it)
await page.reload({ waitUntil: 'networkidle0' });
await page.addStyleTag({ content: 'nav.tabbar, .credit { display: none !important; }' });
await page.$eval('nav button[aria-label="Orders"]', b => b.click()); await new Promise(r => setTimeout(r, 300));
await (await page.$('xpath/.//button[contains(., "Shop online")]')).evaluate(b => b.click());
await new Promise(r => setTimeout(r, 500));
const card = await page.$$('section.card');
await card[1].screenshot({ path: `${out}/c-order.png` });
await page.$eval('nav button[aria-label="Mail"]', b => b.click()); await new Promise(r => setTimeout(r, 300)); await page.$eval('button[aria-label="Open email"]', b => b.click()); await new Promise(r => setTimeout(r, 600));
await (await page.$('.mail-card')).screenshot({ path: `${out}/c-email.png` });
await browser.close();
console.log('done');
