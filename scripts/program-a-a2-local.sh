#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"
PORTFOLIO_ID="${2:-}"
AS_OF_DATE="${3:-$(date +%F)}"
PLAN_ID="${4:-}"
CONFIRMATION_TOKEN="${5:-}"
DB_URL="${PROGRAM_A_LOCAL_DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[[ "$MODE" == "PLAN" || "$MODE" == "EXECUTE" ]] || { echo "Usage: bash scripts/program-a-a2-local.sh PLAN <portfolio-uuid> [YYYY-MM-DD]" >&2; echo "   or: bash scripts/program-a-a2-local.sh EXECUTE <portfolio-uuid> <YYYY-MM-DD> <plan-id> <confirmation-token>" >&2; exit 1; }
[[ "$PORTFOLIO_ID" =~ ^[0-9a-fA-F-]{36}$ ]] || { echo "ERROR: a local portfolio UUID is required." >&2; exit 1; }
case "$DB_URL" in
  postgresql://*@127.0.0.1:54322/*|postgres://*@127.0.0.1:54322/*|postgresql://*@localhost:54322/*|postgres://*@localhost:54322/*) ;;
  *) echo "ERROR: UNEXPECTED_PRODUCTION_DB_TARGET" >&2; exit 1 ;;
esac
if [[ "$MODE" == "EXECUTE" && ( -z "$PLAN_ID" || -z "$CONFIRMATION_TOKEN" ) ]]; then echo "ERROR: EXECUTE requires plan id and confirmation token." >&2; exit 1; fi

SNAPSHOT_FILE="$(mktemp "${TMPDIR:-/tmp}/portfolioai-program-a-a2.XXXXXX.json")"
trap 'rm -f "$SNAPSHOT_FILE"' EXIT
psql "$DB_URL" -v ON_ERROR_STOP=1 -Atq -v portfolio_id="$PORTFOLIO_ID" -v as_of_date="$AS_OF_DATE" -f "$REPO_ROOT/scripts/program-a-a1-cache-snapshot.sql" > "$SNAPSHOT_FILE"
[[ -s "$SNAPSHOT_FILE" ]] || { echo "ERROR: local portfolio was not found or produced no cache snapshot." >&2; exit 1; }
cd "$REPO_ROOT"
if [[ "$MODE" == "PLAN" ]]; then
  node scripts/program-a-a2-runner.mjs PLAN "$SNAPSHOT_FILE"
else
  node scripts/program-a-a2-runner.mjs EXECUTE "$SNAPSHOT_FILE" "$PLAN_ID" "$CONFIRMATION_TOKEN"
fi
