begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(12);

select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'assignment_status', 'secondary exposure lifecycle is stored');
select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'confidence_state', 'secondary exposure confidence is stored');
select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'effective_from', 'secondary exposure effective start is stored');
select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'effective_to', 'secondary exposure effective end is stored');
select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'reason_code', 'secondary exposure reason is stored');
select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'reviewed_by', 'secondary exposure reviewer is stored');
select extensions.has_column('public', 'research_subprofile_secondary_exposures', 'reviewed_at', 'secondary exposure review time is stored');

select extensions.ok(exists(
  select 1 from pg_constraint
  where conrelid = 'public.research_subprofile_secondary_exposures'::regclass
    and conname = 'research_subprofile_secondary_materiality'
), 'secondary materiality constraint exists');
select extensions.ok(exists(
  select 1 from pg_constraint
  where conrelid = 'public.research_subprofile_secondary_exposures'::regclass
    and conname = 'research_subprofile_secondary_status'
), 'secondary lifecycle constraint exists');
select extensions.ok(exists(
  select 1 from pg_constraint
  where conrelid = 'public.research_subprofile_secondary_exposures'::regclass
    and conname = 'research_subprofile_secondary_review_complete'
), 'reviewed secondary exposures require provenance');
select extensions.ok(has_table_privilege('service_role', 'public.research_subprofile_secondary_exposures', 'INSERT'), 'service role may append secondary exposures');
select extensions.ok(not has_table_privilege('service_role', 'public.research_subprofile_secondary_exposures', 'UPDATE'), 'secondary exposure history remains immutable');

select * from extensions.finish();
rollback;
