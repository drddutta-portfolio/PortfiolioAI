#!/usr/bin/env bash
set -euo pipefail

echo "== Gate J / G10.2 final fail-closed validation =="

echo "[1/6] Focused G10.2 final result + reusable panel tests"
npx vitest run \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/features/research/pharmaGlobalGenericsG102NumericMethodology.test.ts \
  src/features/research/pharmaGlobalGenericsG102PeerSet.test.ts \
  src/features/research/auropharmaG102ClassificationReconfirmation.test.ts

echo "[2/6] G10.1 + Gate I regression controls"
npx vitest run \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts

echo "[3/6] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/6] TypeScript + architecture"
npm run typecheck
npm run check:architecture

echo "[5/6] Lint + production build"
npx eslint \
  src/features/research/auropharmaG102FinalResult.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/PharmaGateJReferenceClassificationPanel.tsx \
  src/features/research/PharmaGateJReferenceClassificationPanel.test.tsx \
  src/features/research/pharmaGlobalGenericsG102NumericMethodology.ts \
  src/features/research/pharmaGlobalGenericsG102NumericMethodology.test.ts
npm run lint:architecture
npm run build

echo "[6/6] Diff whitespace"
git diff --check

echo
echo "G10.2 FINAL VALIDATION PASS"
echo "Reference: AUROPHARMA"
echo "Primary: GLOBAL_GENERICS"
echo "Checkpoint A: COMPLETE / PASS"
echo "Checkpoint B: COMPLETE / FAIL-CLOSED"
echo "Score: SCORE_NOT_COMPUTABLE"
echo "Gate I recommendation: NOT EXECUTED"
echo "Partial score reconstruction: NO"
echo "Production writes: NO"
