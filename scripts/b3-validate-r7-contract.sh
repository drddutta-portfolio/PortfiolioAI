#!/usr/bin/env bash
set -euo pipefail

echo "== Program B · B3 R7 contract validation =="

npx vitest run \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts \
  src/features/research/sectorRecommendation.pharmaV1Strict.test.ts \
  src/features/portfolio/positionSizingEngine.test.ts \
  src/features/research/PositionDecisionControls.test.tsx

npm run typecheck
npm run check:architecture
npm run build
git diff --check

echo "B3 CANDIDATE VALIDATION PASS"
echo "Recommendation computation: NOT EXECUTED"
echo "Sizing computation: NOT EXECUTED"
echo "Next checkpoint: B4 only after explicit owner approval"
