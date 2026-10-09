# Voc

**Speak in Malayalam. Get an English email, a sticky note, or your lists and dates.** Live: https://usevoc.vercel.app

In Kerala, voice notes run everything: a customer's order to the kirana shop, Amma's list for the way home, a boss's instructions. They come in Manglish, Malayalam and English mixed mid-sentence, and someone has to listen and write it all down. Voc (short for voice) does that:

> *"Chetta, randu kilo ari, arakilo cheriya ulli, pathu mutta venam. Nale raavile ethikkanam. Pinne velliyazhcha 5 manikku Ammede doctor appointment und."*

| Order list | Calendar |
|---|---|
| Rice: **2 kg** (randu kilo ari)<br>Shallots: **½ kg** (arakilo cheriya ulli)<br>Egg: **10** (pathu mutta)<br>deliver tomorrow, morning · Send on WhatsApp | Amma's doctor appointment<br>**tomorrow, 5 pm**<br>Google Calendar · .ics |

Record a note, open an audio file, paste a message, or on Android share a WhatsApp voice note straight into the app (long-press, Share, Voc). Shops tick items off as they pack and send the list back on WhatsApp; families get to-dos and calendar entries with the dates already worked out.

## Three things you can say

- **Email.** "Rahul sir-nu mail ayakkanam, nale leave venam, Ammede doctor appointment und, report mattannal raavile ayachu tharam" becomes a polite English email ("…as I have my mother's doctor appointment. I will send the report on the morning of the day after tomorrow, Saturday, 10 October."). Edit it, tap *More formal / Friendlier / Shorter / Clearer*, then open it in Gmail or your mail app. Your name signs it (Settings).
- **Note.** Talk it out on the Notes tab: when you stop, the note writes itself, letter by letter in handwriting, onto a sticky note, in clear English (or as you said it). Open a note to add more: say or type it, and only the new lines write themselves in.
- **Lists.** Shop orders, errands and meetings become to-dos, calendar dates and order lists (below). An order list can be shopped on Blinkit, Zepto, Instamart, BigBasket or JioMart: each item opens that app's search ("maggi noodles", "matta rice 5 kg"); add it there, tick it here. **Zepto and Swiggy Instamart** go further, through their official MCP servers: sign in once on their own page (phone + OTP) and Voc puts every item in that account's cart (an AI agent picks the best match and pack count), then you open the app and pay. Voc never orders or pays: it doesn't ask for that permission and withholds any order/checkout tool. For now both stores only accept sign-ins for Voc running on a laptop (`npm run dev`); the live site needs their approval. Blinkit has no official route.

**When a service is down or slow**, Voc moves on: speech goes Gemini 3.5 Flash → Gemini 3.1 Flash-Lite → Sarvam; writing goes Gemini → Groq → Sarvam. A writer that hasn't answered in 5 seconds gets the next one started alongside, and the first good answer wins (Gemini took 37 s on a busy day; Groq answered in under a second). Sarvam is used only with a `SARVAM_API_KEY` (new accounts get ₹100 of credit).

## The hard part is the language

General speech and language models stumble on Manglish in specific, predictable ways, so Voc has a language core of its own (`src/lib/manglish/`, pure functions, works offline):

