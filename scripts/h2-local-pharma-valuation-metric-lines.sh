#!/usr/bin/env bash
set -euo pipefail

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

PAYLOAD="$(psql "$DB_URL" -Atqc "
select raw_payload->>'metric_result'
from public.data_source_records
where source_code='TRENDLYNE_MCP'
  and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
order by retrieved_at desc
limit 1;
")"

[[ -n "$PAYLOAD" ]] || { echo "ERROR: No local Pharma valuation discovery payload found." >&2; exit 1; }

printf '%s
' "$PAYLOAD"   | sed 's/\\n/\n/g'   | grep -iE '(^|[^A-Z])(P/?E|PE TTM|P/E TTM|EV/?EBITDA|EV EBITDA|ENTERPRISE VALUE.*EBITDA)([^A-Z]|$)|^(TORNTPHARM|MANKIND|ERIS|EMCURE):'   || true

echo
echo "Zero-call review only. No provider call and no database write was performed."
