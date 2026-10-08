import {describe,expect,it} from "vitest"
import {parseTrendlyneOwnershipHistory,validateV14SelectedOwnership,V14_OWNERSHIP_METHOD_VERSION} from "./p7-ic-evidence-normalization"

function capture(section:string,rows:readonly (readonly [string,string])[]) {
 return "chartData:\n  "+section+":\n    [\"Quarter\",\"Holding\"], "+rows.map(([q,v])=>'["'+q+'",'+v+']').join(", ")+"\ninsights:"
}
const good:readonly (readonly [string,string])[]=[["Mar 2025","0"],["Jun 2025","49.123456"],["Sep 2025","50"],["Dec 2025","100"]]
describe("V1-4 ownership methodology fail-closed canonical guard",()=>{
 it("applies promoter selection and retains decimal source strings",()=>{
  const raw=parseTrendlyneOwnershipHistory(capture("Promoter",good))
  expect(raw.series.Promoter[1].exactValue).toBe("49.123456")
  expect(validateV14SelectedOwnership({requirementCode:"OWNERSHIP_TREND_4Q",history:raw})).toMatchObject({
   contractVersion:V14_OWNERSHIP_METHOD_VERSION,series:"Promoter",reason:"OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN",
   eligibleForCanonicalPersistence:false
  })
 })
 it("applies institutional selection, not FII or a component sum",()=>{
  const raw=parseTrendlyneOwnershipHistory(capture("FII",good))
  expect(validateV14SelectedOwnership({requirementCode:"INSTITUTIONAL_OWNERSHIP_TREND_4Q",history:raw}).reason).toBe("OWNERSHIP_SERIES_MISSING")
  const inst=parseTrendlyneOwnershipHistory(capture("Institutional",good))
  expect(validateV14SelectedOwnership({requirementCode:"INSTITUTIONAL_OWNERSHIP_TREND_4Q",history:inst}).reason).toBe("OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN")
 })
 it("rejects missing middle quarters, duplicates and invalid numeric range",()=>{
  const failures:readonly (readonly (readonly [string,string])[])[]=[
   [["Mar 2025","12"],["Jun 2025","13"],["Dec 2025","14"],["Mar 2026","15"]],
   [["Mar 2025","12"],["Jun 2025","13"],["Jun 2025","14"],["Sep 2025","15"]],
   [["Mar 2025","12"],["Jun 2025","13"],["Sep 2025","14"],["Dec 2025","101"]],
   [["Mar 2025","12"],["Jun 2025","13"],["Sep 2025","14"],["Dec 2025","-1"]]
  ]
  for(const rows of failures){
   const raw=parseTrendlyneOwnershipHistory(capture("Promoter",rows))
   expect(validateV14SelectedOwnership({requirementCode:"OWNERSHIP_TREND_4Q",history:raw}).reason).toBe("OWNERSHIP_QUARTERS_INVALID")
  }
 })
 it("requires independent governance documents even with four valid promoter quarters",()=>{
  const raw=parseTrendlyneOwnershipHistory(capture("Promoter",good))
  expect(validateV14SelectedOwnership({requirementCode:"OWNERSHIP_GOVERNANCE",history:raw})).toMatchObject({
   series:null,reason:"OWNERSHIP_GOVERNANCE_DOCUMENT_REVIEW_REQUIRED",eligibleForCanonicalPersistence:false
  })
 })

 it("reprojects retained original ownership text when cached chart history is absent",()=>{
  const original=[
   "summaryData:",
   "chartData:",
   '  Promoter:',
   '    ["Quarter","Promoter Holding (%)"], ["Mar 2025",45.1], ["Jun 2025",45.2], ["Sep 2025",45.3], ["Dec 2025",45.4]',
   '  Institutional:',
   '    ["Quarter","Holding (%)"], ["Mar 2025",20.1], ["Jun 2025",20.2], ["Sep 2025",20.3], ["Dec 2025",20.4]',
   "insights:"
  ].join("\n")
  const parsed=parseTrendlyneOwnershipHistory(original)
  expect(parsed.series.Promoter).toHaveLength(4)
  expect(parsed.series.Institutional).toHaveLength(4)
  expect(validateV14SelectedOwnership({requirementCode:"OWNERSHIP_TREND_4Q",history:parsed}).reason).toBe("OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN")
  expect(validateV14SelectedOwnership({requirementCode:"INSTITUTIONAL_OWNERSHIP_TREND_4Q",history:parsed}).reason).toBe("OWNERSHIP_SOURCE_SEMANTICS_NOT_PROVEN")
 })
})
