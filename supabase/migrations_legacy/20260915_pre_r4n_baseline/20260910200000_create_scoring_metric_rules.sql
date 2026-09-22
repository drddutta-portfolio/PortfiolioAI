-- Stage 8.1 — versioned metric-level scoring contracts.
-- The parent PAI_STOCK_SCORE V1 model remains DRAFT. These rules are auditable methodology only.

create table if not exists public.scoring_model_metric_rules (
  id uuid primary key default gen_random_uuid(),
  scoring_model_id uuid not null references public.scoring_models(id) on delete cascade,
  scoring_profile text not null,
  dimension_code text not null,
  input_code text not null,
  input_kind text not null,
  metric_code text,
  preferred_source text,
  provider_field_contract text,
  metric_weight numeric(8,4) not null,
  direction text not null,
  rule_state text not null default 'DRAFT',
  normalization_rule jsonb not null default '{}'::jsonb,
  display_order integer not null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique(scoring_model_id, scoring_profile, dimension_code, input_code),
  constraint scoring_rule_profile_shape check (scoring_profile ~ '^[A-Z0-9_]+$'),
  constraint scoring_rule_dimension_shape check (dimension_code ~ '^[A-Z0-9_]+$'),
  constraint scoring_rule_input_shape check (input_code ~ '^[A-Z0-9_]+$'),
  constraint scoring_rule_input_kind check (input_kind in ('FUNDAMENTAL','EXTERNAL_RATING','MARKET','DERIVED')),
  constraint scoring_rule_weight_range check (metric_weight > 0 and metric_weight <= 100),
  constraint scoring_rule_direction check (direction in ('HIGHER_BETTER','LOWER_BETTER','ORDINAL','RELATIVE','CUSTOM')),
  constraint scoring_rule_state check (rule_state in ('PENDING_SOURCE','DRAFT','REVIEWED','ACTIVE','RETIRED')),
  constraint scoring_rule_normalization_object check (jsonb_typeof(normalization_rule)='object'),
  constraint scoring_rule_display_order check (display_order > 0)
);

create index if not exists scoring_model_metric_rules_lookup_idx
  on public.scoring_model_metric_rules(scoring_model_id, scoring_profile, dimension_code, display_order);

alter table public.scoring_model_metric_rules enable row level security;
create policy scoring_model_metric_rules_authenticated_read
  on public.scoring_model_metric_rules for select to authenticated using (true);

