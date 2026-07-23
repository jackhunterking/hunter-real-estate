-- Full-assembly compose: build the entire OfferingBundle `content_snapshot` from
-- normalized rows instead of only overlaying id/slug/manager/properties.
--
-- Transitional safety: the result is `coalesce(draft_content,'{}') || strip_nulls(assembled)`.
--   * A field ROWS own (non-null in assembled) overrides draft_content.       (rows authoritative)
--   * A field rows don't yet populate (null → stripped) falls back to         (draft_content overlay)
--     draft_content — this is how `media` and `documents` keep rendering in
--     the normalize-first phase before their rows/Storage objects exist.
-- The same function transparently starts emitting media/documents from rows the
-- moment those rows are populated (assets phase); no further compose change.
--
-- compose has NO auth side effects (callers gate); SECURITY DEFINER so assembly
-- bypasses child-table RLS. search_path='' → everything is schema-qualified.
-- Keys are camelCase to match lib/capital/schema.ts (zod) + present.ts exactly.

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
      -- identity (id = slug for a stable, human-meaningful snapshot; the read
      -- layer overrides it with the view's UUID, so this is display-inert)
      'id', o.slug,
      'slug', o.slug,
      'managerId', m.slug,
      -- localized headline copy
      'name', o.name,
      'shortName', o.short_name,
      'summary', o.summary,
      'thesis', o.thesis,
      -- marketing status (distinct from the publication enum o.status)
      'status', o.market_status,
      'featured', o.featured,
      -- taxonomy links
      'strategyIds', (select pg_catalog.jsonb_agg(t.key order by t.sort_order)
                        from app.offering_taxonomies t
                       where t.offering_id = o.id and t.kind = 'strategy'),
      'assetClassIds', (select pg_catalog.jsonb_agg(t.key order by t.sort_order)
                          from app.offering_taxonomies t
                         where t.offering_id = o.id and t.kind = 'asset_class'),
      'regionIds', (select pg_catalog.jsonb_agg(t.key order by t.sort_order)
                      from app.offering_taxonomies t
                     where t.offering_id = o.id and t.kind = 'region'),
      -- share classes (each with its own fundDefinedFacts) + id list
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
      -- properties (whole object from content) + id list
      'properties', (select pg_catalog.jsonb_agg(p.content order by op.sort_order)
                       from app.offering_properties op
                       join app.properties p on p.id = op.property_id
                      where op.offering_id = o.id),
      'propertyIds', (select pg_catalog.jsonb_agg(p.slug order by op.sort_order)
                        from app.offering_properties op
                        join app.properties p on p.id = op.property_id
                       where op.offering_id = o.id),
      -- documents (null until the assets phase populates offering_documents) + id list
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
      -- portfolio facts + offering-level fund-defined facts
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
      -- risks / highlights
      'risks', (select pg_catalog.jsonb_agg(s.text order by s.sort_order)
                  from app.offering_statements s
                 where s.offering_id = o.id and s.kind = 'risk'),
      'highlights', (select pg_catalog.jsonb_agg(s.text order by s.sort_order)
                       from app.offering_statements s
                      where s.offering_id = o.id and s.kind = 'highlight'),
      -- performance
      'trailingReturns', (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object(
            'period', tr.period, 'value', tr.value, 'note', tr.note
          )) order by tr.sort_order)
          from app.offering_trailing_returns tr
         where tr.offering_id = o.id),
      'trailingReturnsNote', o.trailing_returns_note,
      -- media (null until the assets phase populates offering_media). nullif on
      -- the empty object is load-bearing: an all-null media object would strip to
      -- `{}` (non-null) and OVERRIDE draft_content.media; nulling it lets the
      -- transitional overlay keep the authored media until rows/Storage exist.
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
      -- scalar fact-sheet fields
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
      -- service providers
      'serviceProviders', (
        select pg_catalog.jsonb_object_agg(sp.role,
                 pg_catalog.jsonb_strip_nulls(pg_catalog.jsonb_build_object('name', sp.name, 'url', sp.url)))
          from app.offering_service_providers sp
         where sp.offering_id = o.id),
      -- compliance profile
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
      -- manager (whole object lives in fund_managers.content)
      'manager', m.content
    ))
  from app.offerings o
  join app.fund_managers m on m.id = o.manager_id
  where o.id = p_offering_id;
$$;
