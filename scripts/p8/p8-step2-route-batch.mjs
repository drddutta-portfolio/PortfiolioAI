import { readFileSync, writeFileSync } from "node:fs"
import { routeHistoricalResearchProfileV1 } from "../../src/features/research/researchProfileRouting.ts"
import { assessHistoricalSteelFerrousReadiness } from "../../src/features/research/historicalSteelFerrousReadinessAdapter.ts"
const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) throw new Error("usage: p8-step2-route-batch.mjs <input> <output>")
const rows = JSON.parse(readFileSync(inputPath, "utf8"))
const out = rows.map((row) => {
  const route = routeHistoricalResearchProfileV1(row.route_input)
  const readiness = assessHistoricalSteelFerrousReadiness({ route: row.route_input, signals: [] })
  return { pair_key: row.pair_key, route, readiness }
})
writeFileSync(outputPath, JSON.stringify(out))
