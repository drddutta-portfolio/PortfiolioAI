#!/usr/bin/env bash
set -euo pipefail

G10_1_B_BASE_SHA="b76f04c871a82b2e82ad708a89d856b87c8dff2a"

echo "== Gate J / G10.1 Checkpoint B consolidated validation =="

git rev-parse --verify "${G10_1_B_BASE_SHA}^{commit}" >/dev/null

echo "[1/8] API methodology + ALIVUS score/recommendation"
npx vitest run \
  src/features/research/pharmaApiG101NumericMethodology.test.ts \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts

echo "[2/8] Incremental Domestic/API isolation + existing controls"
npx vitest run \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/auropharmaG8ClassificationEvidence.test.ts \
  src/features/research/auropharmaG91ActivationReadiness.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts

echo "[3/8] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/8] Strict TypeScript"
npm run typecheck

echo "[5/8] Architecture guard"
npm run check:architecture

echo "[6/8] Focused lint + architecture lint"
npx eslint \
  src/features/research/pharmaApiG101NumericMethodology.ts \
  src/features/research/pharmaApiG101NumericMethodology.test.ts \
  src/features/research/alivusG101ReadOnlyScore.ts \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/pharmaRecommendationAuthority.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx
npm run lint:architecture

echo "[7/8] Production build"
npm run build

echo "[8/8] Diff whitespace"
git diff --check "${G10_1_B_BASE_SHA}"..HEAD

echo
echo "G10.1 CHECKPOINT B VALIDATION PASS"
echo "ALIVUS score: 76.7225"
echo "Gate I role: SATELLITE_CANDIDATE"
echo "Valuation caution: YES"
echo "CDMO Emerging numeric participation: NO"
echo "Score persistence: OFF"
echo "Recommendation persistence: OFF"
echo "Weight/action/sizing/AI: OFF"

echo "G10.1: COMPLETE / PASS"
