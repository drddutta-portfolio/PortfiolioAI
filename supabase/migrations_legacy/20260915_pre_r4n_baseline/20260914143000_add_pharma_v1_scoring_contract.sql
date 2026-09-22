-- R4I — PHARMA_V1 scoring integration.
-- Repository contract only until explicitly approved for production.
-- Adds a Pharma-specific scoring methodology so canonical Pharma holdings no
-- longer inherit GENERAL metric rules. The model remains DRAFT and no score run
-- is created by this migration.

insert into public.scoring_profiles(code,name,parent_profile_code,description)
values ('PHARMA_V1','Pharmaceuticals · PHARMA_V1','GENERAL','Profile-specific scoring contract for pharmaceutical manufacturers. Research evidence follows the PHARMA_V1 methodology and fails closed when mandatory history/source contracts are incomplete.')
on conflict (code) do update set
  name=excluded.name,
  parent_profile_code=excluded.parent_profile_code,
  description=excluded.description,
  is_active=true;

with m as (select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1),
rows(dimension_code,weight,display_order) as (
  values
    ('QUALITY',15,1),('GROWTH',18,2),('CAPITAL_EFFICIENCY',12,3),('CASH_FLOW',12,4),
    ('BALANCE_SHEET_CREDIT',10,5),('VALUATION',13,6),('MOMENTUM',10,7),
    ('OWNERSHIP_GOVERNANCE',5,8),('RISK',5,9)
)
insert into public.scoring_model_dimensions(scoring_model_id,scoring_profile,dimension_code,weight,minimum_coverage,display_order)
select m.id,'PHARMA_V1',r.dimension_code,r.weight,0.6000,r.display_order from m cross join rows r
on conflict (scoring_model_id,scoring_profile,dimension_code) do update set
  weight=excluded.weight,
  minimum_coverage=excluded.minimum_coverage,
  display_order=excluded.display_order;

