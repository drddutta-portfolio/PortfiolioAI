#!/usr/bin/env bash
set -euo pipefail

I2_BASE_SHA="f5ee94d264d3692929043bd3f7851991361c079f"

echo "== Gate I / I2 PHARMA_V1 recommendation methodology candidate validation =="

git rev-parse --verify "${I2_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused I2 + I1 + Gate H regressions"
npx vitest run \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/auropharmaG91ActivationReadiness.test.ts

echo "[2/7] Strict TypeScript"
npm run typecheck

echo "[3/7] Presentation data-boundary architecture guard"
npm run check:architecture

echo "[4/7] Focused I2 lint"
npx eslint \
  src/features/research/pharmaRecommendationPolicyCandidate.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.ts

echo "[5/7] Existing architecture lint"
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] I2 diff whitespace"
git diff --check "${I2_BASE_SHA}"..HEAD

echo
echo "I2 CANDIDATE VALIDATION PASS"
echo "Policy state: OWNER REVIEW PENDING"
echo "Core threshold candidate: 80"
echo "Satellite threshold candidate: 65"
echo "Watch threshold candidate: 50"
echo "Avoid: fully evaluable overall score below 50"
echo "Recommendation persistence: OFF"
echo "Score persistence: OFF"
echo "I3: NOT STARTED"
