#!/usr/bin/env bash
set -euo pipefail

H3_BASE_SHA="19fe59c4ed7022c3bef02c54ac39d30dd773da40"

echo "== H3 / TORNTPHARM deterministic read-only score validation =="

git rev-parse --verify "${H3_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused H3 + related Gate G/G7/H2 regression tests"
npx vitest run \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/pharmaG7ReadOnlyScoringAdapter.test.ts \
  src/features/research/pharmaG7OverlayNumericModifierProposal.test.ts \
  src/features/research/pharmaG7GovernanceHighRiskConstraint.test.ts \
  src/features/research/pharmaGateGFinal4EndToEndDryRun.test.ts \
  src/features/research/torntpharmGateH2BusinessDurabilityReview.test.ts \
  src/features/research/pharmaDomesticValuationMaTransitionContract.test.ts \
  src/features/research/torntpharmGateH2RegulatoryRuntimeResolution.test.ts

echo "[2/7] TypeScript"
npm run typecheck

echo "[3/7] Presentation data-boundary architecture guard"
npm run check:architecture

echo "[4/7] Focused H3 lint"
npx eslint \
  src/features/research/torntpharmGateH3ReadOnlyScore.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/pharmaG7ReadOnlyScoringAdapter.ts \
  src/features/research/pharmaG7ReadOnlyScoringAdapter.test.ts \
  src/features/research/pharmaSectorWorkspaceCompanyContext.ts \
  src/features/research/PharmaResearchWorkspacePanel.tsx

echo "[5/7] Existing architecture lint"
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] H3 diff whitespace"
git diff --check "${H3_BASE_SHA}"..HEAD

echo
echo "H3 VALIDATION PASS"
echo "Expected deterministic TORNTPHARM read-only score: 75.1575 / 100"
echo "No persistence, recommendation, position sizing, provider call or production mutation is performed by this script."
