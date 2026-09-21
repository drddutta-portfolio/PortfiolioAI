#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${G10_2_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${G10_2_LOCAL_EMAIL:-${H2_LOCAL_EMAIL:-}}"
LOCAL_PASSWORD="${G10_2_LOCAL_PASSWORD:-${H2_LOCAL_PASSWORD:-}}"
API_URL="http://127.0.0.1:54321"
OUTPUT_FILE="/tmp/portfolioai-g10-2-trendlyne-gap-fill.json"

[[ -n "$LOCAL_EMAIL" ]] || { echo "ERROR: local email missing" >&2; exit 1; }
[[ -n "$LOCAL_PASSWORD" ]] || { echo "ERROR: local password missing" >&2; exit 1; }

STATUS_ENV="$(supabase status -o env 2>/dev/null)"
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || { echo "ERROR: local ANON_KEY unavailable" >&2; exit 1; }

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")"
ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
[[ -n "$ACCESS_TOKEN" ]] || { echo "ERROR: local sign-in failed" >&2; exit 1; }

LOG_FILE="/tmp/portfolioai-g10-2-gap-fill-functions.log"
if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
  echo "ERROR: another local functions server is already running." >&2
  exit 1
fi

supabase functions serve g10-2-local-trendlyne-gap-fill --no-verify-jwt --env-file "$ENV_FILE" --debug >"$LOG_FILE" 2>&1 &
SERVE_PID=$!
trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true' EXIT

READY_FILE="$(mktemp)"
for _ in {1..90}; do
  code="$(curl --max-time 5 -sS -o "$READY_FILE" -w '%{http_code}' -X POST \
    "$API_URL/functions/v1/g10-2-local-trendlyne-gap-fill" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d '{"action":"PLAN"}' 2>/dev/null || true)"
  if [[ "$code" == "200" ]]; then break; fi
  sleep 1
done
[[ "$code" == "200" ]] || { tail -n 100 "$LOG_FILE" >&2; exit 1; }
rm -f "$READY_FILE"

echo "Trendlyne gap-fill PLAN PASS (0 calls)."
echo "Executing exactly 2 Trendlyne calls..."

status="$(curl --max-time 180 -sS -o "$OUTPUT_FILE" -w '%{http_code}' -X POST \
  "$API_URL/functions/v1/g10-2-local-trendlyne-gap-fill" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"action":"EXECUTE","confirmation":"OWNER_CONFIRMED_G10_2_TRENDLYNE_GAP_FILL"}')"

cat "$OUTPUT_FILE" | jq .
[[ "$status" -ge 200 && "$status" -lt 300 ]] || {
  echo "ERROR: gap-fill failed with HTTP $status" >&2
  exit 1
}

echo
echo "G10.2 TRENDLYNE GAP-FILL PASS"
echo "Saved: $OUTPUT_FILE"
echo "Provider calls: 2"
echo "Production writes: 0"
