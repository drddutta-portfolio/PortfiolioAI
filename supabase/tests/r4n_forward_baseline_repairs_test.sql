begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

select extensions.ok(
  exists(select 1 from pg_extension where extname = 'pg_cron'),
  'pg_cron exists in the final schema'
);
select extensions.has_table('cron', 'job', 'cron job catalog exists');
select extensions.ok(
  exists(
    select 1 from pg_constraint
    where conrelid = 'public.refresh_domain_policies'::regclass
      and conname = 'refresh_domain_policy_disabled'
      and convalidated
  ),
  'disabled refresh-policy constraint exists and is validated'
);
select extensions.ok(
  not exists(
    select 1 from public.refresh_domain_policies
    where (is_enabled and freshness_basis = 'DISABLED')
       or (not is_enabled and freshness_basis <> 'DISABLED')
  ),
  'all refresh policies satisfy the canonical enabled/basis invariant'
);
select extensions.ok(
  not exists(
    select 1 from public.refresh_domain_policies
    where source_code = 'COMPANY_EXCHANGE_FILING'
      and data_domain = 'NEWS'
      and policy_version = 6
      and (is_enabled or effective_to is null or freshness_basis <> 'DISABLED')
  ),
  'NEWS policy V6 is absent or canonically retired'
);
select extensions.has_function(
  'public',
  'get_portfolio_profile_weight_context_v1',
  array['uuid', 'uuid', 'text'],
  'portfolio profile weight function exists with its original signature'
);
select extensions.ok(
  pg_get_functiondef('public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure)
    like '%count(*)::integer as position_count%',
  'totals CTE uses a non-conflicting position_count alias'
);
select extensions.ok(
  pg_get_functiondef('public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure)
    like '%select t.position_count from totals t%',
  'function result explicitly qualifies the totals alias'
);
select extensions.ok(
  has_function_privilege('authenticated', 'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)', 'EXECUTE'),
  'authenticated execution remains granted'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)', 'EXECUTE'),
  'anonymous execution remains revoked'
);

select * from extensions.finish();
rollback;
