-- Offering authoring: editable working content + a role-gated compose/publish RPC.
--
-- Before this migration the live `content_snapshot` was hand-authored. This adds
-- an editable working store (`app.offerings.draft_content`) plus a normalized
-- manager payload, and an `api.publish_offering` RPC that COMPOSES the immutable
-- published snapshot from those inputs — mirroring how the learning module
-- publishes (`api.transition_learning_resource`). A future admin panel edits the
-- working rows and calls `api.publish_offering`; the seed script uses the same
-- path (as the service role) so seeding and admin publishing never diverge.

-- 1. Editable working content ------------------------------------------------

-- Offering-level working content (the full OfferingBundle minus id/slug/manager/
-- properties, which are composed at publish time). Mirrors the `content jsonb`
-- convention already used by app.share_classes / app.properties.
alter table app.offerings
  add column if not exists draft_content jsonb not null default '{}'::jsonb;

-- Fund managers gain a working content payload so the composed `manager` object
-- carries every field the OfferingBundle needs (description, officeAddress, …)
-- that has no dedicated column today.
alter table app.fund_managers
  add column if not exists content jsonb not null default '{}'::jsonb;

-- 2. Snapshot composition ----------------------------------------------------

-- Pure composition: overlay id/slug/manager/properties (authoritative from the
-- normalized tables) on top of the offering's editable draft_content. No auth
-- side effects — callers gate access.
create or replace function app.compose_offering_snapshot(p_offering_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(o.draft_content, '{}'::jsonb)
    || pg_catalog.jsonb_build_object(
         'id', o.id::text,
         'slug', o.slug,
         'manager', coalesce(m.content, '{}'::jsonb),
         'properties', coalesce(
           (select pg_catalog.jsonb_agg(p.content order by op.sort_order)
              from app.offering_properties op
              join app.properties p on p.id = op.property_id
             where op.offering_id = o.id),
           '[]'::jsonb)
       )
  from app.offerings o
  join app.fund_managers m on m.id = o.manager_id
  where o.id = p_offering_id;
$$;

-- 3. Publish -----------------------------------------------------------------

-- Compose + version + publish, walking the enforced draft→in_review→approved→
-- published progression. Callable by a Hunter admin (MFA + platform role) OR the
-- service role (seed/infra). `p_actor` supplies author/reviewer/compliance when
-- there is no interactive user (service-role seed).
create or replace function api.publish_offering(p_offering_id uuid, p_actor uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_snapshot jsonb;
  v_version_id uuid;
  v_version text;
begin
  if not (
    private.is_hunter_admin()
    or (select auth.jwt() ->> 'role') = 'service_role'
  ) then
    raise exception 'Content administration is required';
  end if;

  v_actor := coalesce((select auth.uid()), p_actor);
  if v_actor is null then
    raise exception 'A publishing actor is required';
  end if;

  v_snapshot := app.compose_offering_snapshot(p_offering_id);
  if v_snapshot is null then
    raise exception 'Offering % was not found', p_offering_id;
  end if;
  if coalesce(trim(v_snapshot #>> '{name,en}'), '') = ''
     or coalesce(trim(v_snapshot #>> '{name,tr}'), '') = '' then
    raise exception 'Offering requires a bilingual name before publishing';
  end if;
  if pg_catalog.jsonb_array_length(coalesce(v_snapshot -> 'shareClasses', '[]'::jsonb)) = 0 then
    raise exception 'Offering requires at least one share class before publishing';
  end if;
  if pg_catalog.jsonb_array_length(coalesce(v_snapshot -> 'properties', '[]'::jsonb)) = 0 then
    raise exception 'Offering requires at least one property before publishing';
  end if;

  v_version := 'v' || (
    select count(*) + 1 from app.offering_content_versions where offering_id = p_offering_id
  )::text;

  insert into app.offering_content_versions(offering_id, version, status, content_snapshot, author_id)
  values (p_offering_id, v_version, 'draft', v_snapshot, v_actor)
  returning id into v_version_id;

  update app.offering_content_versions set status = 'in_review' where id = v_version_id;
  update app.offering_content_versions
     set status = 'approved', reviewer_id = v_actor, compliance_owner_id = v_actor
   where id = v_version_id;

  -- Retire any previously published version before promoting the new one.
  update app.offering_content_versions
     set status = 'superseded'
   where offering_id = p_offering_id and status = 'published' and id <> v_version_id;

  update app.offering_content_versions
     set status = 'published', effective_at = coalesce(effective_at, now()), published_at = now()
   where id = v_version_id;

  update app.offerings
     set current_version_id = v_version_id, status = 'published', updated_at = now()
   where id = p_offering_id;

  insert into app.audit_events(actor_user_id, action, entity_type, entity_id, summary)
  values (v_actor, 'offering.publish', 'offering', p_offering_id::text, 'Offering content published.');

  return v_version_id;
end;
$$;

grant execute on function api.publish_offering(uuid, uuid) to authenticated, service_role;
