import { describe, expect, it } from "vitest"
import { buildResultsQuarterPeriods, labelResultsQuarter } from "./resultsQuarterPeriods"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

const now = new Date("2027-08-15T04:00:00Z")
function fact(end: string, code: string, index = "1", selected = true, source = "COMPANY_EXCHANGE_FILING"): ResultsSourceObservation {
  return {
    id:end+code+index,securityId:index,code,value:"123",periodEnd:end,
    unit:code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE",
    currency:"INR",scope:"CONSOLIDATED",sourceRecordId:end+index,
    source,selected,publishedAt:null,retrievedAt:"2027-08-15T00:00:00Z",
  }
}
function trio(end: string, index = "1") {
  return ["OPERATING_REVENUE_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"]
    .map(code=>fact(end,code,index))
}
describe("Results quarter rollover",()=>{
  it("generates valid FY27 and FY28 labels for future years",()=>{
    expect(labelResultsQuarter("2026-12-31")).toBe("Q3 FY27")
    expect(labelResultsQuarter("2027-03-31")).toBe("Q4 FY27")
    expect(labelResultsQuarter("2027-06-30")).toBe("Q1 FY28")
    expect(labelResultsQuarter("2027-09-30")).toBe("Q2 FY28")
  })
  it("does not add blank future quarters just because the date advanced",()=>{
    const rows=trio("2026-09-30")
    expect(buildResultsQuarterPeriods(rows,new Date("2027-01-02T00:00:00Z"))[0]?.label).toBe("Q2 FY27")
    expect(buildResultsQuarterPeriods(rows,now)[0]?.label).toBe("Q2 FY27")
  })
  it("adds only the new verified original quarter and preserves latest-first order",()=>{
    const periods=buildResultsQuarterPeriods([...trio("2026-09-30"),...trio("2026-12-31")],now)
    expect(periods.slice(0,3).map(p=>p.label)).toEqual(["Q3 FY27","Q2 FY27","Q1 FY27"])
    expect(new Set(periods.map(p=>p.end)).size).toBe(periods.length)
  })
  it("automatically supports Q4 FY27 and FY28 Q1 with no schema or UI edits",()=>{
    const periods=buildResultsQuarterPeriods([...trio("2027-03-31"),...trio("2027-06-30")],now)
    expect(periods.slice(0,4).map(p=>p.label)).toEqual(["Q1 FY28","Q4 FY27","Q3 FY27","Q2 FY27"])
  })
  it("never admits a lone metric, an unselected or contradictory trio, or a future dated filing",()=>{
    const bad=[fact("2027-09-30","OPERATING_REVENUE_QUARTER"),
      ...trio("2027-03-31").map(x=>({...x,selected:false})),
      ...trio("2026-12-31").map((x,i)=>({...x,sourceRecordId:i===1?"different":x.sourceRecordId})),
      ...trio("2027-06-30").map(x=>({...x,source:"OTHER_SOURCE"}))]
    expect(buildResultsQuarterPeriods(bad,now)[0]?.label).toBe("Q1 FY27")
  })
  it("recognizes bank and insurance source-coherent quarterly trios",()=>{
    const bank=["NET_INTEREST_INCOME_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"].map(x=>fact("2026-12-31",x))
    expect(buildResultsQuarterPeriods(bank,now)[0]?.label).toBe("Q3 FY27")
    const insurance=["NET_PREMIUM_EARNED_QUARTER","NET_PROFIT_QUARTER","EPS_DILUTED"].map(x=>fact("2027-03-31",x))
    expect(buildResultsQuarterPeriods(insurance,now)[0]?.label).toBe("Q4 FY27")
  })
})