-- PHARMA_V1 starts with evidence/readiness contracts, not invented numeric
-- score curves. REVIEWED history_contract rows may contribute partial evidence
-- coverage in the read-only preview, but remain score-unready until an explicit
-- later migration approves a normalization curve. Unresolved contracts remain
-- PENDING_SOURCE and contribute neither evidence nor score readiness.
with m as (select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1),
r(dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order) as (
values
  ('QUALITY','PHARMA_OPERATING_MARGIN_HISTORY','DERIVED',null,'PORTFOLIOAI','matched OPERATING_PROFIT_QUARTER / OPERATING_REVENUE_QUARTER',55,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":8,"score_curve_state":"PENDING"}'::jsonb,1),
  ('QUALITY','PHARMA_ROCE_HISTORY','DERIVED',null,'PORTFOLIOAI','reviewed annual ROCE history',45,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":3,"score_curve_state":"PENDING"}'::jsonb,2),

  ('GROWTH','PHARMA_REVENUE_GROWTH_HISTORY','DERIVED',null,'PORTFOLIOAI','semantically consistent operating-revenue annual history',50,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":3,"score_curve_state":"PENDING"}'::jsonb,1),
  ('GROWTH','PHARMA_PAT_EPS_HISTORY','DERIVED',null,'PORTFOLIOAI','matched annual PAT and diluted-EPS history',50,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":3,"score_curve_state":"PENDING"}'::jsonb,2),

  ('CAPITAL_EFFICIENCY','PHARMA_ROCE_HISTORY','DERIVED',null,'PORTFOLIOAI','reviewed annual ROCE history',100,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":3,"score_curve_state":"PENDING"}'::jsonb,1),

  ('CASH_FLOW','PHARMA_CASH_CONVERSION_HISTORY','DERIVED',null,'PORTFOLIOAI','matched CFO, PAT and FCF/capex history',100,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":3,"score_curve_state":"PENDING"}'::jsonb,1),

  ('BALANCE_SHEET_CREDIT','PHARMA_BALANCE_SHEET_LEVERAGE','DERIVED',null,'PORTFOLIOAI','matched debt, cash, EBITDA and interest-cover history',100,'CUSTOM','REVIEWED','{"type":"pharma_history_contract","profile":"PHARMA_V1","minimum_observations":3,"score_curve_state":"PENDING"}'::jsonb,1),

  ('VALUATION','PHARMA_VALUATION_CONTEXT','DERIVED',null,'PORTFOLIOAI','current authoritative market price plus reviewed earnings/cash and peer/self history',100,'CUSTOM','PENDING_SOURCE','{"type":"pharma_valuation_context","profile":"PHARMA_V1","state":"REQUIRES_EARNINGS_CASH_AND_BENCHMARK_CONTRACT"}'::jsonb,1),

  ('MOMENTUM','PRICE_MOMENTUM_12M','MARKET','PRICE_MOMENTUM_12M','ANGEL_ONE',null,40,'HIGHER_BETTER','PENDING_SOURCE','{"type":"piecewise","unit":"PERCENT","state":"REQUIRES_PORTFOLIO_WIDE_MARKET_HISTORY"}'::jsonb,1),
  ('MOMENTUM','PRICE_MOMENTUM_6M','MARKET','PRICE_MOMENTUM_6M','ANGEL_ONE',null,30,'HIGHER_BETTER','PENDING_SOURCE','{"type":"piecewise","unit":"PERCENT","state":"REQUIRES_PORTFOLIO_WIDE_MARKET_HISTORY"}'::jsonb,2),
  ('MOMENTUM','RELATIVE_STRENGTH_12M','DERIVED','RELATIVE_STRENGTH_12M','ANGEL_ONE',null,30,'HIGHER_BETTER','PENDING_SOURCE','{"type":"relative_strength","benchmark":"NIFTY_OR_SECTOR_INDEX","state":"REQUIRES_BENCHMARK_SERIES"}'::jsonb,3),

  ('OWNERSHIP_GOVERNANCE','PHARMA_OWNERSHIP_GOVERNANCE','DERIVED',null,'PORTFOLIOAI','reviewed ownership history plus governance-event overlay',100,'CUSTOM','PENDING_SOURCE','{"type":"pharma_ownership_governance","profile":"PHARMA_V1","state":"REQUIRES_OWNERSHIP_AND_GOVERNANCE_EVENT_CONTRACT"}'::jsonb,1),

  ('RISK','PHARMA_REGULATORY_SITE_STATUS','DERIVED',null,'OFFICIAL_EVIDENCE','official regulator/issuer site-status evidence where exposure is material',60,'CUSTOM','PENDING_SOURCE','{"type":"pharma_regulatory_state","profile":"PHARMA_V1","conditional":true,"state":"REQUIRES_OFFICIAL_SOURCE_CONTRACT"}'::jsonb,1),
  ('RISK','MAX_DRAWDOWN_1Y','MARKET','MAX_DRAWDOWN_1Y','ANGEL_ONE',null,20,'LOWER_BETTER','PENDING_SOURCE','{"type":"piecewise","unit":"PERCENT_ABSOLUTE_DRAWDOWN","state":"REQUIRES_PORTFOLIO_WIDE_MARKET_HISTORY"}'::jsonb,2),
  ('RISK','VOLATILITY_1Y','MARKET','VOLATILITY_1Y','ANGEL_ONE',null,20,'LOWER_BETTER','PENDING_SOURCE','{"type":"relative_percentile","benchmark":"PHARMA_PEERS_OR_NIFTY","lower_is_better":true,"state":"REQUIRES_BENCHMARK_SERIES"}'::jsonb,3)
)
insert into public.scoring_model_metric_rules(scoring_model_id,scoring_profile,dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order)
select m.id,'PHARMA_V1',r.dimension_code,r.input_code,r.input_kind,r.metric_code,r.preferred_source,r.provider_field_contract,r.metric_weight,r.direction,r.rule_state,r.normalization_rule,r.display_order from m cross join r
on conflict (scoring_model_id,scoring_profile,dimension_code,input_code) do update set
  input_kind=excluded.input_kind,
  metric_code=excluded.metric_code,
  preferred_source=excluded.preferred_source,
  provider_field_contract=excluded.provider_field_contract,
  metric_weight=excluded.metric_weight,
  direction=excluded.direction,
  rule_state=excluded.rule_state,
  normalization_rule=excluded.normalization_rule,
  display_order=excluded.display_order,
  updated_at=clock_timestamp();

comment on table public.scoring_model_metric_rules is 'Versioned metric-level scoring contracts. PHARMA_V1 history contracts may expose evidence readiness before numeric score curves are approved.';
