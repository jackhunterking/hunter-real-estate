-- Offering profile depth: the fields a real fund profile needs but the seeded
-- JSON never had a home for — categorised risks, the manager's strategy and
-- operating initiatives, and per-property acquisition facts.
--
-- Driven by what the March 2026 Lankin SEDAR deck actually contains: a six-way
-- risk breakdown (investment / regulatory / leverage / business / redemption /
-- tax) rather than one flat list, a three-part acquisition strategy plus
-- quantified NOI initiatives, and acquisition date / price / ownership share per
-- building. None of it is Lankin-specific — every fund document carries the same
-- shapes, so this generalises to investments #3+.
--
-- Compatibility: `risks` keeps emitting the flat LocalizedText[] the presenter
-- already renders (FundPresentation.tsx:56); `riskGroups` is ADDITIVE, so no
-- consumer breaks. lib/capital/schema.ts is `.passthrough()`, so new keys
-- survive validation untouched.
--
-- All statements are idempotent (MCP apply + later `supabase db push` both run).

-- 1. Categorised statements ---------------------------------------------------
-- Nullable: existing rows stay uncategorised and still render in the flat list.
alter table app.offering_statements
  add column if not exists category text
    check (category is null or category in
      ('investment','regulatory','leverage','business','redemption','tax','other'));

