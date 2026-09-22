#!/usr/bin/env bash
set -euo pipefail

printf '\n[K1] 1/8 focused exchange-primary classification tests\n'
npx vitest run   src/features/portfolio/exchangePrimaryClassification.test.ts   src/features/research/portfolioCoverageProjection.test.ts   src/features/research/sectorResearchMapping.test.ts   src/features/research/researchProfileRouting.test.ts

printf '\n[K1] 2/8 reconciliation comparator tests\n'
node --test scripts/k1-compare-nse-classification.test.mjs
node --check scripts/k1-fetch-nse-primary-classification.mjs
node --check scripts/k1-fetch-nse-bulk-classification.mjs
node --check scripts/k1-fetch-bse-primary-classification.mjs
node --check scripts/k1-compare-nse-classification.mjs
node -e 'JSON.parse(require("fs").readFileSync("scripts/k1-reviewed-identity-transitions-2026-09-22.json", "utf8"))'
bash -n scripts/k1-run-current-cohort-reconciliation.sh

printf '\n[K1] 3/8 full application test suite\n'
npm test -- --run

printf '\n[K1] 4/8 strict TypeScript\n'
npm run typecheck

printf '\n[K1] 5/8 architecture guard\n'
npm run check:architecture

printf '\n[K1] 6/8 architecture lint\n'
npm run lint:architecture

printf '\n[K1] 7/8 production build\n'
npm run build

printf '\n[K1] 8/8 whitespace integrity\n'
git diff --check

printf '\nK1 EXCHANGE-PRIMARY CLASSIFICATION BUILD VALIDATION PASS\n'
printf 'Production mutation: NONE\n'
printf 'Score persistence: OFF\n'
printf 'Recommendation persistence: OFF\n'
printf 'Scheduler mutation: NONE\n'
printf 'Deployment: NONE\n'
printf 'PR merge: NONE\n'
