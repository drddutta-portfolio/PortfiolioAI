import fs from "node:fs"

const computeFiles = [
  "src/features/decision/r8Determinism.ts",
  "src/features/decision/r8PortfolioContextBuilder.ts",
  "src/features/decision/r8CoreHealth.ts",
  "src/features/decision/r8PortfolioFit.ts",
  "src/features/decision/r8PortfolioRisk.ts",
  "src/features/decision/r8ExitIntelligence.ts",
  "src/features/decision/r8PortfolioDecisionEngine.ts",
  "src/features/decision/r8LivePortfolioAdapter.ts",
  "src/features/decision/r8FrozenPortfolioDisposition.ts",
  "src/features/decision/r8ReferenceValidation.ts",
  "src/features/decision/r8OwnerAuthority.ts",
  "src/features/decision/r8Presentation.ts",
  "src/features/decision/r8C2Validation.ts",
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
      failures.push(`${file}: prohibited compute-path import ${specifier}`)
    }
  }
  for (const pattern of prohibitedRuntimePatterns) {
    if (pattern.test(source)) failures.push(`${file}: prohibited runtime pattern ${pattern}`)
  }
}

const consumerFiles = [
  "src/components/DashboardCoreExitRisk.tsx",
  "src/components/DashboardRiskConcentration.tsx",
]
for (const file of consumerFiles) {
  const source = fs.readFileSync(file, "utf8")
  if (!source.includes("buildProgramCR8LivePortfolioProjection")) {
    failures.push(`${file}: canonical R8 consumer integration missing`)
  }
}

if (failures.length) {
  console.error("Program C C2 static safety failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Program C C2 static safety: PASS")
console.log("R8 compute-path provider imports/calls: 0")
console.log("R8 compute-path persistence writes: 0")
console.log("R8 compute-path AI decisions: 0")
console.log("R8 compute-path scheduler/trading behavior: 0")
console.log("Dashboard Core/Exit and Risk/Concentration consumers: canonical R8 adapter present")
