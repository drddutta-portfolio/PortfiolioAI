#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

OUT="tmp/p8-b3/hardening-verification"
mkdir -p "$OUT"

required_logs=(
  "$OUT/supabase-db-reset.log"
  "$OUT/p8-b3-foundation-contract.log"
)

for log in "${required_logs[@]}"; do
  if [ ! -f "$log" ]; then
    echo "ERROR: required passed-step log missing: $log" >&2
    exit 1
  fi
done

echo "P8-B3 hardening verification resume"
echo "HEAD=$(git rev-parse HEAD)" | tee "$OUT/resume-head.txt"

echo
echo "3/9 corrected B3 hardening contract"
psql   "postgresql://postgres:postgres@127.0.0.1:54322/postgres"   -v ON_ERROR_STOP=1   -f supabase/tests/p8_b3_schema_hardening.sql   2>&1 | tee "$OUT/p8-b3-hardening-contract.log"

echo
echo "4/9 deterministic financial fixtures"
npm test -- src/features/backtesting/p8CorporateActionAdjustment.test.ts   2>&1 | tee "$OUT/p8-b3-adjustment-tests.log"

echo
echo "5/9 TypeScript / architecture / scoped lint"
npm run typecheck 2>&1 | tee "$OUT/typecheck.log"
npm run check:architecture 2>&1 | tee "$OUT/architecture.log"
npx eslint   src/features/backtesting/p8CorporateActionAdjustment.ts   src/features/backtesting/p8CorporateActionAdjustment.test.ts   scripts/p8/p8-b3-plan-market-history.mjs   scripts/p8/p8-b3-official-source-canary.mjs   scripts/p8/run-p8-b3-hardening-local-verification.sh   scripts/p8/run-p8-b3-hardening-local-verification-resume.sh   2>&1 | tee "$OUT/scoped-eslint.log"

echo
echo "6/9 production build"
npm run build 2>&1 | tee "$OUT/build.log"

echo
echo "7/9 local DB lint / ledger / generated types"
supabase db lint --level warning 2>&1 | tee "$OUT/supabase-db-lint.log"

psql   "postgresql://postgres:postgres@127.0.0.1:54322/postgres"   -v ON_ERROR_STOP=1   -Atc "select version || '|' || coalesce(name,'') from supabase_migrations.schema_migrations order by version"   2>&1 | tee "$OUT/local-migration-ledger.log"

if ! grep -q '^20261001131500|harden_p8_b3_access_and_foreign_key_indexes$' "$OUT/local-migration-ledger.log"; then
  echo "ERROR: B3 hardening migration is absent from local ledger." >&2
  exit 1
fi

supabase gen types --lang typescript --local > "$OUT/database.types.ts"
if ! grep -q 'p8_b3_source_archives' "$OUT/database.types.ts"; then
  echo "ERROR: generated types do not contain B3 objects." >&2
  exit 1
fi

echo
echo "8/9 post-replay schema diff"
supabase db diff --schema public > "$OUT/local-schema-diff.sql" 2> "$OUT/local-schema-diff.stderr"
if [ -s "$OUT/local-schema-diff.sql" ]; then
  echo "ERROR: local schema diff is not empty after hardening replay." >&2
  cat "$OUT/local-schema-diff.sql" >&2
  exit 1
fi

echo
echo "9/9 repository hygiene / secret scan"
git diff --check 2>&1 | tee "$OUT/git-diff-check.log"

if git grep -nE   '(SUPABASE_SERVICE_ROLE_KEY[[:space:]]*=|service_role_key[[:space:]]*=|sk_(live|test)_[A-Za-z0-9]{12,}|eyJ[A-Za-z0-9_-]{40,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})'   --   supabase/migrations/20261001131500_harden_p8_b3_access_and_foreign_key_indexes.sql   supabase/tests/p8_b3_schema_hardening.sql   supabase/tests/p8_b3_market_history_foundation.sql   > "$OUT/secret-scan.log"
then
  echo "ERROR: credential-shaped material found in B3 hardening package." >&2
  cat "$OUT/secret-scan.log" >&2
  exit 1
else
  : > "$OUT/secret-scan.log"
fi

echo
echo "P8_B3_HARDENING_LOCAL_VERIFICATION_PASS"
echo "Artifacts: $OUT"
