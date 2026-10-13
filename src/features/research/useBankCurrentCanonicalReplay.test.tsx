// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ validate:vi.fn(), getProject:vi.fn() }))
vi.mock("../../data/bankCurrentValidation",()=>({validateEffectiveBankReadOnly:mocks.validate}))
vi.mock("../../lib/environment",()=>({getSupabaseProjectRef:mocks.getProject,DEVELOPMENT_SUPABASE_PROJECT_REF:"lrgpjimipfkyoqbpsqzz"}))
vi.mock("../../lib/config",()=>({publicConfig:{supabaseUrl:"https://lrgpjimipfkyoqbpsqzz.supabase.co"}}))
import { useBankCurrentCanonicalReplay } from "./useBankCurrentCanonicalReplay"

const portfolio="6193a4aa-3235-4057-bddc-209fcf443fc2"
const bank="6771f493-c29a-477e-8cc8-2bede0941e44"
beforeEach(()=>{mocks.validate.mockReset();mocks.getProject.mockReturnValue("lrgpjimipfkyoqbpsqzz");mocks.validate.mockResolvedValue({securityId:bank,status:"REVIEW_REQUIRED",items:[{requirement_code:"ROE_ANNUAL",evidence_state:"REVIEW_REQUIRED",reason_code:"REPORTING_PERIOD_TYPE_NOT_PROVEN"}],evaluationAsOf:"2026-10-09T12:00:00.000Z"})})
afterEach(cleanup)
describe("Development-only live bank recheck scheduling",()=>{
 it("runs one authenticated read-only evaluation on load and again only when expiry phase changes",async()=>{
  const {rerender,result}=renderHook(({phase})=>useBankCurrentCanonicalReplay(portfolio,bank,true,phase,true),{initialProps:{phase:"snapshot:BASELINE"}})
  await waitFor(()=>expect(result.current.status).toBe("completed"))
  expect(mocks.validate).toHaveBeenCalledTimes(1)
  rerender({phase:"snapshot:BASELINE"})
  expect(mocks.validate).toHaveBeenCalledTimes(1)
  rerender({phase:"snapshot:EXPIRED"})
  await waitFor(()=>expect(mocks.validate).toHaveBeenCalledTimes(2))
 })
 it("never invokes validation on a Production Supabase connection",()=>{
  mocks.getProject.mockReturnValue("uxiyufbsbgzzdujzcdxe")
  const {result}=renderHook(()=>useBankCurrentCanonicalReplay(portfolio,bank,true,"snapshot:EXPIRED",true))
  expect(result.current.status).toBe("unavailable")
  expect(mocks.validate).not.toHaveBeenCalled()
 })
 it("rejects nonbank identities and compact/disabled research surfaces",()=>{
  renderHook(()=>useBankCurrentCanonicalReplay(portfolio,portfolio,true,"snapshot:EXPIRED",true))
  renderHook(()=>useBankCurrentCanonicalReplay(portfolio,bank,false,"snapshot:EXPIRED",true))
  renderHook(()=>useBankCurrentCanonicalReplay(portfolio,bank,true,"snapshot:EXPIRED",false))
  expect(mocks.validate).not.toHaveBeenCalled()
 })
})
