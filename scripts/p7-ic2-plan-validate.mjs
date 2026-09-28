#!/usr/bin/env node
import fs from "node:fs";
const plan=JSON.parse(fs.readFileSync(new URL("../docs/p7-ic/PortfolioAI_P7_IC2_CACHE_EVIDENCE_DEFICIT_PLAN_2026-09-29.json",import.meta.url),"utf8"));
const adapter=JSON.parse(fs.readFileSync(new URL("../docs/p7-ic/PortfolioAI_P7_IC2_PROFILE_EVIDENCE_ADAPTER_PLAN_V1.json",import.meta.url),"utf8"));
const errors=[];
if(plan.summary.equities!==239)errors.push("equity count");
if(plan.summary.ic1Resolved!==238)errors.push("resolved count");
if(JSON.stringify(plan.summary.factualReviewRequired)!==JSON.stringify(["BLUEJET"]))errors.push("review exception");
if(plan.summary.trendlyneSupportedAdapterCallCeiling!==920)errors.push("Trendlyne ceiling");
if(plan.summary.angelOneIncrementalStockHistoryCalls!==238)errors.push("Angel history calls");
if(plan.summary.uniqueRequiredPrimaryBenchmarks!==22)errors.push("benchmark count");
if(plan.summary.benchmarkHistoriesReady!==0||plan.summary.r6ReadyNow!==0)errors.push("premature readiness");
if(plan.trendlyneCurrentEvidenceCohorts.some(x=>x.plannedCalls>320))errors.push("daily envelope");
for(const d of plan.trendlyneCurrentEvidenceCohorts)for(const g of [d.identity,d.currentResearch].filter(Boolean))for(const b of g.batches||[])if(b.plannedCalls>40)errors.push("batch cap");
const blue=plan.rows.find(r=>r.symbol==="BLUEJET");if(!blue||blue.plannedProviderCalls.trendlyneSupportedAdapterCeiling!==0||blue.plannedProviderCalls.angelOneStockHistory!==0)errors.push("BLUEJET calls");
if(adapter.status!=="PLAN_ONLY_NO_PROVIDER_EXECUTION")errors.push("adapter status");
console.log(JSON.stringify({status:errors.length?"FAIL":"PASS",errors,summary:plan.summary,trendDays:plan.trendlyneCurrentEvidenceCohorts.map(x=>({day:x.day,calls:x.plannedCalls})),angelBatches:plan.angelOneStockHistoryCohorts.length},null,2));
if(errors.length)process.exit(1);
