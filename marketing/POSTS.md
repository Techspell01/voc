# Voc launch kit

Images are in `images/` (made from real app screenshots in `shots/`, laid out in `promo.html`).

| File | Size | Use |
|---|---|---|
| `linkedin-1-hero-1200x1200.png` | 1200×1200 | LinkedIn post image, or the first slide |
| `linkedin-2-email-1080x1350.png` … `linkedin-5-results-1080x1350.png` | 1080×1350 | LinkedIn carousel (post them together, in order; 4:5 fills the feed) |
| `x-1-hero-1600x900.png` | 1600×900 | X main post |
| `x-2-email` / `x-3-sticky-notes` / `x-4-shopping` | 1600×900 | X thread replies |

Claims in the images and posts are the measured ones (README "Results"). Keep it that way:
the Zepto / Instamart one-tap cart only works on a laptop until the stores approve the site, so the
posts say "opens each item in Blinkit, Zepto…", not "fills your cart".

## LinkedIn

> I built Voc: speak in Malayalam, and it writes the English for you.
>
> In Kerala we run our lives on voice notes, half Malayalam, half English. Voc turns them into:
> ✉️ English emails, ready for Gmail. "Nale njan varilla, Ammede doctor appointment und" becomes a polite leave mail that says *my mother's* appointment, with the right dates.
> 🗒️ Sticky notes that write themselves on screen, in handwriting, as clear English.
> 🛒 Shopping lists that understand "arakilo" (½ kg) and "pathu mutta" (10 eggs), and open each item in Blinkit, Zepto or Instamart.
> 📅 To-dos and calendar dates from "adutha velliyazhcha anchara manikku" (next Friday, 5:30 pm).
>
> The part I'm proudest of is the measuring. On 30 test notes it was never tuned on, notes read fully right went from 57% (rules only) and 67% (an AI alone) to 90%, by checking the AI's answer with my own Manglish engine for numbers, units and dates. When one AI service is slow or down, it hands over to the next.
>
> Try it: https://usevoc.vercel.app
> Code: https://github.com/Techspell01/voc
>
> Feedback from Malayalam speakers very welcome: which words does it get wrong?
>
> #Malayalam #Kerala #AI #SpeechToText #BuildInPublic #DataAnalytics

## X (thread)

**1** (with `x-1-hero`)
> Speak Malayalam. Get it written. ✍️
>
> I built Voc: voice notes in Malayalam or Manglish become English emails, sticky notes and shopping lists.
>
> usevoc.vercel.app

**2** (with `x-2-email`)
> Say "nale njan varilla, Ammede doctor appointment und" and get a polite English leave email, with *my mother's* appointment and the real dates. Opens straight in Gmail.

**3** (with `x-3-sticky-notes`)
> Notes write themselves onto a sticky, in handwriting, in English. Open one later and say more; only the new lines get written in.

**4** (with `x-4-shopping`)
> "arakilo" = ½ kg, "pathu mutta" = 10 eggs. Say the list and each item opens in Blinkit, Zepto, Instamart, BigBasket or JioMart.

**5**
> Measured, not guessed: 90% of 30 unseen test notes read fully right, vs 67% for an AI alone. Code's open: github.com/Techspell01/voc

## Regenerating the images

With `npm run dev` running: `node marketing/shots.mjs marketing/shots` seeds sample notes and screenshots the app,
then `node marketing/render.mjs marketing/images` renders every variant of `promo.html`. Both need
`puppeteer-core` (`npm i -D puppeteer-core`) and Chrome at its default Windows path.
