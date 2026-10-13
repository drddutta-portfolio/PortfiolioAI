import { describe, expect, it } from "vitest"
import { bankCurrentDisplayVeto, type SelectedBankRequirement } from "./bankCurrentDisplayVeto"
const at = Date.parse("2026-10-09T18:00:00Z")
const row = (fresh_through: string | null, evidence_state="FRESH"): SelectedBankRequirement => ({
 requirement_code:"RELATIVE_STRENGTH_12M",required:true,applicability:"APPLICABLE",evidence_state,fresh_through,
})
describe("BANK selected-snapshot clock-based display veto", () => {
 it("blocks expired stock proof even when nothing new was fetched", () => {
  const v=bankCurrentDisplayVeto([row("2026-10-09T17:59:59Z")],at)
  expect(v.veto).toBe(true)
  expect(v.reasons).toContain("RELATIVE_STRENGTH_12M: FRESHNESS_EXPIRED")
 })
 it("blocks at the exact deadline without extending source freshness",()=>{
  expect(bankCurrentDisplayVeto([row("2026-10-09T18:00:00Z")],at).reasons).toContain("RELATIVE_STRENGTH_12M: FRESHNESS_EXPIRED")
 })
 it("blocks unknown or date-only policy deadlines instead of assigning a timezone",()=>{
  expect(bankCurrentDisplayVeto([row("2026-10-10")],at).reasons).toContain("RELATIVE_STRENGTH_12M: FRESHNESS_CUTOFF_UNVERIFIED")
  expect(bankCurrentDisplayVeto([row(null)],at).reasons).toContain("RELATIVE_STRENGTH_12M: FRESHNESS_CUTOFF_UNVERIFIED")
 })
 it("still requires live canonical revalidation when all stored items are FRESH",()=>{
  expect(bankCurrentDisplayVeto([row("2026-10-10T18:00:00Z")],at).reasons).toContain("CURRENT_CANONICAL_REVALIDATION_REQUIRED")
 })
 it("never calls an empty historical snapshot current READY",()=>{
  expect(bankCurrentDisplayVeto([],at).reasons).toContain("REQUIREMENT_SET_MISSING")
 })
 it("preserves canonical applicable/required filtering and reports known conflicts",()=>{
  const v=bankCurrentDisplayVeto([row("2026-10-11T00:00:00Z","CONFLICTING"),{...row(null),required:false}],at)
  expect(v.reasons).toEqual(["RELATIVE_STRENGTH_12M: CONFLICTING"])
 })
})
