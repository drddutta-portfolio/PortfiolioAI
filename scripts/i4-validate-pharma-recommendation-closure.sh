#!/usr/bin/env bash
set -euo pipefail

I4_BASE_SHA="d051d7a8f05d11c902a451de73c8fb5fd2572ba3"

echo "== Gate I / I4 independent verification + Gate I closure candidate =="

git rev-parse --verify "${I4_BASE_SHA}^{commit}" >/dev/null

echo "[1/8] Focused I4 independent verification + Gate I regressions"
npx vitest run \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts \
  src/features/research/PositionDecisionControls.test.tsx \
  src/features/research/useResearchRecommendationAddon.test.ts

echo "[2/8] Related Gate H preservation regressions"
npx vitest run \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/pharmaG7ReadOnlyScoringAdapter.test.ts

echo "[3/8] Full non-Edge application test suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/8] Strict TypeScript"
npm run typecheck

echo "[5/8] Presentation data-boundary architecture guard"
npm run check:architecture

echo "[6/8] Focused I4 lint + existing architecture lint"
npx eslint \
  src/features/research/pharmaGateI4IndependentVerification.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/PositionDecisionControls.tsx \
  src/features/research/PositionDecisionControls.test.tsx \
  src/features/research/useResearchRecommendationAddon.ts \
  src/features/research/useResearchRecommendationAddon.test.ts
npm run lint:architecture

echo "[7/8] Production build"
npm run build

echo "[8/8] I4 diff whitespace"
git diff --check "${I4_BASE_SHA}"..HEAD

echo
echo "I4 CANDIDATE VALIDATION PASS"
echo "Hand role: SATELLITE_CANDIDATE"
echo "Adapter role: SATELLITE_CANDIDATE"
echo "Gate H score preserved: 75.1575"
echo "Ten dimensions preserved: YES"
echo "AUROPHARMA fail-closed no reconstruction: YES"
echo "BANK/NBFC + NIFTY Bank + HDFCBANK leakage: NONE"
echo "Overlay second recommendation: NONE"
echo "CDMO Emerging numeric role input: NONE"
echo "Governance double counting: NONE"
echo "Repeated output identical: YES"
echo "Recommendation / score persistence: OFF"
echo "Weight guidance / action bias / sizing / AI interpretation: OFF"
echo "Provider / production mutation paths invoked: NO"
echo "I4: IMPLEMENTED / VALIDATION PASS — GATE I CLOSURE REVIEW PENDING"