-- 2. Strategy points ----------------------------------------------------------
--   differentiator — "what makes this fund stand out"
--   strategy       — the acquisition thesis (where / what / how)
--   initiative     — operating programmes, usually with a quantified target
create table if not exists app.offering_strategy_points (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  kind text not null check (kind in ('differentiator','strategy','initiative')),
  slug text,
  label jsonb not null,               -- LocalizedText
  body jsonb,                         -- LocalizedText
  metric jsonb,                       -- LocalizedText, e.g. "Up to 40% lower energy cost"
  source_id text,
  source_page integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists offering_strategy_points_offering_idx
  on app.offering_strategy_points(offering_id);

-- 3. Property acquisition facts -----------------------------------------------
-- Promoted out of `content` so the portfolio can be summed and sorted in SQL.
-- The unit-count promotion is load-bearing: it is what lets a query assert that
-- the buildings on file actually add up to the unit count the fund publishes.
alter table app.properties
  add column if not exists unit_count integer,
  add column if not exists acquired_on date,
  add column if not exists purchase_price numeric,
  add column if not exists ownership_note jsonb;   -- LocalizedText, e.g. "50% JV ownership"

-- 4. RLS + grants for the new child table -------------------------------------
-- Same shape as the 20260723170000 child tables. GRANTS ARE LOAD-BEARING — the
-- 20260722210000 revocation outage is the cautionary precedent.
do $$
declare
  t text;
  child_tables text[] := array['offering_strategy_points'];
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

-- 5. compose: emit sources, strategyPoints, riskGroups, freshness, property facts
-- Only the new keys and the two changed ones (risks stays flat, properties gains
-- an overlay) differ from 20260723170100; everything else is carried verbatim.
create or replace function app.compose_offering_snapshot(p_offering_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(o.draft_content, '{}'::jsonb)
    || pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
      'id', o.slug,
      'slug', o.slug,
      'managerId', m.slug,
      'name', o.name,
      'shortName', o.short_name,
      'summary', o.summary,
      'thesis', o.thesis,
      'status', o.market_status,
      'featured', o.featured,
      'strategyIds', (select pg_catalog.jsonb_agg(t.key order by t.sort_order)
                        from app.offering_taxonomies t
                       where t.offering_id = o.id and t.kind = 'strategy'),
      'assetClassIds', (select pg_catalog.jsonb_agg(t.key order by t.sort_order)
                          from app.offering_taxonomies t
                         where t.offering_id = o.id and t.kind = 'asset_class'),
      'regionIds', (select pg_catalog.jsonb_agg(t.key order by t.sort_order)
                      from app.offering_taxonomies t
                     where t.offering_id = o.id and t.kind = 'region'),
      'shareClasses', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'id', sc.code,
            'offeringId', o.slug,
            'name', sc.name,
            'minimumInvestment', sc.minimum_investment,
            'unitPrice', sc.unit_price,
            'targetReturn', sc.target_return,
            'targetDistribution', sc.target_distribution,
            'distributionPerUnit', sc.distribution_per_unit,
            'term', sc.term,
            'redemptionTerms', sc.redemption_terms,
            'drip', sc.drip,
            'registeredAccountTypes', pg_catalog.to_jsonb(sc.registered_account_types),
            'fundDefinedFacts', (
              select pg_catalog.jsonb_agg(
                pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
                  'id', f.slug, 'label', f.label, 'value', f.value,
                  'category', f.category, 'shareClassId', sc.code,
                  'sourceId', f.source_id, 'sourcePage', f.source_page,
                  'effectiveDate', f.effective_date, 'approval', f.approval
                )) order by f.sort_order)
                from app.offering_fund_defined_facts f
               where f.share_class_id = sc.id)
          )) order by sc.sort_order)
          from app.share_classes sc
         where sc.offering_id = o.id and sc.status = 'published'),
      'shareClassIds', (select pg_catalog.jsonb_agg(sc.code order by sc.sort_order)
                          from app.share_classes sc
                         where sc.offering_id = o.id and sc.status = 'published'),
      -- properties: authored `content` stays authoritative, with the promoted
      -- acquisition columns overlaid on top so they are always present.
      'properties', (
        select pg_catalog.jsonb_agg(
          p.content || pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'unitCount', p.unit_count,
            'acquiredOn', p.acquired_on,
            'purchasePrice', p.purchase_price,
            'ownershipNote', p.ownership_note
          )) order by op.sort_order)
          from app.offering_properties op
          join app.properties p on p.id = op.property_id
         where op.offering_id = o.id),
      'propertyIds', (select pg_catalog.jsonb_agg(p.slug order by op.sort_order)
                        from app.offering_properties op
                        join app.properties p on p.id = op.property_id
                       where op.offering_id = o.id),
      'documents', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'id', d.slug, 'offeringId', o.slug, 'title', d.title,
            'description', d.description, 'type', d.document_type,
            'effectiveDate', d.effective_date, 'version', d.version,
            'sourceId', d.source_id, 'visibility', d.visibility,
            'bucket', d.bucket_id, 'path', d.storage_path
          )) order by d.sort_order)
          from app.offering_documents d
         where d.offering_id = o.id and d.status = 'published'),
      'documentIds', (select pg_catalog.jsonb_agg(d.slug order by d.sort_order)
                        from app.offering_documents d
                       where d.offering_id = o.id and d.status = 'published' and d.slug is not null),
      'portfolioFacts', (select pg_catalog.jsonb_agg(pf.value order by pf.sort_order)
                           from app.offering_portfolio_facts pf
                          where pf.offering_id = o.id),
      'fundDefinedFacts', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'id', f.slug, 'label', f.label, 'value', f.value,
            'category', f.category, 'sourceId', f.source_id,
            'sourcePage', f.source_page, 'effectiveDate', f.effective_date,
            'approval', f.approval
          )) order by f.sort_order)
          from app.offering_fund_defined_facts f
         where f.offering_id = o.id and f.share_class_id is null),
      -- risks stays FLAT for the existing presenter…
      'risks', (select pg_catalog.jsonb_agg(s.text order by s.sort_order)
                  from app.offering_statements s
                 where s.offering_id = o.id and s.kind = 'risk'),
      -- …and riskGroups is the additive, categorised view of the same rows.
      'riskGroups', (
        select pg_catalog.jsonb_agg(g order by g ->> 'category')
          from (
            select pg_catalog.jsonb_build_object(
                     'category', coalesce(s.category, 'other'),
                     'items', pg_catalog.jsonb_agg(s.text order by s.sort_order)
                   ) as g
              from app.offering_statements s
             where s.offering_id = o.id and s.kind = 'risk'
             group by coalesce(s.category, 'other')
          ) grouped),
      'highlights', (select pg_catalog.jsonb_agg(s.text order by s.sort_order)
                       from app.offering_statements s
                      where s.offering_id = o.id and s.kind = 'highlight'),
      'strategyPoints', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'id', sp.slug, 'kind', sp.kind, 'label', sp.label, 'body', sp.body,
            'metric', sp.metric, 'sourceId', sp.source_id, 'sourcePage', sp.source_page
          )) order by sp.kind, sp.sort_order)
          from app.offering_strategy_points sp
         where sp.offering_id = o.id),
      'sources', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'id', src.key, 'title', src.title, 'publisher', src.publisher,
            'publishedOn', src.published_on, 'documentSlug', src.document_slug,
            'url', src.url
          )) order by src.sort_order, src.key)
          from app.offering_sources src
         where src.offering_id = o.id),
      'trailingReturns', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'period', tr.period, 'value', tr.value, 'note', tr.note
          )) order by tr.sort_order)
          from app.offering_trailing_returns tr
         where tr.offering_id = o.id),
      'trailingReturnsNote', o.trailing_returns_note,
      -- nullif on the empty object is load-bearing: an all-null media object
      -- would strip to `{}` (non-null) and OVERRIDE draft_content.media.
      'media', nullif((
        select pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
          'card', (select pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
                     'bucket', mm.bucket_id, 'path', mm.storage_path, 'alt', mm.alt,
                     'kind', mm.kind, 'sourceId', mm.source_id, 'verifiedAt', mm.verified_at))
                     from app.offering_media mm
                    where mm.offering_id = o.id and mm.property_id is null and mm.slot = 'card'
                    order by mm.sort_order limit 1),
          'banner', (select pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
                     'bucket', mm.bucket_id, 'path', mm.storage_path, 'alt', mm.alt,
                     'kind', mm.kind, 'sourceId', mm.source_id, 'verifiedAt', mm.verified_at))
                     from app.offering_media mm
                    where mm.offering_id = o.id and mm.property_id is null and mm.slot = 'banner'
                    order by mm.sort_order limit 1),
          'logo', (select pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
                     'bucket', mm.bucket_id, 'path', mm.storage_path, 'alt', mm.alt,
                     'kind', mm.kind, 'sourceId', mm.source_id, 'verifiedAt', mm.verified_at))
                     from app.offering_media mm
                    where mm.offering_id = o.id and mm.property_id is null and mm.slot = 'logo'
                    order by mm.sort_order limit 1),
          'gallery', (select pg_catalog.jsonb_agg(
                        pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
                          'bucket', mm.bucket_id, 'path', mm.storage_path, 'alt', mm.alt,
                          'kind', mm.kind, 'sourceId', mm.source_id, 'verifiedAt', mm.verified_at))
                        order by mm.sort_order)
                        from app.offering_media mm
                       where mm.offering_id = o.id and mm.property_id is null and mm.slot = 'gallery')
        ))), '{}'::jsonb),
      'offeringSize', o.offering_size,
      'unitsTotal', o.units_total,
      'fundType', o.fund_type,
      'fundStatus', o.fund_status,
      'inceptionDate', o.inception_date,
      'aum', o.aum,
      'amountRaised', o.amount_raised,
      'fundingPercent', o.funding_percent,
      'managementFee', o.management_fee,
      'valuationFrequency', o.valuation_frequency,
      'distributionFrequency', o.distribution_frequency,
      'riskProfile', o.risk_profile,
      'lastUpdated', o.last_updated,
      'verifiedAt', o.verified_at,
      -- freshness: the investor-facing "figures as of" contract
      'updateCadence', o.update_cadence,
      'dataAsOf', o.data_as_of,
      'dataPeriodLabel', o.data_period_label,
      'serviceProviders', (
        select pg_catalog.jsonb_object_agg(sp.role,
                 pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object('name', sp.name, 'url', sp.url)))
          from app.offering_service_providers sp
         where sp.offering_id = o.id),
      'complianceProfile', pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
        'issuerLegalType', o.issuer_legal_type,
        'isInvestmentFund', o.is_investment_fund,
        'reviewOwner', o.compliance_review_owner,
        'reviewedAt', o.compliance_reviewed_at,
        'approvedOntarioExemptions', coalesce(
          (select pg_catalog.jsonb_agg(e.exemption_route order by e.sort_order)
             from app.offering_compliance_exemptions e where e.offering_id = o.id),
          '[]'::jsonb)
      )),
      'manager', m.content
    ))
  from app.offerings o
  join app.fund_managers m on m.id = o.manager_id
  where o.id = p_offering_id;