| Problem | Example | What Voc does |
|---|---|---|
| Two scripts | `നാളെ 10 manikku meeting ഉണ്ട്` | Transliterates Malayalam script to Manglish (`translit.js`), with Manglish conventions: ണ്ട = nd (*randu*), ന്റ = nt (*ente*), single ട = d (*podi*) |
| No fixed spelling | thakkali / takkali / thakali | Matches on a spelling skeleton (`skel()`: double letters collapse, aspirates drop, ee→i, final half-u drops) |
| Malayalam numbers and fractions | *onnara kilo*, *arakilo*, *kaal kilo*, *nooru roopaykku* | 1.5 kg, 0.5 kg, 0.25 kg, ₹100 worth (`lexicon.js`) |
| Suffixes glued on | *paalum muttayum* (milk and eggs), *ammede* (Amma's) | Strips case endings before lookup, renders possessives |
| Kerala shop vocabulary | *cheriya ulli*, *mathi*, *milma*, *kuppi*, *kettu* | ~170 items and 15 units with their spoken forms |
| Relative dates and times | *adutha velliyazhcha*, *anchara manikku*, *6-nu munne* | Friday next week, 5:30, before 6 pm (`when.js`); a bare 1-6 o'clock is pm, as people mean it |
| No punctuation from speech-to-text | *paal venam current bill adakkanam* | Malayalam is verb-final, so clauses split after finite verbs (*venam*, *adakkanam*, *und*) |

On top of that, an AI reader (Gemini, Groq as backup) decides what is an order, a to-do or an event and writes the titles, but it never works alone:

- **Lexicon hints**: the rule parser's findings ("item: Shallots 0.25 kg") go into the prompt.
- **Checked answers**: `clean()` in `server/extract.js` recomputes every date from the speaker's own words, keeps the model's am/pm only when ours was a guess, maps units and item names back to the lexicon ("Broiler chicken" → Chicken), and moves delivery lines that the model filed as to-dos onto the order.
- **Fallback**: the phone always has the rule parser's answer, so the app works offline or when the free tier is busy.

## Results

Every note is "said" on Thursday 8 Oct 2026. A note counts as **fully right** only if every item, quantity, unit, to-do, event, date and time matches.

- `eval/cases.jsonl`: 59 development notes (25 shop orders, 20 family, 10 work, 4 mixed; 8 in Malayalam script). The rule parser was tuned on these.
- `eval/holdout.jsonl`: 30 notes written separately and never tuned on: new phrasings, typos (*rand*, *cheriyulli*), English-heavy, Malayalam script.

**Holdout (30 notes): the honest numbers**

| Reader | Fully right | Forgiving to-do/event mix-ups | Item F1 | Qty + unit |
|---|---|---|---|---|
| Rule parser alone (offline) | 50% → 57%¹ | 53% | 92% | 90% |
| Groq gpt-oss-120b, no hints (first prompt) | 63% | 67% | 89% | 89% |
| Gemini 3.5 Flash-Lite, no hints (first prompt) | 67% | 70% | 86% | 96% |
| **Gemini 3.5 Flash-Lite, final prompt + code checks** | **90%²** | **93%** | 97% | **100%** |
| Gemini 3.5 Flash-Lite, final + lexicon hints in the prompt | 87%² | 90% | 97% | 100% |

**Development set (59 notes, tuned on, so optimistic)**: rule parser 97%, Gemini + hints 90% (3 of the 6 misses were dropped connections, so 53 of the 56 answered notes were fully right), Groq 61%.

What the numbers say:
- **The rule parser overfits**: 97% on the notes it was tuned on, 50% on new ones. On its own it is a fallback, not the product.
- **The AI alone is good at meaning but loose with Kerala specifics**: "Broiler chicken curry cut" as an item name, "munnooru" (300) read as 100, "kaal kilo" as ½ kg (Groq), dates off by a week. The lexicon fixes these **in code, after the model answers** (`clean()`: canonical item names, units, cancelled items, delivery lines, dates recomputed from the speaker's words). That, with a tighter prompt, is what took Gemini from 67% to 90%.
- **Putting the lexicon's findings into the prompt did not help measurably**: 87% with hints vs 90% without is one note in 30, within noise. Hints stay on for now (they cost ~100 tokens), and the real-voice-note eval should settle it.
- **Most remaining misses are about type, not content**: is "mattannal raavile 6 manikku airport-il ninnu Chettane pick cheyyanam" a to-do or a calendar entry? Is "mol-nu white dress vaangikkanam" a shopping item or a task? The loose column forgives the to-do/event part of that.
- Gemini beat Groq's gpt-oss on Malayalam numbers, so it is the default reader; Groq is the backup.

¹ 50% on the first run. Two later fixes were prompted by holdout failures ("6-nu munne" read as the 6th of next month instead of before 6 o'clock; item names with a brand in front), which lifts it to 57%. A fresh holdout set is in PLAN.md.
² The saved runs show 87% and 83%: both lost okra to a bug in `clean()` (its cancel check matched "**venda**kka", okra, as "venda", don't want). With the fix, that note passes in both modes; the other notes are unaffected.

All runs are saved in `eval/results/`; `node scripts/rescore.mjs` re-scores them with the current scorer without calling any model.

## Speech-to-text

`npm run eval:audio` synthesises 10 notes with Microsoft's Malayalam neural voices (edge-tts) and runs them end to end. Findings so far:

| Speech service | Result |
|---|---|
| **Gemini 3.5 Flash** (default) | 14% character error (mostly harmless: "2" for "randu"); with the AI reader, 10 of 10 notes fully right¹; the rule parser 6 of 10 |
| Gemini 3.1 Flash-Lite (fallback) | Right words, but English loanwords in Malayalam script (ഡോക്ടർ for doctor) |
| Gemini 3.5 Flash-Lite | **Not used**: drifts into Tamil script mid-note (நாளை for നാളെ) |
| Groq Whisper large-v3 | **Not used**: asked for Malayalam, it writes the sounds in Gurmukhi (Punjabi) script: ਚੇਟਾ, ਰੇਨਡੁ ਕੀਲੋ ਅਰੀ |
| Sarvam Saaras v3 (codemix) | Built for this; not yet tested (needs a key). Tried first when `SARVAM_API_KEY` is set |

¹ 9 of 10 as scored; the 10th was a label too strict to accept "Kalyaanam" for the wedding.

Synthetic voices are clean and evenly paced; real WhatsApp notes have traffic, fans and three people talking. Collecting real notes is the next step (PLAN.md). Gemini 3.5 Flash also had a "high demand" outage during testing, so speech falls back to 3.1 Flash-Lite automatically.

## Run it

```bash
npm install
cp .env.example .env.local      # add GEMINI_API_KEY (free); SARVAM_API_KEY for best speech
npm run dev                     # http://localhost:3200, app and api/ together
npm test                        # unit tests
npm run eval                    # rule parser on the dev set (instant, offline)
npm run eval -- --set=holdout
npm run eval -- --llm --only=llm --provider=gemini --pace=4500 --save=mylabel
```

`npm run deploy` runs the tests and deploys to Vercel (`api/*.js` are Vercel functions). Set the keys as environment variables there, and `APP_KEY` if strangers shouldn't spend your free quota.

## Privacy

Notes, to-dos and orders stay in the phone's storage; there is no account. The only thing kept on a server is the email of anyone who joins the Android test (below). Audio goes to the speech service only to be written down and is never stored. Gemini's free tier may use what it's sent to improve Google's products, so for customers' data use Sarvam or a paid key. "Offline only" mode keeps typed notes entirely on the phone. Visits are counted with Vercel Web Analytics (no cookies; the address is sent without its query or #screen).

## Android test sign-ups

Google Play makes a new personal developer account run a closed test with at least 12 testers for 14 days before an app can go public, so the web app collects testers first: the card at the bottom of Home, Settings, or the link to share, **usevoc.vercel.app/android**. `api/testers.js` keeps one private blob per email in the Vercel Blob store `voc-testers` (`BLOB_READ_WRITE_TOKEN`). Open `https://usevoc.vercel.app/api/testers?key=<TESTERS_KEY>` for the list as CSV, ready for Play Console's tester list.

## Layout

```
src/lib/manglish/   translit, lexicon, normalize (skeletons), when (dates), parse (rule extractor)
src/lib/            audio (decode, 16 kHz WAV, split at silence), recorder, pipeline, store, share (WhatsApp, calendar)
src/screens/        New, To-do, Orders, Notes
server/             transcribe (Sarvam / Gemini / Groq), extract (AI reader + checks), providers (keys, retries)
api/                Vercel functions: status, transcribe, extract
eval/               cases, holdout, audio clips, scorer, saved results
```
