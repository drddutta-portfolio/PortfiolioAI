#!/usr/bin/env bash
set -euo pipefail

if ! command -v supabase >/dev/null 2>&1; then
  echo "ERROR: Supabase CLI is required." >&2
  exit 1
fi
if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql is required." >&2
  exit 1
fi

DB_URL="$(supabase status -o env 2>/dev/null | sed -n 's/^DB_URL=//p' | tr -d '"' | head -n 1)"
if [[ -z "${DB_URL}" ]]; then
  echo "ERROR: Local Supabase DB_URL was not returned by 'supabase status -o env'." >&2
  echo "Start local Supabase first, then rerun this command." >&2
  exit 1
fi

if [[ ! "${DB_URL}" =~ ^postgres(ql)?://.*@(127\.0\.0\.1|localhost):[0-9]+/ ]]; then
  echo "ERROR: Refusing to run against a non-local database URL." >&2
  exit 1
fi

echo "Local-only guard: PASS"
echo "Running TORNTPHARM numeric preflight in READ ONLY mode..."
psql "${DB_URL}" -v ON_ERROR_STOP=1 -f scripts/r4n/torntpharm-local-numeric-preflight.sql
