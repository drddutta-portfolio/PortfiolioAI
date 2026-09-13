begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(20);

select extensions.has_table('public','position_sizing_assessments','D35B assessment table exists');
select extensions.has_column('public','position_sizing_assessments','engine_version','engine version is persisted');
select extensions.has_column('public','position_sizing_assessments','evaluation_key','idempotency key is persisted');
select extensions.has_column('public','position_sizing_assessments','assessment_state','assessment state is persisted');
select extensions.has_column('public','position_sizing_assessments','suggested_target_weight','target weight is persisted');
select extensions.has_column('public','position_sizing_assessments','suggested_minimum_weight','minimum weight is persisted');
select extensions.has_column('public','position_sizing_assessments','suggested_maximum_weight','maximum weight is persisted');
select extensions.has_column('public','position_sizing_assessments','reason_codes','reason codes are persisted');
select extensions.has_column('public','position_sizing_assessments','input_snapshot','canonical input snapshot is persisted');
select extensions.has_column('public','position_sizing_assessments','source_score_run_id','score lineage is persisted');
select extensions.has_column('public','position_sizing_assessments','source_recommendation_run_id','recommendation lineage is persisted');

select extensions.ok(
  exists (
    select 1 from pg_indexes
    where schemaname='public'
      and tablename='position_sizing_assessments'
      and indexname='position_sizing_assessments_idempotency_uq'
      and indexdef ilike 'create unique index%'
  ),
  'assessment idempotency is enforced by a unique index'
);

select extensions.ok(
  exists (
    select 1 from pg_policies
    where schemaname='public'
      and tablename='position_sizing_assessments'
      and policyname='position_sizing_assessments_owner_read'
  ),
  'owner-scoped read policy exists'
);

select extensions.ok(has_table_privilege('authenticated','public.position_sizing_assessments','SELECT'),'authenticated browser can read owner-scoped assessments');
select extensions.ok(not has_table_privilege('authenticated','public.position_sizing_assessments','INSERT'),'authenticated browser cannot insert sizing assessments');
select extensions.ok(not has_table_privilege('authenticated','public.position_sizing_assessments','UPDATE'),'authenticated browser cannot mutate sizing assessments');
select extensions.ok(not has_table_privilege('authenticated','public.position_sizing_assessments','DELETE'),'authenticated browser cannot delete sizing assessments');
select extensions.ok(has_table_privilege('service_role','public.position_sizing_assessments','INSERT'),'trusted service role can append sizing assessments');
select extensions.ok(not has_table_privilege('service_role','public.position_sizing_assessments','UPDATE'),'trusted service role cannot rewrite sizing assessments');
select extensions.ok(not has_table_privilege('service_role','public.position_sizing_assessments','DELETE'),'trusted service role cannot delete sizing assessments');

select * from extensions.finish();
rollback;
