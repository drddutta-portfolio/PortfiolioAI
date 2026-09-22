import { describe, expect, it } from "vitest"
import { resolveScoringProfile } from "./scoringProfileResolution"

describe("resolveScoringProfile", () => {
  it("aliases a reviewed legacy Pharma/Healthcare assignment to PHARMA_V1 for a canonical Pharma company", () => {
    expect(resolveScoringProfile("Pharma", "Pharmaceuticals", "PHARMA_HEALTHCARE")).toEqual({
      profileCode: "PHARMA_V1",
      ruleProfile: "PHARMA_V1",
      profileSource: "REVIEWED_ASSIGNMENT",
      methodologyState: "AVAILABLE",
      scoringExecutionState: "AVAILABLE",
      reasonCode: "REVIEWED_PHARMA_ASSIGNMENT",
      legacyAssignmentCode: "PHARMA_HEALTHCARE",
    })
  })

  it("automatically routes a new canonical Pharma holding to PHARMA_V1 without a manual assignment", () => {
    expect(resolveScoringProfile("Pharma", "Pharmaceuticals", null)).toEqual({
      profileCode: "PHARMA_V1",
      ruleProfile: "PHARMA_V1",
      profileSource: "SECTOR_RULE",
      methodologyState: "AVAILABLE",
      scoringExecutionState: "AVAILABLE",
      reasonCode: "SUPPORTED_ENGINE_ROUTED",
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
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: "METHODOLOGY_NOT_AVAILABLE",
      scoringExecutionState: "BLOCKED",
      reasonCode: "REGISTERED_PROFILE_METHODOLOGY_PENDING",
      legacyAssignmentCode: null,
    })
  })

  it("never activates BANK_NBFC from Banking sector alone", () => {
    expect(resolveScoringProfile("Banking", null, null)).toEqual({
      profileCode: null,
      ruleProfile: null,
      profileSource: "METHODOLOGY_UNAVAILABLE",
      methodologyState: "REVIEW_REQUIRED",
      scoringExecutionState: "BLOCKED",
      reasonCode: "BANKING_INDUSTRY_REQUIRED",
      legacyAssignmentCode: null,
    })
  })

  it("routes a completed K4 engine identity while preserving its separate read-only scoring authority", () => {
    expect(resolveScoringProfile("Information Technology", "IT Services", null)).toMatchObject({
      profileCode: "IT_TECH",
      ruleProfile: null,
      profileSource: "SECTOR_RULE",
      methodologyState: "AVAILABLE",
      scoringExecutionState: "PENDING_ADAPTER",
    })
  })

  it("preserves an explicit reviewed BANK_NBFC assignment", () => {
    expect(resolveScoringProfile("Banking", "Banks", "BANK_NBFC")).toMatchObject({
      profileCode: "BANK_NBFC",
      ruleProfile: "BANK_NBFC",
      profileSource: "REVIEWED_ASSIGNMENT",
    })
  })

  it("keeps reviewed K4 methodology identity but blocks GENERAL execution until its adapter is active", () => {
    expect(resolveScoringProfile("Information Technology", "IT Services", "IT_TECH")).toMatchObject({
      profileCode: "IT_TECH",
      ruleProfile: null,
      profileSource: "REVIEWED_ASSIGNMENT",
      methodologyState: "AVAILABLE",
      scoringExecutionState: "PENDING_ADAPTER",
    })
  })

  it("blocks routed and reviewed AUTO_COMPONENTS from GENERAL execution", () => {
    expect(resolveScoringProfile("Automobile and Auto Components", "Auto Components", null)).toMatchObject({
      profileCode: "AUTO_COMPONENTS", ruleProfile: null, methodologyState: "AVAILABLE", scoringExecutionState: "PENDING_ADAPTER",
    })
    expect(resolveScoringProfile("Automobile and Auto Components", "Auto Components", "AUTO_COMPONENTS")).toMatchObject({
      profileCode: "AUTO_COMPONENTS", ruleProfile: null, methodologyState: "AVAILABLE", scoringExecutionState: "PENDING_ADAPTER",
    })
  })

  it("preserves an explicitly canonical GENERAL assignment", () => {
    expect(resolveScoringProfile(null, null, "GENERAL")).toMatchObject({
      profileCode: "GENERAL", ruleProfile: "GENERAL", methodologyState: "AVAILABLE", scoringExecutionState: "AVAILABLE",
    })
  })

  it("distinguishes unsupported methodology from missing classification without selecting GENERAL", () => {
    expect(resolveScoringProfile("Telecommunication", "Telecom Services", null)).toMatchObject({
      profileCode: null,
      ruleProfile: null,
      methodologyState: "METHODOLOGY_NOT_AVAILABLE",
      profileSource: "METHODOLOGY_UNAVAILABLE",
    })
    expect(resolveScoringProfile(null, null, null)).toMatchObject({
      profileCode: null,
      ruleProfile: null,
      methodologyState: "REVIEW_REQUIRED",
      profileSource: "METHODOLOGY_UNAVAILABLE",
    })
  })
})
