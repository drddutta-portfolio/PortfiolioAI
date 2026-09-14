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

  it("routes Healthcare/Pharmaceuticals to the Pharma methodology without rewriting its application sector", () => {
    const resolved = resolveScoringProfile("Healthcare", "Pharmaceuticals", null)
    expect(resolved.profileCode).toBe("PHARMA_V1")
    expect(resolved.ruleProfile).toBe("PHARMA_V1")
  })

  it("does not force generic Healthcare into PHARMA_V1", () => {
    const resolved = resolveScoringProfile("Healthcare", "Hospitals", null)
    expect(resolved.profileCode).toBe("GENERAL")
    expect(resolved.ruleProfile).toBe("GENERAL")
  })

  it("preserves the BANK_NBFC reference pathway", () => {
    expect(resolveScoringProfile("Banking", "Banks", "BANK_NBFC")).toMatchObject({
      profileCode: "BANK_NBFC",
      ruleProfile: "BANK_NBFC",
      profileSource: "REVIEWED_ASSIGNMENT",
    })
  })

  it("keeps other reviewed legacy profiles on their existing GENERAL-rule behavior", () => {
    expect(resolveScoringProfile("Information Technology", "IT Services", "IT_TECH")).toMatchObject({
      profileCode: "IT_TECH",
      ruleProfile: "GENERAL",
      profileSource: "REVIEWED_ASSIGNMENT",
    })
  })
})
