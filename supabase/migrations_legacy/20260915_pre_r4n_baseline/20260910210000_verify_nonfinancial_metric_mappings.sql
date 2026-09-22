-- Stage 7.2D.2B.3 — verify exact non-financial Trendlyne metric contracts.
-- No provider call, observation promotion, score run, model activation, or portfolio-role mutation.

update public.fundamental_metric_definitions
set definition = jsonb_strip_nulls(coalesce(definition, '{}'::jsonb) || jsonb_build_object(
  'provider', 'TRENDLYNE_MCP',
  'selection', 'REVIEWED',
  'provider_label', 'Promoter holding pledge percentage % Qtr',
  'period_type', 'QUARTER',
  'mapping_version', 'nonfinancial-exact-v1',
  'denominator', 'PROMOTER_HOLDING'
))
where code = 'SHAREHOLDING_PROMOTER_PLEDGE_PERCENT';

update public.scoring_model_metric_rules
set provider_field_contract = 'Promoter holding pledge percentage % Qtr',
    rule_state = 'REVIEWED',
    updated_at = now()
where scoring_profile = 'GENERAL'
  and input_code = 'PROMOTER_PLEDGE'
  and metric_code = 'SHAREHOLDING_PROMOTER_PLEDGE_PERCENT'
  and preferred_source = 'TRENDLYNE_MCP';

-- ROCE_ANNUAL and OPM_TTM were already REVIEWED from observed exact labels.
-- Reaffirm their contracts without changing normalization semantics.
update public.scoring_model_metric_rules
set provider_field_contract = case input_code
      when 'ROCE_ANNUAL' then 'ROCE Ann. %'
      when 'OPM_TTM' then 'OPM TTM %'
      else provider_field_contract
    end,
    rule_state = 'REVIEWED',
    updated_at = now()
where scoring_profile = 'GENERAL'
  and input_code in ('ROCE_ANNUAL','OPM_TTM')
  and preferred_source = 'TRENDLYNE_MCP';
