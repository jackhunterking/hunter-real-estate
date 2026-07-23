-- Introduce a single 'master_admin' super-role. Holding it satisfies every
-- has_platform_role() check (platform_admin, compliance_admin, finance_admin),
-- so an owner can operate with one role instead of stacking several.
--
-- NOTE: adding an enum value must be committed before it can be referenced by a
-- LANGUAGE sql function, so the superset redefinition lives in the next migration.
alter type app.platform_role add value if not exists 'master_admin';
