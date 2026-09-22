import { describe, expect, it } from "vitest"
import { resolveScoringProfile } from "./scoringProfileResolution"

describe("resolveScoringProfile", () => {
  it("aliases a reviewed legacy Pharma/Healthcare assignment to PHARMA_V1 for a canonical Pharma company", () => {
    expect(resolveScoringProfile("Pharma", "Pharmaceuticals", "PHARMA_HEALTHCARE")).toEqual({
      profileCode: "PHARMA_V1",
      ruleProfile: "PHARMA_V1",
      profileSource: "REVIEWED_ASSIGNMENT",
      legacyAssignmentCode: "PHARMA_HEALTHCARE",
    })
  })

  it("automatically routes a new canonical Pharma holding to PHARMA_V1 without a manual assignment", () => {
    expect(resolveScoringProfile("Pharma", "Pharmaceuticals", null)).toEqual({
      profileCode: "PHARMA_V1",
      ruleProfile: "PHARMA_V1",
      profileSource: "SECTOR_RULE",
      legacyAssignmentCode: null,
    })
  })

  it("routes Healthcare/Pharmaceuticals to PHARMA_V1 without rewriting the application sector", () => {
    const resolved = resolveScoringProfile("Healthcare", "Pharmaceuticals", null)
    expect(resolved.profileCode).toBe("PHARMA_V1")
    expect(resolved.ruleProfile).toBe("PHARMA_V1")
  })

  it("routes Banking + Banks to BANK_NBFC without a symbol-specific assignment", () => {
    expect(resolveScoringProfile("Banking", "Banks", null)).toMatchObject({
      profileCode: "BANK_NBFC",
      ruleProfile: "BANK_NBFC",
      profileSource: "SECTOR_RULE",
    })
  })

  it("recognizes Financial Services + NBFC but fails scoring closed until NBFC methodology is approved", () => {
    expect(resolveScoringProfile("Financial Services", "NBFC", null)).toEqual({
      profileCode: "GENERAL",
      ruleProfile: "GENERAL",
      profileSource: "GENERAL_FALLBACK",
      legacyAssignmentCode: null,
    })
  })

  it("never activates BANK_NBFC from Banking sector alone", () => {
    expect(resolveScoringProfile("Banking", null, null)).toEqual({
      profileCode: "GENERAL",
      ruleProfile: "GENERAL",
      profileSource: "GENERAL_FALLBACK",
      legacyAssignmentCode: null,
    })
  })

  it("routes a completed K4 engine identity while preserving its separate read-only scoring authority", () => {
    expect(resolveScoringProfile("Information Technology", "IT Services", null)).toMatchObject({
      profileCode: "IT_TECH",
      ruleProfile: "GENERAL",
      profileSource: "SECTOR_RULE",
    })
  })

  it("preserves an explicit reviewed BANK_NBFC assignment", () => {
    expect(resolveScoringProfile("Banking", "Banks", "BANK_NBFC")).toMatchObject({
      profileCode: "BANK_NBFC",
      ruleProfile: "BANK_NBFC",
      profileSource: "REVIEWED_ASSIGNMENT",
    })
  })

  it("keeps other reviewed legacy profiles on their existing GENERAL-rule behavior until their K4 methodology is approved", () => {
    expect(resolveScoringProfile("Information Technology", "IT Services", "IT_TECH")).toMatchObject({
      profileCode: "IT_TECH",
      ruleProfile: "GENERAL",
      profileSource: "REVIEWED_ASSIGNMENT",
    })
  })
})
