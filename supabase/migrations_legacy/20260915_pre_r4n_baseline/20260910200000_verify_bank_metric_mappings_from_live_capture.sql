-- Stage 8.1C — verify exact Bank/NBFC scoring mappings from the live HDFCBANK Trendlyne capture.
-- This migration only registers canonical metric definitions and marks exact provider contracts REVIEWED.
-- It does not promote observations and does not activate the scoring model.

insert into public.fundamental_metric_definitions(code,name,value_kind,canonical_unit,statement_scope,freshness_seconds,definition,is_active)
values
  ('GROSS_NPA_PERCENT','Gross NPA ratio current quarter','NUMERIC','PERCENT','RATIO',7776000,
    jsonb_build_object('provider','TRENDLYNE_MCP','selection','REVIEWED','provider_label','Gross NPA ratio Qtr %','period_type','QUARTER','mapping_version','bank-observed-v1'),true),
  ('NET_NPA_PERCENT','Net NPA ratio current quarter','NUMERIC','PERCENT','RATIO',7776000,
    jsonb_build_object('provider','TRENDLYNE_MCP','selection','REVIEWED','provider_label','Net NPA ratio % Qtr','period_type','QUARTER','mapping_version','bank-observed-v1'),true),
  ('EPS_GROWTH_YOY','EPS quarterly YoY growth','NUMERIC','PERCENT','RATIO',7776000,
    jsonb_build_object('provider','TRENDLYNE_MCP','selection','REVIEWED','provider_label','EPS Qtr YoY Growth %','period_type','QUARTER','mapping_version','bank-observed-v1'),true)
on conflict (code) do update set
  name=excluded.name,
  value_kind=excluded.value_kind,
  canonical_unit=excluded.canonical_unit,
  statement_scope=excluded.statement_scope,
  freshness_seconds=excluded.freshness_seconds,
  definition=excluded.definition,
  is_active=true;

with m as (
  select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1
)
update public.scoring_model_metric_rules r
set provider_field_contract = case r.input_code
      when 'GROSS_NPA_PERCENT' then 'Gross NPA ratio Qtr %'
      when 'NET_NPA_PERCENT' then 'Net NPA ratio % Qtr'
      when 'EPS_GROWTH_YOY' then 'EPS Qtr YoY Growth %'
      else r.provider_field_contract
    end,
    rule_state='REVIEWED',
    updated_at=clock_timestamp()
from m
where r.scoring_model_id=m.id
  and r.scoring_profile='BANK_NBFC'
  and r.input_code in ('GROSS_NPA_PERCENT','NET_NPA_PERCENT','EPS_GROWTH_YOY');

-- Keep ambiguous/unreturned fields pending. Do not infer CET1 from generic Tier1, and do not
-- use the observed Basel-II capital-adequacy zero values as an approved contract.
