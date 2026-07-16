create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists app;
create schema if not exists api;
create schema if not exists private;

revoke all on schema app from public;
revoke all on schema api from public;
revoke all on schema private from public;

grant usage on schema api to anon, authenticated, service_role;
grant usage on schema app to authenticated, service_role;
grant usage on schema private to service_role;

alter default privileges in schema app revoke all on tables from anon, authenticated;
alter default privileges in schema app revoke all on sequences from anon, authenticated;
alter default privileges in schema app revoke execute on functions from public, anon, authenticated;
alter default privileges in schema api revoke all on tables from anon, authenticated;
alter default privileges in schema api revoke execute on functions from public, anon, authenticated;
alter default privileges in schema private revoke all on tables from anon, authenticated;
alter default privileges in schema private revoke execute on functions from public, anon, authenticated;

grant all on all tables in schema app to service_role;
grant all on all sequences in schema app to service_role;
grant all on all tables in schema private to service_role;
grant all on all sequences in schema private to service_role;
