-- Assets phase: serve offering images (and public fact sheets) from Supabase
-- Storage instead of Next.js /public.
--
-- The `offering-public` bucket becomes truly public so `getPublicUrl` returns
-- stable CDN URLs that plain <img> / next/image can load directly, without a
-- per-object read policy. Writes stay admin-locked: the existing
-- `private_offering_hunter_only` storage policy governs insert/update/delete on
-- this bucket regardless of the public flag. Investor-only documents live in the
-- still-private `offering-private` bucket and are served via short-lived signed
-- URLs from a role-checked route.
--
-- `href` is added to app.offering_documents as a transitional/authoring column:
-- it lets a document row carry an explicit URL (e.g. a legacy /public path or an
-- external link) so the admin panel and the compose fallback can round-trip it.
-- Idempotent.

update storage.buckets set public = true where id = 'offering-public';

alter table app.offering_documents
  add column if not exists href text;

notify pgrst, 'reload schema';
