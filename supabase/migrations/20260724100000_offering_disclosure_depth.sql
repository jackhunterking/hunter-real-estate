-- Disclosure depth: who a published fact is written for, and what an
-- independent firm actually did.
--
-- Two gaps the Lankin OM reconciliation exposed:
--
--   1. Normalizing the OM turned every term into a `fundDefinedFact`, including
--      the dealer-compensation disclosures — selling commission, trailer fee,
--      the sales channel that names the dealer. Those belong in the Offering
--      Memorandum and the advisor view, not on the page an investor decides
--      from. `audience` marks them; lib/capital/key-facts.ts filters on it.
--
--   2. `offering_service_providers` carried a name and a URL and nothing else,
--      so the interface had no date to show beside an auditor except the
--      offering's `verified_at` — Hunter's own data-check date, which then
--      reads as an audit date. `scope` and `as_of` carry the firm's own
--      engagement ("FY2025 statements, report dated 30 Apr 2026") and
--      `source_id` says which registered document names it.
--
-- `structureLabel` and `aumNote` need no columns: compose overlays row-owned
-- fields on top of draft_content, so keys the rows do not own pass through —
-- the documented fallback path (20260723170100).
--
-- WHY THIS PATCHES INSTEAD OF RE-DECLARING THE FUNCTIONS
-- compose_offering_snapshot and apply_offering_bundle are long, and they have
-- been amended by several migrations since they were introduced (most recently
-- to unlink removed properties). Pasting a full `create or replace` here would
-- silently revert any amendment not present in the copy that was pasted. So
-- this migration rewrites only the fragments it owns, against whatever
-- definition is live, and raises if an anchor is missing — a loud failure
-- rather than a quiet no-op.

-- 1. Columns ------------------------------------------------------------------

alter table app.offering_fund_defined_facts
  add column if not exists audience text not null default 'investor';

do $cons$
begin
  if not exists (
    select 1 from pg_catalog.pg_constraint
     where conrelid = 'app.offering_fund_defined_facts'::regclass
       and conname = 'offering_fund_defined_facts_audience_check'
  ) then
    alter table app.offering_fund_defined_facts
      add constraint offering_fund_defined_facts_audience_check
      check (audience in ('investor','advisor'));
  end if;
end $cons$;

alter table app.offering_service_providers
  add column if not exists scope jsonb,          -- LocalizedText: what the firm did
  add column if not exists as_of date,           -- the firm's own report/opinion date
  add column if not exists source_id text;       -- the registered source that names it

-- 2. Patch the two functions --------------------------------------------------
--
-- The patch runs as a throwaway function rather than an anonymous DO block so
-- the migration runner sees one ordinary statement, and its anchors are plain
-- quoted literals rather than dollar-quoted strings for the same reason.

create or replace function app._patch_offering_disclosure_depth()
returns void
language plpgsql
as $fn$
declare
  v_def  text;
  v_from text;
  v_to   text;
begin
  select pg_catalog.pg_get_functiondef(p.oid) into v_def
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'app' and p.proname = 'compose_offering_snapshot';
  if v_def is null then
    raise exception 'app.compose_offering_snapshot not found';
  end if;

  v_from := E'''effectiveDate'', f.effective_date, ''approval'', f.approval\n                )) order by f.sort_order)';
  v_to   := E'''effectiveDate'', f.effective_date, ''approval'', f.approval,\n                  ''audience'', f.audience\n                )) order by f.sort_order)';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'compose: share-class fundDefinedFacts anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  v_from := E'''approval'', f.approval\n          )) order by f.sort_order)';
  v_to   := E'''approval'', f.approval, ''audience'', f.audience\n          )) order by f.sort_order)';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'compose: offering-level fundDefinedFacts anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  v_from := E'pg_catalog.jsonb_build_object(''name'', sp.name, ''url'', sp.url)';
  v_to   := E'pg_catalog.jsonb_build_object(''name'', sp.name, ''url'', sp.url, ''scope'', sp.scope, ''asOfDate'', sp.as_of, ''sourceId'', sp.source_id)';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'compose: serviceProviders anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  execute v_def;

  select pg_catalog.pg_get_functiondef(p.oid) into v_def
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'app' and p.proname = 'apply_offering_bundle';
  if v_def is null then
    raise exception 'app.apply_offering_bundle not found';
  end if;

  v_from := E'insert into app.offering_service_providers (offering_id, role, name, url)\n  select v_offering_id, kv.key, kv.value ->> ''name'', kv.value ->> ''url''';
  v_to   := E'insert into app.offering_service_providers (offering_id, role, name, url, scope, as_of, source_id)\n  select v_offering_id, kv.key, kv.value ->> ''name'', kv.value ->> ''url'',\n         kv.value -> ''scope'', nullif(kv.value ->> ''asOfDate'', '''')::date, kv.value ->> ''sourceId''';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'apply: serviceProviders insert anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  v_from := E'source_id, source_page, effective_date, approval, sort_order';
  v_to   := E'source_id, source_page, effective_date, approval, audience, sort_order';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'apply: fundDefinedFacts column list anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  v_from := E'f ->> ''approval'', (ford - 1)::int';
  v_to   := E'f ->> ''approval'', coalesce(f ->> ''audience'', ''investor''), (ford - 1)::int';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'apply: share-class fact values anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  v_from := E'f ->> ''approval'', (ord - 1)::int';
  v_to   := E'f ->> ''approval'', coalesce(f ->> ''audience'', ''investor''), (ord - 1)::int';
  if pg_catalog.strpos(v_def, v_from) = 0 then
    raise exception 'apply: offering-level fact values anchor not found';
  end if;
  v_def := pg_catalog.replace(v_def, v_from, v_to);

  execute v_def;
end;
$fn$;

select app._patch_offering_disclosure_depth();
drop function app._patch_offering_disclosure_depth();

notify pgrst, 'reload schema';
