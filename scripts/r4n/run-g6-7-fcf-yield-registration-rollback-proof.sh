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

PROPOSAL="docs/sql/R4N_PHARMA_FCF_YIELD_PERCENT_V1_REGISTRATION_PROPOSAL.sql"

if [[ ! -f "${PROPOSAL}" ]]; then
  echo "ERROR: Proposal SQL not found: ${PROPOSAL}" >&2
  exit 1
fi

before_legacy="$(psql "${DB_URL}" -Atqc "select count(*) from public.fundamental_metric_definitions where code='FCF_YIELD';")"
before_canonical="$(psql "${DB_URL}" -Atqc "select count(*) from public.fundamental_metric_definitions where code='FCF_YIELD_PERCENT';")"

echo "Local-only guard: PASS"
echo "Before execution: FCF_YIELD=${before_legacy}, FCF_YIELD_PERCENT=${before_canonical}"
echo "Running G6.7 rollback-only execution proof..."
psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${PROPOSAL}"

after_legacy="$(psql "${DB_URL}" -Atqc "select count(*) from public.fundamental_metric_definitions where code='FCF_YIELD';")"
after_canonical="$(psql "${DB_URL}" -Atqc "select count(*) from public.fundamental_metric_definitions where code='FCF_YIELD_PERCENT';")"

echo "After rollback: FCF_YIELD=${after_legacy}, FCF_YIELD_PERCENT=${after_canonical}"

if [[ "${before_legacy}" != "${after_legacy}" || "${before_canonical}" != "${after_canonical}" ]]; then
  echo "ERROR: Rollback proof failed: persisted metric-definition state changed." >&2
  exit 1
fi

echo "G6.7 rollback proof: PASS"
echo "Persisted definition state unchanged."
echo "WRITE_AUTHORIZED=NO"
