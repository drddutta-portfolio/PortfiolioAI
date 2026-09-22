#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${K1_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${K1_LOCAL_EMAIL:-${H2_LOCAL_EMAIL:-}}"
LOCAL_PASSWORD="${K1_LOCAL_PASSWORD:-${H2_LOCAL_PASSWORD:-}}"
API_URL="http://127.0.0.1:54321"
OUTPUT_FILE="${K1_TRENDLYNE_CAPABILITY_OUTPUT:-artifacts/k1-trendlyne-capability-discovery.json}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq

[[ -n "$LOCAL_EMAIL" ]] || die "Set K1_LOCAL_EMAIL (or reuse H2_LOCAL_EMAIL)."
[[ -n "$LOCAL_PASSWORD" ]] || die "Set K1_LOCAL_PASSWORD (or reuse H2_LOCAL_PASSWORD)."
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE."
grep -qE '^TRENDLYNE_MCP_URL=.+' "$ENV_FILE" || die "TRENDLYNE_MCP_URL missing from $ENV_FILE."
grep -qE '^K1_LOCAL_TRENDLYNE_CAPABILITY_DISCOVERY_ENABLED=true$' "$ENV_FILE" ||   die "Add K1_LOCAL_TRENDLYNE_CAPABILITY_DISCOVERY_ENABLED=true to $ENV_FILE."

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running. Run: supabase start"
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || die "Could not resolve local ANON_KEY."

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password"   -H "apikey: $ANON_KEY"   -H "Content-Type: application/json"   -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")"   || die "Local Supabase password sign-in failed."
ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
[[ -n "$ACCESS_TOKEN" ]] || die "Local sign-in did not return an access token."

LOG_FILE="/tmp/portfolioai-k1-trendlyne-capability-discovery.log"
if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
  die "A local functions server is already running. Stop it before this one-time discovery."
fi

printf '[K1] Starting Trendlyne MCP capability discovery...\n'
printf '  env file: %s\n' "$ENV_FILE"
printf '  log: %s\n' "$LOG_FILE"

supabase functions serve k1-local-trendlyne-capability-discovery   --no-verify-jwt   --env-file "$ENV_FILE"   --debug >"$LOG_FILE" 2>&1 &
SERVE_PID=$!
trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true' EXIT

PLAN_FILE="$(mktemp)"
ready=0
printf '[K1] Waiting for local Edge Function readiness...\n'
for attempt in {1..90}; do
  if ! kill -0 "$SERVE_PID" >/dev/null 2>&1; then
    printf '\nLocal Edge Function exited before readiness. Log tail:\n' >&2
    tail -n 120 "$LOG_FILE" >&2 || true
    rm -f "$PLAN_FILE"
    die "Trendlyne capability discovery function failed to start."
  fi

  status="$(curl --max-time 5 -sS -o "$PLAN_FILE" -w '%{http_code}' -X POST     "$API_URL/functions/v1/k1-local-trendlyne-capability-discovery"     -H "Authorization: Bearer $ACCESS_TOKEN"     -H "apikey: $ANON_KEY"     -H "Content-Type: application/json"     -d '{"action":"PLAN"}' 2>/dev/null || true)"

  if [[ "$status" == "200" ]]; then ready=1; break; fi
  if (( attempt % 10 == 0 )); then printf '  still waiting... %ss\n' "$attempt"; fi
  sleep 1
done

[[ "$ready" == "1" ]] || {
  printf '\nLast readiness response:\n' >&2
  cat "$PLAN_FILE" >&2 || true
  printf '\nLocal function log tail:\n' >&2
  tail -n 120 "$LOG_FILE" >&2 || true
  rm -f "$PLAN_FILE"
  die "Trendlyne capability discovery function did not become ready."
}

printf '[K1] Local Edge Function readiness PASS\n'
printf 'K1 Trendlyne capability discovery PLAN\n'
jq '{mode,estimatedProviderCalls,productionWrites,scoreRuns,note}' "$PLAN_FILE"
rm -f "$PLAN_FILE"

mkdir -p "$(dirname "$OUTPUT_FILE")"
HTTP_STATUS="$(curl --max-time 120 -sS -o "$OUTPUT_FILE" -w '%{http_code}' -X POST   "$API_URL/functions/v1/k1-local-trendlyne-capability-discovery"   -H "Authorization: Bearer $ACCESS_TOKEN"   -H "apikey: $ANON_KEY"   -H "Content-Type: application/json"   -d '{"action":"EXECUTE","confirmation":"OWNER_CONFIRMED_K1_TRENDLYNE_CAPABILITY_DISCOVERY"}')"

jq '{
  mode,
  providerCalls,
  toolCount,
  relevantToolCount,
  relevantTools,
  productionWrites,
  scoreRuns
}' "$OUTPUT_FILE"

[[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]] ||   die "Trendlyne capability discovery failed with HTTP $HTTP_STATUS. Response saved at $OUTPUT_FILE"

printf '\nSaved capability artifact: %s\n' "$OUTPUT_FILE"
printf 'No production database write was performed.\n'
