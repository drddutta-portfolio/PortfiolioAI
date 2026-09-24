#!/usr/bin/env bash
set -euo pipefail

BASE_COMMIT="fdd44b4591402dbc521e597e499341e2395b910a"

echo "== PortfolioAI · Program C · C2 R8 execution validation =="

npx vitest run \
  src/features/decision/r8ContractArchitecture.test.ts \
  src/features/decision/r8Execution.test.ts \
  src/features/research/programBFinalClosure.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/programBR7Execution.test.ts

echo "== Program C C2 canonical report =="
node scripts/program-c-c2-report.mjs

echo "== Program C C2 structural safety =="
node scripts/program-c-c2-static-safety.mjs

echo "== Program C C2 scoped lint =="
npx eslint \
  scripts/program-c-c2-report.mjs \
  scripts/program-c-c2-static-safety.mjs \
  src/features/decision/r8*.ts \
  src/components/DashboardCoreExitRisk.tsx \
  src/components/DashboardRiskConcentration.tsx

echo "== Program C C2 repository safety allowlist =="
unexpected="$(
  git diff --name-only "$BASE_COMMIT"..HEAD | grep -Ev '^(docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF\.md|docs/PortfolioAI_PROGRAM_C_C2_R8_EXECUTION_VALIDATION\.md|scripts/c2-validate-program-c-r8\.sh|scripts/program-c-c2-report\.mjs|scripts/program-c-c2-static-safety\.mjs|src/features/decision/r8[^/]*\.(ts|tsx)|src/components/DashboardCoreExitRisk\.tsx|src/components/DashboardRiskConcentration\.tsx)$' || true
)"
if [[ -n "$unexpected" ]]; then
  echo "Unexpected C2 file(s) outside the reviewed allowlist:"
  echo "$unexpected"
  exit 1
fi

if git diff --name-only "$BASE_COMMIT"..HEAD | grep -Eq '^supabase/migrations/|^supabase/functions/|^\.github/workflows/|^src/data/|(^|/)vercel|(^|/)netlify'; then
  echo "Program C C2 repository safety guard failed: schema/provider/persistence/deploy surface changed."
  exit 1
fi

echo "Program C C2 repository safety guard: PASS"

npm run typecheck
npm run check:architecture
npm run build
git diff --check "$BASE_COMMIT"..HEAD

echo "PROGRAM C C2 VALIDATION ALL PASS"
echo "R8 = IMPLEMENTED / VALIDATED / AWAITING OWNER CLOSURE"
echo "Portfolio-wide deterministic R8 disposition = COMPLETE over frozen 238-holding universe"
echo "Numeric action coverage = NOT CLAIMED"
echo "Provider/AI/persistence/production/scheduler/trading behavior = 0"
