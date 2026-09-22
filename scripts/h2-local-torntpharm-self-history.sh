#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${H2_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${H2_LOCAL_EMAIL:-}"
LOCAL_PASSWORD="${H2_LOCAL_PASSWORD:-}"
API_URL="http://127.0.0.1:54321"
DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
MODE="${H2_SELF_HISTORY_MODE:-PLAN}"
REUSE_FUNCTION_SERVER="${H2_REUSE_FUNCTION_SERVER:-0}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq
need psql

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*) ;;
  *) die "Refusing to run: local H2 self-history refresh requires localhost/127.0.0.1 port 54322." ;;
esac

[[ "$MODE" == "PLAN" || "$MODE" == "EXECUTE" ]] || die "H2_SELF_HISTORY_MODE must be PLAN or EXECUTE."
[[ -n "$LOCAL_EMAIL" ]] || die "Set H2_LOCAL_EMAIL in your shell."
[[ -n "$LOCAL_PASSWORD" ]] || die "Set H2_LOCAL_PASSWORD in your shell."
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE."
grep -qE '^TRENDLYNE_MCP_URL=.+' "$ENV_FILE" || die "TRENDLYNE_MCP_URL is missing from $ENV_FILE."

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running."
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || die "Could not resolve local ANON_KEY."

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")" \
  || die "Local Supabase password sign-in failed."

ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
USER_ID="$(printf '%s' "$AUTH_JSON" | jq -r '.user.id // empty')"
[[ -n "$ACCESS_TOKEN" && -n "$USER_ID" ]] || die "Local sign-in did not return access token/user id."

SECURITY_ID="$(psql "$DB_URL" -Atqc "select id from public.securities where symbol='TORNTPHARM' and exchange='NSE' and is_active is true order by created_at limit 1;")"
[[ -n "$SECURITY_ID" ]] || die "TORNTPHARM missing locally."

IDENTITY_COUNT="$(psql "$DB_URL" -Atqc "select count(*) from public.security_identity_observations where security_id='$SECURITY_ID' and source_code='TRENDLYNE_MCP' and evidence_status='MATCHED' and provider_instrument_id='1409';")"
[[ "$IDENTITY_COUNT" -ge 1 ]] || die "TORNTPHARM matched Trendlyne identity 1409 is missing. Run scripts/h2-local-torntpharm-trendlyne-identity-setup.sh first."

PORTFOLIO_ID="$(psql "$DB_URL" -Atqc "select p.id from public.portfolios p join public.current_holdings h on h.portfolio_id=p.id where p.user_id='$USER_ID' and h.security_id='$SECURITY_ID' and h.current_quantity::numeric <> 0 order by p.id limit 1;")"
[[ -n "$PORTFOLIO_ID" ]] || die "No open local TORNTPHARM holding belongs to $LOCAL_EMAIL."

LOG_FILE="/tmp/portfolioai-h2-local-torntpharm-self-history.log"
SERVE_PID=""
READY_RESPONSE="$(mktemp)"
RESPONSE="$(mktemp)"

cleanup() {
  rm -f "$READY_RESPONSE" "$RESPONSE"
  if [[ -n "$SERVE_PID" ]]; then
    kill "$SERVE_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

if [[ "$REUSE_FUNCTION_SERVER" == "1" ]]; then
  pgrep -f "supabase functions serve" >/dev/null 2>&1 || die "H2_REUSE_FUNCTION_SERVER=1 but no local functions server is running."
else
  if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
    die "A manual 'supabase functions serve' process is already running. Stop it or export H2_REUSE_FUNCTION_SERVER=1."
  fi

  supabase functions serve --no-verify-jwt --env-file "$ENV_FILE" --debug >"$LOG_FILE" 2>&1 &
  SERVE_PID=$!
fi

# Strong readiness proof: authenticated PLAN exercises the real function worker,
# auth, local DB, Trendlyne identity, metric definition and provider controls.
# PLAN is contractually zero provider calls and zero fundamental writes.
PLAN_PAYLOAD="$(jq -nc --arg p "$PORTFOLIO_ID" --arg s "$SECURITY_ID" '{action:"PLAN",portfolioId:$p,securityId:$s}')"
SERVER_READY=0
READY_STATUS="000"

for _ in {1..45}; do
  if [[ -n "$SERVE_PID" ]] && ! kill -0 "$SERVE_PID" >/dev/null 2>&1; then
    break
  fi

  : > "$READY_RESPONSE"
  READY_STATUS="$(curl --max-time 8 -sS -o "$READY_RESPONSE" -w '%{http_code}' -X POST "$API_URL/functions/v1/refresh-valuation-evidence" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$PLAN_PAYLOAD" || true)"

  if [[ "$READY_STATUS" == "200" ]] \
    && jq -e '.mode == "VALUATION_EVIDENCE_REFRESH_PLAN" and .providerCalls == 0 and .security == "TORNTPHARM" and .providerInstrumentId == "1409"' "$READY_RESPONSE" >/dev/null 2>&1; then
    SERVER_READY=1
    break
  fi
  sleep 1
done

if [[ "$SERVER_READY" != "1" ]]; then
  echo "Authenticated zero-call PLAN readiness failed." >&2
  echo "Last HTTP status: $READY_STATUS" >&2
  if [[ -s "$READY_RESPONSE" ]]; then
    echo "Last response:" >&2
    cat "$READY_RESPONSE" >&2
    echo >&2
  fi
  die "Local refresh-valuation-evidence function failed to become fully ready. Review $LOG_FILE."
fi

if [[ "$MODE" == "PLAN" ]]; then
  jq . "$READY_RESPONSE"
  echo
  echo "PLAN complete: zero provider calls and zero self-history writes."
  exit 0
fi

EXECUTE_PAYLOAD="$(jq -nc --arg p "$PORTFOLIO_ID" --arg s "$SECURITY_ID" '{action:"EXECUTE",portfolioId:$p,securityId:$s,confirmation:"OWNER_CONFIRMED_VALUATION_EVIDENCE_REFRESH"}')"

STATUS="$(curl --max-time 90 -sS -o "$RESPONSE" -w '%{http_code}' -X POST "$API_URL/functions/v1/refresh-valuation-evidence" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$EXECUTE_PAYLOAD")"

if jq . "$RESPONSE" >/dev/null 2>&1; then jq . "$RESPONSE"; else cat "$RESPONSE"; fi

if [[ "$STATUS" -lt 200 || "$STATUS" -ge 300 ]]; then
  die "Local TORNTPHARM self-history EXECUTE failed with HTTP $STATUS. Review $LOG_FILE."
fi

echo
echo "Latest TORNTPHARM self-history evidence"
psql "$DB_URL" -P pager=off -c "
select
  s.symbol,
  f.metric_code,
  f.numeric_value,
  f.unit,
  f.source_code,
  f.evidence_status,
  f.retrieved_at,
  f.fresh_until,
  case when f.fresh_until > now() then 'FRESH' else 'STALE' end as freshness_state
from public.fundamental_observations f
join public.securities s on s.id=f.security_id
where s.symbol='TORNTPHARM'
  and f.metric_code='PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT'
order by f.retrieved_at desc
limit 3;
"

echo
echo "PASS: local-only TORNTPHARM self-history refresh completed."
echo "Production was not contacted."
