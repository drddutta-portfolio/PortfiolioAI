import { readFileSync, writeFileSync } from "node:fs"
import { routeHistoricalResearchProfileV1 } from "../../src/features/research/researchProfileRouting.ts"
const [inputPath, outputPath] = process.argv.slice(2)
if (!inputPath || !outputPath) throw new Error("usage: p8-step2-route-batch.mjs <input> <output>")
const rows = JSON.parse(readFileSync(inputPath, "utf8"))
const out = rows.map((row) => {
  const route = routeHistoricalResearchProfileV1(row.route_input)
  return { pair_key: row.pair_key, route }
})
writeFileSync(outputPath, JSON.stringify(out))
