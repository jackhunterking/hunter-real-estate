-- Offering data freshness: give every investment a stated update cadence, an
-- "as of" reporting period, a next-review-due date, an owner, a review log, and
-- resolvable provenance — so the platform can say *when* its numbers were last
-- reconciled against the manager's own documents, and surface a fund that has
-- gone stale before an investor notices.
--
-- Why this exists: Lankin Apartment REIT acquired a $72M / 258-unit property in
-- Ottawa in May 2026 and the platform did not notice for four months. Nothing
-- recorded that a quarterly update was owed, so nothing was ever overdue.
--
-- Design:
--   * `data_as_of` is the reporting period END the figures describe (a DATE, so
--     it does arithmetic), while `data_period_label` is the manager's own words
--     ("Q1 2026"). Both are needed: one computes, one is displayed verbatim.
--   * `next_review_due_at` is DERIVED but STORED, so the operations queue can
--     filter on it with an index instead of recomputing per row.
--   * `manager_public_url` is the manager's own fund page. Every review starts
--     by opening it and comparing headline figures. It is a link for a human,
--     never a scraper.
--   * `app.offering_sources` finally makes `SourcedValue.sourceId` resolvable —
--     today every figure cites a string like 'lankin-fact-2026-q1' that points
--     at nothing (app.source_references is empty and is keyed to a version, not
--     to the offering).
--
-- All statements are idempotent (MCP apply + later `supabase db push` both run).

-- 1. Freshness columns on app.offerings ---------------------------------------
alter table app.offerings
  add column if not exists update_cadence text not null default 'quarterly'
    check (update_cadence in ('quarterly','semi-annual','annual','ad-hoc')),
  add column if not exists data_as_of date,
  add column if not exists data_period_label text,
  add column if not exists next_review_due_at date,
  add column if not exists last_reviewed_at timestamptz,
  add column if not exists review_owner_user_id uuid references app.profiles(user_id) on delete set null,
  add column if not exists manager_public_url text;

create index if not exists offerings_next_review_due_idx
  on app.offerings(next_review_due_at) where next_review_due_at is not null;

-- 2. Derivation helpers -------------------------------------------------------
-- Publication lag: managers publish weeks AFTER period close — Lankin's Q1 2026
-- sheet and Epiphany's Q4 2025 sheet both landed ~4-5 weeks out. Due-dating at
-- the bare period end would mark every fund overdue the day the quarter turns.
create or replace function app.offering_next_review_due(p_as_of date, p_cadence text)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_as_of is null then null
    when p_cadence = 'ad-hoc' then null
    when p_cadence = 'annual' then p_as_of + interval '1 year'
    when p_cadence = 'semi-annual' then p_as_of + interval '6 months'
    else p_as_of + interval '3 months'
  end::date + 45;
$$;

create or replace function app.offering_freshness_status(p_due date)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_due is null then 'unscheduled'
    when p_due < current_date then 'overdue'
    when p_due <= current_date + 30 then 'due-soon'
    else 'current'
  end;
$$;

-- 3. Review log ---------------------------------------------------------------
-- A dated trail of "we checked, and here is what moved". Publishing already
-- snapshots into app.offering_content_versions, so a review row ties a human
-- check to the version it produced.
create table if not exists app.offering_reviews (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  reviewed_at timestamptz not null default now(),
  reviewed_by uuid references app.profiles(user_id) on delete set null,
  data_as_of date,
  period_label text,
  source_document_id uuid references app.offering_documents(id) on delete set null,
  outcome text not null check (outcome in ('updated','no-change','awaiting-source')),
  fields_changed text[] not null default '{}',
  note text,
  created_at timestamptz not null default now()
);
create index if not exists offering_reviews_offering_idx
  on app.offering_reviews(offering_id, reviewed_at desc);

-- 4. Resolvable provenance ----------------------------------------------------
-- One row per source document a figure may cite. `key` is the string that
-- appears in SourcedValue.sourceId / FundDefinedFact.sourceId.
create table if not exists app.offering_sources (
  id uuid primary key default gen_random_uuid(),
  offering_id uuid not null references app.offerings(id) on delete cascade,
  key text not null,
  title jsonb not null,                -- LocalizedText
  publisher text,
  published_on date,
  document_slug text,                  -- soft link to app.offering_documents.slug
  url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (offering_id, key)
);
create index if not exists offering_sources_offering_idx on app.offering_sources(offering_id);

