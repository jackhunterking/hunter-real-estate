# Hunter Group Web

Production Next.js platform for Jack & Tara Hunter at `jackhunter.com`.

This repository is now one deployable app at the repo root. It contains the real estate, mortgage, guide, and Hunter Group Capital experiences together.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- CSS Modules plus the existing design tokens in `app/globals.css`
- HubSpot lead capture in `lib/hubspot.ts`
- Resend email delivery in `lib/email.ts`
- Vercel hosting

## Core Routes

- `/` - homepage
- `/rehber/alici` and `/rehber/satici` - buyer/seller guide funnels
- `/rehber/ogren` - education hub
- `/mortgage` - mortgage landing
- `/mortgage/oranlar` - manual mortgage rates
- `/mortgage/araclar` - redirects to `/mortgage`
- `/hunter-group-capital` - canonical Capital experience
- `/hunter-x-capital` - legacy redirect to `/hunter-group-capital`
- `/gizlilik`, `/kullanim-kosullari`, `/reklam-aciklamasi` - legal pages

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in the production/service values.

Required integrations:

- `HUBSPOT_ACCESS_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_REPLY_TO`
- `NEXT_PUBLIC_SITE_URL`
- PostHog values if analytics/session replay should be enabled

## Guide PDFs

The guide email and thank-you pages expect:

- `public/guides/ev-alma-rehberi.pdf`
- `public/guides/ev-satma-rehberi.pdf`

Both are present from the approved HUNTER guide Pages PDFs.

## Notes

- Mortgage services are disclosed through Real Mortgage Associates, with Jack Hunter FSRA Licence `M26001258`.
- Real estate brokerage identity remains separate from mortgage identity.
- Historical consolidation notes and archived content-ops materials live under `docs/archive/`.
