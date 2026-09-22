#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/r4n/biocon-g10-3-local-research-target.sql"
DB_URL="${PORTFOLIOAI_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

case "$DB_URL" in
  *"127.0.0.1"*|*"localhost"*) ;;
  *)
    echo "REFUSING: G10.3 BIOCON fixture is local-only. PORTFOLIOAI_LOCAL_DB_URL must target localhost."
    exit 2
    ;;
esac

echo "Applying G10.3 BIOCON local Research target fixture..."
echo "Database: local Supabase only"
psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
