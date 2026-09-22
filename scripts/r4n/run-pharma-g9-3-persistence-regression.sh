#!/usr/bin/env bash
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

if [[ "$DB_URL" != *"127.0.0.1"* && "$DB_URL" != *"localhost"* ]]; then
  echo "REFUSING: G9.3 persistence regression is local-only."
  exit 1
fi

psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/r4n/pharma-g9-3-persistence-regression.sql
