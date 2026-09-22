#!/usr/bin/env bash
set -euo pipefail

G10_FINAL_BASE_SHA="f1a7883a2494515537d783cad378d66c87167872"

echo "== Gate J / G10-FINAL portability + isolation validation =="

git rev-parse --verify "${G10_FINAL_BASE_SHA}^{commit}" >/dev/null

echo "[1/8] G10-FINAL portability + closure contracts"
npx vitest run \
  src/features/research/pharmaGateJFinalPortability.test.ts \
  src/features/research/pharmaGateJFinalClosure.test.ts \
  src/features/research/PharmaGateJPortabilityPanel.test.tsx

echo "[2/8] Gate J reference outcomes + Gate I isolation controls"
npx vitest run \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/syngeneG104FinalResult.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/pharmaG8PortabilityIsolationValidation.test.ts

echo "[3/8] Full non-Edge application suite"
npx vitest run --exclude "supabase/functions/**"

echo "[4/8] Strict TypeScript"
npm run typecheck

echo "[5/8] Architecture guard"
npm run check:architecture

echo "[6/8] Focused lint + architecture lint"
npx eslint \
  src/features/research/pharmaGateJFinalPortability.ts \
  src/features/research/pharmaGateJFinalPortability.test.ts \
  src/features/research/pharmaGateJFinalClosure.ts \
  src/features/research/pharmaGateJFinalClosure.test.ts \
  src/features/research/PharmaGateJPortabilityPanel.tsx \
  src/features/research/PharmaGateJPortabilityPanel.test.tsx \
  src/pages/ResearchPage.tsx
npm run lint:architecture

echo "[7/8] Production build"
npm run build

echo "[8/8] Diff whitespace"
git diff --check "${G10_FINAL_BASE_SHA}"..HEAD

echo
echo "G10-FINAL CANDIDATE VALIDATION PASS"
echo "PHARMA_V1 method authorities: 5/5"
echo "Runtime routing: REVIEWED SUBPROFILE -> EXISTING METHODOLOGY"
echo "Reference-stock identity required at runtime: NO"
echo "New Pharma stock requires new Gate J methodology build: NO"
echo "Missing reviewed subprofile: FAIL CLOSED"
echo "Material Overlay second score: PROHIBITED"
echo "Emerging Watch numeric participation: PROHIBITED"
echo "Gate I policy: UNCHANGED"
echo "Score persistence: OFF"
echo "Recommendation persistence: OFF"
echo "Production mutation/deployment/merge: OFF"
