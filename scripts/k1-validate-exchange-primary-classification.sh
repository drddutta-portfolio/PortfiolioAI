#!/usr/bin/env bash
set -euo pipefail

printf '\n[K1] 1/7 focused exchange-primary classification tests\n'
npx vitest run   src/features/portfolio/exchangePrimaryClassification.test.ts   src/features/research/portfolioCoverageProjection.test.ts   src/features/research/sectorResearchMapping.test.ts

printf '\n[K1] 2/7 full application test suite\n'
npm test -- --run

printf '\n[K1] 3/7 strict TypeScript\n'
npm run typecheck

printf '\n[K1] 4/7 architecture guard\n'
npm run check:architecture

printf '\n[K1] 5/7 architecture lint\n'
npm run lint:architecture

printf '\n[K1] 6/7 production build\n'
npm run build

printf '\n[K1] 7/7 whitespace integrity\n'
git diff --check

printf '\nK1 EXCHANGE-PRIMARY CLASSIFICATION BUILD VALIDATION PASS\n'
printf 'Production mutation: NONE\n'
printf 'Score persistence: OFF\n'
printf 'Recommendation persistence: OFF\n'
printf 'Scheduler mutation: NONE\n'
printf 'Deployment: NONE\n'
printf 'PR merge: NONE\n'
