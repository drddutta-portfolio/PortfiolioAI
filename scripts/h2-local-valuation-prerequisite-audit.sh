#!/usr/bin/env bash
set -euo pipefail

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

echo "H2 local valuation prerequisite audit"
echo

echo "1) public.securities columns"
psql "$DB_URL" -P pager=off -c "
select
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema='public'
  and table_name='securities'
order by ordinal_position;
"

echo
echo "2) Existing rows for target + approved peers"
psql "$DB_URL" -P pager=off -c "
select *
from public.securities
where symbol in ('TORNTPHARM','MANKIND','ERIS','EMCURE')
order by symbol;
"

echo
echo "3) Trendlyne identities for target + approved peers"
psql "$DB_URL" -P pager=off -c "
select
  s.symbol,
  i.provider_instrument_id,
  i.observed_symbol,
  i.evidence_status,
  i.created_at
from public.security_identity_observations i
join public.securities s on s.id=i.security_id
where i.source_code='TRENDLYNE_MCP'
  and s.symbol in ('TORNTPHARM','MANKIND','ERIS','EMCURE')
order by s.symbol, i.created_at desc;
"

echo
echo "4) Required metric definitions"
psql "$DB_URL" -P pager=off -c "
select
  code,
  canonical_unit,
  is_active,
  freshness_seconds
from public.fundamental_metric_definitions
where code in (
  'PE_TTM',
  'EV_EBITDA',
  'PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT',
  'MARKET_CAP_PROVIDER_RAW',
  'FREE_CASH_FLOW_ANNUAL'
)
order by code;
"

echo
echo "5) Trendlyne source state"
psql "$DB_URL" -P pager=off -c "
select
  code,
  is_active,
  entitlement_verified,
  retention_rights_verified
from public.data_sources
where code='TRENDLYNE_MCP';
"

echo
echo "6) Trendlyne ingestion controls"
psql "$DB_URL" -P pager=off -c "
select
  source_code,
  ingestion_enabled,
  daily_internal_attempt_limit,
  per_run_internal_attempt_limit,
  actual_provider_quota_status,
  policy_version
from public.provider_ingestion_controls
where source_code='TRENDLYNE_MCP';
"

echo
echo "7) Any existing local PE / EV-EBITDA observations"
psql "$DB_URL" -P pager=off -c "
select
  s.symbol,
  f.metric_code,
  f.numeric_value,
  f.unit,
  f.period_type,
  f.consolidation_scope,
  f.source_code,
  f.evidence_status,
  f.retrieved_at,
  f.fresh_until
from public.fundamental_observations f
join public.securities s on s.id=f.security_id
where f.metric_code in ('PE_TTM','EV_EBITDA','PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT')
order by s.symbol, f.metric_code, f.retrieved_at desc;
"

echo
echo "Read-only audit complete. No provider call and no database write was performed."
