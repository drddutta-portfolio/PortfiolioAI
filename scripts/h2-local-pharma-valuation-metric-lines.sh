#!/usr/bin/env bash
set -euo pipefail

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

python3 - "$TMP_FILE" <<'PY'
import json, re, sys

raw = open(sys.argv[1], "r", encoding="utf-8").read().strip()

def unwrap(value):
    for _ in range(4):
        if isinstance(value, str):
            s=value.strip()
            try:
                value=json.loads(s)
                continue
            except Exception:
                return s
        if isinstance(value, dict):
            if isinstance(value.get("markdown_data"), str):
                value=value["markdown_data"]
                continue
            if isinstance(value.get("result"), str):
                value=value["result"]
                continue
        break
    return value

value=unwrap(raw)
if isinstance(value, dict):
    text=json.dumps(value, indent=2)
else:
    text=str(value)

text=text.replace("\\n", "
")
lines=[ln.strip().replace("\\","") for ln in text.splitlines() if ln.strip()]

label_re=re.compile(r"(P\s*/?\s*E|PE\s*TTM|P/E\s*TTM|EV\s*/?\s*EBITDA|EV\s+EBITDA|enterprise\s+value.*EBITDA)",re.I)
stock_re=re.compile(r"^(TORNTPHARM|MANKIND|ERIS|EMCURE)\s*:\s*(.+)$",re.I)

blocks=[]
for i,line in enumerate(lines):
    if not label_re.search(line):
        continue
    vals=[]
    for nxt in lines[i+1:i+12]:
        m=stock_re.match(nxt)
        if m:
            vals.append((m.group(1).upper(),m.group(2).strip()))
        elif vals and len(vals) >= 4:
            break
    if vals:
        blocks.append((line, vals[:4]))

if not blocks:
    print("NO_MATCHING_VALUATION_BLOCKS_FOUND")
    print("\nNearby keyword lines:")
    for i,line in enumerate(lines):
        if any(k in line.lower() for k in ("ebitda"," p/e"," pe ","valuation")):
            print(f"{i+1}: {line}")
    sys.exit(0)

for idx,(label,vals) in enumerate(blocks,1):
    print(f"BLOCK {idx}")
    print(f"LABEL: {label}")
    for sym,val in vals:
        print(f"  {sym}: {val}")
    print()
PY

echo "Zero-call review only. No provider call and no database write was performed."
