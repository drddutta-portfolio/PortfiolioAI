#!/usr/bin/env bash
set -euo pipefail

BASE_COMMIT="60bf25caae9d9253c577a3e6809ad5527a23ddda"

echo "== PortfolioAI · Program C · C4 R10 contract/execution/validation =="

npx vitest run \
  src/features/decision/r10ActionCenter.test.ts \
  src/features/decision/r9MeaningfulChange.test.ts \
  src/features/decision/r8ContractArchitecture.test.ts \
  src/features/decision/r8Execution.test.ts \
  src/features/research/programBFinalClosure.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/programBR7Execution.test.ts

echo "== Program C C4 canonical R10 report =="
node scripts/program-c-c4-report.mjs

echo "== Program C C4 structural safety =="
node scripts/program-c-c4-static-safety.mjs

echo "== Program C C4 scoped lint =="
npx eslint \
  src/features/decision/r10*.ts \
  src/features/decision/useProgramCR10ActionCenter.ts \
  src/components/ProgramCR10AttentionBadge.tsx \
  src/components/DashboardDecisionLayer.tsx \
  src/pages/ResearchPage.tsx \
  src/pages/HoldingsPage.tsx

echo "== Program C C4 repository safety allowlist =="
unexpected="$(
  git diff --name-only "$BASE_COMMIT"..HEAD | grep -Ev '^(docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF\.md|docs/PortfolioAI_PROGRAM_C_C4_R10_EXECUTION_VALIDATION\.md|scripts/c4-validate-program-c-r10\.sh|scripts/program-c-c4-report\.mjs|scripts/program-c-c4-static-safety\.mjs|src/features/decision/r10[^/]*\.ts|src/features/decision/useProgramCR10ActionCenter\.ts|src/components/ProgramCR10AttentionBadge\.(tsx|css)|src/components/DashboardDecisionLayer\.tsx|src/pages/ResearchPage\.tsx|src/pages/HoldingsPage\.tsx)$' || true
)"
if [[ -n "$unexpected" ]]; then
  echo "Unexpected C4 file(s) outside the reviewed allowlist:"
  echo "$unexpected"
  exit 1
fi

if git diff --name-only "$BASE_COMMIT"..HEAD | grep -Eq '^supabase/migrations/|^supabase/functions/|^\.github/workflows/|^src/data/|(^|/)vercel|(^|/)netlify'; then
  echo "Program C C4 repository safety guard failed: schema/provider/persistence/deploy surface changed."
  exit 1
fi

echo "Program C C4 repository safety guard: PASS"

npm run typecheck
npm run check:architecture
npm run build
git diff --check "$BASE_COMMIT"..HEAD

echo "PROGRAM C C4 VALIDATION ALL PASS"
echo "R10 = IMPLEMENTED / VALIDATED / AWAITING OWNER CLOSURE"
echo "Canonical Action Center authority = ONE"
echo "ADD_REVIEW / TRIM_REVIEW = NOT PROMOTED"
echo "Provider/AI/persistence/production/scheduler/trading behavior = 0"
