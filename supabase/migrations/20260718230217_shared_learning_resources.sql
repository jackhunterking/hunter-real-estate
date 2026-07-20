create table app.learning_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  resource_type text not null default 'guide' check (resource_type = 'guide'),
  category_key text not null check (category_key in ('investment-fundamentals')),
  audience text not null default 'investor_and_professional' check (audience = 'investor_and_professional'),
  current_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.learning_resource_versions (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references app.learning_resources(id) on delete cascade,
  version integer not null check (version > 0),
  status app.publication_status not null default 'draft',
  title jsonb not null default '{"en":"","tr":""}'::jsonb,
  summary jsonb not null default '{"en":"","tr":""}'::jsonb,
  body_markdown jsonb not null default '{"en":"","tr":""}'::jsonb,
  disclaimer jsonb not null default '{"en":"","tr":""}'::jsonb,
  reading_minutes jsonb not null default '{"en":1,"tr":1}'::jsonb,
  author_id uuid not null references auth.users(id) on delete restrict,
  reviewer_id uuid references auth.users(id) on delete restrict,
  compliance_owner_id uuid references auth.users(id) on delete restrict,
  review_notes text,
  reviewed_at timestamptz,
  effective_at timestamptz,
  published_at timestamptz,
  withdrawal_at timestamptz,
  created_at timestamptz not null default now(),
  unique (resource_id, version),
  check (jsonb_typeof(title) = 'object'),
  check (jsonb_typeof(summary) = 'object'),
  check (jsonb_typeof(body_markdown) = 'object'),
  check (jsonb_typeof(disclaimer) = 'object'),
  check (jsonb_typeof(reading_minutes) = 'object')
);

alter table app.learning_resources
  add constraint learning_resources_current_version_fk
  foreign key (current_version_id) references app.learning_resource_versions(id) on delete set null;

create table app.learning_resource_sources (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references app.learning_resource_versions(id) on delete cascade,
  title text not null,
  url text not null check (url ~ '^https://'),
  publisher text not null,
  published_on date,
  accessed_at date not null,
  notes text,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table app.referral_qualification_assessments (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references app.referrals(id) on delete cascade,
  assessor_user_id uuid not null references auth.users(id) on delete restrict,
  jurisdiction text not null,
  account_type text not null check (account_type in ('individual', 'entity')),
  answers jsonb not null default '{}'::jsonb,
  result text not null,
  financial_result text,
  jurisdiction_review text,
  residence_country_code text,
  residence_region_code text,
  qualifying_criteria jsonb not null default '[]'::jsonb,
  om_context jsonb not null default '{}'::jsonb,
  candidate_routes jsonb not null default '[]'::jsonb,
  review_reasons jsonb not null default '[]'::jsonb,
  om_calculation jsonb not null default '{}'::jsonb,
  assessment_input jsonb not null default '{}'::jsonb,
  ruleset_id text not null,
  source_urls jsonb not null default '[]'::jsonb,
  reassessment_triggers jsonb not null default '[]'::jsonb,
  acknowledgement_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index learning_versions_resource_idx on app.learning_resource_versions(resource_id, version desc);
create index learning_versions_published_idx on app.learning_resource_versions(effective_at desc)
where status = 'published' and withdrawal_at is null;
create index learning_sources_version_idx on app.learning_resource_sources(version_id, sort_order);
create index referral_qualification_referral_idx on app.referral_qualification_assessments(referral_id, created_at desc);

create trigger learning_resources_set_updated_at
before update on app.learning_resources
for each row execute function private.set_updated_at();

create or replace function private.guard_learning_version_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft' and (
    new.title is distinct from old.title
    or new.summary is distinct from old.summary
    or new.body_markdown is distinct from old.body_markdown
    or new.disclaimer is distinct from old.disclaimer
    or new.reading_minutes is distinct from old.reading_minutes
    or new.author_id is distinct from old.author_id
  ) then
    raise exception 'Only draft learning content can be edited';
  end if;

  if old.status = 'draft' and new.status not in ('draft', 'in_review') then
    raise exception 'Draft learning content must be submitted for review';
  elsif old.status = 'in_review' and new.status not in ('in_review', 'draft', 'approved') then
    raise exception 'Invalid learning review transition';
  elsif old.status = 'approved' and new.status not in ('approved', 'published') then
    raise exception 'Approved learning content can only be published';
  elsif old.status = 'published' and new.status not in ('published', 'superseded', 'withdrawn') then
    raise exception 'Published learning content is immutable';
  elsif old.status in ('superseded', 'withdrawn') and new is distinct from old then
    raise exception 'Archived learning content is immutable';
  end if;
  return new;
end;
$$;

create trigger learning_versions_guard_mutation
before update on app.learning_resource_versions
for each row execute function private.guard_learning_version_mutation();

create or replace function private.guard_learning_source_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_version_id uuid;
begin
  target_version_id := case when tg_op = 'DELETE' then old.version_id else new.version_id end;
  if not exists (
    select 1 from app.learning_resource_versions version
    where version.id = target_version_id and version.status = 'draft'
  ) then
    raise exception 'Sources can only be changed for draft learning content';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger learning_sources_guard_mutation
before insert or update or delete on app.learning_resource_sources
for each row execute function private.guard_learning_source_mutation();

alter table app.learning_resources enable row level security;
alter table app.learning_resource_versions enable row level security;
alter table app.learning_resource_sources enable row level security;
alter table app.referral_qualification_assessments enable row level security;

create policy learning_resources_published_read
on app.learning_resources for select to authenticated
using (
  exists (
    select 1 from app.learning_resource_versions version
    where version.id = learning_resources.current_version_id
      and version.status = 'published'
      and version.effective_at <= now()
      and (version.withdrawal_at is null or version.withdrawal_at > now())
  )
  or private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);

create policy learning_resources_content_admin_insert
on app.learning_resources for insert to authenticated
with check (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);
create policy learning_resources_content_admin_update
on app.learning_resources for update to authenticated
using (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
)
with check (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);

create policy learning_versions_published_or_content_admin_read
on app.learning_resource_versions for select to authenticated
using (
  (status = 'published' and effective_at <= now() and (withdrawal_at is null or withdrawal_at > now()))
  or private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);
create policy learning_versions_content_admin_insert
on app.learning_resource_versions for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (
    private.has_platform_role('platform_admin'::app.platform_role)
    or private.has_platform_role('compliance_admin'::app.platform_role)
  )
);
create policy learning_versions_content_admin_update
on app.learning_resource_versions for update to authenticated
using (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
)
with check (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);

