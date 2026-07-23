-- Offering normalization: give every part of the OfferingBundle a typed home so
-- `app.compose_offering_snapshot` can assemble the published `content_snapshot`
-- JSON from relational rows instead of a hand-authored `draft_content` blob, and
-- so a future admin panel can edit each part independently.
--
-- Design principle: normalize ENTITIES and admin-editable LISTS into typed rows;
-- keep leaf value-objects (LocalizedText, SourcedValue) as `jsonb` columns — they
-- are exactly the passthrough leaves the snapshot must reproduce verbatim, so
-- decomposing them into scalar columns buys nothing and only risks parity drift.
--
-- Parity note: several bundle fields are DATE-LIKE STRINGS whose granularity must
-- round-trip exactly (e.g. inceptionDate "2024", not "2024-01-01"). Those are
-- stored as `text`, not `date`, so compose emits the authored string unchanged.
-- The bundle's top-level `status` (available/coming-soon/…) is the MARKETING
-- status and is distinct from `app.offerings.status` (the publication enum); it
-- gets its own `market_status` column.
--
-- All statements are idempotent (MCP apply + later `supabase db push` both run).

-- 1. app.offerings — promote queryable scalars + localized/sourced jsonb --------
alter table app.offerings
  add column if not exists market_status text
    check (market_status is null or market_status in ('available','coming-soon','paused','closed')),
  add column if not exists name jsonb,
  add column if not exists short_name jsonb,
  add column if not exists summary jsonb,
  add column if not exists thesis jsonb,
  add column if not exists featured boolean not null default false,
  add column if not exists inception_date text,
  add column if not exists funding_percent numeric,
  add column if not exists fund_type jsonb,
  add column if not exists fund_status jsonb,
  add column if not exists aum jsonb,
  add column if not exists amount_raised jsonb,
  add column if not exists offering_size jsonb,
  add column if not exists units_total jsonb,
  add column if not exists management_fee jsonb,
  add column if not exists valuation_frequency jsonb,
  add column if not exists distribution_frequency jsonb,
  add column if not exists risk_profile jsonb,
  add column if not exists trailing_returns_note jsonb,
  add column if not exists last_updated text,
  add column if not exists verified_at text,
  add column if not exists issuer_legal_type text,
  add column if not exists is_investment_fund boolean,
  add column if not exists compliance_review_owner text,
  add column if not exists compliance_reviewed_at text;

-- 2. app.share_classes — typed columns + one sourced/localized jsonb per field --
alter table app.share_classes
  add column if not exists sort_order integer not null default 0,
  add column if not exists name text,
  add column if not exists registered_account_types text[] not null default '{}',
  add column if not exists minimum_investment jsonb,
  add column if not exists unit_price jsonb,
  add column if not exists target_return jsonb,
  add column if not exists target_distribution jsonb,
  add column if not exists distribution_per_unit jsonb,
  add column if not exists term jsonb,
  add column if not exists redemption_terms jsonb,
  add column if not exists drip jsonb;

-- 3. app.offering_documents — display columns the OfferingDocument shape needs --
-- storage_path becomes NULLABLE: a document may be registered as metadata-only
-- (no uploaded file) — the UI renders those in its existing "unavailable" state.
-- `href` is intentionally NOT stored; it is resolved at read time from
-- bucket_id + storage_path (public) or a signed-URL route (private).
alter table app.offering_documents
  alter column storage_path drop not null;
alter table app.offering_documents
  add column if not exists slug text,
  add column if not exists description jsonb,
  add column if not exists visibility text,
  add column if not exists version text,
  add column if not exists source_id text,
  add column if not exists effective_date text,
  add column if not exists sort_order integer not null default 0;
create unique index if not exists offering_documents_offering_slug_key
  on app.offering_documents(offering_id, slug) where slug is not null;

-- 4. app.properties — promote map-queryable scalars (localized name/address and
--    media stay in `content jsonb`, which compose still emits verbatim) --------
alter table app.properties
  add column if not exists city text,
  add column if not exists province text,
  add column if not exists country text,
  add column if not exists latitude numeric,
  add column if not exists longitude numeric,
  add column if not exists asset_class_key text,
  add column if not exists property_status text,
  add column if not exists verification_status text;

