import fs from "node:fs"

const computeFiles = [
  "src/features/decision/r8Determinism.ts",
  "src/features/decision/r8PortfolioContextBuilder.ts",
  "src/features/decision/r8PortfolioContext.ts",
  "src/features/decision/r8PortfolioDecisionContract.ts",
  "src/features/decision/r8CoreHealth.ts",
  "src/features/decision/r8PortfolioFit.ts",
  "src/features/decision/r8PortfolioRisk.ts",
  "src/features/decision/r8ExitIntelligence.ts",
  "src/features/decision/r8PortfolioDecisionEngine.ts",
  "src/features/decision/r8FrozenPortfolioDisposition.ts",
  "src/features/decision/r8ReferenceValidation.ts",
  "src/features/decision/r8C2Validation.ts",
  "src/features/decision/r8LivePortfolioAdapter.ts",
  "src/features/decision/r9AuthorityRegistry.ts",
  "src/features/decision/r9MeaningfulChangeContract.ts",
  "src/features/decision/r9MeaningfulChangeRegistry.ts",
  "src/features/decision/r9ObservedState.ts",
  "src/features/decision/r9EventIdentity.ts",
  "src/features/decision/r9MeaningfulChangeEngine.ts",
  "src/features/decision/r9Presentation.ts",
  "src/features/decision/r9FrozenPortfolioDisposition.ts",
  "src/features/decision/r9LivePortfolioAdapter.ts",
  "src/features/decision/r9LiveSession.ts",
  "src/features/decision/r9LiveSessionStore.ts",
  "src/features/decision/r9ReferenceValidation.ts",
  "src/features/decision/r9C3Validation.ts",
  "src/features/decision/r10ActionCenterContract.ts",
  "src/features/decision/r10PrecedenceRegistry.ts",
  "src/features/decision/r10Identity.ts",
  "src/features/decision/r10ActionCenterEngine.ts",
  "src/features/decision/r10ActionCenterViewModel.ts",
  "src/features/decision/r10OwnerAuthority.ts",
  "src/features/decision/r10AuthorityRegistry.ts",
  "src/features/decision/r10LiveActionCenter.ts",
  "src/features/decision/r10FrozenPortfolioDisposition.ts",
  "src/features/decision/r10ReferenceValidation.ts",
  "src/features/decision/r10C4Validation.ts",
  "src/features/decision/programCFinalClosure.ts",
]

const prohibitedImportPatterns = [
  /\/data\//i,
  /supabase/i,
  /trendlyne/i,
  /angel/i,
  /openai/i,
  /provider/i,
  /scheduler/i,
  /brokerage/i,
  /orderrepository/i,
]

const prohibitedRuntimePatterns = [
  /\bfetch\s*\(/,
  /\bDate\.now\s*\(/,
  /\bMath\.random\s*\(/,
  /\brandomUUID\s*\(/,
  /\.insert\s*\(/,
  /\.update\s*\(/,
  /\.upsert\s*\(/,
  /\.from\s*\([^)]*\)[\s\S]{0,240}\.delete\s*\(/,
]

const failures = []

for (const file of computeFiles) {
  const source = fs.readFileSync(file, "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)]
    .map((match) => match[1])
  for (const specifier of imports) {
    if (prohibitedImportPatterns.some((pattern) => pattern.test(specifier))) {
      failures.push(`${file}: prohibited Program C compute-path import ${specifier}`)
    }
  }
  for (const pattern of prohibitedRuntimePatterns) {
    if (pattern.test(source)) {
      failures.push(`${file}: prohibited Program C runtime pattern ${pattern}`)
    }
  }
}

const consumers = [
  ["src/components/DashboardDecisionLayer.tsx", "Dashboard"],
  ["src/pages/ResearchPage.tsx", "Research"],
  ["src/pages/HoldingsPage.tsx", "Holdings"],
]

for (const [file, label] of consumers) {
  const source = fs.readFileSync(file, "utf8")
  if (!source.includes("useProgramCR10ActionCenter")) {
    failures.push(`${label}: canonical R10 shared consumer hook missing`)
  }
  if (source.includes("evaluateProgramCR10Attention")) {
    failures.push(`${label}: presentation surface executes R10 business rules directly`)
  }
}

const dashboard = fs.readFileSync(
  "src/components/DashboardDecisionLayer.tsx",
  "utf8",
)
if (
  dashboard.includes("localActions(")
  || dashboard.includes("recommendationTone(")
  || dashboard.includes("useDashboardRecommendations")
) {
  failures.push("Dashboard: legacy local Action Center authority remains")
}

const meaningful = fs.readFileSync(
  "src/components/DashboardMeaningfulChanges.tsx",
  "utf8",
)
if (
  !meaningful.includes("buildProgramCR9LiveObservedProjection")
  || !meaningful.includes("createProgramCR9LiveSessionStore")
) {
  failures.push("Dashboard meaningful-change surface is not on canonical R9 path")
}

const coreExit = fs.readFileSync(
  "src/components/DashboardCoreExitRisk.tsx",
  "utf8",
)
const riskConcentration = fs.readFileSync(
  "src/components/DashboardRiskConcentration.tsx",
  "utf8",
)
if (!coreExit.includes("buildProgramCR8LivePortfolioProjection")) {
  failures.push("Dashboard Core/Exit surface is not on canonical R8 path")
}
if (!riskConcentration.includes("buildProgramCR8LivePortfolioProjection")) {
  failures.push("Dashboard Risk/Concentration surface is not on canonical R8 path")
}

const r10Contract = fs.readFileSync(
  "src/features/decision/r10ActionCenterContract.ts",
  "utf8",
)
if (
  !r10Contract.includes("addReviewPromoted: false")
  || !r10Contract.includes("trimReviewPromoted: false")
  || r10Contract.includes('"ADD_REVIEW",')
  || r10Contract.includes('"TRIM_REVIEW",')
) {
  failures.push("R10 ADD_REVIEW/TRIM_REVIEW candidate-only boundary is not preserved")
}

if (failures.length) {
  console.error("Program C C-FINAL structural safety failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Program C C-FINAL structural safety: PASS")
console.log("R8/R9/R10 compute-path provider imports/calls: 0")
console.log("R8/R9/R10 persistence writes: 0")
console.log("AI deterministic decision authority: 0")
console.log("Numeric sizing / ADD_REVIEW / TRIM_REVIEW authority: 0")
console.log("R8/R9/R10 canonical consumer paths: present")
console.log("Dashboard/Research/Holdings Action Center authority: one shared R10 collection")
console.log("Scheduler/trading behavior: 0")
