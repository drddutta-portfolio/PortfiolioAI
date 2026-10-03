#!/usr/bin/env bash
set -euo pipefail

endpoint="https://lrgpjimipfkyoqbpsqzz.supabase.co/functions/v1/p8-b4-3-canary"
mkdir -p tmp/p8-b4-4-loop

for i in $(seq 1 20); do
  out="tmp/p8-b4-4-loop/slice-\${i}.json"
  code="$(curl --silent --show-error --max-time 300 --output "$out" --write-out '%{http_code}' \
    -X POST "$endpoint" \
    -H 'content-type: application/json' \
    --data '{"confirmation":"P8_B4_3_OWNER_AUTH_2026_10_03"}')"
  cat "$out"
  test "$code" = "200"

  python - "$out" <<'PY'
import json,sys
p=json.load(open(sys.argv[1]))
if p.get("terminalError"):
    raise SystemExit("terminal provider/campaign error: "+str(p["terminalError"]))
state=p.get("state")
if state not in ("PASS","DAILY_PLANNED_CEILING_REACHED","CAMPAIGN_COMPLETE","NO_PLANNED_CAPACITY"):
    raise SystemExit("unexpected state: "+str(state))
print("state",state,"completeAfter",p.get("completeAfter"),"usedTodayAfter",p.get("usedTodayAfter"))
PY

  state="$(python -c 'import json,sys; print(json.load(open(sys.argv[1])).get("state",""))' "$out")"
  used="$(python -c 'import json,sys; print(int(json.load(open(sys.argv[1])).get("usedTodayAfter",0)))' "$out")"
  complete="$(python -c 'import json,sys; print(int(json.load(open(sys.argv[1])).get("completeAfter",0)))' "$out")"

  if [ "$state" = "DAILY_PLANNED_CEILING_REACHED" ] || [ "$state" = "CAMPAIGN_COMPLETE" ] || [ "$state" = "NO_PLANNED_CAPACITY" ] || [ "$used" -ge 320 ] || [ "$complete" -ge 160 ]; then
    break
  fi
done
