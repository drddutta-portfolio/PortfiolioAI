export const PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsCashConversionMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_CASH_CONVERSION_HISTORY"
  readonly canonicalDimension: "CASH_FLOW"
  readonly parentDimensionAlignmentState: "REQUIRES_VERSIONED_PARENT_RECONCILIATION"
  readonly parentDimensionReconciliationRequired: true
  readonly history: {
    readonly minimumComparableAnnualPeriods: 3
    readonly preferredComparableAnnualPeriods: 5
    readonly latestPeriodRequired: true
    readonly matchedCfoPatAndCapexFcfPeriodsRequired: true
    readonly cfoAloneSufficient: false
    readonly singleSnapshotSufficient: false
  }
  readonly reusableMethodologyShape: {
    readonly cfoToPatConversionRequired: true
    readonly fcfConversionRequired: true
    readonly consistencyAndTrendRequired: true
    readonly capexIntensityContextRequired: true
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly cfoToPatBandsApproved: false
    readonly fcfConversionBandsApproved: false
    readonly consistencyTrendBandsApproved: false
    readonly finalAggregationApproved: false
    readonly universalBandsInherited: false
    readonly otherSubprofileBandsInherited: false
  }
  readonly missingEvidenceMayBecomeNeutral: false
  readonly numericCashConversionCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE:
  PharmaGlobalGenericsCashConversionMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_CASH_CONVERSION_HISTORY",
    canonicalDimension: "CASH_FLOW",
    parentDimensionAlignmentState: "REQUIRES_VERSIONED_PARENT_RECONCILIATION",
    parentDimensionReconciliationRequired: true,
    history: {
      minimumComparableAnnualPeriods: 3,
      preferredComparableAnnualPeriods: 5,
      latestPeriodRequired: true,
      matchedCfoPatAndCapexFcfPeriodsRequired: true,
      cfoAloneSufficient: false,
      singleSnapshotSufficient: false,
    },
    reusableMethodologyShape: {
      cfoToPatConversionRequired: true,
      fcfConversionRequired: true,
      consistencyAndTrendRequired: true,
      capexIntensityContextRequired: true,
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      cfoToPatBandsApproved: false,
      fcfConversionBandsApproved: false,
      consistencyTrendBandsApproved: false,
      finalAggregationApproved: false,
      universalBandsInherited: false,
      otherSubprofileBandsInherited: false,
    },
    missingEvidenceMayBecomeNeutral: false,
    numericCashConversionCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export type PharmaGlobalGenericsCashConversionEvidenceState =
  | "READY_FOR_METHOD_SELECTION"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export interface PharmaGlobalGenericsCashConversionEvidenceInput {
  readonly comparableAnnualPeriodCount: number
  readonly latestPeriodPresent: boolean
  readonly matchedCfoPatAndCapexFcfPeriods: boolean
}

export function assessGlobalGenericsCashConversionEvidence(
  input: PharmaGlobalGenericsCashConversionEvidenceInput,
): PharmaGlobalGenericsCashConversionEvidenceState {
  if (!Number.isInteger(input.comparableAnnualPeriodCount) || input.comparableAnnualPeriodCount < 0) {
    return "REVIEW_REQUIRED"
  }

  if (
    input.comparableAnnualPeriodCount < 3
    || !input.latestPeriodPresent
    || !input.matchedCfoPatAndCapexFcfPeriods
  ) {
    return "INSUFFICIENT_EVIDENCE"
  }

  return "READY_FOR_METHOD_SELECTION"
}
