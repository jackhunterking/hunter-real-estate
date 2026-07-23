-- Classification taxonomies (strategy / asset class / region) move from
-- hardcoded arrays in lib/capital/taxonomies.ts into Supabase, so the back end
-- controls the labels and display colors and a future admin panel can edit them.
-- Reads are public (labels/colors appear on the marketing site); writes are
-- gated to Hunter admins, consistent with all other content tables.
--
-- Statements are idempotent so re-application (MCP apply + later db push) is safe.

create table if not exists app.taxonomies (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('strategy', 'asset_class', 'region')),
  key text not null,
  label jsonb not null,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, key)
);

drop trigger if exists taxonomies_set_updated_at on app.taxonomies;
create trigger taxonomies_set_updated_at
  before update on app.taxonomies
  for each row execute function private.set_updated_at();

alter table app.taxonomies enable row level security;

-- The api.taxonomies view is security_invoker, so the querying role needs a
-- base-table SELECT grant (RLS still governs which rows are visible).
grant select on app.taxonomies to anon, authenticated;

drop policy if exists taxonomies_public_read on app.taxonomies;
create policy taxonomies_public_read on app.taxonomies
  for select to anon, authenticated
  using (true);

drop policy if exists taxonomies_admin_all on app.taxonomies;
create policy taxonomies_admin_all on app.taxonomies
  for all to authenticated
  using ((select private.is_hunter_admin()))
  with check ((select private.is_hunter_admin()));

-- Data-API projection.
create or replace view api.taxonomies with (security_invoker = true) as
select kind, key, label, color, sort_order
from app.taxonomies
order by kind, sort_order;

grant select on api.taxonomies to anon, authenticated;

-- Reference rows (migrated verbatim from lib/capital/taxonomies.ts).
insert into app.taxonomies (kind, key, label, color, sort_order) values
  ('strategy',    'core-plus',         '{"en":"Core Plus","tr":"Core Plus"}',            '#61765b', 0),
  ('strategy',    'value-add',         '{"en":"Value Add","tr":"Değer Artırma"}',        '#a27138', 1),
  ('asset_class', 'multifamily',       '{"en":"Multifamily","tr":"Çok Konutlu"}',        '#365f72', 0),
  ('asset_class', 'commercial',        '{"en":"Commercial","tr":"Ticari"}',              '#806b46', 1),
  ('region',      'ontario',           '{"en":"Ontario","tr":"Ontario"}',                '#456b63', 0),
  ('region',      'alberta',           '{"en":"Alberta","tr":"Alberta"}',                '#8b6645', 1),
  ('region',      'saskatchewan',      '{"en":"Saskatchewan","tr":"Saskatchewan"}',      '#7b7652', 2),
  ('region',      'manitoba',          '{"en":"Manitoba","tr":"Manitoba"}',              '#59717a', 3),
  ('region',      'british-columbia',  '{"en":"British Columbia","tr":"British Columbia"}', '#5c7157', 4)
on conflict (kind, key) do update
  set label = excluded.label, color = excluded.color, sort_order = excluded.sort_order;
