#!/usr/bin/env bash
set -euo pipefail

I3_BASE_SHA="4564614e4f7efcb8b5204d86d59a1d4af7ec5537"

echo "== Gate I / I3 first PHARMA_V1 recommendation + AUROPHARMA fail-closed validation =="

git rev-parse --verify "${I3_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused I3 + I2 + I1 + Gate H regressions"
npx vitest run \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/PharmaRecommendationPanel.test.tsx \
  src/features/research/PositionDecisionControls.test.tsx \
  src/features/research/useResearchRecommendationAddon.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/auropharmaG91ActivationReadiness.test.ts

echo "[2/7] Strict TypeScript"
npm run typecheck

echo "[3/7] Presentation data-boundary architecture guard"
npm run check:architecture

echo "[4/7] Focused I3 lint"
npx eslint \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/PharmaRecommendationPanel.tsx \
  src/features/research/PharmaRecommendationPanel.test.tsx \
  src/features/research/pharmaGateI3RecommendationAddon.ts \
  src/features/research/researchRecommendationAddon.ts \
  src/features/research/useResearchRecommendationAddon.ts \
  src/features/research/useResearchRecommendationAddon.test.ts \
  src/features/research/PositionDecisionControls.tsx \
  src/features/research/PositionDecisionControls.test.tsx \
  src/pages/ResearchPage.tsx

echo "[5/7] Existing architecture lint"
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] I3 diff whitespace"
git diff --check "${I3_BASE_SHA}"..HEAD

echo
echo "I3 IMPLEMENTATION VALIDATION PASS"
echo "TORNTPHARM expected deterministic role: SATELLITE_CANDIDATE"
echo "TORNTPHARM authoritative score: 75.1575"
echo "TORNTPHARM caution: VALUATION_BELOW_NEUTRAL_ANCHOR"
echo "AUROPHARMA expected role: INSUFFICIENT"
echo "AUROPHARMA score state: SCORE_NOT_COMPUTABLE"
echo "Recommendation persistence: OFF"
echo "Score persistence: OFF"
echo "Weight guidance / action bias / sizing / AI interpretation: OFF"
echo "I3: COMPLETE / PASS"
echo "I4: NOT STARTED"
