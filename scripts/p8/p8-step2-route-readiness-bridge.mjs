#!/usr/bin/env node
import readline from "node:readline"
import { routeHistoricalResearchProfileV1 } from "../../src/features/research/researchProfileRouting.ts"
import { assessHistoricalSteelFerrousReadiness } from "../../src/features/research/historicalSteelFerrousReadinessAdapter.ts"

const rl=readline.createInterface({input:process.stdin,crlfDelay:Infinity})
for await (const line of rl) {
  if (!line.trim()) continue
  const item=JSON.parse(line)
  const route=routeHistoricalResearchProfileV1(item.route)
  const readiness=assessHistoricalSteelFerrousReadiness({route:item.route,signals:[]})
  process.stdout.write(JSON.stringify({pair_key:item.pair_key,route,readiness})+"\n")
}