-- 5. RLS + grants -------------------------------------------------------------
-- Same shape as the 20260723170000 child tables: public read when the parent
-- offering is published, full admin write. GRANTS ARE LOAD-BEARING — the
-- 20260722210000 revocation outage is the cautionary precedent.
--
-- Exception: offering_reviews is an INTERNAL operations log (it can name staff
-- and unpublished findings), so it gets NO anon/public read — admins only.
do $$
declare
  t text;
  public_read_tables text[] := array['offering_sources'];
begin
  foreach t in array public_read_tables loop
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

alter table app.offering_reviews enable row level security;
drop policy if exists offering_reviews_admin_all on app.offering_reviews;
create policy offering_reviews_admin_all on app.offering_reviews for all to authenticated
  using ((select private.is_hunter_admin())) with check ((select private.is_hunter_admin()));
revoke all on app.offering_reviews from anon;
grant select, insert, update, delete on app.offering_reviews to authenticated;

-- 6. Record a review ----------------------------------------------------------
-- Stamps the offering's freshness fields, recomputes the due date, and appends
-- to the log — one call, so the three can never drift apart.
create or replace function api.record_offering_review(
  p_offering_id uuid,
  p_outcome text,
  p_data_as_of date default null,
  p_period_label text default null,
  p_fields_changed text[] default '{}',
  p_note text default null,
  p_source_document_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_as_of date;
  v_label text;
  v_cadence text;
  v_review_id uuid;
begin
  if not (private.is_hunter_admin() or (select auth.jwt() ->> 'role') = 'service_role') then
    raise exception 'Content administration is required';
  end if;
  v_actor := (select auth.uid());

  -- An 'awaiting-source' review records that we looked and the manager has not
  -- published yet: it must NOT advance data_as_of, only last_reviewed_at.
  select coalesce(p_data_as_of, o.data_as_of),
         coalesce(p_period_label, o.data_period_label),
         o.update_cadence
    into v_as_of, v_label, v_cadence
    from app.offerings o where o.id = p_offering_id;

  if not found then
    raise exception 'Unknown offering %', p_offering_id;
  end if;

  update app.offerings set
    data_as_of         = case when p_outcome = 'awaiting-source' then data_as_of else v_as_of end,
    data_period_label  = case when p_outcome = 'awaiting-source' then data_period_label else v_label end,
    next_review_due_at = case
                           when p_outcome = 'awaiting-source'
                             then current_date + 30   -- look again in a month
                           else app.offering_next_review_due(v_as_of, v_cadence)
                         end,
    last_reviewed_at   = now(),
    updated_at         = now()
  where id = p_offering_id;

  insert into app.offering_reviews (
    offering_id, reviewed_by, data_as_of, period_label,
    source_document_id, outcome, fields_changed, note
  ) values (
    p_offering_id, v_actor, v_as_of, v_label,
    p_source_document_id, p_outcome, coalesce(p_fields_changed, '{}'), p_note
  )
  returning id into v_review_id;

  return v_review_id;
end;
$$;

revoke all on function api.record_offering_review(uuid, text, date, text, text[], text, uuid) from public, anon;
grant execute on function api.record_offering_review(uuid, text, date, text, text[], text, uuid) to authenticated, service_role;

-- 7. Admin read view ----------------------------------------------------------
create or replace view api.offering_admin with (security_invoker = true) as
select
  o.id,
  o.slug,
  o.status,
  o.market_status,
  o.current_version_id,
  (select max(version) from app.offering_content_versions v where v.offering_id = o.id) as latest_version,
  o.draft_content,
  o.updated_at,
  o.update_cadence,
  o.data_as_of,
  o.data_period_label,
  o.next_review_due_at,
  o.last_reviewed_at,
  o.review_owner_user_id,
  o.manager_public_url,
  app.offering_freshness_status(o.next_review_due_at) as freshness_status,
  (select p.display_name from app.profiles p where p.user_id = o.review_owner_user_id) as review_owner_name
from app.offerings o
where (select private.is_hunter_admin());

grant select on api.offering_admin to authenticated;

-- 8. Operations queue: due / overdue investments ------------------------------
-- Recreated in full (a view cannot be extended in place). Branches 1-7 are the
-- existing definition verbatim; branch 8 is new. Because the queue is a VIEW,
-- freshness items compute themselves on every read — no scheduler, which
-- matters because pg_cron is not installed on this project.
drop view if exists api.operations_queue;
create view api.operations_queue with (security_invoker = true) as
select
  'investment:' || application.id::text as id,
  'requests'::text as module,
  application.user_id::text as title,
  application.offering_id || ' · ' || application.amount::text || ' CAD' as summary,
  application.status::text as status,
  application.updated_at as occurred_at,
  'compliance_admin'::text as required_role,
  pg_catalog.jsonb_build_object(
    'user_id', application.user_id,
    'offering_id', application.offering_id,
    'amount', application.amount,
    'account_type', application.account_type,
    'preferred_contact_channel', application.preferred_contact_channel,
    'contact_consent_at', application.contact_consent_at,
    'note', application.note,
    'submitted_at', application.submitted_at
  ) as payload
from app.investment_applications application
where private.is_hunter_admin()
union all
select
  'professional:' || application.id::text,
  'professional',
  trim(application.registered_first_names || ' ' || application.registry_last_name),
  application.professional_title || ' · ' || application.firm_work_email,
  application.status::text,
  application.updated_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'user_id', application.user_id,
    'organization_id', application.organization_id,
    'licence_document_number', application.licence_document_number,
    'licence_type', application.licence_type
  )
