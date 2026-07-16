create table app.commission_status_history (
  id uuid primary key default gen_random_uuid(),
  commission_entry_id uuid not null references app.commission_entries(id) on delete cascade,
  status app.commission_status not null,
  changed_by uuid not null references auth.users(id) on delete restrict,
  payment_reference text,
  note text,
  occurred_at timestamptz not null default now()
);

create index commission_status_history_entry_idx
  on app.commission_status_history(commission_entry_id, occurred_at desc);

alter table app.commission_status_history enable row level security;
create policy commission_history_hunter_finance on app.commission_status_history for all to authenticated
using (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
)
with check (
  (select private.has_platform_role('finance_admin'::app.platform_role))
  or (select private.has_platform_role('platform_admin'::app.platform_role))
);

grant select, insert on app.commission_status_history to authenticated;
