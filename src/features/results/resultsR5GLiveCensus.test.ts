import { describe, expect, it } from "vitest"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { buildIndustryR5Calibrations, gradeQuarterR5, RESULTS_GRADING_VERSION,
  type R5IndustryPeer } from "./quarterlyR5Classification"
import { compareQuarterMetric } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

/** Dedicated CI runs this only with a fresh Development SQL evidence snapshot.
 * No duplicated financial models, provider calls, or production mutations.
 */
interface Equity extends R5IndustryPeer { symbol:string }
interface AuditInput {
  contract:string
  environment:string
  cohort:Equity[]
  observations:ResultsSourceObservation[]
  displayedFour:string[]
  evaluationQuarter:string
  noProviderCalls:boolean
}
const QUARTERS=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
const statuses=["STRONG","MIXED","WEAK","UNAVAILABLE"] as const
type Status=(typeof statuses)[number]
const blank=():Record<Status,number>=>({STRONG:0,MIXED:0,WEAK:0,UNAVAILABLE:0})
const basis=()=>({INDUSTRY_PEER:0,COMPANY_TREND:0,UNAVAILABLE:0})

/** Same four-current-quarter coherence predicate as the source-backed UI. */
function currentFour(own:readonly ResultsSourceObservation[],equity:Equity):boolean{
  const selected=own.filter(x=>x.selected&&x.source==="COMPANY_EXCHANGE_FILING")
  const bank=/\bbanks?\b/i.test(equity.industry??"") ||
    selected.some(x=>x.code==="NET_INTEREST_INCOME_QUARTER"||x.code==="GROSS_NPA_PERCENT"||x.code==="NET_NPA_PERCENT")
  const top=equity.symbol==="STARHEALTH"?"NET_PREMIUM_EARNED_QUARTER":
    bank?"NET_INTEREST_INCOME_QUARTER":"OPERATING_REVENUE_QUARTER"
  const required=[top,"NET_PROFIT_QUARTER","EPS_DILUTED"]
  return QUARTERS.every(period=>{
    const rows=selected.filter(x=>x.periodEnd===period&&required.includes(x.code))
    return rows.length===3 && new Set(rows.map(x=>x.code)).size===3 &&
      rows.every(x=>Boolean(x.sourceRecordId)&&["STANDALONE","CONSOLIDATED"].includes(x.scope??"") &&
        x.currency==="INR"&&x.unit===(x.code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE")) &&
      new Set(rows.map(x=>x.sourceRecordId)).size===1&&new Set(rows.map(x=>x.scope)).size===1
  })
}

describe.skipIf(!process.env.RESULTS_R5_G_INPUT)("Live 262-equity R5-G actual-grade acceptance",()=>{
  it("grades full cohort using the exact Results UI engine; retains derived-only audit",()=>{
    const data=JSON.parse(readFileSync(process.env.RESULTS_R5_G_INPUT!,"utf8")) as AuditInput
    expect(data.contract).toBe("RESULTS_R5_G_ACTUAL_ENGINE_READBACK_V1")
    expect(data.environment).toBe("Development")
    expect(data.noProviderCalls).toBe(true)
    expect(data.cohort).toHaveLength(262)
    expect(new Set(data.cohort.map(x=>x.securityId)).size).toBe(262)
    expect(data.displayedFour).toEqual(QUARTERS)
    expect(data.evaluationQuarter).toBe("2026-06-30")
    const calibration=buildIndustryR5Calibrations(data.observations,data.cohort)
    const byId=new Map(data.cohort.map(x=>[x.securityId,
      data.observations.filter(r=>r.securityId===x.securityId)]))
    const gradeCounts=blank(),fourCompleteGradeCounts=blank()
    const gradeBasisCounts=basis(),fourCompleteBasisCounts=basis()
    const unavailableReasons:Record<string,number>={}
    const availableComparisons={revenueOrNiiQoQ:0,revenueOrNiiYoY:0,patQoQ:0,patYoY:0}
    let complete=0
    for(const equity of data.cohort){
      const own=byId.get(equity.securityId)!
      const grade=gradeQuarterR5(own,equity.securityId,data.evaluationQuarter,
        equity.sector,equity.industry,calibration)
      expect(statuses).toContain(grade.status)
      expect(grade.policyVersion).toBe(RESULTS_GRADING_VERSION)
      expect(grade.scope).toBe("QOQ_ONLY")
      if(grade.status==="UNAVAILABLE"){
        expect(grade.basis).toBe("UNAVAILABLE")
        unavailableReasons[grade.explanation]=(unavailableReasons[grade.explanation]??0)+1
      }else{
        expect(grade.basis).not.toBe("UNAVAILABLE")
        expect(grade.supportingMetrics).toHaveLength(2)
        expect(grade.sampleSize).toBeGreaterThanOrEqual(2)
      }
      gradeCounts[grade.status]++
      gradeBasisCounts[grade.basis]++
      if(currentFour(own,equity)){
        complete++
        fourCompleteGradeCounts[grade.status]++
        fourCompleteBasisCounts[grade.basis]++
      }
      const top=equity.symbol==="STARHEALTH"?"NET_PREMIUM_EARNED_QUARTER":
        own.some(x=>x.code==="NET_INTEREST_INCOME_QUARTER")?"NET_INTEREST_INCOME_QUARTER":"OPERATING_REVENUE_QUARTER"
      const t=compareQuarterMetric(own,equity.securityId,"2026-06-30",top)
      const p=compareQuarterMetric(own,equity.securityId,"2026-06-30","NET_PROFIT_QUARTER")
      if(t.qoq!==null)availableComparisons.revenueOrNiiQoQ++
      if(t.yoy!==null)availableComparisons.revenueOrNiiYoY++
      if(p.qoq!==null)availableComparisons.patQoQ++
      if(p.yoy!==null)availableComparisons.patYoY++
    }
    expect(Object.values(gradeCounts).reduce((a,b)=>a+b,0)).toBe(262)
    expect(Object.values(gradeBasisCounts).reduce((a,b)=>a+b,0)).toBe(262)
    expect(Object.values(fourCompleteGradeCounts).reduce((a,b)=>a+b,0)).toBe(complete)
    const report={
      contract:"RESULTS_R5_G_LIVE_GRADE_CENSUS_V1",
      environment:"Development",engineVersion:RESULTS_GRADING_VERSION,
      gradingQuarter:"2026-06-30",equities:262,
      sourceSelectedObservationRows:data.observations.length,
      fourQuarterCompleteEquities:complete,
      gradeCounts,gradeBasisCounts,fourCompleteGradeCounts,fourCompleteBasisCounts,
      calibratedIndustryGroups:calibration.size,unavailableReasons,availableComparisons,
      status:"GRADED_SOURCE_CENSUS_VERIFIED_UI_VISUAL_ACCEPTANCE_PENDING",
      limitations:["Quarterly performance is not investment action",
        "Unqualified issuer periods remain Not Rated; no point-in-time inference",
        "Counts are actual-engine readback, not authenticated browser visual acceptance"],
    }
    mkdirSync("tmp/results-r5-g",{recursive:true})
    writeFileSync("tmp/results-r5-g/grade-census.json",JSON.stringify(report,null,2))
    console.log("R5_G_LIVE_GRADE_CENSUS",JSON.stringify(report))
  })
})
