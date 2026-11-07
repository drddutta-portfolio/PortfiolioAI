import { describe, expect, it, vi } from "vitest"
import { matchesResultsQuarterFilters } from "./resultsQuarterFilter"
import type { ResultsGradeFilter } from "./resultsQuarterFilter"

const quarters = ["2026-09-30","2026-06-30","2026-03-31"]
const newlyReported = new Map([["alpha|2026-09-30", Date.parse("2026-11-07T12:00:00Z")]])
const statuses: Record<string,ResultsGradeFilter> = {
  "2026-09-30":"UNAVAILABLE",
  "2026-06-30":"STRONG",
  "2026-03-31":"WEAK",
}
function test(
  grades: ResultsGradeFilter[], onlyNew: boolean,
  params: {securityId?: string; changed?: Record<string,ResultsGradeFilter>; dates?: string[]}={},
) {
  const getter=vi.fn((end: string):ResultsGradeFilter => params.changed?.[end] ?? statuses[end] ?? "UNAVAILABLE")
  const matches=matchesResultsQuarterFilters({
    securityId:params.securityId??"alpha",quarterEnds:params.dates??quarters,
    selectedGrades:new Set(grades),onlyNew,newlyReported,gradeForQuarter:getter,
  })
  return {matches,getter}
}
describe("Results stock-row filter algebra",()=>{
  it("does not require a grade when no grade or Blue filters are chosen",()=>{
    const result=test([],false)
    expect(result.matches).toBe(true)
    expect(result.getter).not.toHaveBeenCalled()
  })
  it("Blue alone selects seven-day original results only, not all stock rows",()=>{
    expect(test([],true).matches).toBe(true)
    expect(test([],true,{securityId:"other"}).matches).toBe(false)
  })
  it("without Blue, grades match only the newest column, not any older quarter",()=>{
    expect(test(["STRONG"],false).matches).toBe(false)
    expect(test(["WEAK"],false).matches).toBe(false)
    expect(test(["UNAVAILABLE"],false).matches).toBe(true)
  })
  it("Green + Red + Grey is OR within the newest quarter",()=>{
    expect(test(["STRONG","WEAK"],false).matches).toBe(false)
    expect(test(["STRONG","WEAK","UNAVAILABLE"],false).matches).toBe(true)
    expect(test(["STRONG","WEAK"],false,{changed:{"2026-09-30":"WEAK"}}).matches).toBe(true)
    expect(test(["STRONG","WEAK"],false,{changed:{"2026-09-30":"STRONG"}}).matches).toBe(true)
  })
  it("Blue AND Green only matches the grade of the Blue quarter, never historic Green",()=>{
    expect(test(["STRONG"],true).matches).toBe(false)
    expect(test(["WEAK"],true).matches).toBe(false)
    expect(test(["UNAVAILABLE"],true).matches).toBe(true)
    expect(test(["STRONG","WEAK"],true).matches).toBe(false)
    expect(test(["STRONG","WEAK","UNAVAILABLE"],true).matches).toBe(true)
  })
  it("Blue AND OR-grade combinations work for all four grade colors",()=>{
    for(const grade of ["STRONG","MIXED","WEAK","UNAVAILABLE"] as const){
      expect(test([grade],true,{changed:{"2026-09-30":grade}}).matches).toBe(true)
    }
    expect(test(["STRONG","WEAK"],true,{changed:{"2026-09-30":"MIXED"}}).matches).toBe(false)
  })
  it("empty quarters and stocks with no Blue are excluded even if some historical grades match",()=>{
    expect(test(["UNAVAILABLE"],false,{dates:[]}).matches).toBe(false)
    expect(test(["UNAVAILABLE"],true,{securityId:"other"}).matches).toBe(false)
    expect(test(["STRONG"],true,{dates:["2026-06-30"]}).matches).toBe(false)
  })
  it("Blue will match an older new quarter when that exact quarter's grade qualifies",()=>{
    const getter=vi.fn((end:string):ResultsGradeFilter => end==="2026-06-30"?"WEAK":"STRONG")
    const match=matchesResultsQuarterFilters({
      securityId:"alpha",quarterEnds:quarters,
      selectedGrades:new Set<ResultsGradeFilter>(["WEAK"]),onlyNew:true,
      newlyReported:new Map([["alpha|2026-06-30",100]]),gradeForQuarter:getter,
    })
    expect(match).toBe(true)
    expect(getter).toHaveBeenCalledWith("2026-06-30")
    expect(getter).not.toHaveBeenCalledWith("2026-09-30")
  })
});
