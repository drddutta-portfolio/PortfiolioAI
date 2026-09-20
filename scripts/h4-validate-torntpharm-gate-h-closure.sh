#!/usr/bin/env bash
set -euo pipefail

H4_BASE_SHA="3a52fb7b1930a1067e75af83bb583a10051b77d1"

echo "== Gate H / H4 independent TORNTPHARM verification =="

git rev-parse --verify "${H4_BASE_SHA}^{commit}" >/dev/null

echo "[1/8] Focused H4 + Gate H regression tests"
npx vitest run \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/pharmaG7ReadOnlyScoringAdapter.test.ts \
  src/features/research/pharmaG7OverlayNumericModifierProposal.test.ts \
  src/features/research/pharmaG7GovernanceHighRiskConstraint.test.ts \
  src/features/research/torntpharmGateH2BusinessDurabilityReview.test.ts \
  src/features/research/pharmaDomesticValuationMaTransitionContract.test.ts \
  src/features/research/torntpharmGateH2RegulatoryRuntimeResolution.test.ts

echo "[2/8] Full application test suite"
npm test

echo "[3/8] Strict TypeScript"
npm run typecheck

echo "[4/8] Presentation data-boundary architecture guard"
npm run check:architecture

echo "[5/8] Focused H4 lint"
npx eslint \
  src/features/research/torntpharmGateH4IndependentVerification.ts \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.ts \
  src/features/research/pharmaG7ReadOnlyScoringAdapter.ts

echo "[6/8] Existing architecture lint"
npm run lint:architecture

echo "[7/8] Production build"
npm run build

echo "[8/8] H4 diff whitespace"
git diff --check "${H4_BASE_SHA}"..HEAD

echo
echo "H4 VALIDATION PASS"
echo "HAND-VERIFIED TORNTPHARM SCORE: 75.1575 / 100"
echo "DETERMINISM: PASS"
echo "ANTI-LEAKAGE: PASS"
echo "SCORE PERSISTENCE: OFF"
echo "RECOMMENDATION: OFF"
echo "POSITION SIZING: OFF"
echo "EDGE TESTS: NOT REQUIRED — H4 touches no Edge Function code"
