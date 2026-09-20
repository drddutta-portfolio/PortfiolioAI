#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${H2_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${H2_LOCAL_EMAIL:-}"
LOCAL_PASSWORD="${H2_LOCAL_PASSWORD:-}"
API_URL="http://127.0.0.1:54321"
DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
REUSE_FUNCTION_SERVER="${H2_REUSE_FUNCTION_SERVER:-0}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq
need psql

[[ -n "$LOCAL_EMAIL" ]] || die "Set H2_LOCAL_EMAIL in your shell."
[[ -n "$LOCAL_PASSWORD" ]] || die "Set H2_LOCAL_PASSWORD in your shell."
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE. It must contain TRENDLYNE_MCP_URL for local discovery."

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running. Run: supabase start"
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || die "Could not resolve local ANON_KEY."

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")" \
  || die "Local Supabase password sign-in failed."

ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
USER_ID="$(printf '%s' "$AUTH_JSON" | jq -r '.user.id // empty')"
[[ -n "$ACCESS_TOKEN" && -n "$USER_ID" ]] || die "Local sign-in did not return an access token/user id."

PORTFOLIO_ID="$(psql "$DB_URL" -Atqc "select id from public.portfolios where user_id='$USER_ID' order by created_at limit 1;")"
[[ -n "$PORTFOLIO_ID" ]] || die "No local portfolio belongs to $LOCAL_EMAIL."

TORNT_SECURITY_ID="$(psql "$DB_URL" -Atqc "select id from public.securities where symbol='TORNTPHARM' and is_active is true order by created_at limit 1;")"
[[ -n "$TORNT_SECURITY_ID" ]] || die "TORNTPHARM is missing from local securities."

OPEN_HOLDING="$(psql "$DB_URL" -Atqc "select count(*) from public.current_holdings where portfolio_id='$PORTFOLIO_ID' and security_id='$TORNT_SECURITY_ID' and current_quantity::numeric <> 0;")"
[[ "$OPEN_HOLDING" == "1" ]] || die "TORNTPHARM must be an open local holding for discovery accounting."

TRENDLYNE_ENV_PRESENT="$(grep -E '^TRENDLYNE_MCP_URL=' "$ENV_FILE" | wc -l | tr -d ' ')"
[[ "$TRENDLYNE_ENV_PRESENT" == "1" ]] || die "TRENDLYNE_MCP_URL is missing from $ENV_FILE."

printf 'Local valuation discovery preflight PASS\n'
printf '  user:      %s\n' "$LOCAL_EMAIL"
printf '  portfolio: %s\n' "$PORTFOLIO_ID"
printf '  reference: TORNTPHARM (%s)\n' "$TORNT_SECURITY_ID"
printf '  max calls: 4 Trendlyne\n'

LOG_FILE="/tmp/portfolioai-h2-local-valuation-discovery.log"

if [[ "$REUSE_FUNCTION_SERVER" == "1" ]]; then
  pgrep -f "supabase functions serve" >/dev/null 2>&1 || die "H2_REUSE_FUNCTION_SERVER=1 but no local functions server is running."
  SERVE_PID=""
  trap ':' EXIT
else
  if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
    die "A manual 'supabase functions serve' is already running. Stop it or export H2_REUSE_FUNCTION_SERVER=1."
  fi
  supabase functions serve --no-verify-jwt --env-file "$ENV_FILE" --debug >"$LOG_FILE" 2>&1 &
  SERVE_PID=$!
  trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true' EXIT

  for _ in {1..30}; do
    if curl -sS -o /dev/null "$API_URL/functions/v1/discover-trendlyne-pharma-valuation-contract"; then break; fi
    sleep 1
  done
  kill -0 "$SERVE_PID" >/dev/null 2>&1 || die "Local Edge Functions server failed to start. Review $LOG_FILE."
fi

RESPONSE_FILE="$(mktemp)"
STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' -X POST "$API_URL/functions/v1/discover-trendlyne-pharma-valuation-contract" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg p "$PORTFOLIO_ID" '{portfolioId:$p}')")"

cat "$RESPONSE_FILE" | jq .

if [[ "$STATUS" -lt 200 || "$STATUS" -ge 300 ]]; then
  rm -f "$RESPONSE_FILE"
  if [[ "$REUSE_FUNCTION_SERVER" == "1" ]]; then
    die "Discovery failed with HTTP $STATUS. Review the foreground function terminal."
  fi
  die "Discovery failed with HTTP $STATUS. Review $LOG_FILE."
fi

PROVIDER_CALLS="$(jq -r '.providerCalls // -1' "$RESPONSE_FILE")"
[[ "$PROVIDER_CALLS" == "4" ]] || die "Unexpected provider call count: $PROVIDER_CALLS"

rm -f "$RESPONSE_FILE"

echo
echo "Latest local raw discovery capture"
psql "$DB_URL" -P pager=off -c "
select
  id,
  record_kind,
  retrieved_at,
  payload_hash,
  external_record_id
from public.data_source_records
where source_code='TRENDLYNE_MCP'
  and record_kind='PHARMA_VALUATION_CONTRACT_DISCOVERY_V1'
order by retrieved_at desc
limit 1;
"

echo
echo "Discovery completed locally. No canonical peer security, identity, metric-definition, or fundamental-observation promotion was performed."
