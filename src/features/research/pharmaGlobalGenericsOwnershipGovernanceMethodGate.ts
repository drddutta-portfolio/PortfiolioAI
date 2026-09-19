import { PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL } from "./pharmaOwnershipGovernanceCurveProposal"

export const PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsOwnershipGovernanceMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_OWNERSHIP_GOVERNANCE"
  readonly canonicalDimension: "OWNERSHIP_GOVERNANCE"
  readonly parentDimensionAlignmentState: typeof PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.dimensionAlignmentState
  readonly parentDimensionReconciliationRequired: true
  readonly history: {
    readonly minimumComparableShareholdingQuarters: 4
    readonly preferredComparableShareholdingQuarters: 8
    readonly latestShareholdingQuarterRequired: true
    readonly currentMaterialGovernanceEventsRequired: true
    readonly promoterAbsenceAutomaticallyNegative: false
  }
  readonly reusableMethodologyShape: {
    readonly ownershipStructureAndStabilityRequired: true
    readonly pledgeAndControlRiskRequired: true
    readonly governanceEventContextRequired: true
  }
  readonly antiDoubleCountingBoundary: {
    readonly g4CriticalOrBlockedMayReceiveSecondHiddenPenalty: false
    readonly g4HighRiskMayReceiveSecondHiddenPenalty: false
    readonly governanceEventContextMayRemainVisible: true
    readonly additionalGateCapInsideDimensionAllowed: false
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly ownershipBandsApproved: false
    readonly pledgeBandsApproved: false
    readonly governanceEventContextBandsApproved: false
    readonly finalAggregationApproved: false
    readonly promoterPercentageMechanicalThresholdsApproved: false
    readonly institutionalOwnershipMechanicalBonusApproved: false
  }
  readonly pledgeZeroAutomaticallyBestScore: false
  readonly promoterPercentageAbsoluteLevelAloneSufficient: false
  readonly institutionalOwnershipAutomaticallyPositive: false
  readonly missingEvidenceMayBecomeNeutral: false
  readonly numericOwnershipGovernanceCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE:
  PharmaGlobalGenericsOwnershipGovernanceMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_OWNERSHIP_GOVERNANCE",
    canonicalDimension: "OWNERSHIP_GOVERNANCE",
    parentDimensionAlignmentState: PHARMA_OWNERSHIP_GOVERNANCE_CURVE_PROPOSAL.dimensionAlignmentState,
    parentDimensionReconciliationRequired: true,
    history: {
      minimumComparableShareholdingQuarters: 4,
      preferredComparableShareholdingQuarters: 8,
      latestShareholdingQuarterRequired: true,
      currentMaterialGovernanceEventsRequired: true,
      promoterAbsenceAutomaticallyNegative: false,
    },
    reusableMethodologyShape: {
      ownershipStructureAndStabilityRequired: true,
      pledgeAndControlRiskRequired: true,
      governanceEventContextRequired: true,
    },
    antiDoubleCountingBoundary: {
      g4CriticalOrBlockedMayReceiveSecondHiddenPenalty: false,
      g4HighRiskMayReceiveSecondHiddenPenalty: false,
      governanceEventContextMayRemainVisible: true,
      additionalGateCapInsideDimensionAllowed: false,
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      ownershipBandsApproved: false,
      pledgeBandsApproved: false,
      governanceEventContextBandsApproved: false,
      finalAggregationApproved: false,
      promoterPercentageMechanicalThresholdsApproved: false,
      institutionalOwnershipMechanicalBonusApproved: false,
    },
    pledgeZeroAutomaticallyBestScore: false,
    promoterPercentageAbsoluteLevelAloneSufficient: false,
    institutionalOwnershipAutomaticallyPositive: false,
    missingEvidenceMayBecomeNeutral: false,
    numericOwnershipGovernanceCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export type PharmaGlobalGenericsOwnershipGovernanceEvidenceState =
  | "READY_FOR_METHOD_SELECTION"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export interface PharmaGlobalGenericsOwnershipGovernanceEvidenceInput {
  readonly comparableShareholdingQuarterCount: number
  readonly latestShareholdingQuarterPresent: boolean
  readonly currentMaterialGovernanceEventsReviewed: boolean
}

export function assessGlobalGenericsOwnershipGovernanceEvidence(
  input: PharmaGlobalGenericsOwnershipGovernanceEvidenceInput,
): PharmaGlobalGenericsOwnershipGovernanceEvidenceState {
  if (
    !Number.isInteger(input.comparableShareholdingQuarterCount)
    || input.comparableShareholdingQuarterCount < 0
  ) {
    return "REVIEW_REQUIRED"
  }

  if (
    input.comparableShareholdingQuarterCount < 4
    || !input.latestShareholdingQuarterPresent
    || !input.currentMaterialGovernanceEventsReviewed
  ) {
    return "INSUFFICIENT_EVIDENCE"
  }

  return "READY_FOR_METHOD_SELECTION"
}
