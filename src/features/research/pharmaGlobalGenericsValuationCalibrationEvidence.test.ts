import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE,
  globalGenericsValuationCalibrationBlockers,
} from "./pharmaGlobalGenericsValuationCalibrationEvidence"

describe("PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE", () => {
  it("defers Global Generics valuation calibration while preserving the parent shape", () => {
    const contract = PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE

    expect(contract.parentMethodologyShapeValidated).toBe(true)
    expect(contract.parentDimensionAligned).toBe(true)
    expect(contract.globalSpecificCalibrationAvailable).toBe(false)
    expect(contract.numericValuationCurveReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("records explicit Global Generics valuation blockers", () => {
    expect(globalGenericsValuationCalibrationBlockers()).toEqual([
      "GLOBAL_GENERICS_VALUATION_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "SELF_HISTORY_CALIBRATION_NOT_ESTABLISHED",
      "PEER_RELATIVE_METRIC_MIX_NOT_ESTABLISHED",
      "PEER_RELATIVE_BANDS_NOT_ESTABLISHED",
      "FCF_CORROBORATION_METHOD_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "FINAL_AGGREGATION_NOT_ESTABLISHED",
    ])
  })

  it("prohibits Domestic fallback, missing-component renormalization, and hidden reweighting", () => {
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.domesticCalibrationMayBeUsedAsFallback).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.missingComponentRenormalizationAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.hiddenReweightingAllowed).toBe(false)
  })

  it("keeps execution and activation disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
