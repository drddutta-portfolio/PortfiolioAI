import fs from "node:fs"

const computeFiles = [
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
  /\.delete\s*\(/,
  /\.upsert\s*\(/,
]

const failures = []

for (const file of computeFiles) {
  const source = fs.readFileSync(file, "utf8")
  const imports = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1])
  for (const specifier of imports) {
    if (prohibitedImportPatterns.some((pattern) => pattern.test(specifier))) {
      failures.push(`${file}: prohibited R9 compute-path import ${specifier}`)
    }
  }
  for (const pattern of prohibitedRuntimePatterns) {
    if (pattern.test(source)) {
      failures.push(`${file}: prohibited R9 runtime pattern ${pattern}`)
    }
  }
}

const component = fs.readFileSync(
  "src/components/DashboardMeaningfulChanges.tsx",
  "utf8",
)
if (
  !component.includes("buildProgramCR9LiveObservedProjection")
  || !component.includes("advanceProgramCR9InMemorySession")
) {
  failures.push("DashboardMeaningfulChanges: canonical R9 consumer integration missing")
}

const routes = fs.readFileSync("src/routes/AppRoutes.tsx", "utf8")
if (
  !routes.includes("DashboardMeaningfulChanges")
  || !routes.includes("dashboard-meaningful-change")
) {
  failures.push("AppRoutes: R9 meaningful-change dashboard section missing")
}

const dailyMovement = fs.readFileSync(
  "src/components/DashboardDailyMovement.tsx",
  "utf8",
)
if (!dailyMovement.includes("not R9 meaningful-change materiality")) {
  failures.push("DashboardDailyMovement: market movement is not explicitly separated from R9")
}

if (failures.length) {
  console.error("Program C C3 R9 static safety failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Program C C3 R9 static safety: PASS")
console.log("R9 compute-path provider imports/calls: 0")
console.log("R9 compute-path persistence writes: 0")
console.log("R9 AI materiality decisions: 0")
console.log("R9 durable acknowledgement/snooze: 0")
console.log("R9 scheduler/trading behavior: 0")
console.log("Dashboard meaningful-change consumer: canonical R9 path present")
console.log("Dashboard daily price movement: explicitly separate from R9")
