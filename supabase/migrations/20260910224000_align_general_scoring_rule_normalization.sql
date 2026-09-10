-- Stage 8.5 — align GENERAL scoring-rule JSON with the canonical Stage 8.2 contract.
-- No score run is created and PAI_STOCK_SCORE V1 remains DRAFT.

with m as (
  select id from public.scoring_models where code = 'PAI_STOCK_SCORE' and version = 1
)
update public.scoring_model_metric_rules r
set normalization_rule = case
  when r.dimension_code = 'QUALITY' and r.input_code = 'ROE_ANNUAL' then
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":22,"score":100},{"gte":17,"score":80},{"gte":13,"score":60},{"gte":9,"score":40},{"lt":9,"score":20}]}'::jsonb
  when r.dimension_code = 'QUALITY' and r.input_code = 'OPM_TTM' then
    '{"type":"relative_plus_absolute","state":"REQUIRES_SECTOR_CONTEXT"}'::jsonb
  when r.dimension_code = 'QUALITY' and r.input_code = 'EARNINGS_CONSISTENCY' then
    '{"type":"history_consistency","inputs":["EPS_GROWTH_HISTORY","PAT_GROWTH_HISTORY"]}'::jsonb
  when r.dimension_code = 'GROWTH' and r.input_code = 'REVENUE_GROWTH_3Y' then
    '{"type":"cagr","years":3,"state":"REQUIRES_HISTORY"}'::jsonb
  when r.dimension_code = 'GROWTH' and r.input_code = 'PAT_GROWTH_3Y' then
    '{"type":"cagr","years":3,"state":"REQUIRES_HISTORY"}'::jsonb
  when r.dimension_code = 'GROWTH' and r.input_code = 'EPS_GROWTH_3Y' then
    '{"type":"cagr","years":3,"state":"REQUIRES_HISTORY"}'::jsonb
  when r.dimension_code = 'CAPITAL_EFFICIENCY' and r.input_code = 'ROCE_ANNUAL' then
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":25,"score":100},{"gte":20,"score":80},{"gte":15,"score":60},{"gte":10,"score":40},{"lt":10,"score":20}]}'::jsonb
  when r.dimension_code = 'CAPITAL_EFFICIENCY' and r.input_code = 'ROE_ANNUAL' then
    '{"type":"piecewise","unit":"PERCENT","bands":[{"gte":22,"score":100},{"gte":17,"score":80},{"gte":13,"score":60},{"gte":9,"score":40},{"lt":9,"score":20}]}'::jsonb
  when r.dimension_code = 'CASH_FLOW' and r.input_code = 'CFO_TO_EBITDA' then
    '{"type":"ratio","formula":"CFO_ANNUAL / EBITDA_ANNUAL","state":"REQUIRES_MATCHED_PERIODS"}'::jsonb
  when r.dimension_code = 'CASH_FLOW' and r.input_code = 'FCF_CONVERSION' then
    '{"type":"ratio","state":"REQUIRES_CAPEX_AND_CFO_HISTORY"}'::jsonb
  when r.dimension_code = 'BALANCE_SHEET_CREDIT' and r.input_code = 'NET_DEBT_TO_EBITDA' then
    '{"type":"piecewise","state":"REQUIRES_VERIFIED_FIELD"}'::jsonb
  when r.dimension_code = 'BALANCE_SHEET_CREDIT' and r.input_code = 'INTEREST_COVERAGE' then
    '{"type":"piecewise","state":"REQUIRES_VERIFIED_FIELD"}'::jsonb
  when r.dimension_code = 'BALANCE_SHEET_CREDIT' and r.input_code = 'EXTERNAL_LONG_TERM_RATING' then
    '{"type":"rating_ordinal","optional":true,"absence":"INSUFFICIENT_NOT_NEGATIVE"}'::jsonb
  when r.dimension_code = 'VALUATION' and r.input_code = 'PE_TTM_RELATIVE' then
    '{"type":"relative_percentile","benchmark":"SECTOR_PEER_AND_5Y_SELF","lower_is_better":true,"state":"REQUIRES_BENCHMARK_SERIES"}'::jsonb
  when r.dimension_code = 'VALUATION' and r.input_code = 'PBV_RELATIVE' then
    '{"type":"relative_percentile","benchmark":"SECTOR_PEER_AND_5Y_SELF","lower_is_better":true}'::jsonb
  when r.dimension_code = 'VALUATION' and r.input_code = 'FCF_YIELD' then
    '{"type":"yield","state":"REQUIRES_FCF_AND_MARKET_CAP"}'::jsonb
  when r.dimension_code = 'MOMENTUM' and r.input_code = 'PRICE_MOMENTUM_12M' then
    '{"type":"piecewise","unit":"PERCENT"}'::jsonb
  when r.dimension_code = 'MOMENTUM' and r.input_code = 'PRICE_MOMENTUM_6M' then
    '{"type":"piecewise","unit":"PERCENT"}'::jsonb
  when r.dimension_code = 'MOMENTUM' and r.input_code = 'RELATIVE_STRENGTH_12M' then
    '{"type":"relative_strength","benchmark":"NIFTY_OR_SECTOR_INDEX"}'::jsonb
  when r.dimension_code = 'OWNERSHIP_GOVERNANCE' and r.input_code = 'INSTITUTIONAL_OWNERSHIP_TREND' then
    '{"type":"trend","state":"REQUIRES_4Q_HISTORY"}'::jsonb
  when r.dimension_code = 'OWNERSHIP_GOVERNANCE' and r.input_code = 'PROMOTER_PLEDGE' then
    '{"type":"piecewise","unit":"PERCENT_OF_PROMOTER_HOLDING","absence_policy":"NOT_APPLICABLE_IF_NO_PROMOTER"}'::jsonb
  when r.dimension_code = 'OWNERSHIP_GOVERNANCE' and r.input_code = 'INSIDER_GOVERNANCE_SIGNAL' then
    '{"type":"event_score","state":"REQUIRES_EVENT_CONTRACT"}'::jsonb
  when r.dimension_code = 'RISK' and r.input_code = 'MAX_DRAWDOWN_1Y' then
    '{"type":"piecewise","unit":"PERCENT_ABSOLUTE_DRAWDOWN"}'::jsonb
  when r.dimension_code = 'RISK' and r.input_code = 'VOLATILITY_1Y' then
    '{"type":"relative_percentile","benchmark":"SECTOR_OR_NIFTY","lower_is_better":true}'::jsonb
  when r.dimension_code = 'RISK' and r.input_code = 'BALANCE_SHEET_RISK' then
    '{"type":"composite","inputs":["NET_DEBT_TO_EBITDA","INTEREST_COVERAGE"]}'::jsonb
  when r.dimension_code = 'RISK' and r.input_code = 'EVIDENCE_CONFLICT_PENALTY' then
    '{"type":"evidence_penalty","higher_score_means_lower_risk":true}'::jsonb
  else r.normalization_rule
end,
updated_at = clock_timestamp()
from m
where r.scoring_model_id = m.id
  and r.scoring_profile = 'GENERAL';

-- Preserve the exact reviewed provider contract for promoter pledge.
with m as (
  select id from public.scoring_models where code = 'PAI_STOCK_SCORE' and version = 1
)
update public.scoring_model_metric_rules r
set provider_field_contract = 'Promoter holding pledge percentage % Qtr',
    rule_state = 'REVIEWED',
    updated_at = clock_timestamp()
from m
where r.scoring_model_id = m.id
  and r.scoring_profile = 'GENERAL'
  and r.dimension_code = 'OWNERSHIP_GOVERNANCE'
  and r.input_code = 'PROMOTER_PLEDGE';
