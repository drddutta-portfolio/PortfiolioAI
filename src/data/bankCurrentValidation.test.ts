import { beforeEach, describe, expect, it, vi } from "vitest"
import { validateEffectiveBankReadOnly } from "./bankCurrentValidation"
const invoke=vi.hoisted(()=>vi.fn())
vi.mock("./bankingValidationRepository",()=>({invokeBankingReadOnlyValidation:invoke}))
const portfolio="6193a4aa-3235-4057-bddc-209fcf443fc2"
const security="6771f493-c29a-477e-8cc8-2bede0941e44"
const cutoff="2026-10-09T12:00:00.000Z"
function sample():Record<string,unknown> {
 return {status:"IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY",dryRun:true,processed:1,providerCalls:0,
  snapshotIds:[],selectionIds:[],writeTotals:{snapshotsCreated:0,snapshotsReused:0,selectionsCreated:0,selectionsReused:0},
  results:[{securityId:security,status:"REVIEW_REQUIRED",snapshotHash:"a".repeat(64),items:[{requirement_code:"ROE_ANNUAL",evidence_state:"REVIEW_REQUIRED",reason_code:"REPORTING_PERIOD_TYPE_NOT_PROVEN"}]}]}
}
beforeEach(()=>invoke.mockReset())
describe("owner-session one-bank canonical current validation",()=>{
 it("sends only exact read-only action, identity and current cutoff",async()=>{
  invoke.mockResolvedValue(sample())
  const result=await validateEffectiveBankReadOnly(portfolio,security,cutoff)
  expect(result.status).toBe("REVIEW_REQUIRED")
  expect(invoke).toHaveBeenCalledWith(expect.objectContaining({
   action:"P7_IC3_VALIDATE_CANONICAL_INPUTS",portfolioId:portfolio,securityIds:[security],
   evaluationAsOf:cutoff,sourceCutoffAt:cutoff,
  }))
  expect((invoke.mock.calls[0]?.[0] as { selectionRunId:string }).selectionRunId).toMatch(/^[\da-f-]{36}$/i)
 })
 it("fails closed on missing or nonzero write proof",async()=>{
  for(const bad of [{...sample(),writeTotals:{}},{...sample(),providerCalls:1},{...sample(),selectionIds:["unapproved"]}]){
   invoke.mockResolvedValueOnce(bad)
   await expect(validateEffectiveBankReadOnly(portfolio,security,cutoff)).rejects.toThrow()
  }
 })
 it("rejects missing, duplicate or mismatched per-bank requirements",async()=>{
  for(const bad of [
   {...sample(),results:[]},
   {...sample(),results:[{...((sample().results as Record<string,unknown>[])[0]),securityId:portfolio}]},
   {...sample(),results:[{...((sample().results as Record<string,unknown>[])[0]),items:[]}]},
  ]) {invoke.mockResolvedValueOnce(bad);await expect(validateEffectiveBankReadOnly(portfolio,security,cutoff)).rejects.toThrow()}
 })
 it("never issues a call for invalid security or portfolio IDs",async()=>{
  await expect(validateEffectiveBankReadOnly("not-a-uuid",security,cutoff)).rejects.toThrow("SCOPE_INVALID")
  await expect(validateEffectiveBankReadOnly(portfolio,"not-a-uuid",cutoff)).rejects.toThrow("SCOPE_INVALID")
  expect(invoke).not.toHaveBeenCalled()
 })
})
