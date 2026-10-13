import {describe,it,expect} from "vitest"
import {bankResearchExecutorQualified,bankResearchGrantExternalId,BANK_RESEARCH_TARGETS} from "./v14-bank-approved-research-executor.ts"
const claims={repository:"drddutta-portfolio/PortfiolioAI",repository_id:"1357024254",ref:"refs/heads/codex/banking-source-remediation",environment:"PortfolioAI-Development",sub:"repo:drddutta-portfolio@324877535/PortfiolioAI@1357024254:environment:PortfolioAI-Development",workflow_ref:"drddutta-portfolio/PortfiolioAI/.github/workflows/banking-v14-authorized-research.yml@refs/heads/codex/banking-source-remediation",event_name:"push",sha:"9bf5e6240b9b2195b6b71fec6777b5f64cb55511"}
describe("owner-authorized signed banking source-acquisition scope",()=>{
 it("accepts the exact signed Development repository workflow only",()=>{
  expect(bankResearchExecutorQualified(claims)).toBe(true)
  for(const patch of [{repository_id:"other"},{ref:"refs/heads/main"},{environment:"Production"},{workflow_ref:"other"},{event_name:"pull_request"},{sub:"repo:attacker:environment:PortfolioAI-Development"},{sha:"invalid"}])expect(bankResearchExecutorQualified({...claims,...patch})).toBe(false)
 })
 it("bounds issuance to five stable date/scope identities across separate workflow runs",()=>{
  expect(BANK_RESEARCH_TARGETS).toHaveLength(5)
  const ids=BANK_RESEARCH_TARGETS.map(t=>bankResearchGrantExternalId("2026-10-12",t))
  expect(new Set(ids).size).toBe(5)
  expect(bankResearchGrantExternalId("2026-10-12",BANK_RESEARCH_TARGETS[0])).toBe(ids[0])
  expect(bankResearchGrantExternalId("2026-10-13",BANK_RESEARCH_TARGETS[0])).not.toBe(ids[0])
 })
 it("cannot issue an owner review, materialization, maintenance or out-of-scope grant",()=>{
  for(const action of ["P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS","V1_4_BANK_MAINTENANCE_DAILY_V1","OWNER_NUMERIC_REVIEW"])
   expect(()=>bankResearchGrantExternalId("2026-10-12",{action,sliceId:"BANK-P1-01",scope:BANK_RESEARCH_TARGETS[0].scope})).toThrow("RESEARCH_SCOPE_INVALID")
  expect(()=>bankResearchGrantExternalId("2026-10-12",{...BANK_RESEARCH_TARGETS[0],scope:"other portfolio"})).toThrow()
 })
})
