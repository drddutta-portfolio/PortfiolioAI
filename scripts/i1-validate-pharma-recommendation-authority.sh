#!/usr/bin/env bash
set -euo pipefail

I1_BASE_SHA="c787c518dc8f1604073ccfc6b90dd02315c04b2b"

echo "== Gate I / I1 PHARMA_V1 recommendation authority validation =="

git rev-parse --verify "${I1_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused I1 + authority regressions"
npx vitest run \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts \
  src/features/research/pharmaSubprofileAssignment.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/auropharmaG91ActivationReadiness.test.ts

echo "[2/7] Strict TypeScript"
npm run typecheck

echo "[3/7] Presentation data-boundary architecture guard"
npm run check:architecture

echo "[4/7] Focused I1 lint"
npx eslint \
  src/features/research/pharmaRecommendationAuthority.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/sectorRecommendation.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts

echo "[5/7] Existing architecture lint"
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] I1 diff whitespace"
git diff --check "${I1_BASE_SHA}"..HEAD

echo
echo "I1 VALIDATION PASS"
echo "PHARMA_V1 recommendation authority: FROZEN"
echo "PHARMA_V1 missing-overall-score reconstruction: DISABLED"
echo "Recommendation thresholds/floors: NOT YET DEFINED"
echo "Score persistence: OFF"
echo "Recommendation persistence: OFF"
echo "Edge tests: NOT REQUIRED — I1 touches no Edge Function code"
