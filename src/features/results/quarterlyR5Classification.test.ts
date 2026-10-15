import { describe, expect, it } from "vitest"
import { gradeQuarterR5, RESULTS_GRADING_VERSION } from "./quarterlyR5Classification"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

function fact(end:string, code:string, value:string, scope="CONSOLIDATED"):ResultsSourceObservation {
  const [year,month] = end.split("-").map(Number)
  return { id:end+code, securityId:"s1", code, value, unit:code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE",
    periodEnd:end, periodStart:new Date(Date.UTC(year!,month!-3,1)).toISOString().slice(0,10),
    currency:"INR",scope,source:"COMPANY_EXCHANGE_FILING",
    sourceRecordId:end+"-issuer",publishedAt:null,retrievedAt:"2026-10-15T00:00:00Z",selected:true }
}
function history(topCode:string, currentTop:string, oldTop:string, currentPat:string, oldPat:string) {
  return [
    fact("2026-06-30",topCode,currentTop),
    fact("2026-03-31",topCode,oldTop),
    fact("2026-06-30","NET_PROFIT_QUARTER",currentPat),
    fact("2026-03-31","NET_PROFIT_QUARTER",oldPat),
  ]
}
describe("R5 calibrated current-display quarterly operating signals", () => {
  it("returns Strong when IT sales and PAT exceed calibrated upper-quartile growth",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","114","100","125","100")
    const a=gradeQuarterR5(rows,"s1","2026-06-30","Information Technology","Computers - Software & Consulting")
    expect(a.status).toBe("STRONG")
    expect(a.policyVersion).toBe(RESULTS_GRADING_VERSION)
  })
  it("scores banks on NII and PAT rather than industrial revenue",()=>{
    const rows=history("NET_INTEREST_INCOME_QUARTER","110","100","125","100")
    expect(gradeQuarterR5(rows,"s1","2026-06-30","Banking","Private Sector Bank").status).toBe("STRONG")
    expect(gradeQuarterR5(rows,"s1","2026-06-30","Pharma","Pharmaceuticals").status).toBe("UNAVAILABLE")
  })
  it("requires a known calibrated sector and matching original selected sources",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","130","100","145","100")
    expect(gradeQuarterR5(rows,"s1","2026-06-30",null,null).status).toBe("UNAVAILABLE")
    expect(gradeQuarterR5(rows,"s1","2026-06-30","Pharma","Pharmaceuticals").status).toBe("STRONG")
    expect(gradeQuarterR5([...rows.slice(0,2), {...rows[2]!,sourceRecordId:"a-different-issuer"}, rows[3]!],"s1","2026-06-30","Pharma","Pharmaceuticals").status).toBe("UNAVAILABLE")
  })
  it("labels material profit weakness without suggesting an investment sale",()=>{
    const rows=history("OPERATING_REVENUE_QUARTER","75","100","-3","100")
    const a=gradeQuarterR5(rows,"s1","2026-06-30","Information Technology","Software")
    expect(a.status).toBe("WEAK")
    expect(a.explanation).toContain("No YoY conclusion")
  })
  it("declines bank grade from unselected or unrelated activity data",()=>{
    const rows=history("NET_INTEREST_INCOME_QUARTER","110","100","125","100")
    const a=gradeQuarterR5(rows.map((x,i)=>i===3?{...x,selected:false}:x),"s1","2026-06-30","Banking","Banks")
    expect(a.status).toBe("UNAVAILABLE")
  })
})
