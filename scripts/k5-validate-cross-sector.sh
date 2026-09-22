#!/usr/bin/env bash
set -euo pipefail

echo "== PortfolioAI Gate K5 consolidated local validation =="

npx vitest run \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/sectorEngineRegistry.test.ts \
  src/features/research/researchProfileRouting.test.ts \
  src/features/research/scoringProfileResolution.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts \
  src/features/research/researchWorkspaceContract.test.ts

npm run typecheck

echo "== Gate K5 consolidated local validation PASS =="
