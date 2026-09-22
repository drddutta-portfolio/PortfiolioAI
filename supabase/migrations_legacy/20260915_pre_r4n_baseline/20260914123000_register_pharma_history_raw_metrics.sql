-- R4H — canonical PHARMA raw-history metric definitions.
-- Repository migration only until separately approved for production.
-- This migration writes no fundamental observations and performs no provider calls.

-- Fail closed if another migration/process has already claimed one of these codes
-- with incompatible semantics. `on conflict do nothing` is safe only after this
-- compatibility assertion has passed.
do $$
begin
  if exists (
    select 1
    from public.fundamental_metric_definitions
    where code = 'REVENUE_ANNUAL'
      and (
        value_kind <> 'NUMERIC'
        or canonical_unit <> 'INR_CRORE'
        or statement_scope <> 'INCOME_STATEMENT'
        or coalesce(definition->>'period_type','') <> 'YEAR'
        or coalesce(definition->>'semantic_guard','') <> 'OPERATING_REVENUE_ONLY'
      )
  ) then
    raise exception 'R4H metric-code conflict: REVENUE_ANNUAL already exists with incompatible semantics';
  end if;

  if exists (
    select 1
    from public.fundamental_metric_definitions
    where code = 'OPERATING_REVENUE_QUARTER'
      and (
        value_kind <> 'NUMERIC'
        or canonical_unit <> 'INR_CRORE'
        or statement_scope <> 'INCOME_STATEMENT'
        or coalesce(definition->>'period_type','') <> 'QUARTER'
      )
  ) then
    raise exception 'R4H metric-code conflict: OPERATING_REVENUE_QUARTER already exists with incompatible semantics';
  end if;

  if exists (
    select 1
    from public.fundamental_metric_definitions
    where code = 'OPERATING_PROFIT_QUARTER'
      and (
        value_kind <> 'NUMERIC'
        or canonical_unit <> 'INR_CRORE'
        or statement_scope <> 'INCOME_STATEMENT'
        or coalesce(definition->>'period_type','') <> 'QUARTER'
        or coalesce(definition->>'conflict_policy','') <> 'FAIL_CLOSED_PER_PERIOD'
      )
  ) then
    raise exception 'R4H metric-code conflict: OPERATING_PROFIT_QUARTER already exists with incompatible semantics';
  end if;

  if not exists (
    select 1
    from public.fundamental_metric_definitions
    where code = 'CFO_ANNUAL'
      and value_kind = 'NUMERIC'
      and canonical_unit = 'INR_CRORE'
  ) then
    raise exception 'R4H prerequisite missing/incompatible: CFO_ANNUAL canonical definition';
  end if;
end
$$;

insert into public.fundamental_metric_definitions (
  code,
  name,
  value_kind,
  canonical_unit,
  statement_scope,
  freshness_seconds,
  definition,
  is_active
) values
  (
    'REVENUE_ANNUAL',
    'Operating revenue annual',
    'NUMERIC',
    'INR_CRORE',
    'INCOME_STATEMENT',
    7776000,
    jsonb_build_object(
      'selection', 'REVIEWED',
      'provider', 'TRENDLYNE_MCP',
      'period_type', 'YEAR',
      'semantic_guard', 'OPERATING_REVENUE_ONLY',
      'rejected_substitutes', jsonb_build_array('Total Rev. Ann.', 'Rev. Ann.'),
      'provider_labels', jsonb_build_array(
        'Operating Rev. Ann.',
        'Operating Rev. Ann. 1Y Ago',
        'Operating Rev. Ann. 2Y Ago',
        'Operating Rev. Ann. 3Y Ago',
        'Operating Rev. Ann. 4Y Ago',
        'Operating Rev. Ann. 5Y Ago'
      ),
      'mapping_version', 'R4H_RAW_HISTORY_V1'
    ),
    true
  ),
  (
    'OPERATING_REVENUE_QUARTER',
    'Operating revenue quarterly',
    'NUMERIC',
    'INR_CRORE',
    'INCOME_STATEMENT',
    7776000,
    jsonb_build_object(
      'selection', 'REVIEWED',
      'provider', 'TRENDLYNE_MCP',
      'period_type', 'QUARTER',
      'provider_labels', jsonb_build_array(
        'Operating Rev. Qtr',
        'Operating Rev. 1Q ago',
        'Operating Rev. 2Q ago',
        'Operating Rev. 3Q ago',
        'Operating Rev. 4Q ago',
        'Operating Rev. 5Q ago',
        'Operating Rev. 6Q ago',
        'Operating Rev. 7Q ago',
        'Operating Rev. 8Q ago'
      ),
      'mapping_version', 'R4H_RAW_HISTORY_V1'
    ),
    true
  ),
  (
    'OPERATING_PROFIT_QUARTER',
    'Operating profit quarterly',
    'NUMERIC',
    'INR_CRORE',
    'INCOME_STATEMENT',
    7776000,
    jsonb_build_object(
      'selection', 'REVIEWED',
      'provider', 'TRENDLYNE_MCP',
      'period_type', 'QUARTER',
      'provider_labels', jsonb_build_array(
        'Operating Profit Qtr',
        'Operating Profit 1Q Ago',
        'Operating Profit 2Q Ago',
        'Operating Profit 3Q Ago',
        'Operating Profit 4Q Ago',
        'Operating Profit 5Q Ago',
        'Operating Profit 5Qtr Ago',
        'Operating Profit 6Q Ago',
        'Operating Profit 6Qtr Ago',
        'Operating Profit 7Q Ago',
        'Operating Profit 7Qtr Ago',
        'Operating Profit 8Q Ago',
        'Operating Profit 8Qtr Ago'
      ),
      'conflict_policy', 'FAIL_CLOSED_PER_PERIOD',
      'mapping_version', 'R4H_RAW_HISTORY_V1'
    ),
    true
  )
on conflict (code) do nothing;

-- CFO_ANNUAL already exists. Add only the reviewed historical mapping metadata;
-- do not replace or reinterpret the pre-existing definition.
update public.fundamental_metric_definitions
set definition = coalesce(definition, '{}'::jsonb) || jsonb_build_object(
      'trendlyne_history_selection', 'REVIEWED',
      'trendlyne_history_period_type', 'YEAR',
      'trendlyne_history_provider_labels', jsonb_build_array(
        'Cash from Operating Act. Ann.',
        'Cash from Operating Act. Ann. 1Y Ago',
        'Cash from Operating Act. Ann. 2Y Ago',
        'Cash from Operating Act. Ann. 3Y Ago',
        'Cash from Operating Act. Ann. 4Y Ago',
        'Cash from Operating Act. Ann. 5Y Ago'
      ),
      'trendlyne_history_mapping_version', 'R4H_RAW_HISTORY_V1'
    )
where code = 'CFO_ANNUAL';
