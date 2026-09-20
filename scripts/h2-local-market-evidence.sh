#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

ENV_FILE="${H2_LOCAL_ENV_FILE:-supabase/.env.local}"
LOCAL_EMAIL="${H2_LOCAL_EMAIL:-}"
LOCAL_PASSWORD="${H2_LOCAL_PASSWORD:-}"
API_URL="http://127.0.0.1:54321"
DB_URL="${H2_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

die() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "$1 is required."; }

need supabase
need curl
need jq
need psql

[[ -n "$LOCAL_EMAIL" ]] || die "Set H2_LOCAL_EMAIL in your shell."
[[ -n "$LOCAL_PASSWORD" ]] || die "Set H2_LOCAL_PASSWORD in your shell."
[[ -f "$ENV_FILE" ]] || die "Missing $ENV_FILE. Create it locally with Angel One secrets; never commit it."

STATUS_ENV="$(supabase status -o env 2>/dev/null)" || die "Local Supabase is not running. Run: supabase start"
ANON_KEY="$(printf '%s\n' "$STATUS_ENV" | sed -nE 's/^ANON_KEY="?([^"]+)"?$/\1/p' | head -n1)"
[[ -n "$ANON_KEY" ]] || die "Could not resolve local ANON_KEY from 'supabase status -o env'."

AUTH_JSON="$(curl -fsS -X POST "$API_URL/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$(jq -nc --arg email "$LOCAL_EMAIL" --arg password "$LOCAL_PASSWORD" '{email:$email,password:$password}')")" \
  || die "Local Supabase password sign-in failed."

ACCESS_TOKEN="$(printf '%s' "$AUTH_JSON" | jq -r '.access_token // empty')"
USER_ID="$(printf '%s' "$AUTH_JSON" | jq -r '.user.id // empty')"
[[ -n "$ACCESS_TOKEN" && -n "$USER_ID" ]] || die "Local sign-in did not return an access token/user id."

SECURITY_ID="$(psql "$DB_URL" -Atqc "select id from public.securities where symbol='TORNTPHARM' and is_active is true order by created_at limit 1;")"
[[ -n "$SECURITY_ID" ]] || die "TORNTPHARM is missing from the local securities table."

PORTFOLIO_ID="$(psql "$DB_URL" -Atqc "select p.id from public.portfolios p join public.current_holdings h on h.portfolio_id=p.id where p.user_id='$USER_ID' and h.security_id='$SECURITY_ID' and h.current_quantity::numeric <> 0 order by p.created_at limit 1;")"
[[ -n "$PORTFOLIO_ID" ]] || die "No open local TORNTPHARM holding belongs to $LOCAL_EMAIL."

MAPPING_STATE="$(psql "$DB_URL" -Atqc "select coalesce(mapping_status,'') || '|' || coalesce(provider_instrument_id,'') || '|' || coalesce(exchange,'') || '|' || coalesce(trading_symbol,'') from public.market_data_instrument_mappings where security_id='$SECURITY_ID' and provider_code='ANGEL_ONE' limit 1;")"
[[ "$MAPPING_STATE" == VERIFIED\|* ]] || die "TORNTPHARM does not have a VERIFIED local Angel One mapping."

printf 'Local preflight PASS\n'
printf '  user:      %s\n' "$LOCAL_EMAIL"
printf '  portfolio: %s\n' "$PORTFOLIO_ID"
printf '  security:  %s\n' "$SECURITY_ID"
printf '  mapping:   %s\n' "$MAPPING_STATE"

LOG_FILE="/tmp/portfolioai-h2-local-functions.log"
supabase functions serve refresh-market-history refresh-pharma-benchmark --env-file "$ENV_FILE" >"$LOG_FILE" 2>&1 &
SERVE_PID=$!
trap 'kill "$SERVE_PID" >/dev/null 2>&1 || true' EXIT

for _ in {1..30}; do
  if curl -sS -o /dev/null "$API_URL/functions/v1/refresh-market-history"; then break; fi
  sleep 1
done

call_fn() {
  local fn="$1"
  local payload="$2"
  curl -fsS -X POST "$API_URL/functions/v1/$fn" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$payload"
}

market_plan="$(jq -nc --arg p "$PORTFOLIO_ID" --arg s "$SECURITY_ID" '{action:"PLAN",portfolioId:$p,securityId:$s}')"
printf '\nTORNTPHARM market-history PLAN\n'
call_fn refresh-market-history "$market_plan" | jq .

market_execute="$(jq -nc --arg p "$PORTFOLIO_ID" --arg s "$SECURITY_ID" '{action:"EXECUTE",portfolioId:$p,securityId:$s,confirmation:"OWNER_CONFIRMED_MARKET_HISTORY_REFRESH"}')"
printf '\nTORNTPHARM market-history EXECUTE\n'
call_fn refresh-market-history "$market_execute" | jq .

benchmark_plan="$(jq -nc --arg p "$PORTFOLIO_ID" --arg s "$SECURITY_ID" '{action:"PLAN",portfolioId:$p,securityId:$s}')"
printf '\nNIFTY Pharma benchmark PLAN\n'
call_fn refresh-pharma-benchmark "$benchmark_plan" | jq .

benchmark_execute="$(jq -nc --arg p "$PORTFOLIO_ID" --arg s "$SECURITY_ID" '{action:"EXECUTE",portfolioId:$p,securityId:$s,confirmation:"OWNER_CONFIRMED_PHARMA_BENCHMARK_REFRESH"}')"
printf '\nNIFTY Pharma benchmark EXECUTE\n'
call_fn refresh-pharma-benchmark "$benchmark_execute" | jq .

printf '\nLocal verification\n'
psql "$DB_URL" -P pager=off -c "
select metric_code, round(numeric_value::numeric, 6) as value, unit, as_of_date, lookback_start, lookback_end, fresh_until
from public.market_metric_observations
where security_id='$SECURITY_ID'
  and provider_code='ANGEL_ONE'
  and metric_code in ('PRICE_MOMENTUM_12M','PRICE_MOMENTUM_6M','MAX_DRAWDOWN_1Y','VOLATILITY_1Y','RELATIVE_STRENGTH_12M')
order by metric_code, as_of_date desc;
"

psql "$DB_URL" -P pager=off -c "
select benchmark_code, count(*) as candles, min(period_start)::date as first_day, max(period_start)::date as last_day
from public.market_benchmark_price_history
where benchmark_code='NIFTY_PHARMA' and provider_code='ANGEL_ONE'
group by benchmark_code;
"

printf '\nH2 Risk relative-volatility derivation from local raw histories\n'
psql "$DB_URL" -P pager=off -c "
with common_closes as (
  select
    s.period_start::date as d,
    s.close::numeric as stock_close,
    b.close::numeric as benchmark_close
  from public.market_price_history s
  join public.market_benchmark_price_history b
    on b.period_start::date = s.period_start::date
   and b.benchmark_code='NIFTY_PHARMA'
   and b.provider_code='ANGEL_ONE'
   and b.interval='ONE_DAY'
  where s.security_id='$SECURITY_ID'
    and s.provider_code='ANGEL_ONE'
    and s.interval='ONE_DAY'
),
bounded as (
  select *
  from common_closes
  where d >= (select max(d) - 365 from common_closes)
),
returns as (
  select
    d,
    ln(stock_close / lag(stock_close) over (order by d)) as stock_lr,
    ln(benchmark_close / lag(benchmark_close) over (order by d)) as benchmark_lr
  from bounded
),
vols as (
  select
    stddev_samp(stock_lr) * sqrt(252) as stock_vol,
    stddev_samp(benchmark_lr) * sqrt(252) as benchmark_vol,
    count(*) filter (where stock_lr is not null and benchmark_lr is not null) as common_daily_returns
  from returns
)
select
  round((stock_vol * 100)::numeric, 6) as torntpharm_volatility_1y_percent,
  round((benchmark_vol * 100)::numeric, 6) as nifty_pharma_volatility_1y_percent,
  round((stock_vol / nullif(benchmark_vol,0))::numeric, 6) as relative_volatility_ratio,
  common_daily_returns
from vols;
"

printf '\nNOTE: MAX_DRAWDOWN_1Y is stored as an absolute positive magnitude; the approved Risk evaluator consumes its negative signed form.\n'
printf 'PASS boundary: all writes above are local Supabase only.\n'
printf 'Function log: %s\n' "$LOG_FILE"
