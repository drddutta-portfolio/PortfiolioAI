-- Stage 8.5B: promote semantically reviewed Trendlyne evidence mappings.
-- This migration changes contract/readiness metadata only. It makes no provider calls,
-- rewrites no observations, creates no score runs, and does not activate the scoring model.

update public.fundamental_metric_definitions
set definition = jsonb_set(
  coalesce(definition, '{}'::jsonb),
  '{selection}',
  '"REVIEWED"'::jsonb,
  true
)
where code in ('ROE_ANNUAL', 'PE_TTM', 'NET_PROFIT_TTM');

-- ROE_A is now a reviewed exact Trendlyne evidence contract for BANK_NBFC.
-- Existing bank-specific normalization bands are retained unchanged.
update public.scoring_model_metric_rules
set rule_state = 'REVIEWED',
    updated_at = now()
where scoring_profile = 'BANK_NBFC'
  and metric_code = 'ROE_ANNUAL'
  and provider_field_contract = 'ROE_A'
  and dimension_code in ('QUALITY', 'CAPITAL_EFFICIENCY');

-- PE_TTM remains DRAFT for scoring because peer/self benchmark series are not yet available.
-- NET_PROFIT_TTM remains non-score-ready where history/normalization requirements are pending.
-- REVENUE_TTM and CFO_ANNUAL remain PROVISIONAL; MARKET_CAP_PROVIDER_RAW remains secondary.
