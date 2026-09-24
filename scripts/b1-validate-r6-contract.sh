#!/usr/bin/env bash
set -euo pipefail

echo "== Program B · B1 R6 contract validation =="

npx vitest run \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/scoringProfileResolution.test.ts

npm run typecheck
npm run check:architecture
npm run build
git diff --check

echo "B1 CANDIDATE VALIDATION PASS"
echo "Numeric scoring executed: NO"
echo "Provider calls: 0"
echo "Next checkpoint: B2 only after explicit owner approval"
