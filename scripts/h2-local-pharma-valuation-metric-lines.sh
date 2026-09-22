#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 is required." >&2; exit 1; }

TMP_FILE="$(mktemp)"
trap 'rm -f "$TMP_FILE"' EXIT

psql "$DB_URL" -Atqc "
select raw_payload->>'metric_result'
from public.data_source_records
where source_code='TRENDLYNE_MCP'
  and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
order by retrieved_at desc
limit 1;
" > "$TMP_FILE"

[[ -s "$TMP_FILE" ]] || { echo "ERROR: No local Pharma valuation discovery payload found." >&2; exit 1; }

echo "Exact valuation blocks from stored local Trendlyne discovery"
echo

python3 scripts/h2_parse_valuation_metric_lines.py "$TMP_FILE"

echo
echo "Zero-call review only. No provider call and no database write was performed."
