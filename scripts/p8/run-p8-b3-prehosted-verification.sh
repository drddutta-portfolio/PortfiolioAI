#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

OUT="tmp/p8-b3/prehosted-verification"
mkdir -p "$OUT"

echo "P8-B3 pre-hosted verification"
echo "HEAD=$(git rev-parse HEAD)" | tee "$OUT/head.txt"

echo
echo "1/10 clean local replay"
supabase db reset 2>&1 | tee "$OUT/supabase-db-reset.log"

echo
echo "2/10 SQL contract"
psql   "postgresql://postgres:postgres@127.0.0.1:54322/postgres"   -v ON_ERROR_STOP=1   -f supabase/tests/p8_b3_market_history_foundation.sql   2>&1 | tee "$OUT/p8-b3-sql-contract.log"

echo
echo "3/10 deterministic financial fixtures"
npm test -- src/features/backtesting/p8CorporateActionAdjustment.test.ts   2>&1 | tee "$OUT/p8-b3-adjustment-tests.log"

echo
echo "4/10 TypeScript"
npm run typecheck 2>&1 | tee "$OUT/typecheck.log"

echo
echo "5/10 scoped lint"
npx eslint   src/features/backtesting/p8CorporateActionAdjustment.ts   src/features/backtesting/p8CorporateActionAdjustment.test.ts   scripts/p8/p8-b3-plan-market-history.mjs   scripts/p8/p8-b3-official-source-canary.mjs   2>&1 | tee "$OUT/scoped-eslint.log"

echo
echo "6/10 architecture"
npm run check:architecture 2>&1 | tee "$OUT/architecture.log"

echo
echo "7/10 production build"
npm run build 2>&1 | tee "$OUT/build.log"

echo
echo "8/10 local DB lint, migration list and generated types"
supabase db lint --level warning 2>&1 | tee "$OUT/supabase-db-lint.log"

# The current Supabase CLI "migration list" command always requires a linked
# remote project. This verification worktree is intentionally not linked.
# Read the local migration ledger directly instead.
psql \
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -v ON_ERROR_STOP=1 \
  -Atc "select version || '|' || coalesce(name,'') from supabase_migrations.schema_migrations order by version" \
  2>&1 | tee "$OUT/local-migration-ledger.log"

supabase gen types --lang typescript --local > "$OUT/database.types.ts"

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

# Added package must not contain obvious credential-shaped material.
if git grep -nE   '(SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=|service_role_key[[:space:]]*=|sk_(live|test)_[A-Za-z0-9]{12,}|eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})'   --   supabase/migrations/20261001123000_create_p8_b3_market_history_foundation.sql   supabase/tests/p8_b3_market_history_foundation.sql   src/features/backtesting/p8CorporateActionAdjustment.ts   src/features/backtesting/p8CorporateActionAdjustment.test.ts   scripts/p8/p8-b3-plan-market-history.mjs   scripts/p8/p8-b3-official-source-canary.mjs   > "$OUT/secret-scan.log"
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
