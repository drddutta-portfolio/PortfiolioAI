import fs from "node:fs"

const computeFiles = [
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
      failures.push(`${file}: prohibited R10 compute-path import ${specifier}`)
    }
  }
  for (const pattern of prohibitedRuntimePatterns) {
    if (pattern.test(source)) {
      failures.push(`${file}: prohibited R10 runtime pattern ${pattern}`)
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
    failures.push(`${label}: presentation surface must not execute R10 business rules directly`)
  }
}

const dashboard = fs.readFileSync(
  "src/components/DashboardDecisionLayer.tsx",
  "utf8",
)
if (dashboard.includes("localActions(") || dashboard.includes("recommendationTone(")) {
  failures.push("DashboardDecisionLayer: legacy local Action Center heuristic remains")
}
if (dashboard.includes("useDashboardRecommendations")) {
  failures.push("DashboardDecisionLayer: legacy persisted advisory is still being promoted in Action Center")
}
if (!dashboard.includes("Canonical R10 Action Center")) {
  failures.push("DashboardDecisionLayer: canonical R10 Action Center label missing")
}

const contract = fs.readFileSync(
  "src/features/decision/r10ActionCenterContract.ts",
  "utf8",
)
if (
  !contract.includes('addReviewPromoted: false')
  || !contract.includes('trimReviewPromoted: false')
) {
  failures.push("R10 contract: ADD_REVIEW/TRIM_REVIEW candidate-only boundary missing")
}

if (failures.length) {
  console.error("Program C C4 R10 static safety failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Program C C4 R10 static safety: PASS")
console.log("R10 compute-path provider imports/calls: 0")
console.log("R10 compute-path persistence writes: 0")
console.log("R10 AI deterministic decisions: 0")
console.log("R10 numeric sizing / ADD_REVIEW / TRIM_REVIEW authority: 0")
console.log("Dashboard/Research/Holdings: shared canonical R10 consumer path present")
console.log("Legacy Dashboard local Action Center heuristics: removed")
console.log("R10 scheduler/trading behavior: 0")
