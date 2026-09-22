-- Stage 8.6D: make BANK_NBFC valuation score-ready from a reviewed self-history P/E signal.
-- This uses an already captured Trendlyne exact label and does not make a provider call.
-- The provider metric is treated as relative valuation evidence, not as intrinsic fair value.

insert into public.fundamental_metric_definitions (
  code, name, value_kind, canonical_unit, statement_scope, freshness_seconds, definition, is_active
)
values (
  'PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT',
  'P/E versus 5Y average implied upside',
  'NUMERIC',
  'PERCENT',
  'VALUATION',
  86400,
  jsonb_build_object(
    'provider', 'TRENDLYNE_MCP',
    'selection', 'REVIEWED',
    'provider_label', 'Fair Price 5YrPE Upside%',
    'mapping_version', 'bank-valuation-self-history-v1',
    'semantics', 'Percentage upside implied by applying the provider 5-year average P/E to the current earnings base; use as self-history relative valuation only, not intrinsic fair value.'
  ),
  true
)
on conflict (code) do update
set name = excluded.name,
    value_kind = excluded.value_kind,
    canonical_unit = excluded.canonical_unit,
    statement_scope = excluded.statement_scope,
    freshness_seconds = excluded.freshness_seconds,
    definition = excluded.definition,
    is_active = true;

-- Reweight BANK_NBFC valuation so one exact, reviewed self-history signal can cross the
-- 60% dimension gate. PBV and valuation-to-ROE remain pending until clean generic PBV
-- evidence and their benchmark contracts are available.
update public.scoring_model_metric_rules
set input_code = 'PE_5Y_SELF_HISTORY_RELATIVE',
    input_kind = 'FUNDAMENTAL',
    metric_code = 'PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT',
    preferred_source = 'TRENDLYNE_MCP',
    provider_field_contract = 'Fair Price 5YrPE Upside%',
    metric_weight = 60,
    direction = 'HIGHER_BETTER',
    rule_state = 'REVIEWED',
    normalization_rule = jsonb_build_object(
      'type', 'piecewise',
      'unit', 'PERCENT',
      'basis', 'CURRENT_PE_VS_5Y_AVERAGE_PE_IMPLIED_UPSIDE',
      'bands', jsonb_build_array(
        jsonb_build_object('gte', 30, 'score', 100),
        jsonb_build_object('gte', 15, 'score', 80),
        jsonb_build_object('gte', -5, 'score', 60),
        jsonb_build_object('gte', -20, 'score', 40),
        jsonb_build_object('lt', -20, 'score', 20)
      )
    )
where scoring_profile = 'BANK_NBFC'
  and dimension_code = 'VALUATION'
  and input_code = 'PE_TTM_RELATIVE';

update public.scoring_model_metric_rules
set metric_weight = 25
where scoring_profile = 'BANK_NBFC'
  and dimension_code = 'VALUATION'
  and input_code = 'PBV_RELATIVE';

update public.scoring_model_metric_rules
set metric_weight = 15
where scoring_profile = 'BANK_NBFC'
  and dimension_code = 'VALUATION'
  and input_code = 'VALUATION_TO_ROE';

-- Promote HDFCBANK's latest exact captured self-history signal from the immutable
-- Trendlyne capture. The value is parsed from the capture; no generated source ID is hardcoded.
with target_security as (
  select id
  from public.securities
  where symbol = 'HDFCBANK'
  limit 1
), exact_capture as (
  select dsr.id as source_record_id,
         dsr.retrieved_at,
         ((regexp_match(
           dsr.raw_payload::text,
           'Fair Price 5YrPE Upside%[^H]*HDFCBANK:([0-9.-]+)'
         ))[1])::numeric as metric_value
  from public.data_source_records dsr
  join target_security ts
    on (dsr.raw_payload->>'security_id')::uuid = ts.id
  where dsr.source_code = 'TRENDLYNE_MCP'
    and dsr.raw_payload::text like '%Fair Price 5YrPE Upside%%'
  order by dsr.retrieved_at desc
  limit 1
)
insert into public.fundamental_observations (
  security_id, metric_code, source_record_id, source_code, numeric_value,
  currency, unit, period_start, period_end, period_type, accounting_standard,
  consolidation_scope, observed_at, retrieved_at, fresh_until, evidence_status,
  published_at
)
select ts.id,
       'PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT',
       ec.source_record_id,
       'TRENDLYNE_MCP',
       ec.metric_value,
       null,
       'PERCENT',
       null,
       null,
       'POINT_IN_TIME',
       null,
       'UNKNOWN',
       null,
       ec.retrieved_at,
       ec.retrieved_at + interval '1 day',
       'AVAILABLE',
       null
from target_security ts
cross join exact_capture ec
where ec.metric_value is not null
on conflict (security_id, metric_code, source_code, period_end, period_type, consolidation_scope, source_record_id)
do update set
  numeric_value = excluded.numeric_value,
  unit = excluded.unit,
  retrieved_at = excluded.retrieved_at,
  fresh_until = excluded.fresh_until,
  evidence_status = excluded.evidence_status;
