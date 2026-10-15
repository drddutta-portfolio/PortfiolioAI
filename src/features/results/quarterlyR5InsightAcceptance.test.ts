import { describe, expect, it } from "vitest"
import { compareQuarterMetrics, explainQuarterlyComparisons } from "./quarterlyR5"
import { gradeQuarterR5 } from "./quarterlyR5Classification"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

function fact(end: string, code: string, value: string, selected = true): ResultsSourceObservation {
  const [year,month] = end.split("-").map(Number)
  return {
    id: end + code, securityId: "issuer", code, value, selected,
    periodEnd: end, periodStart: new Date(Date.UTC(year!, month! - 3, 1)).toISOString().slice(0,10),
    unit: "INR_CRORE", currency: "INR", scope: "CONSOLIDATED",
    source: "COMPANY_EXCHANGE_FILING", sourceRecordId: end + "original",
    publishedAt: null, retrievedAt: "2026-10-15T00:00:00Z",
  }
}
const insight = (facts: readonly ResultsSourceObservation[], bank: boolean) =>
  explainQuarterlyComparisons(compareQuarterMetrics(facts,"issuer","2026-06-30"),bank).join(" ")
const quarterPair = (topCode: string) => [
  fact("2026-06-30",topCode,"110"),fact("2026-03-31",topCode,"100"),
  fact("2026-06-30","NET_PROFIT_QUARTER","12"),fact("2026-03-31","NET_PROFIT_QUARTER","10"),
]
describe("R5-E source-evidence narrative acceptance", () => {
  it("narrates only qualified operating revenue and PAT, with real signed QoQ values",()=>{
    const text=insight(quarterPair("OPERATING_REVENUE_QUARTER"),false)
    expect(text).toContain("Revenue increased by 10.00% QoQ.")
    expect(text).toContain("Profit after tax increased by 20.00% QoQ.")
    expect(text).not.toContain("Net interest income")
    expect(text).toContain("no YoY performance conclusion")
    expect(text).toContain("Thesis impact: Not assessed")
    expect(text).toContain("No investment recommendation")
  })
  it("uses bank NII and PAT only, not revenue, when bank=true",()=>{
    const text=insight(quarterPair("NET_INTEREST_INCOME_QUARTER"),true)
    expect(text).toContain("Net interest income increased by 10.00% QoQ.")
    expect(text).toContain("Profit after tax increased by 20.00% QoQ.")
    expect(text).not.toContain("Revenue increased")
  })
  it("never narrates unselected baseline data as actual growth",()=>{
    const rows=quarterPair("OPERATING_REVENUE_QUARTER").map(r =>
      r.periodEnd==="2026-03-31"?{...r,selected:false}:r)
    const text=insight(rows,false)
    expect(text).toContain("comparable preceding quarter is unavailable")
    expect(text).not.toContain("increased by 10.00% QoQ")
    expect(text).not.toContain("increased by 20.00% QoQ")
  })
  it("does not use negative or zero PAT as a percentage baseline",()=>{
    for(const value of ["0","-12"]){
      const rows=[...quarterPair("OPERATING_REVENUE_QUARTER").filter(r=>r.code==="OPERATING_REVENUE_QUARTER"),
        fact("2026-06-30","NET_PROFIT_QUARTER","12"),fact("2026-03-31","NET_PROFIT_QUARTER",value)]
      const text=insight(rows,false)
      expect(text).toContain("Profit after tax is source-selected, but a comparable preceding quarter is unavailable")
      expect(text).not.toContain("Profit after tax increased by")
    }
  })
  it("uses qualified YoY only with a selected original prior-year comparison",()=>{
    const rows=[...quarterPair("OPERATING_REVENUE_QUARTER"),
      fact("2025-06-30","OPERATING_REVENUE_QUARTER","80"),
      fact("2025-06-30","NET_PROFIT_QUARTER","8")]
    const text=insight(rows,false)
    expect(text).toContain("Revenue increased by 37.50% YoY")
    expect(text).toContain("Profit after tax increased by 50.00% YoY")
    expect(text).not.toContain("no YoY performance conclusion")
    const missing=insight(rows.map(r=>r.periodEnd==="2025-06-30"?{...r,selected:false}:r),false)
    expect(missing).toContain("no YoY performance conclusion")
    expect(missing).not.toContain("increased by 37.50% YoY")
  })
  it("refuses incoherent scope, wrong original issuer or duplicated source facts",()=>{
    const base=quarterPair("OPERATING_REVENUE_QUARTER")
    const cases=[
      base.map(r=>r.periodEnd==="2026-03-31"?{...r,scope:"STANDALONE"}:r),
      base.map(r=>r.periodEnd==="2026-03-31"?{...r,source:"UNVERIFIED_PROVIDER"}:r),
      [...base,{...base[1]!,id:"duplicate-verified-observation"}],
    ]
    for(const facts of cases){
      const text=insight(facts,false)
      expect(text).not.toContain("Revenue increased by 10.00% QoQ.")
      expect(text).toContain("Thesis impact: Not assessed")
    }
  })
  it("keeps unsupported industry rating explicitly unavailable and distinct from the source narrative",()=>{
    const rows=quarterPair("OPERATING_REVENUE_QUARTER")
    const grade=gradeQuarterR5(rows,"issuer","2026-06-30",null,null,new Map())
    expect(grade.status).toBe("UNAVAILABLE")
    expect(grade.basis).toBe("UNAVAILABLE")
    const text=insight(rows,false)
    expect(text).toContain("Revenue increased by 10.00% QoQ.")
    expect(text).toContain("No investment recommendation or V1-4 research score is inferred")
  })
  it("returns safe empty-evidence and decline/unchanged narratives without inventing causes",()=>{
    const empty=insight([],false)
    expect(empty).toContain("No sufficiently qualified current-quarter core financial comparisons")
    expect(empty).not.toContain("Revenue increased")
    const declines=[
      fact("2026-06-30","OPERATING_REVENUE_QUARTER","80"),fact("2026-03-31","OPERATING_REVENUE_QUARTER","100"),
      fact("2026-06-30","NET_PROFIT_QUARTER","10"),fact("2026-03-31","NET_PROFIT_QUARTER","10"),
    ]
    const text=insight(declines,false)
    expect(text).toContain("Revenue decreased by 20.00% QoQ.")
    expect(text).toContain("Profit after tax was unchanged QoQ.")
    expect(text).not.toMatch(/due to|management decision|market share gain|buy now|sell now/i)
  })
})
