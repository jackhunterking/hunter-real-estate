-- Extend localized-content constraints from Turkish/English to the full set of
-- first-class locales (tr, en, fr, es) now that the site routes and indexes all
-- four. The app-layer LocalizedText/Localized types already allow fr/es and fall
-- back to English via tx(), so no data backfill is required — this only widens
-- what the database will accept for newly authored fr/es guide assets, legal
-- snapshots, and contact/client language preferences.

-- Language-keyed versioned content ------------------------------------------

alter table app.guide_assets
  drop constraint if exists guide_assets_language_check;
alter table app.guide_assets
  add constraint guide_assets_language_check
  check (language in ('tr', 'en', 'fr', 'es'));

alter table app.legal_document_versions
  drop constraint if exists legal_document_versions_language_check;
alter table app.legal_document_versions
  add constraint legal_document_versions_language_check
  check (language in ('tr', 'en', 'fr', 'es'));

-- User-facing language preference -------------------------------------------

alter table app.contacts
  drop constraint if exists contacts_preferred_language_check;
alter table app.contacts
  add constraint contacts_preferred_language_check
  check (
    preferred_language is null
    or preferred_language in ('tr', 'en', 'fr', 'es', 'both')
  );

alter table app.clients
  drop constraint if exists clients_preferred_language_check;
alter table app.clients
  add constraint clients_preferred_language_check
  check (
    preferred_language is null
    or preferred_language in ('tr', 'en', 'fr', 'es', 'both')
  );
