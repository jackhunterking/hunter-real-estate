# Hunter Group Web

Production Next.js platform for Jack & Tara Hunter at `jackhunter.com`.

This repository is now one deployable app at the repo root. It contains the real estate, mortgage, guide, and Hunter & Hunter Investment Advisory experiences together.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- CSS Modules plus the existing design tokens in `app/globals.css`
- Supabase Postgres, Auth, Storage, RLS, and an internal lead workflow
- Resend-only transactional email delivery with durable retry jobs
- Vercel hosting

## Core Routes

- `/` - homepage
- `/rehber/alici` and `/rehber/satici` - buyer/seller guide funnels
- `/rehber/ogren` - education hub
- `/mortgage` - mortgage landing
- `/mortgage/oranlar` - permanent redirect to `/mortgage` (legacy route)
- `/mortgage/araclar` - redirects to `/mortgage`
- `/investing` - bridge from the Jack Hunter site to Hunter & Hunter Investment Advisory
- `/hunter-advisory` - canonical Hunter & Hunter Investment Advisory public and portal experience
- `/hunter-north-capital`, `/hunter-group-capital`, and `/hunter-x-capital` - legacy aliases or redirects
- `/gizlilik`, `/kullanim-kosullari`, `/reklam-aciklamasi` - legal pages

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in the production/service values.

Required integrations are documented in `.env.example`. Browser requests use
the Supabase publishable key; public form ingestion, email jobs, and webhook
processing use the server-only `SUPABASE_WEB_SECRET_KEY`.

The database exposes only the `api` schema. Domain tables live in `app`, while
email jobs, webhook events, and operational audit records live in `private`.
Resend Contacts, Audiences, Broadcasts, and marketing campaigns are not used.

## Guide PDFs

The guide email and thank-you pages expect:

- `public/guides/ev-alma-rehberi.pdf`
- `public/guides/ev-satma-rehberi.pdf`

The current local copies remain available during development. Production guide
assets are registered in `app.guide_assets` and served from the
`guides-public` Supabase Storage bucket only while their publication version is
active.

## Notes

- Mortgage services are disclosed through Real Mortgage Associates, with Jack Hunter FSRA Licence `M26001258`.
- Real estate brokerage identity remains separate from mortgage identity.
- Hunter & Hunter Investment Advisory is positioned around Canadian private-real-estate research, education, interest records, and licensed-process coordination; it does not present itself as a portfolio manager or executing dealer.
- Historical consolidation notes and archived content-ops materials live under `docs/archive/`.
