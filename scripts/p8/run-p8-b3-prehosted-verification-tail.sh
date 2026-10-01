#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

OUT="tmp/p8-b3/prehosted-verification"
mkdir -p "$OUT"

# This tail runner is valid only after the main runner reached step 8.
# Because the main runner is set -euo pipefail, reaching step 8 proves
# steps 1-7 exited successfully.
required_logs=(
  "$OUT/supabase-db-reset.log"
  "$OUT/p8-b3-sql-contract.log"
  "$OUT/p8-b3-adjustment-tests.log"
  "$OUT/typecheck.log"
  "$OUT/scoped-eslint.log"
  "$OUT/architecture.log"
  "$OUT/build.log"
)

for log in "${required_logs[@]}"; do
  if [ ! -f "$log" ]; then
    echo "ERROR: required passed-step log missing: $log" >&2
    exit 1
  fi
done

echo "P8-B3 pre-hosted verification resume: steps 8-10"
echo "HEAD=$(git rev-parse HEAD)" | tee "$OUT/tail-head.txt"

echo
echo "8/10 local DB lint, local migration ledger and generated types"
supabase db lint --level warning 2>&1 | tee "$OUT/supabase-db-lint.log"

psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -Atc "select version || '|' || coalesce(name,'') from supabase_migrations.schema_migrations order by version" \
  2>&1 | tee "$OUT/local-migration-ledger.log"

if ! grep -q '^20261001123000|' "$OUT/local-migration-ledger.log"; then
  echo "ERROR: local B3 migration is absent from the applied local migration ledger." >&2
  exit 1
fi

supabase gen types --lang typescript --local > "$OUT/database.types.ts"

if ! grep -q 'p8_b3_source_archives' "$OUT/database.types.ts"; then
  echo "ERROR: generated local types do not contain B3 schema objects." >&2
  exit 1
fi

echo
echo "9/10 post-replay schema diff"
supabase db diff --schema public > "$OUT/local-schema-diff.sql" 2> "$OUT/local-schema-diff.stderr"
if [ -s "$OUT/local-schema-diff.sql" ]; then
  echo "ERROR: local schema diff is not empty after reset." >&2
  cat "$OUT/local-schema-diff.sql" >&2
  exit 1
fi

echo
echo "10/10 repository hygiene"
git diff --check 2>&1 | tee "$OUT/git-diff-check.log"

if git grep -nE \
  '(SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=|service_role_key[[:space:]]*=|sk_(live|test)_[A-Za-z0-9]{12,}|eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})' \
  -- \
  supabase/migrations/20261001123000_create_p8_b3_market_history_foundation.sql \
  supabase/tests/p8_b3_market_history_foundation.sql \
  src/features/backtesting/p8CorporateActionAdjustment.ts \
  src/features/backtesting/p8CorporateActionAdjustment.test.ts \
  scripts/p8/p8-b3-plan-market-history.mjs \
  scripts/p8/p8-b3-official-source-canary.mjs \
  > "$OUT/secret-scan.log"
then
  echo "ERROR: credential-shaped material found in B3 package." >&2
  cat "$OUT/secret-scan.log" >&2
  exit 1
else
  : > "$OUT/secret-scan.log"
fi

echo
echo "P8_B3_PREHOSTED_VERIFICATION_PASS"
echo "Artifacts: $OUT"
