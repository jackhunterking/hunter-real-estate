create type app.publication_status as enum ('draft', 'in_review', 'approved', 'published', 'superseded', 'withdrawn');

create table app.fund_managers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  legal_name text not null,
  display_name jsonb not null,
  website text,
  headquarters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.offerings (
  id uuid primary key default gen_random_uuid(),
  manager_id uuid not null references app.fund_managers(id) on delete restrict,
  slug text not null unique,
  status app.publication_status not null default 'draft',
  current_version_id uuid,
  withdrawal_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.offering_content_versions (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  version text not null,
  status app.publication_status not null default 'draft',
  content_snapshot jsonb not null,
  author_id uuid references auth.users(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete restrict,
  compliance_owner_id uuid references auth.users(id) on delete restrict,
  effective_at timestamptz,
  published_at timestamptz,
  withdrawal_at timestamptz,
  created_at timestamptz not null default now(),
  unique (offering_id, version)
);

alter table app.offerings
  add constraint offerings_current_version_fk
  foreign key (current_version_id) references app.offering_content_versions(id) on delete set null;

create table app.share_classes (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  code text not null,
  content jsonb not null default '{}'::jsonb,
  status app.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  unique (offering_id, code)
);

create table app.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null,
  address jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  status app.publication_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.offering_properties (
  offering_id uuid not null references app.offerings(id) on delete cascade,
  property_id uuid not null references app.properties(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (offering_id, property_id)
);

create table app.source_references (
  id uuid primary key default gen_random_uuid(),
  offering_version_id uuid not null references app.offering_content_versions(id) on delete cascade,
  title text not null,
  url text,
  publisher text,
  published_on date,
  accessed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table app.offering_metrics (
  id uuid primary key default gen_random_uuid(),
  offering_version_id uuid not null references app.offering_content_versions(id) on delete cascade,
  metric_key text not null,
  metric_value jsonb not null,
  source_reference_id uuid references app.source_references(id) on delete set null,
  unique (offering_version_id, metric_key)
);

create table app.offering_documents (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  offering_version_id uuid references app.offering_content_versions(id) on delete set null,
  title jsonb not null,
  document_type text not null,
  bucket_id text not null check (bucket_id in ('offering-public', 'offering-private')),
  storage_path text not null unique,
  status app.publication_status not null default 'draft',
  effective_at timestamptz,
  withdrawal_at timestamptz,
  created_at timestamptz not null default now()
);

create table app.guide_assets (
  id uuid primary key default gen_random_uuid(),
  guide_key text not null,
  language text not null check (language in ('tr', 'en')),
  version text not null,
  bucket_id text not null default 'guides-public' check (bucket_id = 'guides-public'),
  storage_path text not null unique,
  status app.publication_status not null default 'draft',
  effective_at timestamptz,
  withdrawal_at timestamptz,
  created_at timestamptz not null default now(),
  unique (guide_key, language, version)
);

create table app.legal_document_versions (
  id uuid primary key default gen_random_uuid(),
  document_key text not null,
  language text not null check (language in ('tr', 'en')),
  version text not null,
  content_snapshot jsonb not null,
  status app.publication_status not null default 'draft',
  effective_at timestamptz,
  published_at timestamptz,
  withdrawal_at timestamptz,
  author_id uuid references auth.users(id),
  reviewer_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (document_key, language, version)
);

create index offering_versions_public_idx on app.offering_content_versions(offering_id, effective_at desc)
where status = 'published' and withdrawal_at is null;
create index source_references_version_idx on app.source_references(offering_version_id);
create index offering_documents_public_idx on app.offering_documents(offering_id, effective_at desc)
where status = 'published' and withdrawal_at is null;

alter table app.fund_managers enable row level security;
alter table app.offerings enable row level security;
alter table app.offering_content_versions enable row level security;
alter table app.share_classes enable row level security;
alter table app.properties enable row level security;
alter table app.offering_properties enable row level security;
alter table app.source_references enable row level security;
alter table app.offering_metrics enable row level security;
alter table app.offering_documents enable row level security;
alter table app.guide_assets enable row level security;
alter table app.legal_document_versions enable row level security;

create policy published_offerings_read on app.offerings for select to anon, authenticated
using (status = 'published' and (withdrawal_at is null or withdrawal_at > now()));
create policy offering_admin_all on app.offerings for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_versions_read on app.offering_content_versions for select to anon, authenticated
using (status = 'published' and effective_at <= now() and (withdrawal_at is null or withdrawal_at > now()));
create policy offering_versions_admin_all on app.offering_content_versions for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_managers_read on app.fund_managers for select to anon, authenticated
using (exists (
  select 1 from app.offerings offering
  where offering.manager_id = fund_managers.id
    and offering.status = 'published'
    and (offering.withdrawal_at is null or offering.withdrawal_at > now())
));
create policy managers_admin_all on app.fund_managers for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_share_classes_read on app.share_classes for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from app.offerings offering
    where offering.id = share_classes.offering_id
      and offering.status = 'published'
      and (offering.withdrawal_at is null or offering.withdrawal_at > now())
  )
);
create policy share_classes_admin_all on app.share_classes for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_properties_read on app.properties for select to anon, authenticated
using (status = 'published');
create policy properties_admin_all on app.properties for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_offering_properties_read on app.offering_properties for select to anon, authenticated
using (exists (
  select 1 from app.offerings offering
  where offering.id = offering_properties.offering_id and offering.status = 'published'
));
create policy offering_properties_admin_all on app.offering_properties for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_sources_read on app.source_references for select to anon, authenticated
using (exists (
  select 1 from app.offering_content_versions version
  where version.id = source_references.offering_version_id
    and version.status = 'published'
    and version.effective_at <= now()
    and (version.withdrawal_at is null or version.withdrawal_at > now())
));
create policy sources_admin_all on app.source_references for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_metrics_read on app.offering_metrics for select to anon, authenticated
using (exists (
  select 1 from app.offering_content_versions version
  where version.id = offering_metrics.offering_version_id
    and version.status = 'published'
    and version.effective_at <= now()
    and (version.withdrawal_at is null or version.withdrawal_at > now())
));
create policy metrics_admin_all on app.offering_metrics for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_offering_documents_read on app.offering_documents for select to anon, authenticated
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy offering_documents_admin_all on app.offering_documents for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_guides_read on app.guide_assets for select to anon, authenticated
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy guides_admin_all on app.guide_assets for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
create policy published_legal_read on app.legal_document_versions for select to anon, authenticated
using (
  status = 'published'
  and effective_at <= now()
  and (withdrawal_at is null or withdrawal_at > now())
);
create policy legal_admin_all on app.legal_document_versions for all to authenticated
using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));

grant select on app.fund_managers, app.offerings, app.offering_content_versions, app.share_classes,
  app.properties, app.offering_properties, app.source_references, app.offering_metrics,
  app.offering_documents, app.guide_assets, app.legal_document_versions to anon, authenticated;
grant insert, update, delete on app.fund_managers, app.offerings, app.offering_content_versions, app.share_classes,
  app.properties, app.offering_properties, app.source_references, app.offering_metrics,
  app.offering_documents, app.guide_assets, app.legal_document_versions to authenticated;
