#!/usr/bin/env bash
set -euo pipefail

DB_URL="${PORTFOLIOAI_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

case "$DB_URL" in
  *"127.0.0.1"*|*"localhost"*) ;;
  *)
    echo "REFUSING: G10.1 Checkpoint B assignment is local-only."
    exit 2
    ;;
esac

psql "$DB_URL" -v ON_ERROR_STOP=1 -f scripts/r4n/alivus-g10-1-local-reviewed-assignment.sql