$$;

-- 6. apply_offering_bundle: populate the new rows and columns -----------------
-- Extends 20260723170400 with sources, strategyPoints, risk categories and the
-- promoted property columns. Everything else is carried verbatim.
create or replace function app.apply_offering_bundle(p_bundle jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_manager jsonb;
  v_manager_id uuid;
  v_offering_id uuid;
  v_prop record;
  v_sc record;
  v_sc_id uuid;
begin
  v_manager := p_bundle -> 'manager';
  if v_manager is null or coalesce(v_manager ->> 'slug', '') = '' then
    raise exception 'Offering bundle requires a manager with a slug';
  end if;
  if coalesce(p_bundle ->> 'slug', '') = '' then
    raise exception 'Offering bundle requires a slug';
  end if;

  insert into app.fund_managers (slug, legal_name, display_name, website, headquarters, content)
  values (
    v_manager ->> 'slug',
    coalesce(v_manager -> 'name' ->> 'en', v_manager ->> 'slug'),
    v_manager -> 'name',
    v_manager ->> 'website',
    coalesce(v_manager -> 'headquarters', '{}'::jsonb),
    v_manager
  )
  on conflict (slug) do update set
    legal_name = excluded.legal_name, display_name = excluded.display_name,
    website = excluded.website, headquarters = excluded.headquarters,
    content = excluded.content, updated_at = now()
  returning id into v_manager_id;

  insert into app.offerings (slug, manager_id, status, draft_content)
  values (p_bundle ->> 'slug', v_manager_id, 'draft', p_bundle)
  on conflict (slug) do update set
    manager_id = excluded.manager_id, draft_content = excluded.draft_content, updated_at = now()
  returning id into v_offering_id;

  update app.offerings set
    market_status          = p_bundle ->> 'status',
    name                   = p_bundle -> 'name',
    short_name             = p_bundle -> 'shortName',
    summary                = p_bundle -> 'summary',
    thesis                 = p_bundle -> 'thesis',
    featured               = coalesce((p_bundle ->> 'featured')::boolean, false),
    inception_date         = p_bundle ->> 'inceptionDate',
    funding_percent        = nullif(p_bundle ->> 'fundingPercent', '')::numeric,
    fund_type              = p_bundle -> 'fundType',
    fund_status            = p_bundle -> 'fundStatus',
    aum                    = p_bundle -> 'aum',
    amount_raised          = p_bundle -> 'amountRaised',
    offering_size          = p_bundle -> 'offeringSize',
    units_total            = p_bundle -> 'unitsTotal',
    management_fee         = p_bundle -> 'managementFee',
    valuation_frequency    = p_bundle -> 'valuationFrequency',
    distribution_frequency = p_bundle -> 'distributionFrequency',
    risk_profile           = p_bundle -> 'riskProfile',
    trailing_returns_note  = p_bundle -> 'trailingReturnsNote',
    last_updated           = p_bundle ->> 'lastUpdated',
    verified_at            = p_bundle ->> 'verifiedAt',
    issuer_legal_type      = p_bundle #>> '{complianceProfile,issuerLegalType}',
    is_investment_fund     = nullif(p_bundle #>> '{complianceProfile,isInvestmentFund}', '')::boolean,
    compliance_review_owner= p_bundle #>> '{complianceProfile,reviewOwner}',
    compliance_reviewed_at = p_bundle #>> '{complianceProfile,reviewedAt}',
    -- freshness: only overwritten when the bundle carries a value, so an editor
    -- that never touches these cannot silently clear a fund's review schedule.
    update_cadence         = coalesce(nullif(p_bundle ->> 'updateCadence', ''), update_cadence),
    data_as_of             = coalesce(nullif(p_bundle ->> 'dataAsOf', '')::date, data_as_of),
    data_period_label      = coalesce(nullif(p_bundle ->> 'dataPeriodLabel', ''), data_period_label),
    manager_public_url     = coalesce(nullif(p_bundle ->> 'managerPublicUrl', ''), manager_public_url),
    updated_at = now()
  where id = v_offering_id;

  -- Recompute the due date from whatever as-of/cadence now stands.
  update app.offerings set
    next_review_due_at = app.offering_next_review_due(data_as_of, update_cadence)
  where id = v_offering_id;

  delete from app.offering_fund_defined_facts where offering_id = v_offering_id;
  delete from app.share_classes                 where offering_id = v_offering_id;
  delete from app.offering_taxonomies           where offering_id = v_offering_id;
  delete from app.offering_portfolio_facts      where offering_id = v_offering_id;
  delete from app.offering_statements           where offering_id = v_offering_id;
  delete from app.offering_trailing_returns     where offering_id = v_offering_id;
  delete from app.offering_service_providers    where offering_id = v_offering_id;
  delete from app.offering_compliance_exemptions where offering_id = v_offering_id;
  delete from app.offering_strategy_points      where offering_id = v_offering_id;

  insert into app.offering_taxonomies (offering_id, kind, key, sort_order)
  select v_offering_id, 'strategy', elem, (ord - 1)::int
  from jsonb_array_elements_text(coalesce(p_bundle -> 'strategyIds', '[]'::jsonb)) with ordinality as t(elem, ord)
  on conflict do nothing;
  insert into app.offering_taxonomies (offering_id, kind, key, sort_order)
  select v_offering_id, 'asset_class', elem, (ord - 1)::int
  from jsonb_array_elements_text(coalesce(p_bundle -> 'assetClassIds', '[]'::jsonb)) with ordinality as t(elem, ord)
  on conflict do nothing;
  insert into app.offering_taxonomies (offering_id, kind, key, sort_order)
  select v_offering_id, 'region', elem, (ord - 1)::int
  from jsonb_array_elements_text(coalesce(p_bundle -> 'regionIds', '[]'::jsonb)) with ordinality as t(elem, ord)
  on conflict do nothing;

  insert into app.offering_portfolio_facts (offering_id, value, sort_order)
  select v_offering_id, elem, (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'portfolioFacts', '[]'::jsonb)) with ordinality as t(elem, ord);

  -- Risks accept either the legacy flat LocalizedText or {text, category}.
  insert into app.offering_statements (offering_id, kind, text, category, sort_order)
  select v_offering_id, 'risk',
         case when elem ? 'text' then elem -> 'text' else elem end,
         nullif(elem ->> 'category', ''),
         (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'risks', '[]'::jsonb)) with ordinality as t(elem, ord);
  insert into app.offering_statements (offering_id, kind, text, sort_order)
  select v_offering_id, 'highlight', elem, (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'highlights', '[]'::jsonb)) with ordinality as t(elem, ord);

  insert into app.offering_strategy_points (
    offering_id, kind, slug, label, body, metric, source_id, source_page, sort_order
  )
  select v_offering_id, elem ->> 'kind', elem ->> 'id', elem -> 'label', elem -> 'body',
         elem -> 'metric', elem ->> 'sourceId', nullif(elem ->> 'sourcePage', '')::int, (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'strategyPoints', '[]'::jsonb)) with ordinality as t(elem, ord)
  where elem ->> 'kind' is not null;

  -- Sources are UPSERTED, never deleted: a figure published in an earlier
  -- version still cites its source id, so dropping rows would orphan history.
  insert into app.offering_sources (
    offering_id, key, title, publisher, published_on, document_slug, url, sort_order
  )
  select v_offering_id, elem ->> 'id', elem -> 'title', elem ->> 'publisher',
         nullif(elem ->> 'publishedOn', '')::date, elem ->> 'documentSlug',
         elem ->> 'url', (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'sources', '[]'::jsonb)) with ordinality as t(elem, ord)
  where coalesce(elem ->> 'id', '') <> ''
  on conflict (offering_id, key) do update set
    title = excluded.title, publisher = excluded.publisher,
    published_on = excluded.published_on, document_slug = excluded.document_slug,
    url = excluded.url, sort_order = excluded.sort_order;

  insert into app.offering_trailing_returns (offering_id, period, value, note, sort_order)
  select v_offering_id, elem -> 'period', elem ->> 'value', elem -> 'note', (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'trailingReturns', '[]'::jsonb)) with ordinality as t(elem, ord);

  insert into app.offering_service_providers (offering_id, role, name, url)
  select v_offering_id, kv.key, kv.value ->> 'name', kv.value ->> 'url'
  from jsonb_each(coalesce(p_bundle -> 'serviceProviders', '{}'::jsonb)) as kv
  where kv.value ? 'name';

  insert into app.offering_compliance_exemptions (offering_id, exemption_route, sort_order)
  select v_offering_id, elem, (ord - 1)::int
  from jsonb_array_elements_text(coalesce(p_bundle #> '{complianceProfile,approvedOntarioExemptions}', '[]'::jsonb)) with ordinality as t(elem, ord)
  on conflict do nothing;

  for v_sc in
    select value as sc, ordinality as ord
    from jsonb_array_elements(coalesce(p_bundle -> 'shareClasses', '[]'::jsonb)) with ordinality
  loop
    insert into app.share_classes (
      offering_id, code, name, sort_order, registered_account_types,
      minimum_investment, unit_price, target_return, target_distribution,
      distribution_per_unit, term, redemption_terms, drip, content, status
    ) values (
      v_offering_id, v_sc.sc ->> 'id', v_sc.sc ->> 'name', (v_sc.ord - 1)::int,
      coalesce((select array_agg(x order by o) from jsonb_array_elements_text(v_sc.sc -> 'registeredAccountTypes') with ordinality as r(x, o)), '{}'),
      v_sc.sc -> 'minimumInvestment', v_sc.sc -> 'unitPrice', v_sc.sc -> 'targetReturn',
      v_sc.sc -> 'targetDistribution', v_sc.sc -> 'distributionPerUnit', v_sc.sc -> 'term',
      v_sc.sc -> 'redemptionTerms', v_sc.sc -> 'drip', v_sc.sc, 'published'
    )
    returning id into v_sc_id;

    insert into app.offering_fund_defined_facts (
      offering_id, share_class_id, slug, label, value, category,
      source_id, source_page, effective_date, approval, sort_order
    )
    select v_offering_id, v_sc_id, f ->> 'id', f -> 'label', f -> 'value', f ->> 'category',
           f ->> 'sourceId', nullif(f ->> 'sourcePage', '')::int, f ->> 'effectiveDate',
           f ->> 'approval', (ford - 1)::int
    from jsonb_array_elements(coalesce(v_sc.sc -> 'fundDefinedFacts', '[]'::jsonb)) with ordinality as t(f, ford);
  end loop;

  insert into app.offering_fund_defined_facts (
    offering_id, share_class_id, slug, label, value, category,
    source_id, source_page, effective_date, approval, sort_order
  )
  select v_offering_id, null, f ->> 'id', f -> 'label', f -> 'value', f ->> 'category',
         f ->> 'sourceId', nullif(f ->> 'sourcePage', '')::int, f ->> 'effectiveDate',
         f ->> 'approval', (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'fundDefinedFacts', '[]'::jsonb)) with ordinality as t(f, ord);

  -- Unlink properties the bundle no longer lists. Without this a property
  -- removed or renamed in the bundle stayed attached forever — the Lankin pass
  -- surfaced it as 12 map markers for a 9-building portfolio. The property ROW
  -- is left alone: another offering may still reference it.
  delete from app.offering_properties op
  where op.offering_id = v_offering_id
    and op.property_id not in (
      select p.id from app.properties p
      where p.slug in (
        select elem ->> 'id'
        from jsonb_array_elements(coalesce(p_bundle -> 'properties', '[]'::jsonb)) as t(elem)
        where coalesce(elem ->> 'id', '') <> ''
      )
    );

  for v_prop in
    select value as prop, ordinality
    from jsonb_array_elements(coalesce(p_bundle -> 'properties', '[]'::jsonb)) with ordinality
  loop
    insert into app.properties (
      slug, name, address, content, status,
      city, province, country, latitude, longitude,
      asset_class_key, property_status, verification_status,
      unit_count, acquired_on, purchase_price, ownership_note
    ) values (
      v_prop.prop ->> 'id', v_prop.prop -> 'name', coalesce(v_prop.prop -> 'address', '{}'::jsonb),
      v_prop.prop, 'published', v_prop.prop ->> 'city', v_prop.prop ->> 'province', v_prop.prop ->> 'country',
      nullif(v_prop.prop ->> 'latitude', '')::numeric, nullif(v_prop.prop ->> 'longitude', '')::numeric,
      v_prop.prop ->> 'assetClassId', v_prop.prop ->> 'status', v_prop.prop ->> 'verificationStatus',
      -- unitCount is the promoted scalar; `units` is the legacy SourcedValue.
      coalesce(nullif(v_prop.prop ->> 'unitCount', '')::int,
               nullif(v_prop.prop #>> '{units,value}', '')::int),
      nullif(v_prop.prop ->> 'acquiredOn', '')::date,
      nullif(v_prop.prop ->> 'purchasePrice', '')::numeric,
      v_prop.prop -> 'ownershipNote'
    )
    on conflict (slug) do update set
      name = excluded.name, address = excluded.address, content = excluded.content, status = 'published',
      city = excluded.city, province = excluded.province, country = excluded.country,
      latitude = excluded.latitude, longitude = excluded.longitude,
      asset_class_key = excluded.asset_class_key, property_status = excluded.property_status,
      verification_status = excluded.verification_status,
      unit_count = excluded.unit_count, acquired_on = excluded.acquired_on,
      purchase_price = excluded.purchase_price, ownership_note = excluded.ownership_note,
      updated_at = now();

    insert into app.offering_properties (offering_id, property_id, sort_order)
    values (v_offering_id, (select id from app.properties where slug = v_prop.prop ->> 'id'), (v_prop.ordinality - 1)::int)
    on conflict (offering_id, property_id) do update set sort_order = excluded.sort_order;
  end loop;

  return v_offering_id;
end;
$$;

notify pgrst, 'reload schema';
