# CLAUDE.md — Hunter Group Site

Context for Claude Code. Read this and `hunter-merged-site-build-spec.md` before making changes.

## What this project is

Bilingual (Turkish-first) website for Hunter Group — a RE/MAX Hallmark real estate brokerage **and** Real Mortgage Associates mortgage brokerage. Built with **Next.js (App Router) + TypeScript**. Deps: `next`, `react`, `resend`, `zod`.

## What we're building

Folding the old Kredibaba mortgage site into this one as a new **Mortgage** tab — the new hero of the site. Full plan, route tree, port matrix, and phased order are in `hunter-merged-site-build-spec.md`. **Work Phase 1 first; don't jump ahead.**

## Existing structure (reuse, don't recreate)

- `app/page.tsx` — single-page homepage composed of section components
- `components/` — `Nav`, `Footer`, `HomeHero`, `ServicesSection`, `CapitalTeaser`, `ContactSection`, etc.
- `/hunter-advisory` — canonical Hunter & Hunter Investment Advisors public and portal path; the `app/hunter-north-capital/` directory remains the internal implementation path for migration compatibility
- `app/rehber/alici`, `app/rehber/satici` — guide lead-capture funnels (+ `/tesekkur`)
- `app/api/lead-capture/route.ts` — Resend email handler. **Reuse this for Mortgage leads.**
- i18n: copy is keyed via a `t.*` translation object (see `Nav.tsx`). Match this pattern; do not hardcode Turkish strings in components.

## Guardrails — do not violate

1. **Do not import or port the Kredibaba logged-in app** (Dashboard, Documents, Properties, Realtors, Referrals, Toolkit, Supabase auth). It is parked. Marketing/content pages only.
2. **Keep the two regulated identities separate.** RE/MAX Hallmark (real estate) and Real Mortgage Associates (mortgage) never share a disclosure block or brokerage label. Mortgage pages carry Real Mortgage Associates + Jack Hunter FSRA identity; real-estate pages carry RE/MAX.
3. **Do not publish mortgage rates.** The product may explain that final pricing depends on the borrower, property, and lender, but it must not render current, sample, historical, or illustrative rate numbers.
4. **Turkish-first.** All new UI copy is Turkish first, English second, through the i18n layer.
5. **Reuse existing components and styling tokens.** Match the current design system; don't introduce a new color palette.
6. **Keep Hunter & Hunter Investment Advisors’ role precise.** Public copy may describe Canadian private-real-estate and alternative-investment research, education, interest records, and licensed-process coordination. Do not imply that Hunter & Hunter Investment Advisors itself provides portfolio management, securities execution, suitability approval, or regulated investment advice.

## Local preview

```bash
npm install        # first time only
npm run dev        # http://localhost:3000
```

After building, tell me what to open (e.g. http://localhost:3000/mortgage) so I can check it.
