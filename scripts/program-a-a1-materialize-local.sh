#!/usr/bin/env bash
set -euo pipefail

DB_URL="${PROGRAM_A_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
PORTFOLIO_ID="${1:-}"
AS_OF_DATE="${2:-$(date +%F)}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v psql >/dev/null 2>&1 || { echo "ERROR: psql is required." >&2; exit 1; }
[[ "$PORTFOLIO_ID" =~ ^[0-9a-fA-F-]{36}$ ]] || { echo "Usage: bash scripts/program-a-a1-materialize-local.sh <local-portfolio-uuid> [YYYY-MM-DD]" >&2; exit 1; }
[[ "$AS_OF_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "ERROR: as-of date must be YYYY-MM-DD." >&2; exit 1; }

case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*) ;;
  *) echo "ERROR: Refusing to run: Program A A1.2 materialization is LOCAL-ONLY and requires localhost/127.0.0.1 port 54322." >&2; exit 1 ;;
esac

SNAPSHOT_FILE="$(mktemp "${TMPDIR:-/tmp}/portfolioai-program-a-a1.XXXXXX.json")"
trap 'rm -f "$SNAPSHOT_FILE"' EXIT

echo "Program A A1.2 local cache-only materialization" >&2
echo "READ ONLY / ZERO PROVIDER CALLS / ZERO WRITES" >&2

psql "$DB_URL" -v ON_ERROR_STOP=1 -Atq \
  -v portfolio_id="$PORTFOLIO_ID" \
  -v as_of_date="$AS_OF_DATE" \
  -f "$REPO_ROOT/scripts/program-a-a1-cache-snapshot.sql" > "$SNAPSHOT_FILE"

[[ -s "$SNAPSHOT_FILE" ]] || { echo "ERROR: local portfolio was not found or produced no cache snapshot." >&2; exit 1; }
cd "$REPO_ROOT"
node scripts/program-a-a1-render-cache-snapshot.mjs "$SNAPSHOT_FILE"