-- Bank/NBFC V1 contract. All rows remain DRAFT/PENDING_SOURCE while the model is DRAFT.
-- Rules with PENDING_SOURCE name the canonical input PortfolioAI wants, but must not score until provider semantics are verified.
with m as (
  select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1
), r(scoring_profile,dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order) as (
  values
  -- QUALITY
  ('BANK_NBFC','QUALITY','ROE_ANNUAL','FUNDAMENTAL','ROE_ANNUAL','TRENDLYNE_MCP','ROE_A',20,'HIGHER_BETTER','DRAFT',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":18,"score":100},{"gte":15,"score":80},{"gte":12,"score":60},{"gte":9,"score":40},{"lt":9,"score":20}]}'::jsonb,1),
  ('BANK_NBFC','QUALITY','NIM_TTM','FUNDAMENTAL','NIM_TTM','TRENDLYNE_MCP',null,35,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":4.2,"score":100},{"gte":3.8,"score":80},{"gte":3.3,"score":60},{"gte":2.8,"score":40},{"lt":2.8,"score":20}]}'::jsonb,2),
  ('BANK_NBFC','QUALITY','GROSS_NPA_PERCENT','FUNDAMENTAL','GROSS_NPA_PERCENT','TRENDLYNE_MCP',null,20,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"lte":1.5,"score":100},{"lte":2.5,"score":80},{"lte":4,"score":60},{"lte":6,"score":40},{"gt":6,"score":20}]}'::jsonb,3),
  ('BANK_NBFC','QUALITY','NET_NPA_PERCENT','FUNDAMENTAL','NET_NPA_PERCENT','TRENDLYNE_MCP',null,25,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"lte":0.5,"score":100},{"lte":1,"score":80},{"lte":2,"score":60},{"lte":3,"score":40},{"gt":3,"score":20}]}'::jsonb,4),

  -- GROWTH
  ('BANK_NBFC','GROWTH','ADVANCES_GROWTH_YOY','FUNDAMENTAL','ADVANCES_GROWTH_YOY','TRENDLYNE_MCP',null,35,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":18,"score":100},{"gte":12,"score":80},{"gte":8,"score":60},{"gte":4,"score":40},{"lt":4,"score":20}]}'::jsonb,1),
  ('BANK_NBFC','GROWTH','DEPOSITS_GROWTH_YOY','FUNDAMENTAL','DEPOSITS_GROWTH_YOY','TRENDLYNE_MCP',null,30,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":16,"score":100},{"gte":11,"score":80},{"gte":7,"score":60},{"gte":3,"score":40},{"lt":3,"score":20}]}'::jsonb,2),
  ('BANK_NBFC','GROWTH','EPS_GROWTH_YOY','FUNDAMENTAL','EPS_GROWTH_YOY','TRENDLYNE_MCP',null,35,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":18,"score":100},{"gte":12,"score":80},{"gte":7,"score":60},{"gte":2,"score":40},{"lt":2,"score":20}]}'::jsonb,3),

  -- CAPITAL EFFICIENCY
  ('BANK_NBFC','CAPITAL_EFFICIENCY','ROE_ANNUAL','FUNDAMENTAL','ROE_ANNUAL','TRENDLYNE_MCP','ROE_A',60,'HIGHER_BETTER','DRAFT',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":18,"score":100},{"gte":15,"score":80},{"gte":12,"score":60},{"gte":9,"score":40},{"lt":9,"score":20}]}'::jsonb,1),
  ('BANK_NBFC','CAPITAL_EFFICIENCY','ROA_ANNUAL','FUNDAMENTAL','ROA_ANNUAL','TRENDLYNE_MCP',null,40,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":1.8,"score":100},{"gte":1.5,"score":80},{"gte":1.1,"score":60},{"gte":0.8,"score":40},{"lt":0.8,"score":20}]}'::jsonb,2),

  -- BALANCE SHEET / CREDIT
  ('BANK_NBFC','BALANCE_SHEET_CREDIT','EXTERNAL_LONG_TERM_RATING','EXTERNAL_RATING',null,'RATING_AGENCIES','instrument-level long-term senior/deposit rating',40,'ORDINAL','DRAFT',
    '{"type":"rating_ordinal","scale":{"AAA":100,"AA+":90,"AA":80,"AA-":70,"A+":60,"A":50,"A-":40,"BBB+":30,"BBB":20,"BBB-":10,"BELOW_BBB_MINUS":0},"outlook_modifier":{"POSITIVE":3,"STABLE":0,"NEGATIVE":-5,"WATCH_NEGATIVE":-10,"WATCH_POSITIVE":3},"clamp":[0,100]}'::jsonb,1),
  ('BANK_NBFC','BALANCE_SHEET_CREDIT','CET1_PERCENT','FUNDAMENTAL','CET1_PERCENT','TRENDLYNE_MCP',null,20,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":16,"score":100},{"gte":14,"score":80},{"gte":12,"score":60},{"gte":10,"score":40},{"lt":10,"score":20}]}'::jsonb,2),
  ('BANK_NBFC','BALANCE_SHEET_CREDIT','CAPITAL_ADEQUACY_PERCENT','FUNDAMENTAL','CAPITAL_ADEQUACY_PERCENT','TRENDLYNE_MCP',null,15,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":18,"score":100},{"gte":16,"score":80},{"gte":14,"score":60},{"gte":12,"score":40},{"lt":12,"score":20}]}'::jsonb,3),
  ('BANK_NBFC','BALANCE_SHEET_CREDIT','GROSS_NPA_PERCENT','FUNDAMENTAL','GROSS_NPA_PERCENT','TRENDLYNE_MCP',null,10,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"lte":1.5,"score":100},{"lte":2.5,"score":80},{"lte":4,"score":60},{"lte":6,"score":40},{"gt":6,"score":20}]}'::jsonb,4),
  ('BANK_NBFC','BALANCE_SHEET_CREDIT','NET_NPA_PERCENT','FUNDAMENTAL','NET_NPA_PERCENT','TRENDLYNE_MCP',null,15,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"lte":0.5,"score":100},{"lte":1,"score":80},{"lte":2,"score":60},{"lte":3,"score":40},{"gt":3,"score":20}]}'::jsonb,5),

  -- VALUATION: deliberately relative; absolute PE/PB bands are not activated for banks.
  ('BANK_NBFC','VALUATION','PE_TTM_RELATIVE','DERIVED','PE_TTM','TRENDLYNE_MCP','PE_TTM',45,'RELATIVE','DRAFT',
    '{"type":"relative_percentile","benchmark":"BANK_NBFC_PE_TTM_PEER_AND_5Y_SELF","lower_is_better":true,"state":"REQUIRES_BENCHMARK_SERIES"}'::jsonb,1),
  ('BANK_NBFC','VALUATION','PBV_RELATIVE','DERIVED','PBV_GENERIC','TRENDLYNE_MCP',null,35,'RELATIVE','PENDING_SOURCE',
    '{"type":"relative_percentile","benchmark":"BANK_NBFC_PBV_PEER_AND_5Y_SELF","lower_is_better":true,"state":"REQUIRES_GENERIC_PBV_AND_BENCHMARK_SERIES"}'::jsonb,2),
  ('BANK_NBFC','VALUATION','VALUATION_TO_ROE','DERIVED',null,'PORTFOLIOAI',null,20,'CUSTOM','PENDING_SOURCE',
    '{"type":"derived","formula":"PBV / ROE_PERCENT","lower_is_better":true,"state":"REQUIRES_GENERIC_PBV_AND_ROE"}'::jsonb,3),

  -- MOMENTUM uses Angel One price authority; Trendlyne technicals may be corroborative only.
  ('BANK_NBFC','MOMENTUM','PRICE_MOMENTUM_12M','MARKET','PRICE_MOMENTUM_12M','ANGEL_ONE',null,40,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":20,"score":100},{"gte":10,"score":80},{"gte":0,"score":60},{"gte":-10,"score":40},{"lt":-10,"score":20}]}'::jsonb,1),
  ('BANK_NBFC','MOMENTUM','PRICE_MOMENTUM_6M','MARKET','PRICE_MOMENTUM_6M','ANGEL_ONE',null,30,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":12,"score":100},{"gte":6,"score":80},{"gte":0,"score":60},{"gte":-7,"score":40},{"lt":-7,"score":20}]}'::jsonb,2),
  ('BANK_NBFC','MOMENTUM','RELATIVE_STRENGTH_12M','DERIVED','RELATIVE_STRENGTH_12M','ANGEL_ONE',null,30,'HIGHER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENTAGE_POINTS","bands":[{"gte":15,"score":100},{"gte":7,"score":80},{"gte":0,"score":60},{"gte":-7,"score":40},{"lt":-7,"score":20}]}'::jsonb,3),

  -- OWNERSHIP / GOVERNANCE. Static institutional ownership is context; trend is needed for scoring.
  ('BANK_NBFC','OWNERSHIP_GOVERNANCE','INSTITUTIONAL_OWNERSHIP_TREND','DERIVED',null,'TRENDLYNE_MCP',null,60,'CUSTOM','PENDING_SOURCE',
    '{"type":"trend","formula":"delta(FII_FPI + DII, 4_quarters)","state":"REQUIRES_HISTORY"}'::jsonb,1),
  ('BANK_NBFC','OWNERSHIP_GOVERNANCE','INSIDER_GOVERNANCE_SIGNAL','DERIVED',null,'TRENDLYNE_MCP',null,40,'CUSTOM','PENDING_SOURCE',
    '{"type":"event_score","inputs":["insider_trades","pledge_or_encumbrance_if_applicable"],"state":"REQUIRES_EVENT_CONTRACT"}'::jsonb,2),

  -- RISK: higher normalized score means lower investment risk.
  ('BANK_NBFC','RISK','GROSS_NPA_PERCENT','FUNDAMENTAL','GROSS_NPA_PERCENT','TRENDLYNE_MCP',null,25,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"lte":1.5,"score":100},{"lte":2.5,"score":80},{"lte":4,"score":60},{"lte":6,"score":40},{"gt":6,"score":20}]}'::jsonb,1),
  ('BANK_NBFC','RISK','NET_NPA_PERCENT','FUNDAMENTAL','NET_NPA_PERCENT','TRENDLYNE_MCP',null,25,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT","bands":[{"lte":0.5,"score":100},{"lte":1,"score":80},{"lte":2,"score":60},{"lte":3,"score":40},{"gt":3,"score":20}]}'::jsonb,2),
  ('BANK_NBFC','RISK','MAX_DRAWDOWN_1Y','MARKET','MAX_DRAWDOWN_1Y','ANGEL_ONE',null,20,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"piecewise","unit":"PERCENT_ABSOLUTE_DRAWDOWN","bands":[{"lte":10,"score":100},{"lte":18,"score":80},{"lte":28,"score":60},{"lte":40,"score":40},{"gt":40,"score":20}]}'::jsonb,3),
  ('BANK_NBFC','RISK','VOLATILITY_1Y','MARKET','VOLATILITY_1Y','ANGEL_ONE',null,15,'LOWER_BETTER','PENDING_SOURCE',
    '{"type":"relative_percentile","benchmark":"NIFTY_BANK_OR_BANK_NBFC_PEERS","lower_is_better":true,"state":"REQUIRES_BENCHMARK_SERIES"}'::jsonb,4),
  ('BANK_NBFC','RISK','RATING_TREND','EXTERNAL_RATING',null,'RATING_AGENCIES','rating action/outlook history',15,'ORDINAL','DRAFT',
    '{"type":"event_ordinal","scale":{"UPGRADE":100,"POSITIVE_OUTLOOK":90,"REAFFIRMED_STABLE":80,"NO_CHANGE":70,"NEGATIVE_OUTLOOK":35,"WATCH_NEGATIVE":15,"DOWNGRADE":0}}'::jsonb,5)
)
insert into public.scoring_model_metric_rules(
  scoring_model_id,scoring_profile,dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order
)
select m.id,r.* from m cross join r
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

comment on table public.scoring_model_metric_rules is 'Versioned metric-level normalization contracts. Parent model status gates live scoring; PENDING_SOURCE inputs cannot score.';