create policy learning_sources_published_or_content_admin_read
on app.learning_resource_sources for select to authenticated
using (
  exists (
    select 1 from app.learning_resource_versions version
    where version.id = learning_resource_sources.version_id
      and (
        (version.status = 'published' and version.effective_at <= now() and (version.withdrawal_at is null or version.withdrawal_at > now()))
        or private.has_platform_role('platform_admin'::app.platform_role)
        or private.has_platform_role('compliance_admin'::app.platform_role)
      )
  )
);
create policy learning_sources_content_admin_insert
on app.learning_resource_sources for insert to authenticated
with check (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);
create policy learning_sources_content_admin_update
on app.learning_resource_sources for update to authenticated
using (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
)
with check (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);
create policy learning_sources_content_admin_delete
on app.learning_resource_sources for delete to authenticated
using (
  private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);

create policy referral_qualification_owner_or_admin_read
on app.referral_qualification_assessments for select to authenticated
using (
  exists (
    select 1 from app.referrals referral
    where referral.id = referral_qualification_assessments.referral_id
      and referral.owner_user_id = (select auth.uid())
  )
  or private.has_platform_role('platform_admin'::app.platform_role)
  or private.has_platform_role('compliance_admin'::app.platform_role)
);
create policy referral_qualification_owner_insert
on app.referral_qualification_assessments for insert to authenticated
with check (
  assessor_user_id = (select auth.uid())
  and exists (
    select 1 from app.referrals referral
    where referral.id = referral_qualification_assessments.referral_id
      and referral.owner_user_id = (select auth.uid())
      and private.is_active_org_member(referral.firm_id)
  )
);

grant select, insert, update on app.learning_resources to authenticated;
grant select, insert, update on app.learning_resource_versions to authenticated;
grant select, insert, update, delete on app.learning_resource_sources to authenticated;
grant select, insert on app.referral_qualification_assessments to authenticated;

create view api.published_learning_resources
with (security_invoker = true)
as
select
  resource.id,
  resource.slug,
  resource.resource_type,
  resource.category_key,
  resource.audience,
  version.id as version_id,
  version.version,
  version.title,
  version.summary,
  version.body_markdown,
  version.disclaimer,
  version.reading_minutes,
  version.effective_at,
  version.published_at,
  version.reviewed_at,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', source.id,
        'title', source.title,
        'url', source.url,
        'publisher', source.publisher,
        'publishedOn', source.published_on,
        'accessedAt', source.accessed_at,
        'notes', source.notes,
        'sortOrder', source.sort_order
      ) order by source.sort_order
    ) filter (where source.id is not null),
    '[]'::jsonb
  ) as sources
