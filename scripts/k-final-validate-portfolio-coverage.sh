#!/usr/bin/env bash
set -euo pipefail

echo "== PortfolioAI Gate K-FINAL consolidated local validation =="

npx vitest run \
  src/features/research/kFinalPortfolioCoverage.test.ts \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/k3BankNbfcClosure.test.ts \
  src/features/research/sectorRecommendation.k2Safety.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/researchWorkspaceContract.test.ts

npm run typecheck

echo "== Gate K-FINAL consolidated local validation PASS =="
