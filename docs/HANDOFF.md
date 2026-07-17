# Project handoff

Last updated: July 17, 2026

## Repository state

- Canonical repository: `https://github.com/jackhunterking/hunter-real-estate.git`
- Working branch: `main`
- The Jack Hunter/Jack Vetara professional-site bridge and the Hunter North Capital fund, onboarding, interest-request, and partner-platform refactor are committed to `main`.
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

## Current deployment blocker

Vercel receives new GitHub commits but rejects them before a build starts. The project is on the Hobby plan while `vercel.json` schedules `/api/cron/email-jobs` every five minutes:

```json
"schedule": "*/5 * * * *"
```

Vercel Hobby permits cron jobs only once per day. Resolve this before expecting a new deployment by choosing one of these paths:

1. Change the Vercel cron schedule to a daily expression.
2. Upgrade the Vercel project to Pro and retain the five-minute schedule.
3. Move frequent scheduling to an approved external scheduler, such as a reviewed Supabase Cron implementation.

Do not treat the missing deployment row as a Next.js build failure. GitHub verification passed; Vercel rejected the deployment configuration before build creation.

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
