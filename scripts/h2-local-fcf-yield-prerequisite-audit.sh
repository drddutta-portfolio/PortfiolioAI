#!/usr/bin/env bash
set -euo pipefail

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*) ;;
  *) echo "ERROR: Refusing to run: H2 FCF-yield audit is LOCAL-ONLY and requires localhost/127.0.0.1 port 54322." >&2; exit 1 ;;
esac

echo "H2 local TORNTPHARM FCF-yield prerequisite audit"
echo "READ ONLY / ZERO PROVIDER CALLS / ZERO WRITES"
echo

psql "$DB_URL" -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
begin transaction read only;

\echo '1) TORNTPHARM security'
select id, symbol, exchange, isin, name, is_active
from public.securities
where symbol='TORNTPHARM'
  and exchange='NSE'
order by created_at
limit 1;

\echo
\echo '2) Relevant metric definitions'
select
  code,
  name,
  canonical_unit,
  statement_scope,
  freshness_seconds,
  is_active,
  definition
from public.fundamental_metric_definitions
where code in (
  'FREE_CASH_FLOW_ANNUAL',
  'CFO_ANNUAL',
  'CAPEX_ANNUAL',
  'MARKET_CAP',
  'MARKET_CAP_PROVIDER_RAW',
  'FCF_YIELD',
  'FCF_YIELD_PERCENT'
)
order by code;

\echo
\echo '3) Latest TORNTPHARM FCF / CFO / CAPEX / market-cap observations'
with target as (
  select id
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
  order by created_at
  limit 1
),
ranked as (
  select
    f.metric_code,
    f.numeric_value,
    f.unit,
    f.period_type,
    f.period_start,
    f.period_end,
    f.consolidation_scope,
    f.source_code,
    f.evidence_status,
    f.retrieved_at,
    f.fresh_until,
    row_number() over (
      partition by f.metric_code
      order by
        f.period_end desc nulls last,
        f.retrieved_at desc nulls last,
        f.created_at desc
    ) as rn
  from public.fundamental_observations f
  where f.security_id=(select id from target)
    and f.metric_code in (
      'FREE_CASH_FLOW_ANNUAL',
      'CFO_ANNUAL',
      'CAPEX_ANNUAL',
      'MARKET_CAP',
      'MARKET_CAP_PROVIDER_RAW',
      'FCF_YIELD',
      'FCF_YIELD_PERCENT'
    )
)
select
  metric_code,
  numeric_value,
  unit,
  period_type,
  period_start,
  period_end,
  consolidation_scope,
  source_code,
  evidence_status,
  retrieved_at,
  fresh_until,
  case
    when fresh_until is null then 'NO_FRESHNESS'
    when fresh_until > now() then 'FRESH'
    else 'STALE'
  end as freshness_state
from ranked
where rn=1
order by metric_code;

\echo
\echo '4) Authoritative Angel One current-price cache'
with target as (
  select id
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
  order by created_at
  limit 1
)
select
  p.provider_code,
  p.price,
  p.currency,
  p.price_timestamp,
  p.retrieved_at,
  p.market_session_status,
  p.previous_close,
  now() - p.retrieved_at as cache_age,
  p.provenance
from public.market_price_latest p
where p.security_id=(select id from target)
  and p.provider_code='ANGEL_ONE'
order by p.retrieved_at desc;

\echo
\echo '5) Angel One mapping state'
with target as (
  select id
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
  order by created_at
  limit 1
)
select
  provider_code,
  provider_instrument_id,
  exchange,
  trading_symbol,
  mapping_status,
  verified_at,
  instrument_master_as_of
from public.market_data_instrument_mappings
where security_id=(select id from target)
  and provider_code='ANGEL_ONE';

\echo
\echo '6) Any share-count / market-cap candidate metrics already registered'
select
  code,
  name,
  canonical_unit,
  statement_scope,
  is_active,
  definition
from public.fundamental_metric_definitions
where
  code ilike '%SHARE%'
  or code ilike '%MARKET_CAP%'
  or name ilike '%shares%'
  or name ilike '%market cap%'
order by code;

\echo
\echo '7) TORNTPHARM observations for any share-count / market-cap candidate metrics'
with target as (
  select id
  from public.securities
  where symbol='TORNTPHARM'
    and exchange='NSE'
  order by created_at
  limit 1
)
select
  f.metric_code,
  f.numeric_value,
  f.unit,
  f.period_type,
  f.period_end,
  f.source_code,
  f.evidence_status,
  f.retrieved_at,
  f.fresh_until
from public.fundamental_observations f
where f.security_id=(select id from target)
  and (
    f.metric_code ilike '%SHARE%'
    or f.metric_code ilike '%MARKET_CAP%'
  )
order by f.metric_code, f.retrieved_at desc;

rollback;
SQL

echo
echo "Read-only audit complete. No provider call and no database write was performed."
