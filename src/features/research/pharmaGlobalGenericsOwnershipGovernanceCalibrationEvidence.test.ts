import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE,
  globalGenericsOwnershipGovernanceCalibrationBlockers,
} from "./pharmaGlobalGenericsOwnershipGovernanceCalibrationEvidence"

describe("PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE", () => {
  it("defers Global Generics Ownership/Governance calibration and preserves the parent alignment blocker", () => {
    const contract = PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE

    expect(contract.parentMethodologyShapeValidated).toBe(true)
    expect(contract.parentDimensionReconciliationRequired).toBe(true)
    expect(contract.parentDimensionReconciliationPerformed).toBe(false)
    expect(contract.globalSpecificCalibrationAvailable).toBe(false)
    expect(contract.numericOwnershipGovernanceCurveReady).toBe(false)
    expect(contract.deferralRequired).toBe(true)
  })

  it("preserves the G4 anti-double-counting lock", () => {
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE.g4AntiDoubleCountingLockPreserved).toBe(true)
  })

  it("records explicit calibration and parent-alignment blockers", () => {
    expect(globalGenericsOwnershipGovernanceCalibrationBlockers()).toEqual([
      "GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_OWNERSHIP_COHORT_NOT_ESTABLISHED",
      "OWNERSHIP_BAND_EVIDENCE_NOT_ESTABLISHED",
      "PLEDGE_CONTROL_RISK_BAND_EVIDENCE_NOT_ESTABLISHED",
      "GOVERNANCE_EVENT_CONTEXT_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "FINAL_AGGREGATION_NOT_ESTABLISHED",
      "PARENT_OWNERSHIP_GOVERNANCE_DIMENSION_RECONCILIATION_REQUIRED",
    ])
  })

  it("prohibits mechanical ownership shortcuts and keeps execution disabled", () => {
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE.mechanicalOwnershipShortcutsAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE.scoreExecutionEnabled).toBe(false)
  })
})
