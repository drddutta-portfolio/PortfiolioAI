import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE,
  globalGenericsCashConversionCalibrationBlockers,
} from "./pharmaGlobalGenericsCashConversionCalibrationEvidence"

describe("PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE", () => {
  it("defers Global Generics Cash Conversion calibration and preserves the parent alignment blocker", () => {
    const contract = PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE

    expect(contract.parentMethodologyShapeValidated).toBe(true)
    expect(contract.parentDimensionReconciliationRequired).toBe(true)
    expect(contract.parentDimensionReconciliationPerformed).toBe(false)
    expect(contract.globalSpecificCalibrationAvailable).toBe(false)
    expect(contract.numericCashConversionCurveReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("records the current parent dimension mismatch explicitly", () => {
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.currentParentMetricDimension)
      .toBe("EARNINGS_CASH_QUALITY")
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.canonicalDimension)
      .toBe("CASH_FLOW")
  })

  it("records explicit calibration and alignment blockers", () => {
    expect(globalGenericsCashConversionCalibrationBlockers()).toEqual([
      "GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "CFO_TO_PAT_BAND_EVIDENCE_NOT_ESTABLISHED",
      "FCF_CONVERSION_BAND_EVIDENCE_NOT_ESTABLISHED",
      "CONSISTENCY_TREND_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "PARENT_CASH_FLOW_DIMENSION_RECONCILIATION_REQUIRED",
    ])
  })

  it("prohibits other-subprofile fallback and keeps execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.otherSubprofileCalibrationMayBeUsedAsFallback).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