from app.learning_resources resource
join app.learning_resource_versions version on version.id = resource.current_version_id
left join app.learning_resource_sources source on source.version_id = version.id
where version.status = 'published'
  and version.effective_at <= now()
  and (version.withdrawal_at is null or version.withdrawal_at > now())
group by resource.id, version.id;

create view api.learning_resource_admin
with (security_invoker = true)
as
select
  resource.id,
  resource.slug,
  resource.resource_type,
  resource.category_key,
  resource.audience,
  resource.current_version_id,
  version.id as version_id,
  version.version,
  version.status,
  version.title,
  version.summary,
  version.body_markdown,
  version.disclaimer,
  version.reading_minutes,
  version.author_id,
  version.reviewer_id,
  version.compliance_owner_id,
  version.review_notes,
  version.reviewed_at,
  version.effective_at,
  version.published_at,
  version.withdrawal_at,
  version.created_at,
  coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', source.id,
        'title', source.title,
        'url', source.url,
        'publisher', source.publisher,
        'publishedOn', source.published_on,
        'accessedAt', source.accessed_at,
        'notes', source.notes,
        'sortOrder', source.sort_order
      ) order by source.sort_order
    ) filter (where source.id is not null),
    '[]'::jsonb
  ) as sources
from app.learning_resources resource
join app.learning_resource_versions version on version.resource_id = resource.id
left join app.learning_resource_sources source on source.version_id = version.id
group by resource.id, version.id;

create view api.referral_qualification_assessments
with (security_invoker = true)
as select * from app.referral_qualification_assessments;

revoke all on api.published_learning_resources, api.learning_resource_admin, api.referral_qualification_assessments from public, anon;
grant select on api.published_learning_resources, api.learning_resource_admin, api.referral_qualification_assessments to authenticated;

