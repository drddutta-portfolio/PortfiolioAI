#!/usr/bin/env bash
set -euo pipefail

G10_4_B_BASE_SHA="69382c2be55452e3c63a0e9c5b2ad74a5885b4f0"

echo "== Gate J / G10.4 Checkpoint B consolidated validation =="

git rev-parse --verify "${G10_4_B_BASE_SHA}^{commit}" >/dev/null

echo "[1/8] CDMO methodology + SYNGENE evidence/final result"
npx vitest run \
  src/features/research/pharmaCdmoG104Methodology.test.ts \
  src/features/research/syngeneG104CheckpointBEvidence.test.ts \
  src/features/research/syngeneG104FinalResult.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx

echo "[2/8] Gate I + Gate J isolation controls"
npx vitest run \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/torntpharmGateH4IndependentVerification.test.ts

echo "[3/8] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/8] Strict TypeScript"
npm run typecheck

echo "[5/8] Architecture guard"
npm run check:architecture

echo "[6/8] Focused lint + architecture lint"
npx eslint \
  src/features/research/pharmaCdmoG104Methodology.ts \
  src/features/research/pharmaCdmoG104Methodology.test.ts \
  src/features/research/syngeneG104CheckpointBEvidence.ts \
  src/features/research/syngeneG104CheckpointBEvidence.test.ts \
  src/features/research/syngeneG104FinalResult.ts \
  src/features/research/syngeneG104FinalResult.test.ts \
  src/features/research/pharmaGateJReferenceClassification.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx
npm run lint:architecture

echo "[7/8] Production build"
npm run build

echo "[8/8] Diff whitespace"
git diff --check "${G10_4_B_BASE_SHA}"..HEAD

echo
echo "G10.4 CHECKPOINT B CANDIDATE VALIDATION PASS"
echo "Reference: SYNGENE"
echo "Primary: CDMO_CRAMS"
echo "Material Overlays: NONE"
echo "Score state: SCORE_NOT_COMPUTABLE"
echo "Gate I recommendation: NOT EXECUTED"
echo "Score persistence: OFF"
echo "Recommendation persistence: OFF"
echo "Production mutation/deployment/merge: OFF"
