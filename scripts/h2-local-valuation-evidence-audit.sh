#!/usr/bin/env bash
set -euo pipefail

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

echo "H2 local valuation evidence audit"
echo

psql "$DB_URL" -P pager=off -c "
with target_symbols(symbol) as (
  values ('TORNTPHARM'), ('MANKIND'), ('ERIS'), ('EMCURE')
)
select
  ts.symbol,
  s.id as security_id,
  s.is_active
from target_symbols ts
left join public.securities s on s.symbol = ts.symbol
order by ts.symbol;
"

echo
echo "Latest local PE_TTM / EV_EBITDA / self-history observations"
psql "$DB_URL" -P pager=off -c "
with ranked as (
  select
    s.symbol,
    f.metric_code,
    f.numeric_value,
    f.unit,
    f.period_type,
    f.period_end,
    f.consolidation_scope,
    f.source_code,
    f.evidence_status,
    f.retrieved_at,
    f.fresh_until,
    row_number() over (
      partition by s.symbol, f.metric_code
      order by f.retrieved_at desc nulls last, f.created_at desc
    ) as rn
  from public.fundamental_observations f
  join public.securities s on s.id = f.security_id
  where s.symbol in ('TORNTPHARM','MANKIND','ERIS','EMCURE')
    and f.metric_code in ('PE_TTM','EV_EBITDA','PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT','MARKET_CAP_PROVIDER_RAW')
)
select
  symbol,
  metric_code,
  numeric_value,
  unit,
  period_type,
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
where rn = 1
order by symbol, metric_code;
"

echo
echo "Peer-family readiness counts"
psql "$DB_URL" -P pager=off -c "
with latest as (
  select distinct on (s.symbol, f.metric_code)
    s.symbol,
    f.metric_code,
    f.numeric_value,
    f.evidence_status,
    f.fresh_until
  from public.fundamental_observations f
  join public.securities s on s.id = f.security_id
  where s.symbol in ('MANKIND','ERIS','EMCURE')
    and f.metric_code in ('PE_TTM','EV_EBITDA')
  order by s.symbol, f.metric_code, f.retrieved_at desc nulls last, f.created_at desc
)
select
  metric_code,
  count(*) filter (
    where numeric_value > 0
      and evidence_status = 'AVAILABLE'
      and fresh_until > now()
  ) as fresh_positive_peers,
  3 as required_peers
from latest
group by metric_code
order by metric_code;
"

echo
echo "No provider call or write was performed by this audit."
