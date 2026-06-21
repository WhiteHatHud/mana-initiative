# The Ma'na Initiative — Setup Guide

## Before you go live, do these 5 things

### 1. Supabase (database + storage + auth)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**, paste the contents of `supabase-schema.sql`, and run it
3. Go to **Storage**, create two **public** buckets: `book-covers` and `engagements`
4. Go to **Authentication → Users → Invite user** — add your committee admin email(s)
5. Copy your **Project URL** and **anon key** from **Project Settings → API**

### 2. Fill in your config

Open `js/config.js` and replace:
```js
SUPABASE_URL:      'https://YOUR_PROJECT_REF.supabase.co',
SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
CONTACT_EMAIL: 'hello@mana-initiative.sg',  ← your real email
INSTAGRAM:    '@manainitiative',             ← your real handle
```

Also update the footer email in `js/layout.js` (search for `hello@mana-initiative.sg`).

### 3. Replace the crest

`assets/crest.svg` is a geometric placeholder.
Replace it with Ma'na's actual crest SVG. Keep the filename or update all references.

### 4. Resend (announcement emails)

1. Create account at [resend.com](https://resend.com)
2. Verify your sending domain (e.g. `mana-initiative.sg`)
3. Get an API key
4. In `api/notify-subscribers.js`, update the `from:` address to your verified domain

### 5. Deploy to Vercel

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# From the project folder
cd C:\Users\hud\Documents\mana-initiative
vercel

# Set environment variables in Vercel dashboard (or via CLI):
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add RESEND_API_KEY

# Production deploy
vercel --prod
```

---

## How the admin works

1. Go to `/admin` on your deployed site
2. Sign in with the email you added in Supabase Authentication
3. Use the tabs to manage content:
   - **Sessions** — create/edit sessions, set upcoming/featured, add recording URL when done
   - **Booklist** — add books, set status (reading/completed/upcoming)
   - **Engagements** — add gallery items (paste image URLs from Supabase Storage)
   - **FAQs** — add Q&As (the static ones in `faqs.html` always show; these add to them)
   - **Registrations / Subscribers** — read-only + CSV export
   - **Notify** — select a session and blast an announcement to all subscribers
   - **Committee** — add members; toggle "Consent given" + "Published" only after getting their consent

## File structure

```
css/
  tokens.css      design tokens (colours, spacing, typography)
  base.css        reset + global styles
  components.css  all component styles (nav, footer, cards, buttons...)
  admin.css       admin-only styles
js/
  config.js       ← edit this with your Supabase keys
  db.js           all Supabase queries
  utils.js        shared helpers (date formatting, card HTML, etc.)
  layout.js       injects nav + footer on every page
  home.js         home page dynamic content
  sessions.js     sessions listing page
  session-detail.js  individual session page + registration form
  booklist.js     booklist page filters
  admin.js        full admin dashboard logic
api/
  notify-subscribers.js  Vercel serverless: blast announcement emails
  send-confirmation.js   Vercel serverless: confirmation email after registration
assets/
  crest.svg       ← replace with real crest
```

## Things to fill in from the PRD

Search for these placeholders across the codebase and update them:
- `hello@mana-initiative.sg` → your real contact email
- `@manainitiative` → your real Instagram handle
- `mana-initiative.sg` → your real domain (in sitemap.xml, robots.txt, and the API function)
- `YOUR_PROJECT_REF` → your Supabase project reference
