#!/usr/bin/env bash
set -euo pipefail

BASE_COMMIT="91992ad93f9b2b65c75f85f2b47eed96c6de7a7e"

echo "== PortfolioAI · Program C · C3 R9 contract/execution/validation =="

npx vitest run \
  src/features/decision/r9MeaningfulChange.test.ts \
  src/features/decision/r8ContractArchitecture.test.ts \
  src/features/decision/r8Execution.test.ts \
  src/features/research/programBFinalClosure.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/programBR7Execution.test.ts

echo "== Program C C3 canonical R9 report =="
node scripts/program-c-c3-report.mjs

echo "== Program C C3 structural safety =="
node scripts/program-c-c3-static-safety.mjs

echo "== Program C C3 scoped lint =="
npx eslint \
  src/features/decision/r9*.ts \
  src/components/DashboardMeaningfulChanges.tsx \
  src/components/DashboardDailyMovement.tsx \
  src/components/DashboardSectionNavigator.tsx \
  src/routes/AppRoutes.tsx

echo "== Program C C3 repository safety allowlist =="
unexpected="$(
  git diff --name-only "$BASE_COMMIT"..HEAD | grep -Ev '^(docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF\.md|docs/PortfolioAI_PROGRAM_C_C3_R9_EXECUTION_VALIDATION\.md|scripts/c3-validate-program-c-r9\.sh|scripts/program-c-c3-report\.mjs|scripts/program-c-c3-static-safety\.mjs|src/features/decision/r9[^/]*\.ts|src/components/DashboardMeaningfulChanges\.(tsx|css)|src/components/DashboardDailyMovement\.tsx|src/components/DashboardSectionNavigator\.tsx|src/routes/AppRoutes\.tsx)$' || true
)"
if [[ -n "$unexpected" ]]; then
  echo "Unexpected C3 file(s) outside the reviewed allowlist:"
  echo "$unexpected"
  exit 1
fi

if git diff --name-only "$BASE_COMMIT"..HEAD | grep -Eq '^supabase/migrations/|^supabase/functions/|^\.github/workflows/|^src/data/|(^|/)vercel|(^|/)netlify'; then
  echo "Program C C3 repository safety guard failed: schema/provider/persistence/deploy surface changed."
  exit 1
fi

echo "Program C C3 repository safety guard: PASS"

npm run typecheck
npm run check:architecture
npm run build
git diff --check "$BASE_COMMIT"..HEAD

echo "PROGRAM C C3 VALIDATION ALL PASS"
echo "R9 = IMPLEMENTED / VALIDATED / AWAITING OWNER CLOSURE"
echo "First observation is explicit and is not no-change"
echo "Semantic duplicate suppression = in-memory only"
echo "Durable acknowledgement/snooze/seen state = NOT CLAIMED"
echo "Provider/AI/persistence/production/scheduler/trading behavior = 0"
