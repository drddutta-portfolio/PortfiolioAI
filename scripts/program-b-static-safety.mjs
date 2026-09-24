import { readFileSync } from "node:fs"

const computeFiles = [
  "src/features/research/programBR6Contract.ts",
  "src/features/research/programBR6Execution.ts",
  "src/features/research/programBR7Contract.ts",
  "src/features/research/programBR7Execution.ts",
]
const prohibited = [
  [/from ["'][^"']*(provider|refresh|supabase|openai|angel|trendlyne)/iu, "provider/refresh client import"],
  [/from ["'][^"']*(recommendationPolicyRepository|positionDecisionRepository|scoringRepository)/u, "persistence repository import"],
  [/\.(insert|upsert|update|delete|invoke)\s*\(/u, "canonical write/invocation"],
  [/\b(fetch|schedule|placeOrder|trade)\s*\(/iu, "network/scheduler/trading call"],
]
const failures = []
for (const file of computeFiles) {
  const source = readFileSync(file, "utf8")
  for (const [pattern, label] of prohibited) if (pattern.test(source)) failures.push(`${file}: ${label}`)
}
if (failures.length) {
  process.stderr.write(`Program B static safety failed:\n${failures.join("\n")}\n`)
  process.exit(1)
}
process.stdout.write("Program B static safety: PASS (no provider, persistence, scheduler or trading dependency in R6/R7 compute modules)\n")
