import { describe, expect, it } from "vitest"
import { NEW_RESULT_DURATION_MS, newlyReportedQuarterKeys } from "./resultsNewlyReported"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

const now = Date.parse("2026-11-07T17:00:00.000Z")
const admitted = new Date(now - NEW_RESULT_DURATION_MS + 60_000).toISOString()

function metric(code: string, overrides: Partial<ResultsSourceObservation> = {}): ResultsSourceObservation {
  return {
    id: code,securityId:"titan",code,value:"1",periodEnd:"2026-09-30",
    sourceRecordId:"official-filing-1",scope:"CONSOLIDATED",
    source:"COMPANY_EXCHANGE_FILING",selected:true,currency:"INR",
    unit:code==="EPS_DILUTED"?"INR_PER_SHARE":"INR_CRORE",
    retrievedAt:new Date(now).toISOString(),createdAt:admitted,
    publishedAt:null,...overrides,
  }
}
const trio=()=>[
  metric("OPERATING_REVENUE_QUARTER"),
  metric("NET_PROFIT_QUARTER"),
  metric("EPS_DILUTED"),
]

describe("one-week newly reported original quarterly results",()=>{
  it("shows an actually source-qualified financial trio for seven days then expires on the boundary",()=>{
    const data=trio()
    expect(newlyReportedQuarterKeys(data,now).has("titan|2026-09-30")).toBe(true)
    expect(newlyReportedQuarterKeys(data,now+60_000).size).toBe(0)
  })
  it("does not restart the seven-day clock when the same data is fetched again",()=>{
    const data=trio().map(row=>({...row,retrievedAt:new Date(now+24*60*60_000).toISOString()}))
    expect(newlyReportedQuarterKeys(data,now+60_000).size).toBe(0)
  })
  it("ignores a single metric, partial trios, unselected sources and mixed-original trios",()=>{
    expect(newlyReportedQuarterKeys([metric("OPERATING_REVENUE_QUARTER")],now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().slice(0,2),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map(x=>({...x,selected:false})),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map((x,i)=>i===1?{...x,sourceRecordId:"other"}:x),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map((x,i)=>i===1?{...x,scope:"STANDALONE"}:x),now).size).toBe(0)
  })
  it("does not label an old historical backfill or a future quarter as newly reported",()=>{
    expect(newlyReportedQuarterKeys(trio().map(x=>({...x,periodEnd:"2025-09-30"})),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map(x=>({...x,periodEnd:"2026-12-31"})),now).size).toBe(0)
  })
  it("requires valid original identity, currency, units, insertion time and confirmed selection",()=>{
    expect(newlyReportedQuarterKeys(trio().map((x,i)=>i===1?{...x,unit:"UNKNOWN"}:x),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map((x,i)=>i===1?{...x,createdAt:null}:x),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map(x=>({...x,source:"OTHER"})),now).size).toBe(0)
    expect(newlyReportedQuarterKeys(trio().map((x,i)=>i===1?{...x,currency:"USD"}:x),now).size).toBe(0)
  })
  it("works for bank NII and insurer net-premium trios",()=>{
    for(const code of ["NET_INTEREST_INCOME_QUARTER","NET_PREMIUM_EARNED_QUARTER"]){
      const [top,...rest]=trio()
      const data=[{...top!,code},...rest]
      expect(newlyReportedQuarterKeys(data,now).size).toBe(1)
    }
  })
})