from app.partner_applications application
where private.is_hunter_admin()
union all
select
  'licence:' || verification.id::text,
  'licences',
  verification.queried_registry_last_name,
  verification.queried_licence_number || ' · ' || verification.source_url,
  verification.result::text,
  verification.verified_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'application_id', verification.application_id,
    'user_id', verification.user_id,
    'reviewer_id', verification.reviewer_id,
    'reviewer_notes', verification.reviewer_notes
  )
from app.license_verification_events verification
where private.is_hunter_admin()
union all
select
  'firm:' || organization.id::text,
  'firms',
  organization.legal_name,
  organization.firm_type,
  organization.status::text,
  organization.updated_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'trading_name', organization.trading_name,
    'website', organization.website,
    'business_domain', organization.business_domain
  )
from app.organizations organization
where private.is_hunter_admin()
union all
select
  'payment:' || commission.id::text,
  'payments',
  commission.redacted_referral_reference,
  commission.amount::text || ' ' || commission.currency::text,
  commission.status::text,
  coalesce(commission.paid_at, commission.approved_at, commission.created_at),
  'finance_admin',
  pg_catalog.jsonb_build_object(
    'beneficiary_type', commission.beneficiary_type,
    'beneficiary_user_id', commission.beneficiary_user_id,
    'beneficiary_organization_id', commission.beneficiary_organization_id,
    'offering_id', commission.offering_id,
    'payment_reference', commission.payment_reference
  )
from app.commission_entries commission
where private.is_hunter_admin()
union all
select
  'lead:' || lead.id::text,
  'leads',
  contact.email,
  lead.submission_type::text || ' · ' || coalesce(lead.source, ''),
  lead.status::text,
  lead.submitted_at,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'contact_id', contact.id,
    'first_name', contact.first_name,
    'last_name', contact.last_name,
    'phone', contact.phone,
    'assigned_to', lead.assigned_to,
    'follow_up_at', lead.follow_up_at
  )
from app.lead_submissions lead
join app.contacts contact on contact.id = lead.contact_id
where lead.deleted_at is null and contact.deleted_at is null and private.is_hunter_admin()
union all
select
  'audit:' || event.id::text,
  'audit',
  event.action,
  event.summary,
  event.entity_type,
  event.occurred_at,
  'platform_admin',
  pg_catalog.jsonb_build_object(
    'actor_user_id', event.actor_user_id,
    'entity_id', event.entity_id,
    'request_id', event.request_id
  )
from app.audit_events event
where private.is_hunter_admin()
union all
-- NEW: investments whose manager update is due within 30 days, or overdue.
select
  'freshness:' || o.id::text,
  'freshness',
  coalesce(o.name ->> 'en', o.slug),
  coalesce(o.data_period_label, 'no period on file')
    || ' · due ' || o.next_review_due_at::text,
  app.offering_freshness_status(o.next_review_due_at),
  o.next_review_due_at::timestamptz,
  'compliance_admin',
  pg_catalog.jsonb_build_object(
    'slug', o.slug,
    'cadence', o.update_cadence,
    'data_as_of', o.data_as_of,
    'period_label', o.data_period_label,
    'next_review_due_at', o.next_review_due_at,
    'last_reviewed_at', o.last_reviewed_at,
    'manager_public_url', o.manager_public_url
  )
from app.offerings o
where private.is_hunter_admin()
  and o.status = 'published'
  and o.next_review_due_at is not null
  and o.next_review_due_at <= current_date + 30;

revoke all on api.operations_queue from public, anon;
grant select on api.operations_queue to authenticated;

notify pgrst, 'reload schema';
