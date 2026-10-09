import { describe, expect, it } from "vitest"
import source from "./v14-reviewed-evidence.ts?raw"

/** Integration regression: the canonical reviewer, not UI or metadata preflight,
 * must enforce direct M1-M4 source proof after original source-binding checks. */
describe("M1-M4 binding inside canonical reviewed-evidence owner",()=>{
 it("retains source hash, quoted fragment and exact financial-period/value binding before semantics",()=>{
  expect(source).toContain("REVIEW_SOURCE_HASH_OR_RECORD_INVALID")
  expect(source).toContain("REVIEW_QUOTE_NOT_BOUND_TO_SOURCE")
  expect(source).toContain("const binding=sourceBinding(r,source)")
  expect(source).toContain("NUMERIC_SOURCE_VALUE_MISMATCH")
  expect(source.indexOf("const binding=sourceBinding(r,source)")).toBeLessThan(source.indexOf("BANK_DIRECT_TTM_NIM_SOURCE_PROOF_MISSING"))
 })
 it("does not accept annual NIM or substitute Tier 1 and Basel II for capital proofs",()=>{
  expect(source).toContain('r.period_type!=="TRAILING_FOUR_QUARTERS"')
  expect(source).toContain("BANK_DIRECT_TTM_NIM_SOURCE_PROOF_MISSING")
  expect(source).toContain("BANK_DIRECT_BASEL_III_SOURCE_PROOF_MISSING")
  expect(source).toContain("BANK_CET1_NOT_EXPLICITLY_SOURCED")
  expect(source).toContain("BANK_TOTAL_CAR_NOT_EXPLICITLY_SOURCED")
 })
 it("requires full year and average assets for direct ROA",()=>{
  expect(source).toContain('r.period_type!=="YEAR"')
  expect(source).toContain("BANK_DIRECT_FULL_YEAR_ROA_SOURCE_PROOF_MISSING")
  expect(source).toContain("average (total )?assets")
 })
 it("never gates historical NPA or invents M5-M7",()=>{
  expect(source).not.toContain('["GROSS_NPA","NET_NPA","NIM_TTM"')
  expect(source).not.toContain('"PB_ADJUSTED_FOR_ROE","PB_RELATIVE","PE_TTM_RELATIVE"].includes(requirementCode)')
 })
})
