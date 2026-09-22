import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE,
  globalGenericsBalanceSheetCalibrationBlockers,
} from "./pharmaGlobalGenericsBalanceSheetCalibrationEvidence"

describe("PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE", () => {
  it("defers Global Generics Balance Sheet calibration and preserves the parent alignment blocker", () => {
    const contract = PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE

    expect(contract.parentMethodologyShapeValidated).toBe(true)
    expect(contract.parentDimensionReconciliationRequired).toBe(true)
    expect(contract.parentDimensionReconciliationPerformed).toBe(false)
    expect(contract.globalSpecificCalibrationAvailable).toBe(false)
    expect(contract.numericBalanceSheetCurveReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("records the current parent dimension mismatch explicitly", () => {
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.currentParentMetricDimension)
      .toBe("FINANCIAL_STRENGTH")
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.canonicalDimension)
      .toBe("BALANCE_SHEET_CREDIT")
  })

  it("records explicit calibration and alignment blockers", () => {
    expect(globalGenericsBalanceSheetCalibrationBlockers()).toEqual([
      "GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "LEVERAGE_BAND_EVIDENCE_NOT_ESTABLISHED",
      "INTEREST_COVERAGE_BAND_EVIDENCE_NOT_ESTABLISHED",
      "TREND_RESILIENCE_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "PARENT_BALANCE_SHEET_DIMENSION_RECONCILIATION_REQUIRED",
    ])
  })

  it("prohibits other-subprofile fallback and keeps execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.otherSubprofileCalibrationMayBeUsedAsFallback).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
