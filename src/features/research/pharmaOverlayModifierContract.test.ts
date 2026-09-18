import { describe, expect, it } from "vitest"
import {
  buildPharmaOverlayModifierProposal,
  getPharmaOverlayEligibleDimensions,
  PHARMA_OVERLAY_MODIFIER_CONTRACT,
} from "./pharmaOverlayModifierContract"

describe("PHARMA overlay modifier contract", () => {
  it("remains proposal-only and does not invent a numeric formula or cap", () => {
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.modifierFormulaState).toBe("UNAPPROVED")
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.combinedPerDimensionCapRequired).toBe(true)
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.combinedPerDimensionCapValue).toBeNull()
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.independentOverlayCapStackingAllowed).toBe(false)
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.secondStockScoreAllowed).toBe(false)
    expect(PHARMA_OVERLAY_MODIFIER_CONTRACT.scoreExecutionEnabled).toBe(false)
  })

  it("derives overlay-eligible dimensions from the versioned subprofile evidence contract", () => {
    expect(getPharmaOverlayEligibleDimensions("GLOBAL_GENERICS")).toEqual([
      "BUSINESS_DURABILITY",
      "GROWTH",
      "RISK",
    ])
  })

  it("keeps Emerging Watch completely outside numeric participation", () => {
    const result = buildPharmaOverlayModifierProposal({
      overlayCode: "CDMO_CRAMS",
      overlayRole: "EMERGING_WATCH",
      dimensionCode: "GROWTH",
      economicMaterialityPercent: 12,
      evidenceCompleteness: 1,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: 0.8,
      contradictionState: "NONE",
    })
    expect(result.modifierState).toBe("EXCLUDED_EMERGING_WATCH")
    expect(result.numericModifier).toBeNull()
  })

  it("does not allow an overlay to modify a dimension outside its evidence contract", () => {
    const result = buildPharmaOverlayModifierProposal({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "MOMENTUM",
      economicMaterialityPercent: 25,
      evidenceCompleteness: 1,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: 0.6,
      contradictionState: "NONE",
    })
    expect(result.modifierState).toBe("NOT_ELIGIBLE_DIMENSION")
    expect(result.reasonCodes).toContain("DIMENSION_NOT_TOUCHED_BY_OVERLAY_CONTRACT")
  })

  it("fails closed when a material overlay lacks required evidence inputs", () => {
    const result = buildPharmaOverlayModifierProposal({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "GROWTH",
      economicMaterialityPercent: 25,
      evidenceCompleteness: null,
      evidenceConfidence: null,
      normalizedOverlaySignal: null,
      contradictionState: "NONE",
    })
    expect(result.modifierState).toBe("PARTIAL_EVIDENCE")
    expect(result.reasonCodes).toEqual([
      "MISSING_EVIDENCE_COMPLETENESS",
      "MISSING_EVIDENCE_CONFIDENCE",
      "MISSING_NORMALIZED_OVERLAY_SIGNAL",
    ])
    expect(result.numericModifier).toBeNull()
  })

  it("requires review rather than averaging away an unresolved contradiction", () => {
    const result = buildPharmaOverlayModifierProposal({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "RISK",
      economicMaterialityPercent: 25,
      evidenceCompleteness: 0.9,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: -0.5,
      contradictionState: "UNRESOLVED",
    })
    expect(result.modifierState).toBe("REVIEW_REQUIRED")
    expect(result.reasonCodes).toContain("UNRESOLVED_OVERLAY_CONTRADICTION")
  })

  it("requires material-overlay economic materiality to remain explicit", () => {
    const result = buildPharmaOverlayModifierProposal({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "GROWTH",
      economicMaterialityPercent: null,
      evidenceCompleteness: 0.9,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: 0.5,
      contradictionState: "NONE",
    })
    expect(result.modifierState).toBe("REVIEW_REQUIRED")
    expect(result.reasonCodes).toContain("MATERIAL_OVERLAY_REQUIRES_REVIEWED_MATERIALITY")
  })

  it("can only reach numeric-contract-pending state even when all required inputs exist", () => {
    const result = buildPharmaOverlayModifierProposal({
      overlayCode: "GLOBAL_GENERICS",
      overlayRole: "MATERIAL_OVERLAY",
      dimensionCode: "GROWTH",
      economicMaterialityPercent: 25,
      evidenceCompleteness: 0.9,
      evidenceConfidence: "HIGH",
      normalizedOverlaySignal: 0.5,
      contradictionState: "RESOLVED_BY_VERSIONED_CONTRACT",
    })
    expect(result.modifierState).toBe("ELIGIBLE_PENDING_NUMERIC_CONTRACT")
    expect(result.numericModifier).toBeNull()
    expect(result.combinedPerDimensionCapValue).toBeNull()
    expect(result.reasonCodes).toContain("NUMERIC_FORMULA_AND_COMBINED_CAP_VALUE_UNAPPROVED")
  })
})
