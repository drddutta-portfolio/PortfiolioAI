#!/usr/bin/env bash
set -euo pipefail

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }

echo "H2 latest local Pharma valuation discovery capture"
echo

psql "$DB_URL" -Atqc "
select jsonb_pretty(raw_payload)
from public.data_source_records
where source_code='TRENDLYNE_MCP'
  and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
order by retrieved_at desc
limit 1;
"

echo
echo "No provider call or database write was performed by this review."
