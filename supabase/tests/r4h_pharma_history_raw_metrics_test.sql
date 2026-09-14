begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(10);

select extensions.ok(
  exists (select 1 from public.fundamental_metric_definitions where code='REVENUE_ANNUAL'),
  'REVENUE_ANNUAL definition exists'
);
select extensions.ok(
  exists (select 1 from public.fundamental_metric_definitions where code='OPERATING_REVENUE_QUARTER'),
  'OPERATING_REVENUE_QUARTER definition exists'
);
select extensions.ok(
  exists (select 1 from public.fundamental_metric_definitions where code='OPERATING_PROFIT_QUARTER'),
  'OPERATING_PROFIT_QUARTER definition exists'
);
select extensions.is(
  (select canonical_unit from public.fundamental_metric_definitions where code='REVENUE_ANNUAL'),
  'INR_CRORE',
  'annual operating revenue uses INR_CRORE'
);
select extensions.is(
  (select definition->>'period_type' from public.fundamental_metric_definitions where code='REVENUE_ANNUAL'),
  'YEAR',
  'annual operating revenue is YEAR period type'
);
select extensions.is(
  (select definition->>'semantic_guard' from public.fundamental_metric_definitions where code='REVENUE_ANNUAL'),
  'OPERATING_REVENUE_ONLY',
  'annual revenue semantic guard is explicit'
);
select extensions.is(
  (select definition->>'period_type' from public.fundamental_metric_definitions where code='OPERATING_REVENUE_QUARTER'),
  'QUARTER',
  'quarterly operating revenue is QUARTER period type'
);
select extensions.is(
  (select definition->>'conflict_policy' from public.fundamental_metric_definitions where code='OPERATING_PROFIT_QUARTER'),
  'FAIL_CLOSED_PER_PERIOD',
  'quarterly operating profit conflicts fail closed per period'
);
select extensions.is(
  (select definition->>'trendlyne_history_period_type' from public.fundamental_metric_definitions where code='CFO_ANNUAL'),
  'YEAR',
  'CFO annual history metadata is attached without replacing the metric'
);
select extensions.ok(
  not exists (
    select 1 from public.fundamental_observations
    where metric_code in ('REVENUE_ANNUAL','OPERATING_REVENUE_QUARTER','OPERATING_PROFIT_QUARTER')
  ),
  'definition migration itself writes no new PHARMA observations'
);

select * from extensions.finish();
rollback;
