import { describe, expect, it } from "vitest"
import {
  applyPharmaG7OverlayModifierToDimension,
  buildPharmaG7OverlayNumericModifierProposal,
  combinePharmaG7OverlayModifiers,
  PHARMA_G7_OVERLAY_NUMERIC_MODIFIER,
} from "./pharmaG7OverlayNumericModifierProposal"

const readyInput = {
  overlayCode: "GLOBAL_GENERICS" as const,
  overlayRole: "MATERIAL_OVERLAY" as const,
  dimensionCode: "GROWTH" as const,
  economicMaterialityPercent: 25,
  evidenceCompleteness: 0.8,
  evidenceConfidence: "HIGH" as const,
  normalizedOverlaySignal: 0.5,
  contradictionState: "NONE" as const,
  overlayReadiness: "READY" as const,
}

describe("G7-P1 overlay numeric modifier proposal", () => {
  it("remains proposal-only and cannot be consumed by G7.1 before owner validation", () => {
    expect(PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.combinedPerDimensionCapPoints).toBe(10)
    expect(PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.empiricallyCalibrated).toBe(false)
    expect(PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.ownerValidationRequired).toBe(true)
    expect(PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.g71ConsumptionApproved).toBe(false)
    expect(PHARMA_G7_OVERLAY_NUMERIC_MODIFIER.scoreExecutionEnabled).toBe(false)
  })

  it("uses direct economic-share scaling in the candidate formula", () => {
    const result = buildPharmaG7OverlayNumericModifierProposal(readyInput)
    expect(result.modifierState).toBe("PROPOSED_NUMERIC_MODIFIER")
    expect(result.proposedNumericModifierPoints).toBe(1)
  })

  it("scales confidence explicitly", () => {
    const medium = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      evidenceConfidence: "MEDIUM",
    })
    const low = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      evidenceConfidence: "LOW",
    })
    expect(medium.proposedNumericModifierPoints).toBe(0.75)
    expect(low.proposedNumericModifierPoints).toBe(0.5)
  })

  it("does not numerically score PARTIAL overlay readiness", () => {
    const result = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      overlayReadiness: "PARTIAL",
    })
    expect(result.modifierState).toBe("READINESS_NOT_READY")
    expect(result.proposedNumericModifierPoints).toBeNull()
  })

  it("keeps Emerging Watch numerically excluded", () => {
    const result = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      overlayCode: "CDMO_CRAMS",
      overlayRole: "EMERGING_WATCH",
      overlayReadiness: "EMERGING_WATCH",
    })
    expect(result.modifierState).toBe("EXCLUDED_EMERGING_WATCH")
    expect(result.proposedNumericModifierPoints).toBeNull()
  })

  it("preserves G2 fail-closed eligibility", () => {
    const result = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      contradictionState: "UNRESOLVED",
    })
    expect(result.modifierState).toBe("INELIGIBLE_G2")
    expect(result.proposedNumericModifierPoints).toBeNull()
    expect(result.reasonCodes).toContain("UNRESOLVED_OVERLAY_CONTRADICTION")
  })

  it("enforces one combined per-dimension cap", () => {
    expect(combinePharmaG7OverlayModifiers([7, 6])).toBe(10)
    expect(combinePharmaG7OverlayModifiers([-8, -5])).toBe(-10)
    expect(combinePharmaG7OverlayModifiers([3, -1])).toBe(2)
  })

  it("bounds the final dimension score to 0-100", () => {
    expect(applyPharmaG7OverlayModifierToDimension(96, 8)).toBe(100)
    expect(applyPharmaG7OverlayModifierToDimension(4, -8)).toBe(0)
    expect(applyPharmaG7OverlayModifierToDimension(70, 3)).toBe(73)
  })

  it("makes economic materiality affect magnitude without a second invented breakpoint", () => {
    const twenty = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      economicMaterialityPercent: 20,
      evidenceCompleteness: 1,
      normalizedOverlaySignal: 1,
    })
    const forty = buildPharmaG7OverlayNumericModifierProposal({
      ...readyInput,
      economicMaterialityPercent: 40,
      evidenceCompleteness: 1,
      normalizedOverlaySignal: 1,
    })
    expect(twenty.proposedNumericModifierPoints).toBe(2)
    expect(forty.proposedNumericModifierPoints).toBe(4)
  })
})
