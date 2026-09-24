#!/usr/bin/env bash
set -euo pipefail

DB_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

if [[ "$DB_URL" != postgresql://postgres:postgres@127.0.0.1:54322/* ]]; then
  echo "REFUSING: Program B Pharma assignment repair is restricted to the standard local Supabase database."
  exit 1
fi

psql "$DB_URL" -X -v ON_ERROR_STOP=1 \
  -f scripts/program-b-local-pharma-reference-assignment-repair.sql
