# Hunter Group Web

Production Next.js platform for Jack & Tara Hunter at `huntergroupremax.com` (formerly `jackhunter.com`, now 301-redirected).

This repository is one deployable app at the repo root: the real estate, mortgage and guide experiences.

The funds portal (Equity Market, formerly Hunter & Hunter Investment Advisors) is a separate business and lives in its own repo, [`jackhunterking/equity-market`](https://github.com/jackhunterking/equity-market), deployed to `equitymarket.io`. This site only links out to it.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- CSS Modules plus the existing design tokens in `app/globals.css`
- Supabase Postgres, Auth, Storage, RLS, and an internal lead workflow
- Resend-only transactional email delivery with durable retry jobs
- Vercel hosting

## Core Routes

- `/` - homepage
- `/rehber/alici` and `/rehber/satici` - buyer/seller guide funnels
- `/mortgage` - mortgage landing
- `/mortgage/oranlar` - permanent redirect to `/mortgage` (legacy route)
- `/mortgage/araclar` - redirects to `/mortgage`
- `/rehber/ogren` - redirects to `/mortgage` (the Learn page was removed)
- `/hunter-advisory`, `/investing`, `/hunter-group-capital`, `/hunter-x-capital` - 301 to the funds portal (`NEXT_PUBLIC_PORTAL_URL`), keeping the locale and sub-path
- `hunterhunteradvisors.com` (any path) - 301 to the funds portal; the domain is still attached to this Vercel project
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

The Supabase project ("Hunter Platform") is shared with the funds portal, whose
repo owns the schema and migrations. The database exposes only the `api` schema. Domain tables live in `app`, while
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
- The email job queue is shared with the funds portal. This app sends only guide emails and requeues any other job for the portal's worker.
- Historical consolidation notes and archived content-ops materials live under `docs/archive/`.

## Private property workspace

The Client Login button links to `https://app.huntergroupremax.com`, the intended custom domain for the separately deployed Hunter Property Workspace (the Hunter Capital deal canvas). See [structure and launch steps](docs/PROPERTY_WORKSPACE.md). This is separate from Equity Market.
