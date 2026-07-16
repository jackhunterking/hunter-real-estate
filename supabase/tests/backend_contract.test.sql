begin;
create extension if not exists pgtap with schema extensions;

select plan(22);

select has_schema('app', 'domain schema exists');
select has_schema('api', 'Data API schema exists');
select has_schema('private', 'private operational schema exists');

select has_table('app', 'contacts', 'contacts table exists');
select has_table('app', 'lead_submissions', 'lead submissions table exists');
select has_table('app', 'offerings', 'offerings table exists');
select has_table('app', 'clients', 'clients table exists');
select has_table('private', 'email_jobs', 'email jobs table exists');
select has_table('private', 'resend_events', 'Resend event table exists');
select has_table('private', 'audit_events', 'private audit table exists');

select has_view('api', 'published_offerings', 'published offering API exists');
select has_view('api', 'admin_leads', 'lead inbox API exists');

select has_function('api', 'submit_guide_request', array['jsonb'], 'guide transaction exists');
select has_function('api', 'submit_capital_intake', array['jsonb'], 'capital intake transaction exists');
select has_function('api', 'submit_investor_readiness', array['jsonb'], 'readiness transaction exists');
select has_function('api', 'claim_email_jobs', array['integer'], 'email locking function exists');
select has_function('api', 'record_resend_event', array['text','text','timestamp with time zone','text','text','jsonb'], 'webhook transition function exists');

select ok(not has_schema_privilege('anon', 'app', 'usage'), 'anonymous role cannot address app schema');
select ok(not has_schema_privilege('anon', 'private', 'usage'), 'anonymous role cannot address private schema');
select ok(has_schema_privilege('anon', 'api', 'usage'), 'anonymous role can address api schema');
select ok(not has_table_privilege('authenticated', 'app.contacts', 'delete'), 'contacts cannot be deleted directly');
select ok(not has_table_privilege('authenticated', 'private.email_jobs', 'select'), 'email jobs are not user-readable');

select * from finish();
rollback;
