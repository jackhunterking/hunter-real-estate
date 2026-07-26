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
