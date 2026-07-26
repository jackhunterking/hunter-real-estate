# Equity Market — content is Supabase-sourced

Supabase is the single source of truth for portal content. The application reads
offerings, taxonomies, and learning content **only** from Supabase — there is no
fixture fallback and no hardcoded tenant/demo content in the app.

## Offering content model (admin-panel-ready)

Offerings use a normalized working model with an audited draft→publish workflow,
mirroring the learning module:

- Editable working rows: `app.fund_managers` (with `content`), `app.properties`
  (+ `app.offering_properties`), and `app.offerings.draft_content` (offering-level
  content). A future admin panel edits these directly.
- `api.publish_offering(offering_id, actor)` **composes** the immutable
  `content_snapshot` from those rows (manager + properties overlaid on
  `draft_content`), inserts a new `app.offering_content_versions` row, walks it
  `draft → in_review → approved → published` (enforced by
  `private.enforce_offering_version_progression`), supersedes the prior version,
  and points `app.offerings.current_version_id` at it. Emits an `audit_events`
  row. Role-gated to `private.is_hunter_admin()` or the service role.
- `api.seed_offering(bundle jsonb, actor)` imports one offering bundle end-to-end
  (upsert rows → `publish_offering`). It is the reusable import path the seed
  script uses and the admin panel can reuse.
- The live read path is unchanged: `api.published_offerings.content_snapshot`,
  validated by `parseOfferingBundle` in `lib/equity-market/repository-server.ts`.

Writes to all content tables are gated to Hunter admins (`is_hunter_admin`), and
the new `app.taxonomies` table follows the same rule.

## Migrations

- `20260723000000_offering_authoring.sql` — `draft_content`, `fund_managers.content`,
  `app.compose_offering_snapshot`, `api.publish_offering`.
- `20260723000100_taxonomies.sql` — `app.taxonomies` + `api.taxonomies` (+ 9 rows).
- `20260723000200_seed_offering_rpc.sql` — `api.seed_offering`.

## Seeding

Reference taxonomies are seeded by their migration. Offering content lives as
committed JSON under `supabase/seed/offerings/*.json` and is imported by:

```bash
node --env-file=.env.local scripts/seed-content.ts
```

The script (service role) calls `api.seed_offering` per bundle. Idempotent.
Lankin Apartment REIT and Legacy Investment are published this way.

## Learning content

The learning guide previously hardcoded in `lib/equity-market/learning.ts` has been
removed; `lib/equity-market/learning-repository-server.ts` reads the Supabase learning
tables only (no fixture fallback). The learning schema and content are live on
the remote database (published guides in `api.published_learning_resources`), so
the Learning centre renders real DB content. The old flagship guide is archived
as seed data at `supabase/seed/learning/core-strategies-guide.json` (not used at
runtime). Do not reintroduce a code-level fixture fallback.
