import { describe, expect, it } from "vitest"
import { PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL } from "./pharmaOwnershipGovernanceCurveProposal"

describe("PHARMA Ownership / Governance curve proposal", () => {
  it("remains proposal-only and non-executable", () => {
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.state).toBe("PROPOSAL_ONLY")
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.numericCurveReady).toBe(false)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.activationApproved).toBe(false)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })

  it("targets canonical Ownership / Governance and surfaces the legacy dimension", () => {
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.canonicalDimension).toBe("OWNERSHIP_GOVERNANCE")
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.currentParentContractDimension).toBe("OWNERSHIP_GOVERNANCE")
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.dimensionAlignmentState).toBe(
      "ALIGNED_VERSIONED_PARENT",
    )
  })

  it("preserves the four-quarter minimum and eight-quarter preferred ownership history", () => {
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.minimumComparableShareholdingQuarters).toBe(4)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.preferredComparableShareholdingQuarters).toBe(8)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.latestShareholdingQuarterRequired).toBe(true)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.currentMaterialGovernanceEventsRequired).toBe(true)
  })

  it("does not treat promoter absence as automatically negative", () => {
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.history.promoterAbsenceAutomaticallyNegative).toBe(false)
  })

  it("keeps the weighted dimension distinct from the G4 gate", () => {
    const separation = PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.governanceGateSeparation
    expect(separation.g4CriticalOrBlockedEventMayReceiveSecondHiddenPenalty).toBe(false)
    expect(separation.g4HighRiskMayReceiveSecondHiddenPenalty).toBe(false)
    expect(separation.governanceEventContextMayRemainVisible).toBe(true)
    expect(separation.additionalGateCapInsideDimensionAllowed).toBe(false)
  })

  it("does not mechanically score ownership percentages or zero pledge", () => {
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.promoterPercentageAbsoluteLevelAloneSufficient).toBe(false)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.pledgeZeroAutomaticallyBestScore).toBe(false)
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.institutionalOwnershipAutomaticallyPositive).toBe(false)
  })

  it("does not invent component weights or bands", () => {
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.methodologyShape.componentWeightsState).toBe("UNAPPROVED")
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.methodologyShape.ownershipBandsState).toBe("UNAPPROVED")
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.methodologyShape.pledgeBandsState).toBe("UNAPPROVED")
    expect(PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.methodologyShape.eventContextBandsState).toBe("UNAPPROVED")
  })
})
