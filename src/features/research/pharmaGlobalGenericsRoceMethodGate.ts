import { PHARMA_ROCE_CURVE_PROPOSAL } from "./pharmaRoceCurveProposal"

export const PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsRoceMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_ROCE_HISTORY"
  readonly canonicalDimension: "CAPITAL_EFFICIENCY"
  readonly parentDimensionAlignmentState: typeof PHARMA_ROCE_CURVE_PROPOSAL.dimensionAlignmentState
  readonly parentDimensionReconciliationRequired: true
  readonly history: {
    readonly minimumComparableAnnualPeriods: 3
    readonly preferredComparableAnnualPeriods: 5
    readonly latestPeriodRequired: true
    readonly consistentCalculationSemanticsRequired: true
    readonly singleSnapshotSufficient: false
  }
  readonly reusableMethodologyShape: {
    readonly levelComponentRequired: true
    readonly stabilityComponentRequired: true
    readonly trendComponentRequired: true
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly levelBandsApproved: false
    readonly stabilityBandsApproved: false
    readonly trendBandsApproved: false
    readonly finalAggregationApproved: false
    readonly universalBandsInherited: false
    readonly domesticOrOtherSubprofileBandsInherited: false
  }
  readonly missingEvidenceMayBecomeNeutral: false
  readonly numericRoceCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE:
  PharmaGlobalGenericsRoceMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_ROCE_HISTORY",
    canonicalDimension: "CAPITAL_EFFICIENCY",
    parentDimensionAlignmentState: PHARMA_ROCE_CURVE_PROPOSAL.dimensionAlignmentState,
    parentDimensionReconciliationRequired: true,
    history: {
      minimumComparableAnnualPeriods: 3,
      preferredComparableAnnualPeriods: 5,
      latestPeriodRequired: true,
      consistentCalculationSemanticsRequired: true,
      singleSnapshotSufficient: false,
    },
    reusableMethodologyShape: {
      levelComponentRequired: true,
      stabilityComponentRequired: true,
      trendComponentRequired: true,
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      levelBandsApproved: false,
      stabilityBandsApproved: false,
      trendBandsApproved: false,
      finalAggregationApproved: false,
      universalBandsInherited: false,
      domesticOrOtherSubprofileBandsInherited: false,
    },
    missingEvidenceMayBecomeNeutral: false,
    numericRoceCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export type PharmaGlobalGenericsRoceEvidenceState =
  | "READY_FOR_METHOD_SELECTION"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export interface PharmaGlobalGenericsRoceEvidenceInput {
  readonly comparableAnnualPeriodCount: number
  readonly latestPeriodPresent: boolean
  readonly consistentCalculationSemantics: boolean
}

export function assessGlobalGenericsRoceEvidence(
  input: PharmaGlobalGenericsRoceEvidenceInput,
): PharmaGlobalGenericsRoceEvidenceState {
  if (!Number.isInteger(input.comparableAnnualPeriodCount) || input.comparableAnnualPeriodCount < 0) {
    return "REVIEW_REQUIRED"
  }

  if (
    input.comparableAnnualPeriodCount < 3
    || !input.latestPeriodPresent
    || !input.consistentCalculationSemantics
  ) {
    return "INSUFFICIENT_EVIDENCE"
  }

  return "READY_FOR_METHOD_SELECTION"
}
