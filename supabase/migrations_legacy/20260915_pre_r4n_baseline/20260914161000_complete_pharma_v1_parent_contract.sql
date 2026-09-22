-- R4L — Complete the PHARMA_V1 parent evidence contract before subtype work.
-- Repository-only until explicit production approval.
-- This migration does not create score runs, recommendations, provider calls,
-- position-sizing assessments, or scheduler actions.

with m as (
  select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1
), rows(dimension_code,weight,display_order) as (
  values
    ('QUALITY',13,1),
    ('GROWTH',15,2),
    ('CAPITAL_EFFICIENCY',10,3),
    ('CASH_FLOW',10,4),
    ('BALANCE_SHEET_CREDIT',10,5),
    ('BUSINESS_DURABILITY',10,6),
    ('VALUATION',12,7),
    ('MOMENTUM',8,8),
    ('OWNERSHIP_GOVERNANCE',6,9),
    ('RISK',6,10)
)
insert into public.scoring_model_dimensions(scoring_model_id,scoring_profile,dimension_code,weight,minimum_coverage,display_order)
select m.id,'PHARMA_V1',r.dimension_code,r.weight,0.6000,r.display_order
from m cross join rows r
on conflict (scoring_model_id,scoring_profile,dimension_code) do update set
  weight=excluded.weight,
  minimum_coverage=excluded.minimum_coverage,
  display_order=excluded.display_order;

with m as (
  select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1
), r(dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order) as (
values
  ('BUSINESS_DURABILITY','PHARMA_RND_INTENSITY','DERIVED',null,'CANONICAL_PROVIDER_EVIDENCE','reviewed R&D expense/intensity history',45,'CUSTOM','PENDING_SOURCE','{"type":"pharma_business_durability","profile":"PHARMA_V1","state":"REQUIRES_RND_HISTORY_CONTRACT","score_curve_state":"PENDING"}'::jsonb,1),
  ('BUSINESS_DURABILITY','PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE','DERIVED',null,'OFFICIAL_EVIDENCE','reviewed issuer/official launch, approval and pipeline evidence',55,'CUSTOM','PENDING_SOURCE','{"type":"pharma_business_durability","profile":"PHARMA_V1","state":"REQUIRES_PIPELINE_EVENT_CONTRACT","score_curve_state":"PENDING"}'::jsonb,2)
)
insert into public.scoring_model_metric_rules(scoring_model_id,scoring_profile,dimension_code,input_code,input_kind,metric_code,preferred_source,provider_field_contract,metric_weight,direction,rule_state,normalization_rule,display_order)
select m.id,'PHARMA_V1',r.dimension_code,r.input_code,r.input_kind,r.metric_code,r.preferred_source,r.provider_field_contract,r.metric_weight,r.direction,r.rule_state,r.normalization_rule,r.display_order
from m cross join r
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

-- Existing reviewed valuation and ownership evidence should contribute to
-- evidence coverage. Their numeric score curves remain deliberately pending,
-- therefore they remain evidence-only and cannot make PHARMA_V1 score-ready.
with m as (
  select id from public.scoring_models where code='PAI_STOCK_SCORE' and version=1
)
update public.scoring_model_metric_rules r
set rule_state='REVIEWED',
    normalization_rule = case r.input_code
      when 'PHARMA_VALUATION_CONTEXT' then '{"type":"pharma_valuation_context","profile":"PHARMA_V1","minimum_components":4,"score_curve_state":"PENDING"}'::jsonb
      when 'PHARMA_OWNERSHIP_GOVERNANCE' then '{"type":"pharma_ownership_governance","profile":"PHARMA_V1","minimum_quarters":4,"score_curve_state":"PENDING"}'::jsonb
      else r.normalization_rule
    end,
    updated_at=clock_timestamp()
from m
where r.scoring_model_id=m.id
  and r.scoring_profile='PHARMA_V1'
  and r.input_code in ('PHARMA_VALUATION_CONTEXT','PHARMA_OWNERSHIP_GOVERNANCE');

comment on table public.scoring_model_metric_rules is
'Versioned metric-level scoring contracts. PHARMA_V1 separates verified evidence coverage from score readiness; evidence-only parent contracts may be REVIEWED while score curves remain pending.';
