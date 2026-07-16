alter function api.submit_guide_request(jsonb) set schema private;
alter function api.submit_capital_intake(jsonb) set schema private;
alter function api.submit_investor_readiness(jsonb) set schema private;
alter function api.get_email_job(uuid) set schema private;
alter function api.claim_email_jobs(integer) set schema private;
alter function api.mark_email_job_sent(uuid, text) set schema private;
alter function api.mark_email_job_failed(uuid, text) set schema private;
alter function api.record_resend_event(text, text, timestamptz, text, text, jsonb) set schema private;

revoke execute on function private.submit_guide_request(jsonb) from public, anon, authenticated;
revoke execute on function private.submit_capital_intake(jsonb) from public, anon, authenticated;
revoke execute on function private.submit_investor_readiness(jsonb) from public, anon, authenticated;
revoke execute on function private.get_email_job(uuid) from public, anon, authenticated;
revoke execute on function private.claim_email_jobs(integer) from public, anon, authenticated;
revoke execute on function private.mark_email_job_sent(uuid, text) from public, anon, authenticated;
revoke execute on function private.mark_email_job_failed(uuid, text) from public, anon, authenticated;
revoke execute on function private.record_resend_event(text, text, timestamptz, text, text, jsonb) from public, anon, authenticated;

grant execute on function private.submit_guide_request(jsonb) to service_role;
grant execute on function private.submit_capital_intake(jsonb) to service_role;
grant execute on function private.submit_investor_readiness(jsonb) to service_role;
grant execute on function private.get_email_job(uuid) to service_role;
grant execute on function private.claim_email_jobs(integer) to service_role;
grant execute on function private.mark_email_job_sent(uuid, text) to service_role;
grant execute on function private.mark_email_job_failed(uuid, text) to service_role;
grant execute on function private.record_resend_event(text, text, timestamptz, text, text, jsonb) to service_role;

create function api.submit_guide_request(p_input jsonb)
returns jsonb
language sql
set search_path = ''
as $$
  select private.submit_guide_request(p_input);
$$;

create function api.submit_capital_intake(p_input jsonb)
returns jsonb
language sql
set search_path = ''
as $$
  select private.submit_capital_intake(p_input);
$$;

create function api.submit_investor_readiness(p_input jsonb)
returns jsonb
language sql
set search_path = ''
as $$
  select private.submit_investor_readiness(p_input);
$$;

create function api.get_email_job(p_job_id uuid)
returns jsonb
language sql
set search_path = ''
as $$
  select private.get_email_job(p_job_id);
$$;

create function api.claim_email_jobs(p_limit integer default 20)
returns table(id uuid)
language sql
set search_path = ''
as $$
  select claimed.id from private.claim_email_jobs(p_limit) claimed;
$$;

create function api.mark_email_job_sent(p_job_id uuid, p_resend_email_id text)
returns void
language sql
set search_path = ''
as $$
  select private.mark_email_job_sent(p_job_id, p_resend_email_id);
$$;

create function api.mark_email_job_failed(p_job_id uuid, p_reason text)
returns void
language sql
set search_path = ''
as $$
  select private.mark_email_job_failed(p_job_id, p_reason);
$$;

create function api.record_resend_event(
  p_event_id text,
  p_event_type text,
  p_event_at timestamptz,
  p_resend_email_id text,
  p_recipient text,
  p_event_data jsonb
)
returns void
language sql
set search_path = ''
as $$
  select private.record_resend_event(
    p_event_id,
    p_event_type,
    p_event_at,
    p_resend_email_id,
    p_recipient,
    p_event_data
  );
$$;

revoke execute on function api.submit_guide_request(jsonb) from public, anon, authenticated;
revoke execute on function api.submit_capital_intake(jsonb) from public, anon, authenticated;
revoke execute on function api.submit_investor_readiness(jsonb) from public, anon, authenticated;
revoke execute on function api.get_email_job(uuid) from public, anon, authenticated;
revoke execute on function api.claim_email_jobs(integer) from public, anon, authenticated;
revoke execute on function api.mark_email_job_sent(uuid, text) from public, anon, authenticated;
revoke execute on function api.mark_email_job_failed(uuid, text) from public, anon, authenticated;
revoke execute on function api.record_resend_event(text, text, timestamptz, text, text, jsonb) from public, anon, authenticated;

grant execute on function api.submit_guide_request(jsonb) to service_role;
grant execute on function api.submit_capital_intake(jsonb) to service_role;
grant execute on function api.submit_investor_readiness(jsonb) to service_role;
grant execute on function api.get_email_job(uuid) to service_role;
grant execute on function api.claim_email_jobs(integer) to service_role;
grant execute on function api.mark_email_job_sent(uuid, text) to service_role;
grant execute on function api.mark_email_job_failed(uuid, text) to service_role;
grant execute on function api.record_resend_event(text, text, timestamptz, text, text, jsonb) to service_role;

do $$
declare
  missing_fk_index record;
  index_name text;
begin
  for missing_fk_index in
    with foreign_keys as (
      select
        constraint_record.oid,
        constraint_record.conname,
        constraint_record.conrelid,
        constraint_record.conkey,
        namespace_record.nspname as schema_name,
        table_record.relname as table_name,
        string_agg(quote_ident(attribute_record.attname), ', ' order by key_column.ordinality) as indexed_columns
      from pg_constraint constraint_record
      join pg_class table_record
        on table_record.oid = constraint_record.conrelid
      join pg_namespace namespace_record
        on namespace_record.oid = table_record.relnamespace
      join lateral unnest(constraint_record.conkey) with ordinality as key_column(attnum, ordinality)
        on true
      join pg_attribute attribute_record
        on attribute_record.attrelid = constraint_record.conrelid
       and attribute_record.attnum = key_column.attnum
      where constraint_record.contype = 'f'
        and namespace_record.nspname = 'app'
      group by
        constraint_record.oid,
        constraint_record.conname,
        constraint_record.conrelid,
        constraint_record.conkey,
        namespace_record.nspname,
        table_record.relname
    )
    select foreign_keys.*
    from foreign_keys
    where not exists (
      select 1
      from pg_index index_record
      where index_record.indrelid = foreign_keys.conrelid
        and index_record.indisvalid
        and index_record.indisready
        and (index_record.indkey::smallint[])[0:cardinality(foreign_keys.conkey) - 1]
          = foreign_keys.conkey
    )
  loop
    index_name := left('idx_' || missing_fk_index.conname, 63);
    execute format(
      'create index if not exists %I on %I.%I (%s)',
      index_name,
      missing_fk_index.schema_name,
      missing_fk_index.table_name,
      missing_fk_index.indexed_columns
    );
  end loop;
end;
$$;
