#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/r4n/auropharma-local-research-target.sql"
DB_URL="${PORTFOLIOAI_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
LOCAL_USER_EMAIL="${PORTFOLIOAI_LOCAL_USER_EMAIL:-}"

case "$DB_URL" in
  *"127.0.0.1"*|*"localhost"*)
    ;;
  *)
    echo "REFUSING: AUROPHARMA G8 fixture is local-only. Set PORTFOLIOAI_LOCAL_DB_URL to a localhost Supabase database."
    exit 2
    ;;
esac

if [[ -z "$LOCAL_USER_EMAIL" ]]; then
  echo "REFUSING: set PORTFOLIOAI_LOCAL_USER_EMAIL to the email used to log into localhost PortfolioAI."
  echo ""
  echo "Local active portfolio candidates:"
  psql "$DB_URL" -P pager=off -c "
    SELECT
      u.email,
      p.id AS portfolio_id,
      p.created_at,
      COALESCE(string_agg(s.symbol || ':' || ch.current_quantity::text, ', ' ORDER BY s.symbol), '<no positive holdings>') AS holdings
    FROM public.portfolios p
    JOIN auth.users u ON u.id = p.user_id
    LEFT JOIN public.current_holdings ch
      ON ch.portfolio_id = p.id
     AND ch.current_quantity > 0
    LEFT JOIN public.securities s ON s.id = ch.security_id
    WHERE p.is_active
    GROUP BY u.email, p.id, p.created_at
    ORDER BY u.email, p.created_at, p.id;
  "
  exit 2
fi

echo "Applying AUROPHARMA local Research target fixture..."
echo "Database: local Supabase only"
psql "$DB_URL" -v ON_ERROR_STOP=1 -v local_user_email="$LOCAL_USER_EMAIL" -f "$SQL_FILE"
