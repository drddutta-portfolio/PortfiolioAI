import { describe, expect, it } from "vitest"
import {
  PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE,
  assessGlobalGenericsOwnershipGovernanceEvidence,
} from "./pharmaGlobalGenericsOwnershipGovernanceMethodGate"

describe("PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE", () => {
  it("reuses only the parent evidence/methodology shape", () => {
    const gate = PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE

    expect(gate.history.minimumComparableShareholdingQuarters).toBe(4)
    expect(gate.history.preferredComparableShareholdingQuarters).toBe(8)
    expect(gate.reusableMethodologyShape.ownershipStructureAndStabilityRequired).toBe(true)
    expect(gate.reusableMethodologyShape.pledgeAndControlRiskRequired).toBe(true)
    expect(gate.reusableMethodologyShape.governanceEventContextRequired).toBe(true)
  })

  it("preserves the parent dimension reconciliation blocker", () => {
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.parentDimensionReconciliationRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.parentDimensionAlignmentState)
      .toBe("REQUIRES_VERSIONED_PARENT_RECONCILIATION")
  })

  it("prevents G4 governance/regulatory double counting", () => {
    const boundary = PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.antiDoubleCountingBoundary

    expect(boundary.g4CriticalOrBlockedMayReceiveSecondHiddenPenalty).toBe(false)
    expect(boundary.g4HighRiskMayReceiveSecondHiddenPenalty).toBe(false)
    expect(boundary.governanceEventContextMayRemainVisible).toBe(true)
    expect(boundary.additionalGateCapInsideDimensionAllowed).toBe(false)
  })

  it("does not approve mechanical ownership shortcuts", () => {
    const gate = PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE
    const decisions = gate.globalGenericsSpecificDecisions

    expect(decisions.componentWeightsApproved).toBe(false)
    expect(decisions.ownershipBandsApproved).toBe(false)
    expect(decisions.pledgeBandsApproved).toBe(false)
    expect(decisions.governanceEventContextBandsApproved).toBe(false)
    expect(decisions.promoterPercentageMechanicalThresholdsApproved).toBe(false)
    expect(decisions.institutionalOwnershipMechanicalBonusApproved).toBe(false)
    expect(gate.pledgeZeroAutomaticallyBestScore).toBe(false)
    expect(gate.promoterPercentageAbsoluteLevelAloneSufficient).toBe(false)
    expect(gate.institutionalOwnershipAutomaticallyPositive).toBe(false)
  })

  it("fails closed when shareholding/governance evidence is insufficient", () => {
    expect(assessGlobalGenericsOwnershipGovernanceEvidence({
      comparableShareholdingQuarterCount: 3,
      latestShareholdingQuarterPresent: true,
      currentMaterialGovernanceEventsReviewed: true,
    })).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("marks structurally valid evidence ready only for method selection", () => {
    expect(assessGlobalGenericsOwnershipGovernanceEvidence({
      comparableShareholdingQuarterCount: 4,
      latestShareholdingQuarterPresent: true,
      currentMaterialGovernanceEventsReviewed: true,
    })).toBe("READY_FOR_METHOD_SELECTION")

    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.numericOwnershipGovernanceCurveReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.ownerApprovalRequired).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.scoreExecutionEnabled).toBe(false)
  })
})
