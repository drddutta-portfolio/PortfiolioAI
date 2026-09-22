import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE,
  globalGenericsRoceCalibrationBlockers,
} from "./pharmaGlobalGenericsRoceCalibrationEvidence"

describe("PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE", () => {
  it("defers Global Generics ROCE calibration and preserves the parent alignment blocker", () => {
    const contract = PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE

    expect(contract.parentMethodologyShapeValidated).toBe(true)
    expect(contract.parentDimensionReconciliationRequired).toBe(true)
    expect(contract.parentDimensionReconciliationPerformed).toBe(false)
    expect(contract.globalSpecificCalibrationAvailable).toBe(false)
    expect(contract.numericRoceCurveReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("records the current parent dimension mismatch explicitly", () => {
    expect(PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.currentParentMetricDimension).toBe("QUALITY")
    expect(PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.canonicalDimension).toBe("CAPITAL_EFFICIENCY")
  })

  it("records explicit calibration and alignment blockers", () => {
    expect(globalGenericsRoceCalibrationBlockers()).toEqual([
      "GLOBAL_GENERICS_ROCE_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "LEVEL_BAND_EVIDENCE_NOT_ESTABLISHED",
      "STABILITY_BAND_EVIDENCE_NOT_ESTABLISHED",
      "TREND_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "PARENT_ROCE_DIMENSION_RECONCILIATION_REQUIRED",
    ])
  })

  it("prohibits other-subprofile fallback and keeps execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.otherSubprofileCalibrationMayBeUsedAsFallback).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
