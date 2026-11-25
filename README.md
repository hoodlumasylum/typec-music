# Type C Custom

Website for **Type C Custom** — we design your artwork and print it on a USB stick or card. Music uploads, music videos, albums and mixtapes, artist artwork and other content. Launch artist: Hoodlum Asylum.

Live preview (GitHub Pages):

**https://hoodlumasylum.github.io/typec-music/**

A custom domain is planned (`typec-music.com`, or another Type C Custom name if that fits better). It is not connected yet. This preview is the same site; a domain can be pointed here later.

## What’s on the site

- Code’s Type C Custom banner at the top (artwork unchanged; only compressed for the web)
- Five content types, plus the design-and-print service for a USB stick or card
- Shop shows only Hoodlum Asylum releases (Artist Collection, Street Credibility, CODEAQUE × NOVA — NO COMPETITION)
- Prices are shown as **from £__** — placeholders, not real prices
- Ordering is **Coming soon / Pre-register** only
- **Design with Nova** is a browser-only layout helper: upload a photo, add a name, pick palette colours and a neon frame, preview it on a stick and a card, download a PNG, and send it with an enquiry

## Design with Nova — limits

- No AI image generation and no paid APIs or keys
- Nova only places the photo and text you provide onto stick and card mockups
- She appears only in this design helper, not as a shop artist or a general chat on the site
- The downloaded PNG is a layout preview, not a photograph of a finished printed product
- If the web form cannot attach the file, download the PNG and attach it in your email app

## Forms (no API keys)

Forms use [FormSubmit](https://formsubmit.co) and go to the address in `config.js` (currently the public GitHub email `hoodlumasylumuk@gmail.com`).

Limits:

- The **first** submission sends a confirmation email to that inbox. Click the link once, then further messages arrive as normal.
- The email address is visible in `config.js` (and in the page).
- FormSubmit is a free third-party service and can rate-limit or delay mail.
- If the web send fails, the site opens a `mailto:` draft as a fallback.

To use a domain inbox later, change `contactEmail` in `config.js` and click the new confirmation email the first time a form is sent.

## Point a domain here later (Porkbun)

Once a domain is bought (typec-music.com or a Type C Custom name), three steps:

1. In this GitHub repo open **Settings → Pages → Custom domain** and enter the domain. GitHub will list the DNS records to add (A records for the root, a CNAME for `www`, and a verification TXT if it asks for one).
2. In **Porkbun → Domain → DNS**, add those records exactly. Typical values are:
   - `A` records for `@` (the root) to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`
   - `CNAME` for `www` to `hoodlumasylum.github.io`
3. Wait until GitHub shows the domain as verified (sometimes a few minutes, sometimes up to 24 hours), then turn on **Enforce HTTPS**.

After that, update the Open Graph image URLs in `index.html` so link previews stay correct.

Do not add a `CNAME` file to this repo until the domain is actually purchased.

## Local preview

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.
