#!/usr/bin/env bash
set -euo pipefail

G10_2_A_BASE_SHA="46e31f8352566014369ac3b71a3f9293527e4d55"

echo "== Gate J / G10.2 Checkpoint A classification re-confirmation validation =="

git rev-parse --verify "${G10_2_A_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused AUROPHARMA re-confirmation + registry/UI tests"
npx vitest run \
  src/features/research/auropharmaG102ClassificationReconfirmation.test.ts \
  src/features/research/auropharmaG8ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx

echo "[2/7] G10.1 + Gate I control regressions"
npx vitest run \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/auropharmaG91ActivationReadiness.test.ts

echo "[3/7] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/7] Strict TypeScript + architecture guard"
npm run typecheck
npm run check:architecture

echo "[5/7] Focused lint + architecture lint"
npx eslint \
  src/features/research/auropharmaG102ClassificationReconfirmation.ts \
  src/features/research/auropharmaG102ClassificationReconfirmation.test.ts \
  src/features/research/pharmaGateJReferenceClassification.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] Diff whitespace"
git diff --check "${G10_2_A_BASE_SHA}"..HEAD

echo
echo "G10.2 CHECKPOINT A CANDIDATE VALIDATION PASS"
echo "Reference: AUROPHARMA"
echo "Primary re-confirmed: GLOBAL_GENERICS"
echo "Material Overlay: NONE"
echo "Emerging Watch: API_BULK_DRUGS"
echo "Unresolved: BIOPHARMA_BIOSIMILARS"
echo "Score state: SCORE_NOT_COMPUTABLE"
echo "Checkpoint B: NOT STARTED"
