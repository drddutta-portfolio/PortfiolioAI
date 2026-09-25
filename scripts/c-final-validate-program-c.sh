#!/usr/bin/env bash
set -euo pipefail

PROGRAM_C_START="d3b8a755885bd4ecc0be37aa59ea46f2eac0ca41"
EXPECTED_BRANCH="program-c-portfolio-decision-engines"

echo "== PortfolioAI · Program C · C-FINAL cross-engine closure candidate =="

current_branch="$(git branch --show-current)"
if [[ "$current_branch" != "$EXPECTED_BRANCH" ]]; then
  echo "Program C branch guard failed: expected $EXPECTED_BRANCH, got $current_branch"
  exit 1
fi
echo "Program C branch guard: PASS"

if ! git merge-base --is-ancestor "$PROGRAM_C_START" HEAD; then
  echo "Program C ancestry guard failed: frozen Program C start is not an ancestor of HEAD."
  exit 1
fi

merge_commits="$(git log --merges --format='%H' "$PROGRAM_C_START"..HEAD)"
if [[ -n "$merge_commits" ]]; then
  echo "Program C history guard failed: merge commit(s) detected inside Program C branch history:"
  echo "$merge_commits"
  exit 1
fi

echo "Program C ancestry / no-merge history guard: PASS"

echo "== Complete Program C + Program B regression =="

npx vitest run \
  src/features/decision/programCFinalClosure.test.ts \
  src/features/decision/r10ActionCenter.test.ts \
  src/features/decision/r9MeaningfulChange.test.ts \
  src/features/decision/r8ContractArchitecture.test.ts \
  src/features/decision/r8Execution.test.ts \
  src/features/research/programBFinalClosure.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/programBR7Execution.test.ts \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts

echo "== Program C canonical final audit =="
node scripts/program-c-final-report.mjs

echo "== Prior checkpoint structural safety regressions =="
node scripts/program-c-c2-static-safety.mjs
node scripts/program-c-c3-static-safety.mjs
node scripts/program-c-c4-static-safety.mjs

echo "== Program C final structural safety =="
node scripts/program-c-final-static-safety.mjs

echo "== Program C final scoped lint =="
npx eslint \
  scripts/program-c-final-report.mjs \
  scripts/program-c-final-static-safety.mjs \
  src/features/decision/programCFinalClosure.ts \
  src/features/decision/programCFinalClosure.test.ts \
  src/features/decision/r8*.ts \
  src/features/decision/r9*.ts \
  src/features/decision/r10*.ts \
  src/features/decision/useProgramCR10ActionCenter.ts \
  src/components/DashboardCoreExitRisk.tsx \
  src/components/DashboardRiskConcentration.tsx \
  src/components/DashboardMeaningfulChanges.tsx \
  src/components/DashboardDailyMovement.tsx \
  src/components/DashboardDecisionLayer.tsx \
  src/components/DashboardSectionNavigator.tsx \
  src/components/ProgramCR10AttentionBadge.tsx \
  src/pages/ResearchPage.tsx \
  src/pages/HoldingsPage.tsx \
  src/routes/AppRoutes.tsx

echo "== Program C full-history repository safety allowlist =="
unexpected="$(
  git diff --name-only "$PROGRAM_C_START"..HEAD | grep -Ev '^(docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF\.md|docs/PortfolioAI_PROGRAM_C_C0_CONTRACT_FREEZE_INHERITANCE_AUDIT\.md|docs/PortfolioAI_PROGRAM_C_C1_R8_CONTRACT_ARCHITECTURE\.md|docs/PortfolioAI_PROGRAM_C_C2_R8_EXECUTION_VALIDATION\.md|docs/PortfolioAI_PROGRAM_C_C3_R9_EXECUTION_VALIDATION\.md|docs/PortfolioAI_PROGRAM_C_C4_R10_EXECUTION_VALIDATION\.md|docs/PortfolioAI_PROGRAM_C_FINAL_CLOSURE\.md|scripts/c2-validate-program-c-r8\.sh|scripts/c3-validate-program-c-r9\.sh|scripts/c4-validate-program-c-r10\.sh|scripts/c-final-validate-program-c\.sh|scripts/program-c-c2-report\.mjs|scripts/program-c-c2-static-safety\.mjs|scripts/program-c-c3-report\.mjs|scripts/program-c-c3-static-safety\.mjs|scripts/program-c-c4-report\.mjs|scripts/program-c-c4-static-safety\.mjs|scripts/program-c-final-report\.mjs|scripts/program-c-final-static-safety\.mjs|src/features/decision/(r8|r9|r10)[^/]*\.(ts|tsx)|src/features/decision/programCFinalClosure\.(ts|test\.ts)|src/features/decision/useProgramCR10ActionCenter\.ts|src/components/DashboardCoreExitRisk\.tsx|src/components/DashboardDailyMovement\.tsx|src/components/DashboardDecisionLayer\.tsx|src/components/DashboardMeaningfulChanges\.(tsx|css)|src/components/DashboardRiskConcentration\.tsx|src/components/DashboardSectionNavigator\.tsx|src/components/ProgramCR10AttentionBadge\.(tsx|css)|src/pages/HoldingsPage\.tsx|src/pages/ResearchPage\.tsx|src/routes/AppRoutes\.tsx)$' || true
)"
if [[ -n "$unexpected" ]]; then
  echo "Unexpected Program C file(s) outside the frozen history allowlist:"
  echo "$unexpected"
  exit 1
fi

if git diff --name-only "$PROGRAM_C_START"..HEAD | grep -Eq '^supabase/migrations/|^supabase/functions/|^\.github/workflows/|^src/data/|(^|/)vercel|(^|/)netlify'; then
  echo "Program C full-history safety guard failed: migration/provider/data/deploy surface changed."
  exit 1
fi

echo "Program C full-history repository safety guard: PASS"

echo "== Program C TypeScript / architecture / build =="
npm run typecheck
npm run check:architecture
npm run build

echo "== Program C diff/history whitespace safety =="
git diff --check "$PROGRAM_C_START"..HEAD

echo "PROGRAM C C-FINAL CANDIDATE VALIDATION PASS"
echo "R8 = COMPLETE / PASS / CLOSED"
echo "R9 = COMPLETE / PASS / CLOSED"
echo "R10 = COMPLETE / PASS / CLOSED"
echo "Program C closure audit = PASS / AWAITING EXPLICIT OWNER FORMAL CLOSURE APPROVAL"
echo "Portfolio-wide deterministic disposition = COMPLETE over frozen 238-holding universe"
echo "Numeric sizing / ADD_REVIEW / TRIM_REVIEW authority = NONE"
echo "Provider/AI/persistence/production/merge/scheduler/trading authority = NONE"
echo "Program C state = VALIDATED LOCAL-CANDIDATE / FAIL-CLOSED WHERE INCOMPLETE"
echo "Production operational = NO"
echo "Program D = NOT AUTHORIZED"
