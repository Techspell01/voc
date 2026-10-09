# Voc plan

## Phase 1: working app + eval (done, 2026-10-08)
- Manglish language core: transliteration, lexicon, spelling skeletons, dates/times, rule extractor.
- AI reader (Gemini, Groq backup) with lexicon hints and code-checked dates, units and item names.
- PWA: record, open a file, paste text, or share a WhatsApp voice note (Android share target). To-do agenda, order lists with packing ticks and WhatsApp send-back, Google Calendar and .ics.
- Eval: 59 dev notes, 30 holdout notes, 10 synthetic voice clips; ablation of rules vs AI vs AI + hints (hints: no measurable gain on the holdout; the code checks in clean() are what made the AI reliable).

## Phase 1b: email, sticky notes, shop online (done, 2026-10-08)
- Renamed to Voc (from Kurippu, then Parayu), live at https://usevoc.vercel.app.
- Email mode (Malayalam speech -> English email, rewrites, Gmail / mail app), Note mode (live-writing sticky notes), Shop online for order lists.
- Fallback chain with hedging; Sarvam wired in for speech and writing, waiting for a key.
- [ ] Add SARVAM_API_KEY (local .env.local and Vercel production), then compare Sarvam vs Gemini speech with `npm run eval:audio -- --stt=sarvam`.
- [ ] An eval set for emails and notes (facts kept, nothing invented, dates right).
- [ ] Contacts: remember the email address for "Rahul sir", "Manager".
- [x] Add to an existing note (2026-10-09), "Created by Harinand" watermark.
- [x] Zepto + Instamart "Add all to cart" via official MCP (2026-10-09), working on localhost; tested with a mock store only.
- [ ] First real run with the user's Zepto account on localhost; fix whatever the real tool schemas need.
- [ ] Ask Zepto to allow https://usevoc.vercel.app/zepto-callback (issue on github.com/zeptonow/mcp), and apply for Swiggy Builders Club production access.

## Phase 2: real voice notes (next)
- [ ] Get a Sarvam key (free credits) and run `npm run eval:audio` with Sarvam vs Gemini.
- [ ] Collect 30-50 real voice notes (family, a friendly kirana shop, a hardware shop), with consent. Transcribe by hand as references, add them to eval/audio.jsonl. Synthetic clips flatter every speech service.
- [ ] Write a fresh holdout set (holdout 1 has influenced three fixes), and rerun the dev set without hints (that run was lost to network errors).
- [ ] Settle lexicon hints on or off with the real-voice-note set.
- [x] Deployed to Vercel (2026-10-08): https://usevoc.vercel.app
- [ ] Try the WhatsApp share flow on an Android phone (install from Chrome, Add to Home screen).

## Phase 3: for shops
- [ ] Prices: a per-shop price list, so an order list gets a bill total, and the WhatsApp reply carries it.
- [ ] Customer name from the shared note / WhatsApp contact, and a simple "who ordered what" list.
- [ ] Malayalam UI option (labels), for shop owners who don't read English.
- [ ] Item list learning: when a shop renames an item ("Colgate paste" -> "Colgate 100 g"), remember it for that shop.

## Phase 4: WhatsApp without the share step
- [ ] WhatsApp Business Cloud API number per shop: customers send voice notes straight to it, the shop sees orders appear. Needs Meta business verification and a small backend (Supabase), and per-conversation costs.
- [ ] Pricing to test: ₹199-499/month per shop.

## Ideas
- Android app: a Trusted Web Activity (PWABuilder / Bubblewrap) so web deploys reach it without store updates. Testers are being collected now (`/android`, 2026-10-09); Play's closed test needs 12+ for 14 days. Needs `/.well-known/assetlinks.json` with the signing key (and Play App Signing's) fingerprint.
- Reminders as notifications instead of calendar entries.
- A Manglish keyboard-free note: speak, Voc writes a clean WhatsApp message back in Manglish or Malayalam.
