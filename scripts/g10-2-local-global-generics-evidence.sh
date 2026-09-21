#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${G10_2_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${G10_2_LOCAL_EMAIL:-${H2_LOCAL_EMAIL:-}}"
LOCAL_PASSWORD="${G10_2_LOCAL_PASSWORD:-${H2_LOCAL_PASSWORD:-}}"
MODE="${G10_2_EVIDENCE_MODE:-PLAN}"
API_URL="http://127.0.0.1:54321"
OUTPUT_FILE="${G10_2_OUTPUT_FILE:-/tmp/portfolioai-g10-2-auropharma-evidence.json}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq

[[ "$MODE" == "PLAN" || "$MODE" == "EXECUTE" ]] || die "G10_2_EVIDENCE_MODE must be PLAN or EXECUTE."
[[ -n "$LOCAL_EMAIL" ]] || die "Set G10_2_LOCAL_EMAIL (or reuse H2_LOCAL_EMAIL)."
[[ -n "$LOCAL_PASSWORD" ]] || die "Set G10_2_LOCAL_PASSWORD (or reuse H2_LOCAL_PASSWORD)."
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE."
grep -qE '^TRENDLYNE_MCP_URL=.+' "$ENV_FILE" || die "TRENDLYNE_MCP_URL missing from $ENV_FILE."
grep -qE '^G10_2_LOCAL_GLOBAL_GENERICS_EVIDENCE_ENABLED=true$' "$ENV_FILE" || die "Add G10_2_LOCAL_GLOBAL_GENERICS_EVIDENCE_ENABLED=true to $ENV_FILE."

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running."
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || die "Could not resolve local ANON_KEY."

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password"   -H "apikey: $ANON_KEY"   -H "Content-Type: application/json"   -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")"   || die "Local Supabase password sign-in failed."
ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
[[ -n "$ACCESS_TOKEN" ]] || die "Local sign-in did not return an access token."

LOG_FILE="/tmp/portfolioai-g10-2-local-functions.log"
REUSE="${G10_2_REUSE_FUNCTION_SERVER:-0}"
if [[ "$REUSE" == "1" ]]; then
  pgrep -f "supabase functions serve" >/dev/null 2>&1 || die "No local functions server is running."
  SERVE_PID=""
  trap ':' EXIT
else
  if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
    die "A local functions server is already running. Stop it or export G10_2_REUSE_FUNCTION_SERVER=1."
  fi
  supabase functions serve g10-2-local-global-generics-evidence --no-verify-jwt --env-file "$ENV_FILE" --debug >"$LOG_FILE" 2>&1 &
  SERVE_PID=$!
  trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true' EXIT
  for _ in {1..30}; do
    if curl -sS -o /dev/null "$API_URL/functions/v1/g10-2-local-global-generics-evidence"; then break; fi
    sleep 1
  done
  kill -0 "$SERVE_PID" >/dev/null 2>&1 || die "Local function server failed. Review $LOG_FILE."
fi

payload="$(jq -nc --arg mode "$MODE" '
  if $mode == "EXECUTE"
  then {action:"EXECUTE",confirmation:"OWNER_CONFIRMED_G10_2_LOCAL_GLOBAL_GENERICS_EVIDENCE"}
  else {action:"PLAN"}
  end
')"

status="$(curl --max-time 300 -sS -o "$OUTPUT_FILE" -w '%{http_code}' -X POST "$API_URL/functions/v1/g10-2-local-global-generics-evidence"   -H "Authorization: Bearer $ACCESS_TOKEN"   -H "apikey: $ANON_KEY"   -H "Content-Type: application/json"   -d "$payload")"

cat "$OUTPUT_FILE" | jq .

if [[ "$status" -lt 200 || "$status" -ge 300 ]]; then
  die "G10.2 evidence run failed with HTTP $status. Response saved at $OUTPUT_FILE"
fi

echo
echo "G10.2 local evidence response saved to:"
echo "  $OUTPUT_FILE"
echo "No production write or score persistence was performed."
