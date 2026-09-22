begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(19);

select extensions.has_table('public', 'research_subprofile_contracts', 'immutable subprofile registry exists');
select extensions.has_table('public', 'research_subprofile_assignments', 'assignment history exists');
select extensions.has_table('public', 'research_subprofile_secondary_exposures', 'secondary exposure history exists');
select extensions.is((select count(*)::integer from public.research_subprofile_contracts), 5, 'five PHARMA_V1 subprofiles are registered');
select extensions.ok(exists(select 1 from pg_constraint where conrelid='public.research_subprofile_assignments'::regclass and conname='research_subprofile_assignments_no_reviewed_overlap'), 'reviewed effective periods cannot overlap');
select extensions.ok(exists(select 1 from pg_indexes where schemaname='public' and indexname='research_subprofile_assignments_idempotency_key' and indexdef ilike 'create unique index%'), 'assignment retries have a stable unique identity');

select extensions.ok((select relrowsecurity from pg_class where oid='public.research_subprofile_contracts'::regclass), 'contract registry has RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid='public.research_subprofile_assignments'::regclass), 'assignments have RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid='public.research_subprofile_secondary_exposures'::regclass), 'secondary exposures have RLS enabled');

select extensions.ok(has_table_privilege('authenticated', 'public.research_subprofile_contracts', 'SELECT'), 'authenticated users can read contract definitions');
select extensions.ok(has_table_privilege('authenticated', 'public.research_subprofile_assignments', 'SELECT'), 'authenticated users can read held-security assignments through RLS');
select extensions.ok(not has_table_privilege('authenticated', 'public.research_subprofile_assignments', 'INSERT'), 'browser clients cannot insert assignments');
select extensions.ok(not has_table_privilege('authenticated', 'public.research_subprofile_assignments', 'UPDATE'), 'browser clients cannot update assignments');
select extensions.ok(not has_table_privilege('authenticated', 'public.research_subprofile_assignments', 'DELETE'), 'browser clients cannot delete assignments');
select extensions.ok(has_table_privilege('service_role', 'public.research_subprofile_assignments', 'INSERT'), 'service role may append assignments');
select extensions.ok(has_column_privilege('service_role', 'public.research_subprofile_assignments', 'effective_to', 'UPDATE'), 'service role may close an effective interval');
select extensions.ok(not has_table_privilege('service_role', 'public.research_subprofile_assignments', 'DELETE'), 'service role cannot delete assignment history');
select extensions.ok(has_table_privilege('service_role', 'public.research_subprofile_secondary_exposures', 'INSERT'), 'service role may append secondary exposures');
select extensions.ok(not has_table_privilege('service_role', 'public.research_subprofile_secondary_exposures', 'UPDATE'), 'service role cannot rewrite secondary exposures');

select * from extensions.finish();
rollback;
