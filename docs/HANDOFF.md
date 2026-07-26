# Project handoff

Last updated: July 18, 2026

## Repository state

- Canonical repository: `https://github.com/jackhunterking/hunter-real-estate.git`
- Working branch: `main`
- Equity Market is the public brand for the Canadian private-real-estate and alternatives experience. `/equity-market` is the canonical application path; only the older Capital routes remain as compatibility redirects.
- The legacy deletion manifest remains review-only. Do not delete its candidates until they are explicitly approved.

## Continue from another computer

```bash
git clone https://github.com/jackhunterking/hunter-real-estate.git
cd hunter-real-estate
npm ci
npm run dev
```

Restore `.env.local` from the authorized password manager or hosting configuration. Environment files and credentials are intentionally excluded from Git. Do not copy secrets into this repository or this document.

Before changing production data, read:

- `docs/SUPABASE_PRODUCTION_SETUP.md`
- `docs/HNC_CONTENT_ROLLOUT.md`
- `docs/HNC_LEGACY_DELETION_MANIFEST.md`

## Deployment configuration

Vercel automatically deploys new commits from `main`. The project is on the
Hobby plan, so `vercel.json` keeps the email-retry job within the plan's
once-per-day Cron limit:

```json
"schedule": "0 13 * * *"
```

The schedule runs daily at 13:00 UTC (with Hobby's documented hourly timing
precision). New emails still send immediately from their submission routes;
this job only recovers queued deliveries whose initial Resend attempt failed.
Do not increase this schedule above once per day while the project remains on
Hobby: Vercel rejects the deployment configuration before creating a build.

## Data and launch status

- The new HNC onboarding and investment-interest migration is committed at `supabase/migrations/20260716234037_hnc_onboarding_interest_requests.sql`.
- The migration and live offering import were not applied from the implementation workspace because production credentials were not available in that session. Inspect the hosted migration history before applying anything.
- Public fund content must pass the documented draft, review, approval, and publication workflow.
- The live-chat slot is present but intentionally disabled until a provider is selected.
- The application does not execute securities purchases or payments online; interests continue into human review.

## Last verification

The platform implementation completed these checks before handoff:

- 34 Node tests passed.
- TypeScript typecheck passed.
- Targeted ESLint checks passed.
- Production build passed.
- Desktop and mobile journey checks passed.

For a fresh checkout, run `npm run verify` before deployment after restoring the required environment configuration.

## Equity Market domain cutover

The rename shipped before `equitymarket.io` existed, so the domain switch is a
configuration change, not a deploy. Until it is flipped, the portal keeps
serving on `hunterhunteradvisors.com` (and the `hunternorthcapital.com` alias)
exactly as before — only the brand, the in-app path and the internal naming
changed.

`NEXT_PUBLIC_PORTAL_DOMAIN_CUTOVER` is the switch, read in
`lib/equity-market/portal-domain.ts`. Unset (today):

- all six hosts serve the portal at their root; nothing redirects
- `PORTAL_ORIGIN` — canonical and OG URLs — is `https://www.hunterhunteradvisors.com`
- auth and intake email send from `@noreply.hunterhunteradvisors.com`, the
  domain Resend has verified, under the display name "Equity Market"

### Flip it when, and only when, all of these are true

1. `equitymarket.io` resolves and is attached to the Vercel project, with
   `hunterhunteradvisors.com` still attached so it can serve its 301.
2. Resend shows `equitymarket.io` verified (DKIM + SPF green) and the
   `noreply.equitymarket.io` sending subdomain exists.
3. The Supabase **dashboard** — Auth → URL Configuration — has Site URL
   `https://equitymarket.io` and the new redirect URLs. `supabase/config.toml`
   is local-only for the hosted project.

### The flip, in one change

- Vercel env: `NEXT_PUBLIC_PORTAL_DOMAIN_CUTOVER=true` and
  `NEXT_PUBLIC_PORTAL_SITE_URL=https://equitymarket.io`
- `RESEND_CAPITAL_FROM_EMAIL="Equity Market <advisors@noreply.equitymarket.io>"`
- Supabase dashboard SMTP sender: `auth@noreply.equitymarket.io`
- Redeploy. `hunterhunteradvisors.com/*` then 301s to `equitymarket.io/*`,
  path and query intact, and the portal has a single canonical origin.

### Required before the FIRST deploy, cutover or not

The portal's in-app path moved, so the Supabase dashboard redirect allowlist
needs `https://jackhunter.com/equity-market/auth/confirm` and its `www` form
added, or sign-up confirmation from the real-estate site bounces. Keep the
`/hunter-advisory/auth/confirm` entries until unexpired links have aged out.

### Also renamed, no fallback

`PORTAL_REQUIRE_AUTH` replaces `HNC_REQUIRE_AUTH` and
`NEXT_PUBLIC_PORTAL_SITE_URL` replaces `NEXT_PUBLIC_HNC_SITE_URL`. Both old
names are still read as a fallback; add the new ones in Vercel, then remove the
fallback in `app/[locale]/equity-market/(portal)/layout.tsx` and
`lib/equity-market/portal-domain.ts`.
