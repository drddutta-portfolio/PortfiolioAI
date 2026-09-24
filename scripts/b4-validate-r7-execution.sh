#!/usr/bin/env bash
set -euo pipefail

echo "== Program B · B4 R7 execution & validation =="

npx vitest run \
  src/features/research/programBR7Execution.test.ts \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/pharmaSubprofileAssignment.test.ts \
  src/features/research/pharmaSubprofileContracts.test.ts \
  src/features/research/pharmaG6SubprofileCurveApplicability.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts \
  src/features/portfolio/positionSizingEngine.test.ts \
  src/features/research/PositionDecisionControls.test.tsx \
  src/features/research/PharmaRecommendationPanel.test.tsx \
  src/pages/ResearchPage.test.tsx

node scripts/program-b-b4-report.mjs

npm run typecheck
npm run check:architecture
npm run build
git diff --check

echo "B4 CANDIDATE VALIDATION PASS"
echo "R7 provider calls: 0"
echo "Recommendation persistence: OFF"
echo "Sizing persistence: OFF"
echo "Owner settings mutation: 0"
echo "Next checkpoint: B-FINAL only after B4 closure and explicit owner approval"
