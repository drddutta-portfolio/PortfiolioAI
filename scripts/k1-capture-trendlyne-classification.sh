#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${K1_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${K1_LOCAL_EMAIL:-${H2_LOCAL_EMAIL:-}}"
LOCAL_PASSWORD="${K1_LOCAL_PASSWORD:-${H2_LOCAL_PASSWORD:-}}"
API_URL="http://127.0.0.1:54321"
BULK_JSON="${K1_BULK_JSON:-artifacts/k1-nse-bulk-primary-classification.json}"
OUTPUT_FILE="${K1_TRENDLYNE_CLASSIFICATION_OUTPUT:-artifacts/k1-trendlyne-classification.json}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq

[[ -n "$LOCAL_EMAIL" ]] || die "Set K1_LOCAL_EMAIL (or reuse H2_LOCAL_EMAIL)."
[[ -n "$LOCAL_PASSWORD" ]] || die "Set K1_LOCAL_PASSWORD (or reuse H2_LOCAL_PASSWORD)."
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE."
grep -qE '^TRENDLYNE_MCP_URL=.+' "$ENV_FILE" || die "TRENDLYNE_MCP_URL missing from $ENV_FILE."
grep -qE '^K1_LOCAL_TRENDLYNE_CLASSIFICATION_ENABLED=true$' "$ENV_FILE" || die "Add K1_LOCAL_TRENDLYNE_CLASSIFICATION_ENABLED=true to $ENV_FILE."
[[ -f "$BULK_JSON" ]] || die "Missing $BULK_JSON. Run the K1 cohort reconciliation once to create the bulk residual list."

SYMBOLS_JSON="$(jq -c '[.residual[].symbol] | unique' "$BULK_JSON")"
SYMBOL_COUNT="$(printf '%s' "$SYMBOLS_JSON" | jq 'length')"
[[ "$SYMBOL_COUNT" -gt 0 ]] || die "No bulk residual symbols remain; Trendlyne fallback is not needed."

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running. Run: supabase start"
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || die "Could not resolve local ANON_KEY."

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")" \
  || die "Local Supabase password sign-in failed."
ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
[[ -n "$ACCESS_TOKEN" ]] || die "Local sign-in did not return an access token."

LOG_FILE="/tmp/portfolioai-k1-trendlyne-classification.log"
REUSE="${K1_REUSE_FUNCTION_SERVER:-0}"
if [[ "$REUSE" == "1" ]]; then
  pgrep -f "supabase functions serve" >/dev/null 2>&1 || die "No local functions server is running."
  SERVE_PID=""
  trap ':' EXIT
else
  if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
    die "A local functions server is already running. Stop it or export K1_REUSE_FUNCTION_SERVER=1."
  fi
  supabase functions serve k1-local-trendlyne-classification --no-verify-jwt --env-file "$ENV_FILE" --debug >"$LOG_FILE" 2>&1 &
  SERVE_PID=$!
  trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true' EXIT
fi

PLAN_FILE="$(mktemp)"
ready=0
for _ in {1..90}; do
  status="$(curl --max-time 5 -sS -o "$PLAN_FILE" -w '%{http_code}' -X POST \
    "$API_URL/functions/v1/k1-local-trendlyne-classification" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$(jq -nc --argjson symbols "$SYMBOLS_JSON" '{action:"PLAN",symbols:$symbols}')" 2>/dev/null || true)"
  if [[ "$status" == "200" ]]; then ready=1; break; fi
  sleep 1
done
[[ "$ready" == "1" ]] || { cat "$PLAN_FILE" >&2 || true; tail -n 120 "$LOG_FILE" >&2 || true; die "K1 Trendlyne classification function did not become ready."; }

printf 'K1 Trendlyne classification PLAN\n'
cat "$PLAN_FILE" | jq '{symbolCount,batchSize,estimatedProviderCalls,productionWrites,scoreRuns}'
rm -f "$PLAN_FILE"

mkdir -p "$(dirname "$OUTPUT_FILE")"
PAYLOAD="$(jq -nc --argjson symbols "$SYMBOLS_JSON" '{action:"EXECUTE",confirmation:"OWNER_CONFIRMED_K1_LOCAL_TRENDLYNE_CLASSIFICATION",symbols:$symbols}')"
HTTP_STATUS="$(curl --max-time 240 -sS -o "$OUTPUT_FILE" -w '%{http_code}' -X POST \
  "$API_URL/functions/v1/k1-local-trendlyne-classification" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

cat "$OUTPUT_FILE" | jq '{mode,source,symbolCount,batchSize,providerCalls,resolvedCount,unresolvedCount,unresolved,productionWrites,scoreRuns}'
[[ "$HTTP_STATUS" -ge 200 && "$HTTP_STATUS" -lt 300 ]] || die "Trendlyne classification capture failed with HTTP $HTTP_STATUS. Response saved at $OUTPUT_FILE"

printf '\nSaved reusable K1 Trendlyne classification artifact: %s\n' "$OUTPUT_FILE"
printf 'No production database write was performed.\n'
