#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${H2_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${H2_LOCAL_EMAIL:-}"
LOCAL_PASSWORD="${H2_LOCAL_PASSWORD:-}"
API_URL="http://127.0.0.1:54321"
DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
MODE="${H2_VALUATION_MODE:-PLAN}"
REUSE_FUNCTION_SERVER="${H2_REUSE_FUNCTION_SERVER:-0}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq
need psql

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*) ;;
  *) die "Refusing to run: local H2 valuation acquisition requires localhost/127.0.0.1 port 54322." ;;
esac

[[ "$MODE" == "PLAN" || "$MODE" == "EXECUTE" ]] || die "H2_VALUATION_MODE must be PLAN or EXECUTE."
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

TORNT_ID="$(psql "$DB_URL" -Atqc "select id from public.securities where symbol='TORNTPHARM' and exchange='NSE' and is_active is true order by created_at limit 1;")"
[[ -n "$TORNT_ID" ]] || die "TORNTPHARM missing locally."

PORTFOLIO_ID="$(psql "$DB_URL" -Atqc "select p.id from public.portfolios p join public.current_holdings h on h.portfolio_id=p.id where p.user_id='$USER_ID' and h.security_id='$TORNT_ID' and h.current_quantity::numeric <> 0 order by p.created_at limit 1;")"
[[ -n "$PORTFOLIO_ID" ]] || die "No open local TORNTPHARM holding belongs to $LOCAL_EMAIL."

TMP_ENV="$(mktemp)"
cp "$ENV_FILE" "$TMP_ENV"
printf '\nH2_LOCAL_PHARMA_VALUATION_ENABLED=true\n' >> "$TMP_ENV"
LOG_FILE="/tmp/portfolioai-h2-local-pharma-valuation-evidence.log"

if [[ "$REUSE_FUNCTION_SERVER" == "1" ]]; then
  pgrep -f "supabase functions serve" >/dev/null 2>&1 || die "H2_REUSE_FUNCTION_SERVER=1 but no local functions server is running."
  SERVE_PID=""
  trap 'rm -f "$TMP_ENV"' EXIT
else
  if pgrep -f "supabase functions serve" >/dev/null 2>&1; then
    rm -f "$TMP_ENV"
    die "A manual 'supabase functions serve' process is already running. Stop it or export H2_REUSE_FUNCTION_SERVER=1."
  fi
  supabase functions serve h2-local-pharma-valuation-evidence --no-verify-jwt --env-file "$TMP_ENV" --debug >"$LOG_FILE" 2>&1 &
  SERVE_PID=$!
  trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true; rm -f "$TMP_ENV"' EXIT

  for _ in {1..30}; do
    if curl -sS -o /dev/null "$API_URL/functions/v1/h2-local-pharma-valuation-evidence"; then break; fi
    sleep 1
  done
  kill -0 "$SERVE_PID" >/dev/null 2>&1 || die "Local function server failed to start. Review $LOG_FILE."
fi

if [[ "$MODE" == "PLAN" ]]; then
  PAYLOAD="$(jq -nc --arg p "$PORTFOLIO_ID" '{action:"PLAN",portfolioId:$p}')"
else
  PAYLOAD="$(jq -nc --arg p "$PORTFOLIO_ID" '{action:"EXECUTE",portfolioId:$p,confirmation:"OWNER_CONFIRMED_H2_LOCAL_PHARMA_VALUATION_EVIDENCE"}')"
fi

RESPONSE="$(mktemp)"
STATUS="$(curl --max-time 90 -sS -o "$RESPONSE" -w '%{http_code}' -X POST "$API_URL/functions/v1/h2-local-pharma-valuation-evidence" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")"

cat "$RESPONSE" | jq .
rm -f "$RESPONSE"

if [[ "$STATUS" -lt 200 || "$STATUS" -ge 300 ]]; then
  die "Local H2 valuation $MODE failed with HTTP $STATUS. Review $LOG_FILE."
fi

if [[ "$MODE" == "PLAN" ]]; then
  echo
  echo "PLAN complete: zero provider calls and zero valuation writes."
  echo "To EXECUTE later, explicit owner approval is required."
  exit 0
fi

echo
echo "Fresh local PE_TTM / EV_EBITDA evidence"
bash scripts/h2-local-valuation-evidence-audit.sh

echo
echo "PASS: local-only H2 valuation evidence acquisition completed."
echo "Provider calls for this execution: 1"
echo "Production was not contacted."