-- 5. New child tables ---------------------------------------------------------
create table if not exists app.offering_portfolio_facts (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  value jsonb not null,               -- SourcedValue<string>
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists app.offering_fund_defined_facts (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  share_class_id uuid references app.share_classes(id) on delete cascade,
  slug text not null,                 -- the fact's bundle `id`
  label jsonb not null,               -- LocalizedText
  value jsonb not null,               -- LocalizedText
  category text not null,             -- target|fee|liquidity|lockup|early-exit|term
  source_id text not null,
  source_page integer,
  effective_date text not null,
  approval text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists app.offering_statements (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  kind text not null check (kind in ('risk','highlight')),
  text jsonb not null,                -- LocalizedText
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists app.offering_trailing_returns (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  period jsonb not null,              -- LocalizedText
  value text not null,
  note jsonb,                         -- LocalizedText
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists app.offering_service_providers (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  role text not null check (role in ('auditor','legalCounsel','appraiser')),
  name text not null,
  url text,
  created_at timestamptz not null default now(),
  unique (offering_id, role)
);

-- Soft reference to app.taxonomies(kind,key): no hard FK, so seeding never fails
-- if a taxonomy row is missing; integrity is enforced by the admin UI instead.
create table if not exists app.offering_taxonomies (
  offering_id uuid not null references app.offerings(id) on delete cascade,
  kind text not null check (kind in ('strategy','asset_class','region')),
  key text not null,
  sort_order integer not null default 0,
  primary key (offering_id, kind, key)
);

create table if not exists app.offering_compliance_exemptions (
  offering_id uuid not null references app.offerings(id) on delete cascade,
  exemption_route text not null,
  sort_order integer not null default 0,
  primary key (offering_id, exemption_route)
);

-- Media (offering-level and per-property). Published rows also back the
-- Storage read policy for images (added in the assets phase).
create table if not exists app.offering_media (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  property_id uuid references app.properties(id) on delete cascade,
  slot text not null check (slot in ('card','banner','logo','gallery')),
  bucket_id text check (bucket_id is null or bucket_id in ('offering-public','offering-private')),
  storage_path text,
  alt jsonb,                          -- LocalizedText
  kind text check (kind is null or kind in ('photo','render')),
  source_id text,
  verified_at text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists offering_portfolio_facts_offering_idx on app.offering_portfolio_facts(offering_id);
create index if not exists offering_fund_defined_facts_offering_idx on app.offering_fund_defined_facts(offering_id);
create index if not exists offering_statements_offering_idx on app.offering_statements(offering_id);
create index if not exists offering_trailing_returns_offering_idx on app.offering_trailing_returns(offering_id);
create index if not exists offering_service_providers_offering_idx on app.offering_service_providers(offering_id);
create index if not exists offering_taxonomies_offering_idx on app.offering_taxonomies(offering_id);
create index if not exists offering_media_offering_idx on app.offering_media(offering_id);
create index if not exists offering_media_path_idx on app.offering_media(bucket_id, storage_path) where storage_path is not null;

-- 6. RLS + grants -------------------------------------------------------------
-- Each child table: public read when its parent offering is published; full
-- admin write. Grants + admin policies are LOAD-BEARING — the 20260722210000
-- grant-revocation outage is the cautionary precedent. compose runs as
-- SECURITY DEFINER so it bypasses these read policies when assembling.
do $$
declare
  t text;
  child_tables text[] := array[
    'offering_portfolio_facts','offering_fund_defined_facts','offering_statements',
    'offering_trailing_returns','offering_service_providers','offering_taxonomies',
    'offering_compliance_exemptions','offering_media'
  ];
begin
  foreach t in array child_tables loop
    execute format('alter table app.%I enable row level security;', t);
    execute format('drop policy if exists %I on app.%I;', 'published_'||t||'_read', t);
    execute format($p$
      create policy %I on app.%I for select to anon, authenticated
      using (exists (
        select 1 from app.offerings o
        where o.id = app.%I.offering_id
          and o.status = 'published'
          and (o.withdrawal_at is null or o.withdrawal_at > now())
      ));
    $p$, 'published_'||t||'_read', t, t);
    execute format('drop policy if exists %I on app.%I;', t||'_admin_all', t);
    execute format($p$
      create policy %I on app.%I for all to authenticated
      using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
    $p$, t||'_admin_all', t);
    execute format('grant select on app.%I to anon, authenticated;', t);
    execute format('grant insert, update, delete on app.%I to authenticated;', t);
  end loop;
end $$;

notify pgrst, 'reload schema';
