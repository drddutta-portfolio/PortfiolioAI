#!/usr/bin/env node
import fs from "node:fs"
const pkg=JSON.parse(fs.readFileSync(new URL("../docs/p7-ic/PortfolioAI_P7_IC2_EXECUTABLE_PROVIDER_PACKAGE_2026-09-29.json",import.meta.url),"utf8"))
const errors=[]
if(pkg.trendlyne.exactPhysicalCallCeiling!==920)errors.push("trendlyne calls")
if(pkg.trendlyne.batchCount!==23)errors.push("trendlyne batch count")
if(pkg.trendlyne.batches.some(b=>b.plannedCalls>40))errors.push("batch >40")
if(pkg.trendlyne.identityCalls!==280||pkg.trendlyne.currentResearchCalls!==640)errors.push("phase totals")
if(pkg.trendlyne.bluejetCalls!==0)errors.push("BLUEJET")
if(pkg.angelOne.stockHistoryCalls!==238||pkg.angelOne.benchmarkHistoryCalls!==22||pkg.angelOne.totalAuthenticatedHistoryCalls!==260)errors.push("Angel One totals")
if(pkg.cacheFirst.reusableBaseResearchBundles!==79)errors.push("cache count")
if(Object.values(pkg.governance).some(Boolean))errors.push("governance boundary")
console.log(JSON.stringify({status:errors.length?"FAIL":"PASS",errors,trendlyne:{calls:pkg.trendlyne.exactPhysicalCallCeiling,batches:pkg.trendlyne.batchCount,reserve:pkg.trendlyne.subscriptionReserve},angelOne:{stock:pkg.angelOne.stockHistoryCalls,benchmarks:pkg.angelOne.benchmarkHistoryCalls,total:pkg.angelOne.totalAuthenticatedHistoryCalls}},null,2))
if(errors.length)process.exit(1)
