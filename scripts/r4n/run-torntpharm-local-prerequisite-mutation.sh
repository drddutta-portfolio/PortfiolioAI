#!/usr/bin/env bash
set -euo pipefail

APPROVAL_FLAG="${PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION:-}"

if [[ "${APPROVAL_FLAG}" != "YES" ]]; then
  echo "REFUSED: local prerequisite mutation is not approved for this execution." >&2
  echo "Required explicit flag: PORTFOLIOAI_ALLOW_LOCAL_PREREQUISITE_MUTATION=YES" >&2
  exit 2
fi

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
  exit 1
fi

if [[ ! "${DB_URL}" =~ ^postgres(ql)?://.*@(127\.0\.0\.1|localhost):[0-9]+/ ]]; then
  echo "ERROR: Refusing prerequisite mutation against a non-local database URL." >&2
  exit 1
fi

echo "Explicit local mutation approval flag: PASS"
echo "Local-only database guard: PASS"
echo "Applying exactly 1 metric-definition row and 4 immutable source-record prerequisites..."
echo "No fundamental observations will be inserted."

psql "${DB_URL}" -v ON_ERROR_STOP=1 -f scripts/r4n/torntpharm-local-prerequisite-mutation.sql
