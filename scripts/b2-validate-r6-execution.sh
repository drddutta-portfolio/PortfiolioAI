#!/usr/bin/env bash
set -euo pipefail

echo "== Program B · B2 R6 execution & validation =="

npx vitest run \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/syngeneG104FinalResult.test.ts \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/k3BankNbfcClosure.test.ts \
  src/features/research/k3BankNbfcPortability.test.ts \
  supabase/functions/_shared/bank-benchmark-authority.test.ts \
  src/features/research/ResearchScorecardPanel.test.tsx \
  src/pages/ResearchPage.test.tsx

node scripts/program-b-b2-report.mjs

npm run typecheck
npm run check:architecture
npm run build
git diff --check

echo "B2 CANDIDATE VALIDATION PASS"
echo "R6 provider calls: 0"
echo "Recommendation/sizing: NOT EXECUTED"
echo "Next checkpoint: B3 only after B2 closure and explicit owner approval"
