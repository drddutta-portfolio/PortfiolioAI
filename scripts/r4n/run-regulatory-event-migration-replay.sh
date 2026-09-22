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
  exit 1
fi

if [[ ! "${DB_URL}" =~ ^postgres(ql)?://.*@(127\.0\.0\.1|localhost):[0-9]+/ ]]; then
  echo "ERROR: Refusing to run against a non-local database URL." >&2
  exit 1
fi

before_history="$(psql "${DB_URL}" -Atqc "select count(*)::text || ':' || coalesce(max(version)::text,'') from supabase_migrations.schema_migrations")"
before_source="$(psql "${DB_URL}" -Atqc "select count(*) from public.data_sources where code='US_FDA_OFFICIAL'")"
before_table="$(psql "${DB_URL}" -Atqc "select case when to_regclass('public.research_regulatory_event_observations') is null then 0 else 1 end")"
before_view="$(psql "${DB_URL}" -Atqc "select case when to_regclass('public.current_research_regulatory_site_state_v1') is null then 0 else 1 end")"

if [[ "${before_table}" != "0" || "${before_view}" != "0" ]]; then
  echo "ERROR: Proposed regulatory objects already exist locally; refusing replay." >&2
  exit 1
fi

echo "Local-only guard: PASS"
echo "Running rollback-only regulatory migration replay..."
psql "${DB_URL}" -v ON_ERROR_STOP=1 -f docs/sql/R4N_PHARMA_REGULATORY_EVENT_EVIDENCE_V1_MIGRATION_PROPOSAL.sql

after_history="$(psql "${DB_URL}" -Atqc "select count(*)::text || ':' || coalesce(max(version)::text,'') from supabase_migrations.schema_migrations")"
after_source="$(psql "${DB_URL}" -Atqc "select count(*) from public.data_sources where code='US_FDA_OFFICIAL'")"
after_table="$(psql "${DB_URL}" -Atqc "select case when to_regclass('public.research_regulatory_event_observations') is null then 0 else 1 end")"
after_view="$(psql "${DB_URL}" -Atqc "select case when to_regclass('public.current_research_regulatory_site_state_v1') is null then 0 else 1 end")"

if [[ "${before_history}" != "${after_history}" ]]; then
  echo "ERROR: Supabase migration history changed during rollback-only replay." >&2
  exit 1
fi
if [[ "${before_source}" != "${after_source}" ]]; then
  echo "ERROR: US_FDA_OFFICIAL registry state changed after rollback." >&2
  exit 1
fi
if [[ "${after_table}" != "0" || "${after_view}" != "0" ]]; then
  echo "ERROR: Proposed regulatory objects remain after rollback." >&2
  exit 1
fi

echo "Replay result: PASS"
echo "Migration history unchanged: YES"
echo "Proposed table absent after rollback: YES"
echo "Proposed view absent after rollback: YES"
echo "US_FDA_OFFICIAL registry count unchanged: YES"
echo "Persistent schema changes: 0"
