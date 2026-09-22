import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY,
  globalGenericsMomentumEvidenceBlockers,
} from "./pharmaGlobalGenericsMomentumEvidenceSufficiency"

describe("PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY", () => {
  it("defers Momentum until the Pharma parent contract and benchmark exist", () => {
    const contract = PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY

    expect(contract.evidenceIdentityValidated).toBe(true)
    expect(contract.dedicatedPharmaParentMomentumContractAvailable).toBe(false)
    expect(contract.approvedPharmaBenchmarkAvailable).toBe(false)
    expect(contract.relativeStrengthScoreReady).toBe(false)
    expect(contract.numericMomentumCurveReady).toBe(false)
    expect(contract.wholeMomentumDimensionReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("records explicit parent, benchmark, calibration, and aggregation blockers", () => {
    expect(globalGenericsMomentumEvidenceBlockers()).toEqual([
      "DEDICATED_PHARMA_PARENT_MOMENTUM_CONTRACT_NOT_ESTABLISHED",
      "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED",
      "GLOBAL_GENERICS_MOMENTUM_CALIBRATION_SET_NOT_ESTABLISHED",
      "ABSOLUTE_MOMENTUM_BAND_EVIDENCE_NOT_ESTABLISHED",
      "RELATIVE_STRENGTH_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "FINAL_AGGREGATION_NOT_ESTABLISHED",
    ])
  })

  it("prohibits BANK_NBFC fallback", () => {
    expect(PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY.bankPilotMayBeUsedAsFallback).toBe(false)
  })

  it("keeps execution and activation disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY.scoreExecutionEnabled).toBe(false)
  })
})