create or replace function api.create_learning_resource(p_input jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_resource_id uuid;
  v_version_id uuid;
  v_source jsonb;
begin
  if not (
    private.has_platform_role('platform_admin'::app.platform_role)
    or private.has_platform_role('compliance_admin'::app.platform_role)
  ) then raise exception 'Content administration is required'; end if;

  insert into app.learning_resources(slug, resource_type, category_key, audience)
  values (
    p_input ->> 'slug',
    coalesce(p_input ->> 'resourceType', 'guide'),
    p_input ->> 'categoryKey',
    coalesce(p_input ->> 'audience', 'investor_and_professional')
  ) returning id into v_resource_id;

  insert into app.learning_resource_versions(
    resource_id, version, title, summary, body_markdown, disclaimer,
    reading_minutes, author_id
  ) values (
    v_resource_id, 1, p_input -> 'title', p_input -> 'summary',
    p_input -> 'bodyMarkdown', p_input -> 'disclaimer',
    p_input -> 'readingMinutes', (select auth.uid())
  ) returning id into v_version_id;

  for v_source in select value from jsonb_array_elements(coalesce(p_input -> 'sources', '[]'::jsonb)) loop
    insert into app.learning_resource_sources(version_id, title, url, publisher, published_on, accessed_at, notes, sort_order)
    values (
      v_version_id, v_source ->> 'title', v_source ->> 'url', v_source ->> 'publisher',
      nullif(v_source ->> 'publishedOn', '')::date, (v_source ->> 'accessedAt')::date,
      nullif(v_source ->> 'notes', ''), coalesce((v_source ->> 'sortOrder')::integer, 0)
    );
  end loop;

  insert into app.audit_events(actor_user_id, action, entity_type, entity_id, summary, after_state)
  values ((select auth.uid()), 'learning_resource.created', 'learning_resource', v_resource_id::text, 'Learning resource draft created.', jsonb_build_object('version_id', v_version_id));
  return jsonb_build_object('resourceId', v_resource_id, 'versionId', v_version_id);
end;
$$;

create or replace function api.update_learning_resource_draft(p_resource_id uuid, p_version_id uuid, p_input jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_source jsonb;
begin
  if not (
    private.has_platform_role('platform_admin'::app.platform_role)
    or private.has_platform_role('compliance_admin'::app.platform_role)
  ) then raise exception 'Content administration is required'; end if;
  if not exists (
    select 1 from app.learning_resource_versions
    where id = p_version_id and resource_id = p_resource_id and status = 'draft'
  ) then raise exception 'Editable draft was not found'; end if;

  update app.learning_resources set
    slug = p_input ->> 'slug',
    category_key = p_input ->> 'categoryKey'
  where id = p_resource_id;

  update app.learning_resource_versions set
    title = p_input -> 'title',
    summary = p_input -> 'summary',
    body_markdown = p_input -> 'bodyMarkdown',
    disclaimer = p_input -> 'disclaimer',
    reading_minutes = p_input -> 'readingMinutes'
  where id = p_version_id;

  delete from app.learning_resource_sources where version_id = p_version_id;
  for v_source in select value from jsonb_array_elements(coalesce(p_input -> 'sources', '[]'::jsonb)) loop
    insert into app.learning_resource_sources(version_id, title, url, publisher, published_on, accessed_at, notes, sort_order)
    values (
      p_version_id, v_source ->> 'title', v_source ->> 'url', v_source ->> 'publisher',
      nullif(v_source ->> 'publishedOn', '')::date, (v_source ->> 'accessedAt')::date,
      nullif(v_source ->> 'notes', ''), coalesce((v_source ->> 'sortOrder')::integer, 0)
    );
  end loop;
end;
$$;

create or replace function api.transition_learning_resource(p_resource_id uuid, p_version_id uuid, p_action text, p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version app.learning_resource_versions%rowtype;
  v_new_version_id uuid;
begin
  if not (
    private.has_platform_role('platform_admin'::app.platform_role)
    or private.has_platform_role('compliance_admin'::app.platform_role)
  ) then raise exception 'Content administration is required'; end if;

  select * into v_version from app.learning_resource_versions
  where id = p_version_id and resource_id = p_resource_id for update;
  if not found then raise exception 'Learning version was not found'; end if;

  if p_action = 'submit' then
    if v_version.status <> 'draft' then raise exception 'Only drafts can be submitted'; end if;
    if trim(coalesce(v_version.title ->> 'en', '')) = '' or trim(coalesce(v_version.title ->> 'tr', '')) = ''
      or trim(coalesce(v_version.summary ->> 'en', '')) = '' or trim(coalesce(v_version.summary ->> 'tr', '')) = ''
      or trim(coalesce(v_version.body_markdown ->> 'en', '')) = '' or trim(coalesce(v_version.body_markdown ->> 'tr', '')) = ''
      or trim(coalesce(v_version.disclaimer ->> 'en', '')) = '' or trim(coalesce(v_version.disclaimer ->> 'tr', '')) = ''
      or not exists (select 1 from app.learning_resource_sources where version_id = p_version_id)
    then raise exception 'Both languages, disclaimer, and at least one source are required'; end if;
    update app.learning_resource_versions set status = 'in_review', review_notes = null where id = p_version_id;
  elsif p_action = 'request_changes' then
    if v_version.status <> 'in_review' or trim(coalesce(p_note, '')) = '' then raise exception 'Review notes are required'; end if;
    update app.learning_resource_versions set status = 'draft', review_notes = trim(p_note) where id = p_version_id;
  elsif p_action = 'approve' then
    if v_version.status <> 'in_review' then raise exception 'Only in-review content can be approved'; end if;
    if v_version.author_id = (select auth.uid()) then raise exception 'Authors cannot approve their own content'; end if;
    update app.learning_resource_versions set status = 'approved', reviewer_id = (select auth.uid()), reviewed_at = now(), review_notes = null where id = p_version_id;
  elsif p_action = 'publish' then
    if v_version.status <> 'approved' then raise exception 'Only approved content can be published'; end if;
    update app.learning_resource_versions set status = 'superseded'
    where id = (select current_version_id from app.learning_resources where id = p_resource_id)
      and id <> p_version_id and status = 'published';
    update app.learning_resource_versions set
      status = 'published', compliance_owner_id = (select auth.uid()),
      effective_at = coalesce(effective_at, now()), published_at = now()
    where id = p_version_id;
    update app.learning_resources set current_version_id = p_version_id where id = p_resource_id;
  elsif p_action = 'withdraw' then
    if v_version.status <> 'published' then raise exception 'Only published content can be withdrawn'; end if;
    update app.learning_resource_versions set status = 'withdrawn', withdrawal_at = now() where id = p_version_id;
    update app.learning_resources set current_version_id = null where id = p_resource_id and current_version_id = p_version_id;
  elsif p_action = 'new_version' then
    if v_version.status not in ('published', 'approved') then raise exception 'A revision must start from approved or published content'; end if;
    insert into app.learning_resource_versions(
      resource_id, version, title, summary, body_markdown, disclaimer, reading_minutes, author_id
    ) values (
      p_resource_id,
      (select coalesce(max(version), 0) + 1 from app.learning_resource_versions where resource_id = p_resource_id),
      v_version.title, v_version.summary, v_version.body_markdown, v_version.disclaimer,
      v_version.reading_minutes, (select auth.uid())
    ) returning id into v_new_version_id;
    insert into app.learning_resource_sources(version_id, title, url, publisher, published_on, accessed_at, notes, sort_order)
    select v_new_version_id, title, url, publisher, published_on, accessed_at, notes, sort_order
    from app.learning_resource_sources where version_id = p_version_id;
    insert into app.audit_events(actor_user_id, action, entity_type, entity_id, summary, after_state)
    values ((select auth.uid()), 'learning_resource.new_version', 'learning_resource', p_resource_id::text, 'New learning resource draft created.', jsonb_build_object('version_id', v_new_version_id));
    return jsonb_build_object('resourceId', p_resource_id, 'versionId', v_new_version_id);
  else
    raise exception 'Unknown learning transition';
  end if;

  insert into app.audit_events(actor_user_id, action, entity_type, entity_id, summary, after_state)
  values ((select auth.uid()), 'learning_resource.' || p_action, 'learning_resource', p_resource_id::text, 'Learning resource workflow transition completed.', jsonb_build_object('version_id', p_version_id, 'action', p_action));
  return jsonb_build_object('resourceId', p_resource_id, 'versionId', p_version_id);
end;
$$;

create or replace function api.create_referral_qualification_assessment(p_referral_id uuid, p_input jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not private.partner_is_active((select auth.uid()))
    or not exists (
      select 1 from app.referrals referral
      where referral.id = p_referral_id and referral.owner_user_id = (select auth.uid())
    )
  then raise exception 'An owned referral and active professional account are required'; end if;
  insert into app.referral_qualification_assessments(
    referral_id, assessor_user_id, jurisdiction, account_type, answers, result,
    financial_result, jurisdiction_review, residence_country_code, residence_region_code,
    qualifying_criteria, om_context, candidate_routes, review_reasons, om_calculation,
    assessment_input, ruleset_id, source_urls, reassessment_triggers, acknowledgement_at
  ) values (
    p_referral_id, (select auth.uid()), p_input ->> 'jurisdiction', p_input ->> 'accountType',
    coalesce(p_input -> 'answers', '{}'::jsonb), p_input ->> 'result', p_input ->> 'financialResult',
    p_input ->> 'jurisdictionReview', p_input ->> 'residenceCountryCode', p_input ->> 'residenceRegionCode',
    coalesce(p_input -> 'qualifyingCriteria', '[]'::jsonb), coalesce(p_input -> 'omContext', '{}'::jsonb),
    coalesce(p_input -> 'candidateRoutes', '[]'::jsonb), coalesce(p_input -> 'reviewReasons', '[]'::jsonb),
    coalesce(p_input -> 'omCalculation', '{}'::jsonb), coalesce(p_input -> 'assessmentInput', '{}'::jsonb),
    p_input ->> 'rulesetId', coalesce(p_input -> 'sourceUrls', '[]'::jsonb),
    coalesce(p_input -> 'reassessmentTriggers', '[]'::jsonb), (p_input ->> 'acknowledgementAt')::timestamptz
  ) returning id into v_id;
  insert into app.audit_events(actor_user_id, action, entity_type, entity_id, summary, after_state)
  values ((select auth.uid()), 'referral.qualification_recorded', 'referral', p_referral_id::text, 'Investor qualification assessment recorded.', jsonb_build_object('assessment_id', v_id));
  return v_id;
end;
$$;

revoke execute on function api.create_learning_resource(jsonb) from public, anon;
revoke execute on function api.update_learning_resource_draft(uuid, uuid, jsonb) from public, anon;
revoke execute on function api.transition_learning_resource(uuid, uuid, text, text) from public, anon;
revoke execute on function api.create_referral_qualification_assessment(uuid, jsonb) from public, anon;
grant execute on function api.create_learning_resource(jsonb) to authenticated;
grant execute on function api.update_learning_resource_draft(uuid, uuid, jsonb) to authenticated;
grant execute on function api.transition_learning_resource(uuid, uuid, text, text) to authenticated;
grant execute on function api.create_referral_qualification_assessment(uuid, jsonb) to authenticated;
