# Type C Music

Website for **Type C Music** — custom UV-printed USB-C music cards from independent and established artists. Launch artist: Hoodlum Asylum.

Live preview (GitHub Pages):

**https://hoodlumasylum.github.io/typec-music/**

The planned custom domain is `typec-music.com` (not bought yet). This preview is the same site; the domain can be pointed here later.

## What’s on the site

- Hero, how it works, shop, artist interest, FAQ and contact
- Shop shows only Hoodlum Asylum sticks (Artist Collection, Street Credibility, CODEAQUE × NOVA — NO COMPETITION)
- Product photos are original mockups of a card-shaped USB-C stick
- Prices are shown as **from £__** — placeholders, not real prices
- Ordering is **Coming soon / Pre-register** only

## Forms (no API keys)

Forms use [FormSubmit](https://formsubmit.co) and go to the address in `config.js` (currently the public GitHub email `hoodlumasylumuk@gmail.com`).

Limits to be aware of:

- The **first** submission sends a confirmation email to that inbox. Click the link once, then further messages arrive as normal.
- The email address is visible in `config.js` (and in the page). That’s how FormSubmit works — there is no private API key.
- FormSubmit is a free third-party service and can rate-limit or delay mail.
- If the web send fails, the site opens a `mailto:` draft in the visitor’s email app as a fallback.

To use a domain inbox later (for example `hello@typec-music.com`), change `contactEmail` in `config.js` and click the new confirmation email the first time a form is sent.

## Point typec-music.com here (Porkbun)

Once the domain is bought, three steps:

1. In this GitHub repo open **Settings → Pages → Custom domain** and enter `typec-music.com`. GitHub will list the DNS records to add (A records for the root, a CNAME for `www`, and a verification TXT if it asks for one).
2. In **Porkbun → Domain → DNS**, add those records exactly. Typical values are:
   - `A` records for `@` (the root) to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`
   - `CNAME` for `www` to `hoodlumasylum.github.io`
3. Wait until GitHub shows the domain as verified (sometimes a few minutes, sometimes up to 24 hours), then turn on **Enforce HTTPS**.

After that, update the Open Graph image URLs in `index.html` from `hoodlumasylum.github.io/typec-music/...` to `https://typec-music.com/assets/og.jpg` so link previews stay correct.

Do not add a `CNAME` file to this repo until the domain is actually purchased.

## Local preview

This is a static site. Open `index.html` in a browser, or from this folder run:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.
