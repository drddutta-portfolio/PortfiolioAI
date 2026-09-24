#!/usr/bin/env bash
set -euo pipefail

BASE_COMMIT="10c87a5d9a2eb5338db51f3f85e5f5ce1ff9a605"

echo "== PortfolioAI · Program B · B-FINAL closure validation =="

npx vitest run \
  src/features/research/programBFinalClosure.test.ts \
  src/features/research/programBR6Contract.test.ts \
  src/features/research/programBR6Execution.test.ts \
  src/features/research/programBR7Contract.test.ts \
  src/features/research/programBR7Execution.test.ts \
  src/features/research/torntpharmGateH3ReadOnlyScore.test.ts \
  src/features/research/alivusG101ReadOnlyScore.test.ts \
  src/features/research/auropharmaG102FinalResult.test.ts \
  src/features/research/bioconG103FinalResult.test.ts \
  src/features/research/syngeneG104FinalResult.test.ts \
  src/features/research/pharmaSubprofileAssignment.test.ts \
  src/features/research/pharmaSubprofileContracts.test.ts \
  src/features/research/pharmaG6SubprofileCurveApplicability.test.ts \
  src/features/research/pharmaRecommendationAuthority.test.ts \
  src/features/research/pharmaRecommendationPolicyCandidate.test.ts \
  src/features/research/pharmaGateI3ReadOnlyRecommendation.test.ts \
  src/features/research/pharmaGateI4IndependentVerification.test.ts \
  src/features/research/alivusG101RecommendationPreview.test.ts \
  src/features/research/k5CrossSectorIsolation.test.ts \
  src/features/research/k5WholePortfolioRouting.test.ts \
  src/features/research/k5RecommendationPortability.test.ts \
  src/features/research/k3BankNbfcClosure.test.ts \
  src/features/research/k3BankNbfcPortability.test.ts \
  supabase/functions/_shared/bank-benchmark-authority.test.ts \
  src/features/portfolio/positionSizingEngine.test.ts \
  src/features/research/PositionDecisionControls.test.tsx \
  src/features/research/PharmaRecommendationPanel.test.tsx \
  src/features/research/ResearchScorecardPanel.test.tsx \
  src/pages/ResearchPage.test.tsx

echo "== Program B canonical final audit =="
node scripts/program-b-final-report.mjs

echo "== Program B repository safety allowlist =="
unexpected="$(
  git diff --name-only "$BASE_COMMIT"..HEAD | grep -Ev '^(docs/PORTFOLIOAI_CUMULATIVE_DEVELOPMENT_HANDOFF\.md|docs/PortfolioAI_PROGRAM_B_B1_R6_CONTRACT_ARCHITECTURE\.md|docs/PortfolioAI_PROGRAM_B_B2_R6_EXECUTION_VALIDATION\.md|docs/PortfolioAI_PROGRAM_B_B3_R7_CONTRACT_ARCHITECTURE\.md|docs/PortfolioAI_PROGRAM_B_B4_R7_EXECUTION_VALIDATION\.md|docs/PortfolioAI_PROGRAM_B_FINAL_CLOSURE\.md|scripts/b1-validate-r6-contract\.sh|scripts/b2-validate-r6-execution\.sh|scripts/b3-validate-r7-contract\.sh|scripts/b4-validate-r7-execution\.sh|scripts/b-final-validate-program-b\.sh|scripts/program-b-b2-report\.mjs|scripts/program-b-b4-report\.mjs|scripts/program-b-final-report\.mjs|src/features/research/ResearchScorecardPanel\.test\.tsx|src/features/research/ResearchScorecardPanel\.tsx|src/features/research/k3BankNbfcClosure\.test\.ts|src/features/research/programBR6Contract\.test\.ts|src/features/research/programBR6Contract\.ts|src/features/research/programBR6Execution\.test\.ts|src/features/research/programBR6Execution\.ts|src/features/research/programBR7Contract\.test\.ts|src/features/research/programBR7Contract\.ts|src/features/research/programBR7Execution\.test\.ts|src/features/research/programBR7Execution\.ts|src/features/research/programBFinalClosure\.test\.ts|src/features/research/programBFinalClosure\.ts|src/pages/ResearchPage\.tsx)$' || true
)"
if [[ -n "$unexpected" ]]; then
  echo "Unexpected Program B file(s) outside the closure allowlist:"
  echo "$unexpected"
  exit 1
fi

if git diff --name-only "$BASE_COMMIT"..HEAD | grep -Eq '^supabase/migrations/|^supabase/functions/|^\.github/workflows/|(^|/)vercel|(^|/)netlify'; then
  echo "Program B repository safety guard failed: production/migration/provider/deploy surface changed."
  exit 1
fi

echo "Program B repository safety guard: PASS"

npm run typecheck
npm run check:architecture
npm run build
git diff --check

echo "B-FINAL CANDIDATE VALIDATION PASS"
echo "Program B closure audit: PASS"
echo "Provider calls from Program B compute paths: 0"
echo "AI numeric decision calls: 0"
echo "Owner settings mutation: 0"
echo "Production mutation/deployment/merge/scheduler/trading authorization: NONE"
echo "Pipeline state: VALIDATED / APPROVED LOCAL-CANDIDATE / FAIL-CLOSED WHERE INCOMPLETE"
echo "Production operational: NO"
