-- api.seed_offering: idempotent import of one offering bundle (jsonb) into the
-- normalized working tables, then publish via api.publish_offering.
--
-- This is the write path the seed script (scripts/seed-content.ts) uses — it
-- passes each committed supabase/seed/offerings/*.json bundle straight through
-- without any hand-transcription. It also gives the future admin panel a clean
-- "import an offering" entry point. Role-gated to Hunter admins or the service
-- role, consistent with api.publish_offering.

create or replace function api.seed_offering(p_bundle jsonb, p_actor uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid;
  v_manager jsonb;
  v_manager_id uuid;
  v_offering_id uuid;
  v_prop record;
begin
  if not (
    private.is_hunter_admin()
    or (select auth.jwt() ->> 'role') = 'service_role'
  ) then
    raise exception 'Content administration is required';
  end if;

  v_actor := coalesce((select auth.uid()), p_actor, (select id from auth.users order by created_at limit 1));
  if v_actor is null then
    raise exception 'A seeding actor is required';
  end if;

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

  for v_prop in
    select value as prop, ordinality
    from jsonb_array_elements(coalesce(p_bundle -> 'properties', '[]'::jsonb)) with ordinality
  loop
    insert into app.properties (slug, name, address, content, status)
    values (
      v_prop.prop ->> 'id',
      v_prop.prop -> 'name',
      coalesce(v_prop.prop -> 'address', '{}'::jsonb),
      v_prop.prop,
      'published'
    )
    on conflict (slug) do update set
      name = excluded.name, address = excluded.address,
      content = excluded.content, status = 'published', updated_at = now();

    insert into app.offering_properties (offering_id, property_id, sort_order)
    values (
      v_offering_id,
      (select id from app.properties where slug = v_prop.prop ->> 'id'),
      (v_prop.ordinality - 1)::int
    )
    on conflict (offering_id, property_id) do update set sort_order = excluded.sort_order;
  end loop;

  perform api.publish_offering(v_offering_id, v_actor);
  return v_offering_id;
end;
$$;

grant execute on function api.seed_offering(jsonb, uuid) to authenticated, service_role;
