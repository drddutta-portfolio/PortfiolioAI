#!/usr/bin/env bash
set -euo pipefail

G10_3_BASE_SHA="ece6bdb3806d98c9cd7c428e658c4a7307937c36"

echo "== Gate J / G10.3 Checkpoint A consolidated validation =="

git rev-parse --verify "${G10_3_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused G10.3 classification + Gate I safety regressions"
npx vitest run \
  src/features/research/bioconG103ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/features/research/pharmaAdaptiveClassificationContract.test.ts \
  src/features/research/pharmaSubprofileCandidateRegistry.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts

echo "[2/7] Prior Gate J/reference-control regressions"
npx vitest run \
  src/features/research/alivusG101ClassificationEvidence.test.ts \
  src/features/research/auropharmaG102ClassificationReconfirmation.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts

echo "[3/7] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/7] Strict TypeScript + architecture guard"
npm run typecheck
npm run check:architecture

echo "[5/7] Focused lint + architecture lint"
npx eslint \
  src/features/research/bioconG103ClassificationEvidence.ts \
  src/features/research/bioconG103ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] Diff whitespace"
git diff --check "${G10_3_BASE_SHA}"..HEAD

echo
echo "G10.3 CHECKPOINT A CANDIDATE VALIDATION PASS"
echo "Reference: BIOCON"
echo "Primary candidate: BIOPHARMA_BIOSIMILARS"
echo "Material Overlays: GLOBAL_GENERICS + CDMO_CRAMS"
echo "Emerging Watch: NONE"
echo "Score execution: OFF"
echo "Recommendation execution: OFF"
echo "Persistence: OFF"
echo "Checkpoint B: NOT STARTED"
