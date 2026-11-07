import { describe, expect, it } from "vitest"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import Decimal from "decimal.js"
import { buildRollingIndustryR5Calibrations, type R5IndustryPeer } from "./quarterlyR5Classification"
import { gradeR5WithVerifiedOriginal } from "./resultsR5VerifiedComparison"
import { compareQuarterMetric } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
interface Input {
  environment:string
  cohort:(R5IndustryPeer & {symbol:string})[]
  observations:ResultsSourceObservation[]
}
const quarters=["2025-03-31","2025-06-30","2025-09-30","2025-12-31","2026-03-31","2026-06-30","2026-09-30"]
const core=["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]
describe.skipIf(!process.env.RESULTS_BHARTI_SCOPE_INPUT)("BHARTIARTL live original-filing scope recovery",()=>{
  it("uses consolidated originals and the unchanged application comparison/grading engine",()=>{
    const before=JSON.parse(readFileSync("tmp/results-r5-g/bharti-before.json","utf8")) as Input
    const after=JSON.parse(readFileSync(process.env.RESULTS_BHARTI_SCOPE_INPUT!,"utf8")) as Input
    expect(before.environment).toBe("Development");expect(after.environment).toBe("Development")
    const equity=after.cohort.find(x=>x.symbol==="BHARTIARTL")!
    expect(equity).toBeDefined()
    const old=before.observations.filter(x=>x.securityId===equity.securityId)
    const own=after.observations.filter(x=>x.securityId===equity.securityId)
    const selected=own.filter(x=>x.selected&&x.periodEnd==="2025-12-31"&&core.includes(x.code))
    expect(selected).toHaveLength(3)
    expect(new Set(selected.map(x=>x.sourceRecordId)).size).toBe(1)
    expect(selected.every(x=>x.scope==="CONSOLIDATED"&&x.periodStart==="2025-10-01"&&x.currency==="INR")).toBe(true)
    const expected:Record<string,string>={OPERATING_REVENUE_QUARTER:"53981.60",NET_PROFIT_QUARTER:"8502.80",EPS_DILUTED:"11.02"}
    for(const row of selected)expect(new Decimal(row.value).eq(expected[row.code]!)).toBe(true)
    const other=(rows:readonly ResultsSourceObservation[])=>rows.filter(x=>x.selected&&x.periodEnd!=="2025-12-31").map(x=>x.id).sort()
    expect(other(own)).toEqual(other(old))
    if(old.some(x=>x.selected&&x.periodEnd==="2025-12-31"&&x.scope==="STANDALONE")){
      expect(compareQuarterMetric(old,equity.securityId,"2025-12-31","OPERATING_REVENUE_QUARTER").qoq).toBeNull()
    }
    const calibration=buildRollingIndustryR5Calibrations(after.observations,after.cohort,quarters)
    const oldCalibration=buildRollingIndustryR5Calibrations(before.observations,before.cohort,quarters)
    const rows=quarters.map(end=>{
      const revenue=compareQuarterMetric(own,equity.securityId,end,"OPERATING_REVENUE_QUARTER")
      const profit=compareQuarterMetric(own,equity.securityId,end,"NET_PROFIT_QUARTER")
      const grade=gradeR5WithVerifiedOriginal(own,equity.securityId,end,equity.sector,equity.industry,calibration)
      const previous=gradeR5WithVerifiedOriginal(old,equity.securityId,end,equity.sector,equity.industry,oldCalibration)
      if(["2025-12-31","2026-03-31","2026-06-30"].includes(end)){
        expect(revenue.qoq).not.toBeNull();expect(profit.qoq).not.toBeNull();expect(grade.status).not.toBe("UNAVAILABLE")
      }
      return {quarter:end,before:previous.status,after:grade.status,revenueQoQ:revenue.qoq,patQoQ:profit.qoq,explanation:grade.explanation}
    })
    mkdirSync("tmp/bharti-scope-repair",{recursive:true})
    writeFileSync("tmp/bharti-scope-repair/derived-grade-readback.json",JSON.stringify({symbol:"BHARTIARTL",uiChanged:false,rows},null,2))
    console.log("BHARTI_SCOPE_ACTUAL_ENGINE_READBACK",JSON.stringify(rows))
  })
})
