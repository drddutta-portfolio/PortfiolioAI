-- PROPOSAL ONLY — DO NOT APPLY.
-- R4N / Gate G6.6 review artifact.
-- Intentionally stored under docs/sql rather than supabase/migrations so normal
-- Supabase migration tooling cannot apply it accidentally.
--
-- Proposed canonical metric:
--   FCF_YIELD_PERCENT
-- Formula:
--   (FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100
--
-- This proposal does NOT create observations, execute scoring, migrate aliases,
-- or authorize local/production deployment.

begin;

do $preflight$
declare
  legacy_count integer;
  canonical_count integer;
begin
  if to_regclass('public.fundamental_metric_definitions') is null then
    raise exception 'PROPOSAL_PREREQUISITE_MISSING: fundamental_metric_definitions';
  end if;

  select count(*) into legacy_count
  from public.fundamental_metric_definitions
  where code = 'FCF_YIELD';

  select count(*) into canonical_count
  from public.fundamental_metric_definitions
  where code = 'FCF_YIELD_PERCENT';

  if legacy_count > 0 then
    raise exception 'PROPOSAL_ALIAS_REVIEW_REQUIRED: FCF_YIELD already exists';
  end if;

  if canonical_count > 1 then
    raise exception 'PROPOSAL_CONFLICT: multiple FCF_YIELD_PERCENT definitions';
  end if;

  if exists (
    select 1
    from public.fundamental_metric_definitions
    where code = 'FCF_YIELD_PERCENT'
      and (
        value_kind <> 'NUMERIC'
        or canonical_unit <> 'PERCENT'
        or statement_scope <> 'VALUATION'
      )
  ) then
    raise exception 'PROPOSAL_CONFLICT: existing FCF_YIELD_PERCENT semantics differ';
  end if;
end
$preflight$;

insert into public.fundamental_metric_definitions (
  code,
  name,
  value_kind,
  canonical_unit,
  statement_scope,
  freshness_seconds,
  definition,
  is_active
)
values (
  'FCF_YIELD_PERCENT',
  'Free cash flow yield',
  'NUMERIC',
  'PERCENT',
  'VALUATION',
  86400,
  jsonb_build_object(
    'selection', 'REVIEWED',
    'calculation_owner', 'PORTFOLIOAI',
    'formula', '(FREE_CASH_FLOW_ANNUAL / CURRENT_MARKET_CAP) * 100',
    'numerator_metric', 'FREE_CASH_FLOW_ANNUAL',
    'numerator_formula', 'CFO_ANNUAL - CAPEX_ANNUAL',
    'denominator_concept', 'CURRENT_MARKET_CAP',
    'current_authoritative_market_price_required', true,
    'provider_market_cap_may_override_price_authority', false,
    'negative_fcf_treatment', 'PRESERVE_NEGATIVE_YIELD_DO_NOT_CLAMP_TO_ZERO',
    'legacy_aliases', jsonb_build_array('FCF_YIELD'),
    'alias_double_counting_allowed', false,
    'period_type', 'POINT_IN_TIME',
    'mapping_version', 'PHARMA_FCF_YIELD_PERCENT_V1'
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
    is_active = excluded.is_active;

do $postconditions$
begin
  if not exists (
    select 1
    from public.fundamental_metric_definitions
    where code = 'FCF_YIELD_PERCENT'
      and value_kind = 'NUMERIC'
      and canonical_unit = 'PERCENT'
      and statement_scope = 'VALUATION'
      and is_active
      and definition ->> 'calculation_owner' = 'PORTFOLIOAI'
      and definition ->> 'mapping_version' = 'PHARMA_FCF_YIELD_PERCENT_V1'
  ) then
    raise exception 'PROPOSAL_POSTCONDITION_FAILED: canonical FCF yield definition';
  end if;
end
$postconditions$;

-- Deliberately rollback: this file is a design proposal, not a migration.
rollback;
