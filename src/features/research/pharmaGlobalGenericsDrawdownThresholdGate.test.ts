import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE,
  isStructurallyValidGlobalGenericsDrawdownBandCandidate,
} from "./pharmaGlobalGenericsDrawdownThresholdGate"

describe("PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE", () => {
  it("keeps all numeric drawdown bands unapproved", () => {
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE.approvedBands).toBeNull()
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE.numericCurveReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE.wholeRiskDimensionReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE.activationApproved).toBe(false)
  })

  it("prohibits BANK_NBFC and other implicit defaults", () => {
    const defaults = PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE.prohibitedDefaults

    expect(defaults.bankNbfcBandsMayBeInherited).toBe(false)
    expect(defaults.equalWidthBandsMayBeAssumed).toBe(false)
    expect(defaults.percentileBandsMayBeAssumed).toBe(false)
    expect(defaults.benchmarkRelativeBandsMayBeAssumed).toBe(false)
    expect(defaults.hiddenClippingAllowed).toBe(false)
  })

  it("requires a monotonic versioned owner-approved future curve", () => {
    const required = PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE.requiredApprovalProperties

    expect(required.monotonic).toBe(true)
    expect(required.nonOverlapping).toBe(true)
    expect(required.exhaustiveAcrossValidRange).toBe(true)
    expect(required.validRangeMinimumPercent).toBe(-100)
    expect(required.validRangeMaximumPercent).toBe(0)
    expect(required.worseDrawdownCannotReceiveHigherScore).toBe(true)
    expect(required.explicitlyVersioned).toBe(true)
    expect(required.ownerApprovalRequired).toBe(true)
  })

  it("accepts only structurally ordered candidate thresholds within -100% to 0%", () => {
    expect(isStructurallyValidGlobalGenericsDrawdownBandCandidate([-60, -40, -25, -15])).toBe(true)
    expect(isStructurallyValidGlobalGenericsDrawdownBandCandidate([])).toBe(false)
    expect(isStructurallyValidGlobalGenericsDrawdownBandCandidate([-15, -25, -40])).toBe(false)
    expect(isStructurallyValidGlobalGenericsDrawdownBandCandidate([-110, -40, -20])).toBe(false)
    expect(isStructurallyValidGlobalGenericsDrawdownBandCandidate([-60, -40, 5])).toBe(false)
  })
})
