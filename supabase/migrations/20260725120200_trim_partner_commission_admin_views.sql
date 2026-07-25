-- Trim the admin surface to the investor relationship.
--
-- The partner / professional / firm / commission middle layer is retired from
-- the product, so its triage feeds are removed from the console's read model.
-- This drops the professional, licences, firms and payments branches of
-- api.operations_queue (leaving requests, leads, audit and freshness) and drops
-- the firm-memberships admin directory view. Base tables are untouched — this is
-- a non-destructive view change, reversible by restoring the branches.

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
    'share_quantity', application.share_quantity,
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
-- Investments whose manager update is due within 30 days, or overdue.
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

-- The firm-memberships directory is gone from the console.
drop view if exists api.admin_firm_memberships;

notify pgrst, 'reload schema';
