# Supabase and Resend production readiness

Repository configuration is implemented here. Database creation, migrations,
verification queries, advisors, and generated types are managed against the
hosted project through the authenticated Supabase MCP connection. Docker and a
local Supabase stack are not required.

Account ownership, billing, MFA, DNS, recovery ownership, and hosted-project
toggles still require an authorized person to complete them in the Supabase,
Resend, DNS, and hosting dashboards.

## 1. Supabase organization and project

Current MCP-verified state:

- Project: `hunter-platform-prod`
- Project reference: `sltthjfmbsgaufbbdowz`
- Region: Canada Central (`ca-central-1`)
- Status: `ACTIVE_HEALTHY`
- Database: PostgreSQL 17.6
- Organization currently shown by Supabase: `jackhunterking's Org`
- Data API: only `api` is exposed
- GraphQL: `pg_graphql` is available but not installed
- Auth: email signup enabled, email confirmation required, anonymous users
  disabled
- Database: 18 migrations applied; all 39 `app` tables have RLS
- Advisors: zero Security findings and zero Performance warnings/errors
- Platform administration: MFA-gated role-management RPC installed with an
  append-only audit record. The first platform administrator can be assigned
  after that person creates and confirms a Supabase Auth account.

Remaining account-level actions:

- Sign in as the legal owner and enable MFA.
- Rename the existing organization to `Hunter Group` and require MFA for
  members.
- Add a second trusted organization owner and verify that owner can sign in.
- Store recovery codes, database password, and owner recovery information in
  the team password manager.
- Upgrade `hunter-platform-prod` from the current $0 project tier to Pro.
- Enable PITR, scheduled backups, project alerts, SSL enforcement, and
  appropriate API/Auth rate limits.
- Keep `api` as the only Data API schema. The project uses a manual
  `authenticator.pgrst.db_schemas=api` override managed by migration.
- Keep GraphQL unused and do not install `pg_graphql`.

## 2. Resend transactional account

- Verify `updates.jackhunter.com`.
- Publish and validate SPF, DKIM, and DMARC records.
- Create `resend-web-app` for application email and
  `resend-supabase-auth` for Auth SMTP. Do not reuse either key.
- Configure senders:
  - `Hunter Group <hello@updates.jackhunter.com>`
  - `Hunter North Capital <capital@updates.jackhunter.com>`
  - `Hunter Account Security <auth@updates.jackhunter.com>`
- Keep `hello@jackhunter.com` as reply-to.
- Disable open/click tracking for Auth and sensitive operational categories.
- Configure Supabase Auth SMTP with `smtp.resend.com`, port `465`, username
  `resend`, and the dedicated Auth key.
- Register `POST /api/webhooks/resend`, subscribe only to transactional email
  events, and save the signing secret as `RESEND_WEBHOOK_SECRET`.
- Do not create or synchronize Resend Contacts, Audiences, Segments, Topics,
  Broadcasts, or campaigns.

## 3. Hosting and environment

- Add every value in `.env.example` to the correct runtime scope.
- Never expose `SUPABASE_WEB_SECRET_KEY`, Resend keys, webhook secret,
  Turnstile secret, cron secret, access token, or database password to browser
  code.
- Set exact Auth redirect URLs for localhost, `jackhunter.com`, and
  `hunternorthcapital.com`.
- Configure Cloudflare Turnstile and set both site and secret keys.
- Confirm the hosting scheduler sends `Authorization: Bearer $CRON_SECRET` to
  `/api/cron/email-jobs`. Vercel Cron does this automatically when
  `CRON_SECRET` is configured.

## 4. Production database change control

- Review every file under `supabase/migrations/` before it is applied.
- Apply migrations in filename order through the authenticated Supabase MCP
  connection. Do not run a local Docker stack or link a developer workstation
  directly to production.
- Before applying a migration set, inspect the target project, its existing
  migration history, and its current schemas.
- After applying it, run explicit database verification queries and both the
  Security and Performance advisors through MCP.
- Generate and commit `lib/supabase/database.types.ts` from the hosted project
  through MCP after every schema change.
- Keep application CI independent from production credentials. Pull requests
  run Node tests, TypeScript, lint, and a production build.

## 5. First deployment sequence

1. Run `npm ci`.
2. Run `npm run verify`.
3. Through Supabase MCP, confirm the target project ID, name, region, database
   version, and migration history.
4. Through Supabase MCP, apply any new reviewed migration files in filename
   order.
5. Run the database verification queries, Security Advisor, and Performance
   Advisor through MCP. Resolve warning/error findings before launch.
6. Refresh and commit `lib/supabase/database.types.ts` from hosted API metadata.
7. Import approved guide and offering assets into the matching Storage buckets
   and register their metadata as published versions.
8. Deploy the web application.
9. Test signup confirmation, password recovery, every public submission,
   immediate email delivery, queued retry, valid/invalid webhook signatures,
   duplicate/out-of-order events, and bounce/complaint suppression.
10. Confirm `/mortgage/oranlar` returns a permanent redirect and that no
    numeric mortgage pricing is shipped or rendered.
