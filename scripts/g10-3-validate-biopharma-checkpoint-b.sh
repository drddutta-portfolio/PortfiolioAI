#!/usr/bin/env bash
set -euo pipefail

G10_3_B_BASE_SHA="c520dcc2bb4969205d6626bfe5250b3742d66c0e"

echo "== Gate J / G10.3 Checkpoint B consolidated validation =="

git rev-parse --verify "${G10_3_B_BASE_SHA}^{commit}" >/dev/null

echo "[1/8] Biosimilars methodology + BIOCON evidence/final result"
npx vitest run \
  src/features/research/pharmaBiosimilarsG103Methodology.test.ts \
  src/features/research/bioconG103CheckpointBEvidence.test.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx

echo "[2/8] Gate I + Gate J isolation controls"
npx vitest run \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts

echo "[3/8] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/8] Strict TypeScript"
npm run typecheck

echo "[5/8] Architecture guard"
npm run check:architecture

echo "[6/8] Focused lint + architecture lint"
npx eslint \
  src/features/research/pharmaBiosimilarsG103Methodology.ts \
  src/features/research/pharmaBiosimilarsG103Methodology.test.ts \
  src/features/research/bioconG103CheckpointBEvidence.ts \
  src/features/research/bioconG103CheckpointBEvidence.test.ts \
  src/features/research/bioconG103FinalResult.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/pharmaGateJReferenceClassification.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx
npm run lint:architecture

echo "[7/8] Production build"
npm run build

echo "[8/8] Diff whitespace"
git diff --check "${G10_3_B_BASE_SHA}"..HEAD

echo
echo "G10.3 CHECKPOINT B CANDIDATE VALIDATION PASS"
echo "Reference: BIOCON"
echo "Primary: BIOPHARMA_BIOSIMILARS"
echo "Material Overlays: GLOBAL_GENERICS + CDMO_CRAMS"
echo "Score state: SCORE_NOT_COMPUTABLE"
echo "Gate I recommendation: NOT EXECUTED"
echo "AUROPHARMA Biosimilars exposure: UNRESOLVED"
echo "Score persistence: OFF"
echo "Recommendation persistence: OFF"
echo "Production mutation/deployment/merge: OFF"
