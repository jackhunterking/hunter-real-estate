-- Let service-key scripts read api.published_offerings.
--
-- 20260716160900 granted this view to `anon` only, while its sibling
-- api.published_guide_assets was granted to `anon, service_role`. The omission
-- means any service-key script that reads published offerings — scripts/seed-content.ts
-- counting what it just published, for one — fails with
-- 42501 "permission denied for view published_offerings".
--
-- The view alone is not enough: it is security_invoker, so the caller also needs
-- SELECT on the tables behind it. service_role does NOT have that. Both
-- 20260716160100 and 20260716160250 ran `grant all on all tables in schema app
-- to service_role`, but that only covers tables existing at the time, and no
-- `alter default privileges` was set for service_role in schema app — so every
-- app table created after 20260716160250 (app.offerings among them) is invisible
-- to service_role. Without these two grants the view read just fails one layer
-- deeper with "permission denied for table offerings".
--
-- Additive only: this grants, and never revokes. The 20260716160800 blanket
-- revoke that broke the portal (see 20260722210000) is the reason this file
-- touches nothing but the missing grants. Re-running `grant` is a no-op, so the
-- migration is idempotent.
--
-- Scoped deliberately to SELECT on the two tables this view reads, rather than
-- re-running the blanket `grant all on all tables in schema app`. The blanket
-- form would hand service_role INSERT/UPDATE/DELETE over 39 tables added since
-- 20260716160250, including the client / contact / lead PII tables. That is a
-- wider decision than this fix, and is left alone here.
grant select on api.published_offerings to service_role;
grant select on app.offerings to service_role;
grant select on app.offering_content_versions to service_role;

-- Reload PostgREST schema cache so the grants are picked up.
notify pgrst, 'reload schema';
