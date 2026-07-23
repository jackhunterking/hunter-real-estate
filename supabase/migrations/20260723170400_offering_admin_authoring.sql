-- Offering admin authoring: a save-draft/publish write path + an admin read view,
-- so the in-portal admin panel can create and edit investments without editing
-- JSON. The bundle population logic is extracted from api.seed_offering into a
-- shared app.apply_offering_bundle so seeding and admin authoring never diverge.
--
--   api.save_offering_draft(bundle)  -> upsert working rows + draft_content, NO publish
--   api.seed_offering(bundle,actor)  -> apply + publish (unchanged behavior)
--   api.publish_offering(id,actor)    -> compose + version + publish (already exists)
--
-- Media/documents stay in the draft_content overlay (dual-write with Storage
-- bucket/path) so the live site never breaks on deploy ordering; the read layer
-- resolves bucket/path to URLs. Idempotent.

-- 1. Shared population (no auth, no publish) ---------------------------------
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
    updated_at = now()
  where id = v_offering_id;

  delete from app.offering_fund_defined_facts where offering_id = v_offering_id;
  delete from app.share_classes                 where offering_id = v_offering_id;
  delete from app.offering_taxonomies           where offering_id = v_offering_id;
  delete from app.offering_portfolio_facts      where offering_id = v_offering_id;
  delete from app.offering_statements           where offering_id = v_offering_id;
  delete from app.offering_trailing_returns     where offering_id = v_offering_id;
  delete from app.offering_service_providers    where offering_id = v_offering_id;
  delete from app.offering_compliance_exemptions where offering_id = v_offering_id;

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

  insert into app.offering_statements (offering_id, kind, text, sort_order)
  select v_offering_id, 'risk', elem, (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'risks', '[]'::jsonb)) with ordinality as t(elem, ord);
  insert into app.offering_statements (offering_id, kind, text, sort_order)
  select v_offering_id, 'highlight', elem, (ord - 1)::int
  from jsonb_array_elements(coalesce(p_bundle -> 'highlights', '[]'::jsonb)) with ordinality as t(elem, ord);

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

  for v_prop in
    select value as prop, ordinality
    from jsonb_array_elements(coalesce(p_bundle -> 'properties', '[]'::jsonb)) with ordinality
  loop
    insert into app.properties (
      slug, name, address, content, status,
      city, province, country, latitude, longitude,
      asset_class_key, property_status, verification_status
    ) values (
      v_prop.prop ->> 'id', v_prop.prop -> 'name', coalesce(v_prop.prop -> 'address', '{}'::jsonb),
      v_prop.prop, 'published', v_prop.prop ->> 'city', v_prop.prop ->> 'province', v_prop.prop ->> 'country',
      nullif(v_prop.prop ->> 'latitude', '')::numeric, nullif(v_prop.prop ->> 'longitude', '')::numeric,
      v_prop.prop ->> 'assetClassId', v_prop.prop ->> 'status', v_prop.prop ->> 'verificationStatus'
    )
    on conflict (slug) do update set
      name = excluded.name, address = excluded.address, content = excluded.content, status = 'published',
      city = excluded.city, province = excluded.province, country = excluded.country,
      latitude = excluded.latitude, longitude = excluded.longitude,
      asset_class_key = excluded.asset_class_key, property_status = excluded.property_status,
      verification_status = excluded.verification_status, updated_at = now();

    insert into app.offering_properties (offering_id, property_id, sort_order)
    values (v_offering_id, (select id from app.properties where slug = v_prop.prop ->> 'id'), (v_prop.ordinality - 1)::int)
    on conflict (offering_id, property_id) do update set sort_order = excluded.sort_order;
  end loop;

  return v_offering_id;
end;
$$;

-- 2. seed_offering now delegates to the shared population --------------------
create or replace function api.seed_offering(p_bundle jsonb, p_actor uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_offering_id uuid;
begin
  if not (private.is_hunter_admin() or (select auth.jwt() ->> 'role') = 'service_role') then
    raise exception 'Content administration is required';
  end if;
  v_actor := coalesce((select auth.uid()), p_actor, (select id from auth.users order by created_at limit 1));
  if v_actor is null then
    raise exception 'A seeding actor is required';
  end if;
  v_offering_id := app.apply_offering_bundle(p_bundle);
  perform api.publish_offering(v_offering_id, v_actor);
  return v_offering_id;
end;
$$;

-- 3. save_offering_draft: admin save without publishing ----------------------
create or replace function api.save_offering_draft(p_bundle jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (private.is_hunter_admin() or (select auth.jwt() ->> 'role') = 'service_role') then
    raise exception 'Content administration is required';
  end if;
  return app.apply_offering_bundle(p_bundle);
end;
$$;

grant execute on function api.seed_offering(jsonb, uuid) to authenticated, service_role;
grant execute on function api.save_offering_draft(jsonb) to authenticated, service_role;

-- 4. Admin read view: the full editable bundle per offering ------------------
create or replace view api.offering_admin with (security_invoker = true) as
select
  o.id,
  o.slug,
  o.status,
  o.market_status,
  o.current_version_id,
  (select max(version) from app.offering_content_versions v where v.offering_id = o.id) as latest_version,
  o.draft_content,
  o.updated_at
from app.offerings o
where (select private.is_hunter_admin());

grant select on api.offering_admin to authenticated;

notify pgrst, 'reload schema';
