import { describe, expect, it } from "vitest"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import {
  buildRollingIndustryR5Calibrations, RESULTS_GRADING_VERSION,
  type R5IndustryPeer,
} from "./quarterlyR5Classification"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { compareQuarterMetric } from "./quarterlyR5"
import { buildVerifiedR5ComparisonRows, gradeR5WithVerifiedOriginal as gradeQuarterR5 } from "./resultsR5VerifiedComparison"

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
    // Classification is read from the same canonical enrichment view as the
    // live Results UI. Source-backed secondary recoveries cannot be replaced
    // with local symbol-based grade labels, and missing classifications fail
    // the 262-equity R5 final acceptance contract.
    const classified=data.cohort.filter(c=>c.sector?.trim()&&c.industry?.trim())
    expect(classified).toHaveLength(262)
    const calibrations=buildRollingIndustryR5Calibrations(data.observations,data.cohort,QUARTERS)
    const selectedById=new Map(data.cohort.map(s=>[s.securityId,data.observations.filter(o=>o.securityId===s.securityId)]))
    // Preserve each individual qualified-but-unrated historical case. The
    // actual R5 engine supplies the authoritative grade and explanation.
    const historicalExceptions: {
      symbol:string;quarter:string;industry:string|null;
      reason:string;gradeBasis:string;previousQuarter:string;
      historicalChecks:readonly {quarter:string;topSelected:boolean;profitSelected:boolean;
        sameFilingAndScope:boolean;topQoQStatus:string;profitQoQStatus:string}[];
      action:string;
    }[]=[]
    const priorQuarter=(end:string)=>{
      const [y,m]=end.split("-").map(Number)
      return new Date(Date.UTC(y!,m!-3,0)).toISOString().slice(0,10)
    }
    const banks=new Set("AUBANK AXISBANK BANDHANBNK BANKBARODA BANKINDIA CANBK FEDERALBNK HDFCBANK ICICIBANK IDBI IDFCFIRSTB INDIANB KARURVYSYA KOTAKBANK RBLBANK SBIN UNIONBANK".split(" "))
    const classifications:Record<string,number>={}
    const existingQualifiedTrendFallbacks: {symbol:string;quarter:string;proposedGrade:string}[]=[]
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
        // Non-numeric, read-only scope trace for exact historically blocked issuers.
        // No alternate proof is promoted into canonical R4 selections.
        if(end==="2025-09-30" && ["SHARDACROP","MOTHERSON","CGPOWER"].includes(security.symbol)){
          const trace=(["CONSOLIDATED","STANDALONE"] as const).map(scope=>{
            const alternate=buildVerifiedR5ComparisonRows(own,undefined,scope)
            const assessed=gradeQuarterR5(own,security.securityId,end,security.sector,security.industry,calibrations,alternate)
            const periods=["2025-03-31","2025-06-30","2025-09-30"]
            return {scope,grade:assessed.status,changed:alternate!==own,
              periods:periods.map(period=>({period,selected:alternate.filter(row=>row.selected&&row.periodEnd===period&&
                ["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"].includes(row.code))
                .map(row=>({code:row.code,scope:row.scope,source:row.sourceRecordId})).sort((a,b)=>a.code.localeCompare(b.code))}))}
          })
          console.log("R5_VERIFIED_SCOPE_TRACE "+JSON.stringify({symbol:security.symbol,quarter:end,canonical:assessment.status,trace}))
        }
        expect(assessment.policyVersion).toBe(RESULTS_GRADING_VERSION)
        counts[assessment.status]++
        basis[assessment.basis]++
        if(assessment.status==="UNAVAILABLE"){
          reasons[assessment.explanation]=(reasons[assessment.explanation]??0)+1
        }
        if(qualifiedOriginal(own,security.symbol,end)){
          qualifiedCounts.qualified++
          if(assessment.status==="UNAVAILABLE") {
            qualifiedCounts.unrated++
            if(end==="2025-03-31"||end==="2025-06-30"||end==="2025-09-30"){
              const top=security.symbol==="STARHEALTH"?"NET_PREMIUM_EARNED_QUARTER":
                banks.has(security.symbol)?"NET_INTEREST_INCOME_QUARTER":"OPERATING_REVENUE_QUARTER"
              const historicalChecks=[] as {quarter:string;topSelected:boolean;profitSelected:boolean;
                sameFilingAndScope:boolean;topQoQStatus:string;profitQoQStatus:string}[]
              let prior:string=end
              for(let index=0;index<4;index++){
                const quarter=prior
                const primary=compareQuarterMetric(own,security.securityId,quarter,top)
                const profit=compareQuarterMetric(own,security.securityId,quarter,"NET_PROFIT_QUARTER")
                const a=primary.current,b=profit.current
                historicalChecks.push({
                  quarter,topSelected:Boolean(a),profitSelected:Boolean(b),
                  sameFilingAndScope:Boolean(a&&b&&a.sourceRecordId&&
                    a.sourceRecordId===b.sourceRecordId&&a.scope===b.scope),
                  topQoQStatus:primary.qoq!==null?"ELIGIBLE":primary.qoqLimitation??"UNKNOWN",
                  profitQoQStatus:profit.qoq!==null?"ELIGIBLE":profit.qoqLimitation??"UNKNOWN",
                })
                prior=priorQuarter(prior)
              }
              const reason=assessment.explanation
              // Run the already-approved issuer-only trajectory contract
              // against the *same* selected originals as a counterfactual.
              // No industry peers or unqualified sources are introduced.
              if(reason.startsWith("Comparable, same-filing")){
                const trend=gradeQuarterR5(own,security.securityId,end,security.sector,security.industry,new Map())
                if(trend.basis==="COMPANY_TREND" && trend.status!=="UNAVAILABLE"){
                  existingQualifiedTrendFallbacks.push({symbol:security.symbol,quarter:end,proposedGrade:trend.status})
                }
              }
              const action=reason.startsWith("Industry is unavailable")?"MODEL_NOT_SUPPORTED":
                reason.startsWith("Comparable, same-filing")?"RECONCILE_ADJACENT_QUARTER_AND_SOURCE_COMPATIBILITY":
                historicalChecks.slice(0,3).some(check=>!check.topSelected||!check.profitSelected)?
                  "RECOVER_QUALIFIED_PRIOR_SOURCE_SELECTION":
                  historicalChecks.slice(0,3).some(check=>!check.sameFilingAndScope)?
                    "RECONCILE_ISSUER_FILING_AND_SCOPE":
                    "INSUFFICIENT_PEER_OR_HISTORICAL_COMPARISON_CONTRACT"
              classifications[action]=(classifications[action]??0)+1
              historicalExceptions.push({
                symbol:security.symbol,quarter:end,industry:security.industry,
                reason,gradeBasis:assessment.basis,
                previousQuarter:priorQuarter(end),historicalChecks,action,
              })
            }
          }
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
    historicalExceptions.sort((a,b)=>a.quarter.localeCompare(b.quarter)||a.symbol.localeCompare(b.symbol))
    const modelSupportedHistoricalExceptions=historicalExceptions.filter(row=>row.action!=="MODEL_NOT_SUPPORTED")
    const groupedActions=Object.fromEntries(Object.entries(classifications).filter(([key])=>key!=="MODEL_NOT_SUPPORTED"))
    const historicalQualifiedUnrated=["2025-03-31","2025-06-30","2025-09-30"].reduce((n,q)=>{
      const row=byQuarter[q] as {qualified:{unrated:number}}
      return n+row.qualified.unrated
    },0)
    expect(historicalExceptions).toHaveLength(historicalQualifiedUnrated)
    const report={
      contract:"R5_ROLLING_HISTORICAL_GRADE_CENSUS_V1",
      quarterEnds:QUARTERS,cohort:262,
      observationSource:"Selected original issuer financial observations in Development",
      engineVersion:RESULTS_GRADING_VERSION,
      overall,byQuarter,
      historicalExceptions:{
        count:historicalExceptions.length,
        supportedModelUnratedCount:modelSupportedHistoricalExceptions.length,
        supportedModelActions:groupedActions,
        eligibleAlreadyApprovedCompanyTrendFallbacks:existingQualifiedTrendFallbacks,
        unmodeledCount:historicalExceptions.length-modelSupportedHistoricalExceptions.length,
        actionCounts:classifications,
        rows:historicalExceptions,
        note:"Exact engine grade failures among source-qualified issuer company-quarters in three newly enabled historical columns; does not equal the arithmetic remainder of a prior fixed 637-slot cohort.",
      },
      newlyEligibleHistoricalQuarterEnds:["2025-03-31","2025-06-30","2025-09-30"],
      reportStatus:"ENGINE_GRADE_CENSUS_VERIFIED_NOT_FINAL_UI_ACCEPTANCE",
      limitations:["No look-ahead historical peer thresholds", "No unqualified financial figures",
        "Future rolling Q2FY27 results only after original filing source selection",
        "Retrospective historical operating performance is not point-in-time trading advice"],
    }
    mkdirSync("tmp/results-r5-g",{recursive:true})
    writeFileSync("tmp/results-r5-g/historical-grade-census.json",JSON.stringify(report,null,2))
    console.log("R5_HISTORICAL_GRADE_CENSUS",JSON.stringify({...report,historicalExceptions:{...report.historicalExceptions,rowsOmittedFromLogs:true,rows:undefined}}))
    console.log("R5_HISTORICAL_FAILURES",JSON.stringify({
      supportedModelUnratedCount:modelSupportedHistoricalExceptions.length,
      supportedModelActions:groupedActions,
      eligibleAlreadyApprovedCompanyTrendFallbacks:existingQualifiedTrendFallbacks,
      unmodeledCount:historicalExceptions.length-modelSupportedHistoricalExceptions.length,
      historicalAllQualifiedUnrated:historicalExceptions.length,
      examples:modelSupportedHistoricalExceptions.slice(0,22).map(x=>({symbol:x.symbol,quarter:x.quarter,action:x.action})),
    }))
  })
})
