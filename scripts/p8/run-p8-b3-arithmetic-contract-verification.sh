#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

OUT="tmp/p8-b3/arithmetic-contract-verification"
mkdir -p "$OUT"

echo "P8-B3 arithmetic contract candidate verification"
echo "HEAD=$(git rev-parse HEAD)" | tee "$OUT/head.txt"

echo
echo "1/5 arithmetic + corporate-action fixtures"
npm test --   src/features/backtesting/p8ArithmeticPolicy.test.ts   src/features/backtesting/p8CorporateActionAdjustment.test.ts   2>&1 | tee "$OUT/tests.log"

echo
echo "2/5 TypeScript"
npm run typecheck 2>&1 | tee "$OUT/typecheck.log"

echo
echo "3/5 scoped lint / architecture"
npx eslint   src/features/backtesting/p8ArithmeticPolicy.ts   src/features/backtesting/p8ArithmeticPolicy.test.ts   src/features/backtesting/p8CorporateActionAdjustment.ts   src/features/backtesting/p8CorporateActionAdjustment.test.ts   2>&1 | tee "$OUT/eslint.log"
npm run check:architecture 2>&1 | tee "$OUT/architecture.log"

echo
echo "4/5 production build"
npm run build 2>&1 | tee "$OUT/build.log"

echo
echo "5/5 repository hygiene"
git diff --check 2>&1 | tee "$OUT/git-diff-check.log"

echo
echo "P8_B3_ARITHMETIC_CONTRACT_CANDIDATE_VERIFICATION_PASS"
echo "Artifacts: $OUT"
