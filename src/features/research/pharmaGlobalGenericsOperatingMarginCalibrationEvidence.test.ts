import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE,
  globalGenericsOperatingMarginCalibrationBlockers,
} from "./pharmaGlobalGenericsOperatingMarginCalibrationEvidence"

describe("PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE", () => {
  it("keeps the parent methodology shape while deferring Global-specific calibration", () => {
    const contract = PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE

    expect(contract.parentMethodologyShapeValidated).toBe(true)
    expect(contract.globalSpecificCalibrationAvailable).toBe(false)
    expect(contract.domesticCalibrationMayBeUsedAsFallback).toBe(false)
    expect(contract.numericOperatingMarginCurveReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("records explicit calibration blockers", () => {
    expect(globalGenericsOperatingMarginCalibrationBlockers()).toEqual([
      "GLOBAL_GENERICS_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "LEVEL_BAND_EVIDENCE_NOT_ESTABLISHED",
      "STABILITY_BAND_EVIDENCE_NOT_ESTABLISHED",
      "TREND_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
    ])
  })

  it("keeps execution and activation disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
