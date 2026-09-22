#!/usr/bin/env bash
set -euo pipefail

G10_4_BASE_SHA="52610785eb59394b40ce832cd4eceb4b8b73fe56"

echo "== Gate J / G10.4 Checkpoint A consolidated validation =="

git rev-parse --verify "${G10_4_BASE_SHA}^{commit}" >/dev/null

echo "[1/7] Focused G10.4 classification + Gate I safety regressions"
npx vitest run \
  src/features/research/syngeneG104ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/features/research/pharmaAdaptiveClassificationContract.test.ts \
  src/features/research/pharmaSubprofileCandidateRegistry.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts

echo "[2/7] Prior Gate J/reference-control regressions"
npx vitest run \
  src/features/research/alivusG101ClassificationEvidence.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts

echo "[3/7] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/7] Strict TypeScript + architecture guard"
npm run typecheck
npm run check:architecture

echo "[5/7] Focused lint + architecture lint"
npx eslint \
  src/features/research/syngeneG104ClassificationEvidence.ts \
  src/features/research/syngeneG104ClassificationEvidence.test.ts \
  src/features/research/pharmaGateJReferenceClassification.ts \
  src/features/research/pharmaGateJReferenceClassification.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx
npm run lint:architecture

echo "[6/7] Production build"
npm run build

echo "[7/7] Diff whitespace"
git diff --check "${G10_4_BASE_SHA}"..HEAD

echo
echo "G10.4 CHECKPOINT A CANDIDATE VALIDATION PASS"
echo "Reference: SYNGENE"
echo "Primary candidate: CDMO_CRAMS"
echo "Material Overlays: NONE"
echo "Emerging Watch: NONE"
echo "Score execution: OFF"
echo "Recommendation execution: OFF"
echo "Persistence: OFF"
echo "Checkpoint B: NOT STARTED"
