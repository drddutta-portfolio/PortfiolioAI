#!/usr/bin/env bash
set -euo pipefail

G10_1_BASE_SHA="d75c3e68589d27a3163bfc94d060db9354a551b7"

echo "== Gate J / G10.1 Checkpoint A consolidated validation =="

git rev-parse --verify "${G10_1_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused G10.1 classification + Gate I safety regressions"
npx vitest run \
  src/features/research/alivusG101ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/features/research/pharmaAdaptiveClassificationContract.test.ts \
  src/features/research/pharmaSubprofileCandidateRegistry.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts

echo "[2/7] Existing reference-control regressions"
npx vitest run \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/auropharmaG8ClassificationEvidence.test.ts \
  src/features/research/auropharmaG91ActivationReadiness.test.ts

echo "[3/7] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/7] Strict TypeScript + architecture guard"
npm run typecheck
npm run check:architecture

echo "[5/7] Focused lint + architecture lint"
npx eslint \
  src/features/research/alivusG101ClassificationEvidence.ts \
  src/features/research/alivusG101ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/pages/ResearchPage.tsx
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] Diff whitespace"
git diff --check "${G10_1_BASE_SHA}"..HEAD

echo
echo "G10.1 CHECKPOINT A CANDIDATE VALIDATION PASS"
echo "Reference: ALIVUS"
echo "Primary candidate: API_BULK_DRUGS"
echo "Material Overlay: NONE"
echo "Emerging Watch: CDMO_CRAMS"
echo "Score execution: OFF"
echo "Recommendation execution: OFF"
echo "Persistence: OFF"
echo "Checkpoint B: NOT STARTED"
