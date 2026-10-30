# Hunter Group Web

Production Next.js platform for Jack & Tara Hunter at `huntergroupremax.com` (formerly `jackhunter.com`, now 301-redirected).

This repository is one deployable app at the repo root: the real estate, mortgage and guide experiences.

The funds portal (Equity Market, formerly Hunter & Hunter Investment Advisors) is a separate business and lives in its own repo, [`jackhunterking/equity-market`](https://github.com/jackhunterking/equity-market), deployed to `equitymarket.io`. This site only links out to it.

## Stack

- Next.js 15 App Router, React 19, TypeScript
- CSS Modules plus the existing design tokens in `app/globals.css`
- Vercel hosting

## Core Routes

- `/` - homepage
- `/rehber/alici` and `/rehber/satici` - buyer/seller guide funnels
- `/mortgage` - mortgage landing
- `/mortgage/oranlar` - permanent redirect to `/mortgage` (legacy route)
- `/mortgage/araclar` - redirects to `/mortgage`
- `/rehber/ogren` - redirects to `/mortgage` (the Learn page was removed)
- `/hunter-advisory`, `/investing`, `/hunter-group-capital`, `/hunter-x-capital` - 301 to the funds portal (`NEXT_PUBLIC_PORTAL_URL`), keeping the locale and sub-path
- `/gizlilik`, `/kullanim-kosullari`, `/reklam-aciklamasi` - legal pages

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env.local` and fill in the production/service values.

Required integrations are documented in `.env.example`. The site has no
database, email or server routes of its own: every page is prerendered, and
the buyer and seller guides are static PDFs in `public/guides/`.

## Notes

- Mortgage services are disclosed through Real Mortgage Associates, with Jack Hunter FSRA Licence `M26001258`.
- Real estate brokerage identity remains separate from mortgage identity.
- Historical consolidation notes and archived content-ops materials live under `docs/archive/`.

## Private property workspace

The Client Login button links to `https://app.huntergroupremax.com`, the intended custom domain for the separately deployed Hunter Property Workspace (the Hunter Capital deal canvas). See [structure and launch steps](docs/PROPERTY_WORKSPACE.md). This is separate from Equity Market.
