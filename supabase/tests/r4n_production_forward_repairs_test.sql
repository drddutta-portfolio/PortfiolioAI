begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(16);

select extensions.ok(
  exists(select 1 from public.refresh_domain_policies
    where source_code='COMPANY_EXCHANGE_FILING' and data_domain='NEWS'
      and policy_version=6 and not is_enabled and effective_to is not null
      and freshness_basis='DISABLED'),
  'closed NEWS V6 is canonically disabled'
);
select extensions.ok(
  exists(select 1 from public.refresh_domain_policies
    where source_code='COMPANY_EXCHANGE_FILING' and data_domain='NEWS'
      and policy_version=7 and is_enabled and effective_to is null
      and freshness_basis<>'DISABLED'),
  'NEWS V7 remains the active policy'
);
select extensions.ok(
  exists(select 1 from pg_constraint
    where conrelid='public.refresh_domain_policies'::regclass
      and conname='refresh_domain_policy_disabled' and convalidated),
  'refresh-policy enabled/freshness invariant is validated'
);
select extensions.ok(
  not exists(select 1 from public.refresh_domain_policies
    where (is_enabled and freshness_basis='DISABLED')
       or (not is_enabled and freshness_basis<>'DISABLED')),
  'all refresh policies satisfy the enabled/freshness invariant'
);
select extensions.is((select count(*)::integer from cron.job), 2,
  'scheduler job count remains unchanged');
select extensions.ok(
  exists(select 1 from cron.job where jobname='portfolioai-n5-nse-news-30min'
    and schedule='*/30 * * * *'
    and command='select public.invoke_nse_news_pipeline_scheduled_v1();'
    and active),
  'NSE NEWS scheduler definition remains unchanged'
);
select extensions.ok(
  exists(select 1 from cron.job
    where jobname='portfolioai-news-evidence-classification-30min'
      and schedule='5,35 * * * *'
      and command='select public.reclassify_unclassified_news_from_stored_evidence_v1(100);'
      and active),
  'NEWS classification scheduler definition remains unchanged'
);
select extensions.has_function('public','get_portfolio_profile_weight_context_v1',
  array['uuid','uuid','text'],'weight-context function signature is preserved');
select extensions.ok(
  pg_get_functiondef('public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure)
    like '%count(*)::integer as position_count%',
  'weight-context totals alias is unambiguous'
);
select extensions.ok(
  pg_get_functiondef('public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure)
    not like '%count(*)::integer as total_position_count%',
  'ambiguous totals alias is absent'
);
select extensions.ok(
  (select prosecdef from pg_proc
   where oid='public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)'::regprocedure),
  'weight-context function remains security definer'
);
select extensions.ok(
  has_function_privilege('authenticated',
    'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)','EXECUTE')
  and not has_function_privilege('anon',
    'public.get_portfolio_profile_weight_context_v1(uuid,uuid,text)','EXECUTE'),
  'weight-context execute grants remain bounded'
);
select extensions.has_table('public','research_subprofile_contracts',
  'R4N contract registry exists');
select extensions.is((select count(*)::integer from public.research_subprofile_contracts),5,
  'five R4N contracts are registered');
select extensions.is((select count(*)::integer from public.research_subprofile_assignments),0,
  'forward package creates no assignments');
select extensions.is((select count(*)::integer from public.research_subprofile_secondary_exposures),0,
  'forward package creates no secondary exposures');

select * from extensions.finish();
rollback;
