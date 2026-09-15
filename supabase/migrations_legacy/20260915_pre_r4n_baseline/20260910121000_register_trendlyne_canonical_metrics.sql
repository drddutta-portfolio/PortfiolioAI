-- Stage 7.2D.2B.3 — register reviewed Trendlyne canonical metric definitions.
-- No fundamental observations are written by this migration.

insert into public.fundamental_metric_definitions (
  code, name, value_kind, canonical_unit, statement_scope, freshness_seconds, definition, is_active
) values
  (
    'ROCE_ANNUAL',
    'Return on capital employed annual',
    'NUMERIC',
    'PERCENT',
    'RATIO',
    7776000,
    jsonb_build_object(
      'selection', 'REVIEWED',
      'provider', 'TRENDLYNE_MCP',
      'provider_label', 'ROCE Ann. %',
      'period_type', 'YEAR',
      'mapping_version', 'observed-v1'
    ),
    true
  ),
  (
    'EBITDA_TTM',
    'EBITDA trailing twelve months',
    'NUMERIC',
    'INR_CRORE',
    'INCOME_STATEMENT',
    7776000,
    jsonb_build_object(
      'selection', 'REVIEWED',
      'provider', 'TRENDLYNE_MCP',
      'provider_label', 'EBITDA TTM',
      'period_type', 'TTM',
      'mapping_version', 'observed-v1'
    ),
    true
  ),
  (
    'OPM_TTM',
    'Operating profit margin trailing twelve months',
    'NUMERIC',
    'PERCENT',
    'RATIO',
    7776000,
    jsonb_build_object(
      'selection', 'REVIEWED',
      'provider', 'TRENDLYNE_MCP',
      'provider_label', 'OPM TTM %',
      'period_type', 'TTM',
      'mapping_version', 'observed-v1'
    ),
    true
  )
on conflict (code) do nothing;

update public.fundamental_metric_definitions
set definition = coalesce(definition, '{}'::jsonb) || jsonb_build_object(
      'trendlyne_selection', 'REVIEWED',
      'trendlyne_provider_label', 'Diluted EPS Qtr',
      'trendlyne_period_type', 'QUARTER',
      'trendlyne_mapping_version', 'observed-v1'
    )
where code = 'EPS_DILUTED';
