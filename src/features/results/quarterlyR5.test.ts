import { describe, expect, it } from "vitest"
import { compareQuarterMetric, explainQuarterlyComparisons } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

function row(periodEnd: string, value: string, code = "OPERATING_REVENUE_QUARTER"): ResultsSourceObservation {
  const [year, month] = periodEnd.split("-").map(Number)
  const start = new Date(Date.UTC(year!, month! - 3, 1)).toISOString().slice(0, 10)
  return { id: periodEnd + code, securityId: "security-1", code, value,
    periodEnd, periodStart: start, unit: "INR_CRORE", currency: "INR",
    scope: "CONSOLIDATED", source: "COMPANY_EXCHANGE_FILING",
    sourceRecordId: periodEnd + "-issuer", publishedAt: null,
    retrievedAt: "2026-10-15T00:00:00Z", selected: true }
}
describe("Results R5 source-qualified period comparisons", () => {
  it("calculates exact QoQ and YoY with matching quarters and half-up rounding", () => {
    const rows = [row("2026-06-30", "120"), row("2026-03-31", "100"), row("2025-06-30", "80")]
    const result = compareQuarterMetric(rows, "security-1", "2026-06-30", "OPERATING_REVENUE_QUARTER")
    expect(result.qoq).toBe("20.00")
    expect(result.yoy).toBe("50.00")
  })
  it("does not use earlier observations unless canonical source selections exist", () => {
    const rows = [row("2026-06-30", "120"), {...row("2026-03-31", "100"), selected: false}]
    const result = compareQuarterMetric(rows, "security-1", "2026-06-30", "OPERATING_REVENUE_QUARTER")
    expect(result.qoq).toBeNull()
    expect(result.qoqLimitation).toMatch(/selection/)
  })
  it("rejects scope mixing and zero/negative baselines", () => {
    const current = row("2026-06-30", "120")
    expect(compareQuarterMetric([current, {...row("2026-03-31", "100"), scope: "STANDALONE"}], "security-1", "2026-06-30", current.code).qoq).toBeNull()
    expect(compareQuarterMetric([current, row("2026-03-31", "0")], "security-1", "2026-06-30", current.code).qoqLimitation).toMatch(/Zero/)
  })
  it("rejects period and metric substitutions, not just mismatched quarter ends", () => {
    const current = row("2026-06-30", "120")
    const bad = {...row("2026-03-31", "100"), periodStart: "2025-04-01"}
    expect(compareQuarterMetric([current, bad], "security-1", "2026-06-30", current.code).qoq).toBeNull()
    expect(compareQuarterMetric([current, row("2026-03-31", "100", "NET_PROFIT_QUARTER")], "security-1", "2026-06-30", current.code).qoq).toBeNull()
  })
  it("preserves split-affected EPS restrictions and avoids false thesis claims", () => {
    const eps = (end: string, value: string) => ({...row(end, value, "EPS_DILUTED"), unit: "INR_PER_SHARE"})
    const current = eps("2026-06-30", "12")
    const baseline = {...eps("2026-03-31", "10"), originalShareBasis: true}
    const result = compareQuarterMetric([current, baseline], "security-1", "2026-06-30", "EPS_DILUTED")
    expect(result.qoq).toBeNull()
    expect(result.qoqLimitation).toMatch(/Split-affected/)
    expect(explainQuarterlyComparisons([result], false).at(-1)).toContain("Not assessed")
  })
  it("does not treat another stock, duplicate selected metric or an unavailable same-year quarter as a valid comparison", () => {
    const june=row("2026-06-30","150")
    const march=row("2026-03-31","100")
    const prior=row("2025-06-30","75")
    const other={...march,securityId:"another-stock"}
    expect(compareQuarterMetric([june,other,prior],"security-1",june.periodEnd,june.code).qoq).toBeNull()
    expect(compareQuarterMetric([june,march,{...march,id:"duplicate-filing"}],"security-1",june.periodEnd,june.code).qoq).toBeNull()
    const y=compareQuarterMetric([june,march,prior],"security-1",june.periodEnd,june.code)
    expect(y.qoq).toBe("50.00")
    expect(y.yoy).toBe("100.00")
    expect(compareQuarterMetric([june,march],"security-1",june.periodEnd,june.code).yoy).toBeNull()
  })
  it("uses exact quarterly date boundaries for the four approved reporting periods", () => {
    const ends=["2025-09-30","2025-12-31","2026-03-31","2026-06-30"]
    const values=["100","110","121","133.1"]
    const rows=ends.map((end,i)=>row(end,values[i]!))
    expect(compareQuarterMetric(rows,"security-1","2025-09-30",rows[0]!.code).qoq).toBeNull()
    expect(compareQuarterMetric(rows,"security-1","2025-12-31",rows[0]!.code).qoq).toBe("10.00")
    expect(compareQuarterMetric(rows,"security-1","2026-03-31",rows[0]!.code).qoq).toBe("10.00")
    expect(compareQuarterMetric(rows,"security-1","2026-06-30",rows[0]!.code).qoq).toBe("10.00")
    expect(compareQuarterMetric(rows,"security-1","2026-06-31",rows[0]!.code).current).toBeNull()
    expect(rows.map(r=>r.selected)).toEqual([true,true,true,true])
  })
  it("fails closed for cross-currency, mistyped units, original-share EPS or absent original record lineage", () => {
    const present=row("2026-06-30","100")
    const prior=row("2026-03-31","80")
    for(const invalid of [
      {...prior,currency:"USD"},
      {...prior,unit:"INR"},
      {...prior,sourceRecordId:null},
      {...prior,source:"PROVIDER_ESTIMATE"},
      {...prior,periodStart:"2026-01-02"},
      {...prior,selected:false},
    ]) {
      expect(compareQuarterMetric([present,invalid],"security-1",present.periodEnd,present.code).qoq).toBeNull()
    }
    const eps=(date:string,value:string)=>({...row(date,value,"EPS_DILUTED"),unit:"INR_PER_SHARE"})
    expect(compareQuarterMetric([eps("2026-06-30","20"),{...eps("2026-03-31","10"),originalShareBasis:true}],
      "security-1","2026-06-30","EPS_DILUTED").qoq).toBeNull()
  })
  it("does not fabricate percentage growth from negative profit, but permits measured decline from positive baselines",()=>{
    const loss=row("2026-06-30","-10","NET_PROFIT_QUARTER")
    const positive=row("2026-03-31","20","NET_PROFIT_QUARTER")
    const decline=compareQuarterMetric([loss,positive],"security-1","2026-06-30","NET_PROFIT_QUARTER")
    expect(decline.qoq).toBe("-150.00")
    expect(compareQuarterMetric([positive,{...loss,periodEnd:"2025-12-31",periodStart:"2025-10-01"}],
      "security-1","2026-03-31","NET_PROFIT_QUARTER").qoq).toBeNull()
  })
  it("narrates bank NII and PAT only when source-selected, avoiding invented YoY and thesis implications",()=>{
    const nii="NET_INTEREST_INCOME_QUARTER"
    const pat="NET_PROFIT_QUARTER"
    const source=[
      row("2026-06-30","110",nii),row("2026-03-31","100",nii),
      row("2026-06-30","23",pat),row("2026-03-31","20",pat),
    ]
    const items=[compareQuarterMetric(source,"security-1","2026-06-30",nii),
      compareQuarterMetric(source,"security-1","2026-06-30",pat)]
    const phrases=explainQuarterlyComparisons(items,true).join(" ")
    expect(phrases).toContain("Net interest income increased by 10.00% QoQ")
    expect(phrases).toContain("Profit after tax increased by 15.00% QoQ")
    expect(phrases).toContain("no YoY performance conclusion")
    expect(phrases).toContain("No investment recommendation")
  })

})
