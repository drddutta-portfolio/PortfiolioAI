import { describe, expect, it } from "vitest"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import {
  buildRollingIndustryR5Calibrations, gradeQuarterR5, RESULTS_GRADING_VERSION,
  type R5IndustryPeer,
} from "./quarterlyR5Classification"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

interface Security extends R5IndustryPeer { readonly symbol: string }
interface Input {
  readonly contract: string
  readonly environment: string
  readonly cohort: readonly Security[]
  readonly observations: readonly ResultsSourceObservation[]
  readonly noProviderCalls: boolean
}
const QUARTERS=["2025-03-31","2025-06-30","2025-09-30",
  "2025-12-31","2026-03-31","2026-06-30","2026-09-30"] as const
const REQUIRES=["NET_PROFIT_QUARTER","EPS_DILUTED"]

/** R4-style same-original/same-scope trio, not merely visible revenue. */
function qualifiedOriginal(rows: readonly ResultsSourceObservation[], symbol:string, end:string):boolean {
  const top=symbol==="STARHEALTH"?"NET_PREMIUM_EARNED_QUARTER":
    ["AUBANK","AXISBANK","BANDHANBNK","BANKBARODA","BANKINDIA","CANBK","FEDERALBNK","HDFCBANK","ICICIBANK","IDBI","IDFCFIRSTB","INDIANB","KARURVYSYA","KOTAKBANK","RBLBANK","SBIN","UNIONBANK"].includes(symbol)?
      "NET_INTEREST_INCOME_QUARTER":"OPERATING_REVENUE_QUARTER"
  const required=new Set([top,...REQUIRES])
  const good=rows.filter(r=>r.selected&&r.periodEnd===end&&required.has(r.code)&&
    r.source==="COMPANY_EXCHANGE_FILING"&&r.sourceRecordId&&r.currency==="INR"&&
    (r.scope==="CONSOLIDATED"||r.scope==="STANDALONE")&&
    r.unit===(r.code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE")&&
    r.periodStart!==null&&r.periodStart!==undefined&&
    !Number.isNaN(Number(r.value)))
  const grouped=new Map<string,Set<string>>()
  for(const r of good){
    const key=r.sourceRecordId+"|"+r.scope
    const found=grouped.get(key)??new Set<string>()
    found.add(r.code)
    grouped.set(key,found)
  }
  return [...grouped.values()].some(x=>x.size===3)
}

describe.skipIf(!process.env.RESULTS_R5_G_INPUT)("live R5 historical 7-quarter accepted issuer grade census",()=>{
  it("measures additional genuinely gradeable older stock-quarters with the application engine",()=>{
    const data=JSON.parse(readFileSync(process.env.RESULTS_R5_G_INPUT!,"utf8")) as Input
    expect(data.contract).toBe("RESULTS_R5_G_ACTUAL_ENGINE_READBACK_V1")
    expect(data.environment).toBe("Development")
    expect(data.noProviderCalls).toBe(true)
    expect(data.cohort).toHaveLength(262)
    const calibrations=buildRollingIndustryR5Calibrations(data.observations,data.cohort,QUARTERS)
    const selectedById=new Map(data.cohort.map(s=>[s.securityId,data.observations.filter(o=>o.securityId===s.securityId)]))
    const byQuarter:Record<string,unknown>={}
    const overall={qualified:0,rated:0,notRated:0}
    for(const end of QUARTERS){
      const counts={STRONG:0,MIXED:0,WEAK:0,UNAVAILABLE:0}
      const basis={INDUSTRY_PEER:0,COMPANY_TREND:0,UNAVAILABLE:0}
      const qualifiedCounts={qualified:0,rated:0,unrated:0}
      const reasons:Record<string,number>={}
      for(const security of data.cohort){
        const own=selectedById.get(security.securityId)!
        const assessment=gradeQuarterR5(own,security.securityId,end,security.sector,security.industry,calibrations)
        expect(assessment.policyVersion).toBe(RESULTS_GRADING_VERSION)
        counts[assessment.status]++
        basis[assessment.basis]++
        if(assessment.status==="UNAVAILABLE"){
          reasons[assessment.explanation]=(reasons[assessment.explanation]??0)+1
        }
        if(qualifiedOriginal(own,security.symbol,end)){
          qualifiedCounts.qualified++
          if(assessment.status==="UNAVAILABLE") qualifiedCounts.unrated++
          else qualifiedCounts.rated++
        }
      }
      expect(Object.values(counts).reduce((sum,x)=>sum+x,0)).toBe(262)
      expect(Object.values(basis).reduce((sum,x)=>sum+x,0)).toBe(262)
      expect(qualifiedCounts.rated+qualifiedCounts.unrated).toBe(qualifiedCounts.qualified)
      byQuarter[end]={qualified:qualifiedCounts,rating:counts,basis,reasons}
      overall.qualified+=qualifiedCounts.qualified
      overall.rated+=qualifiedCounts.rated
      overall.notRated+=qualifiedCounts.unrated
    }
    const report={
      contract:"R5_ROLLING_HISTORICAL_GRADE_CENSUS_V1",
      quarterEnds:QUARTERS,cohort:262,
      observationSource:"Selected original issuer financial observations in Development",
      engineVersion:RESULTS_GRADING_VERSION,
      overall,byQuarter,
      newlyEligibleHistoricalQuarterEnds:["2025-03-31","2025-06-30","2025-09-30"],
      reportStatus:"ENGINE_GRADE_CENSUS_VERIFIED_NOT_FINAL_UI_ACCEPTANCE",
      limitations:["No look-ahead historical peer thresholds", "No unqualified financial figures",
        "Future rolling Q2FY27 results only after original filing source selection",
        "Retrospective historical operating performance is not point-in-time trading advice"],
    }
    mkdirSync("tmp/results-r5-g",{recursive:true})
    writeFileSync("tmp/results-r5-g/historical-grade-census.json",JSON.stringify(report,null,2))
    console.log("R5_HISTORICAL_GRADE_CENSUS",JSON.stringify(report))
  })
})
