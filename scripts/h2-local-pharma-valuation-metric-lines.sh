#!/usr/bin/env bash
set -euo pipefail

DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required." >&2; exit 1; }
command -v awk >/dev/null 2>&1 || { echo "ERROR: awk is required." >&2; exit 1; }

RAW_FILE="$(mktemp)"
DECODED_FILE="$(mktemp)"
trap 'rm -f "$RAW_FILE" "$DECODED_FILE"' EXIT

psql "$DB_URL" -Atqc "
select raw_payload->>'metric_result'
from public.data_source_records
where source_code='TRENDLYNE_MCP'
  and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
order by retrieved_at desc
limit 1;
" > "$RAW_FILE"

[[ -s "$RAW_FILE" ]] || { echo "ERROR: No local Pharma valuation discovery payload found." >&2; exit 1; }

# metric_result is stored as JSON text. Decode it once, then emit markdown_data verbatim.
if ! jq -Rr '
  fromjson
  | if type == "object" and (.markdown_data? != null)
    then .markdown_data
    elif type == "object" and (.result? != null)
    then .result
    else .
    end
' "$RAW_FILE" > "$DECODED_FILE" 2>/dev/null; then
  echo "ERROR: Stored metric_result could not be decoded as JSON." >&2
  exit 1
fi

echo "Exact valuation blocks from stored local Trendlyne discovery"
echo

awk '
function is_label(line) {
  u=toupper(line)
  return (
    u ~ /(^|[^A-Z])P[[:space:]]*\/[[:space:]]*E([^A-Z]|$)/ ||
    u ~ /PE[[:space:]]*TTM/ ||
    u ~ /P\/E[[:space:]]*TTM/ ||
    u ~ /EV[[:space:]]*\/[[:space:]]*EBITDA/ ||
    u ~ /EV[[:space:]]+EBITDA/ ||
    u ~ /ENTERPRISE VALUE.*EBITDA/
  )
}
function is_stock(line) {
  u=toupper(line)
  return (
    u ~ /^TORNTPHARM[[:space:]]*:/ ||
    u ~ /^MANKIND[[:space:]]*:/ ||
    u ~ /^ERIS[[:space:]]*:/ ||
    u ~ /^EMCURE[[:space:]]*:/
  )
}
{
  gsub(/\\$/, "", $0)
  line=$0
  if (is_label(line)) {
    block++
    active=1
    count=0
    print "BLOCK " block
    print "LABEL: " line
    next
  }
  if (active && is_stock(line)) {
    print "  " line
    count++
    if (count >= 4) {
      print ""
      active=0
    }
  } else if (active && count > 0 && line !~ /^[[:space:]]*$/) {
    active=0
    print ""
  }
}
END {
  if (block == 0) {
    print "NO_MATCHING_VALUATION_BLOCKS_FOUND"
  }
}
' "$DECODED_FILE"

echo
echo "Zero-call review only. No provider call and no database write was performed."
