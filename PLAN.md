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
- [x] Translate a reply (2026-10-19): say it in Malayalam, Hindi, Manglish or English and get one English message to copy or send on WhatsApp, off a card on Home. Speech asks for language detection (`?lang=auto`) so Hindi isn't read as Malayalam. Nothing is saved.
- [x] Voc keyboard (2026-10-21, asked for by the user): a real keyboard inside the Android app. Tap the mic while any chat box is open, speak, and the English reply is typed where the caret is, so WhatsApp is never left. It calls the live backend itself (`/api/transcribe?lang=auto`, then `/api/compose`) and keeps nothing. The keyboard has no letter keys: a mic, a status line, and a way back to your usual keyboard. On the phone the Translate screen also copies each reply the moment it arrives and puts WhatsApp first.
- [x] Home is Email + Translate only (2026-10-21, asked for by the user): the Email / Note / Lists picker is gone. Notes are recorded with the yellow mic in Notes; lists with the coral mic in Orders (or typed into Orders when the list is empty). A written list opens in Orders, or in To-do when it only made to-dos and dates, and "Add more items" now sits on each order card.

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
- Android app: Capacitor (2026-10-21, replaced the Bubblewrap TWA) — the APK wraps the live site and ships the Voc keyboard. The release build is signed with `android/keystore/voc-android.keystore` (kept out of git); Play's closed test still needs 12+ testers for 14 days.
- Reminders as notifications instead of calendar entries.
- A Manglish keyboard-free note: speak, Voc writes a clean WhatsApp message back in Manglish or Malayalam.
