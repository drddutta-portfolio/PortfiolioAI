export const PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsBalanceSheetMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE"
  readonly canonicalDimension: "BALANCE_SHEET_CREDIT"
  readonly parentDimensionAlignmentState: "REQUIRES_VERSIONED_PARENT_RECONCILIATION"
  readonly parentDimensionReconciliationRequired: true
  readonly history: {
    readonly minimumComparableAnnualPeriods: 3
    readonly preferredComparableAnnualPeriods: 5
    readonly latestBalanceSheetPeriodRequired: true
    readonly matchedDebtCashAndOperatingEarningsRequired: true
    readonly pointInTimeOnlySufficient: false
    readonly singleSnapshotSufficient: false
  }
  readonly reusableMethodologyShape: {
    readonly netDebtLeverageRequired: true
    readonly interestCoverageRequired: true
    readonly trendAndResilienceRequired: true
    readonly reviewedCashDefinitionRequired: true
    readonly explicitNetCashTreatmentRequired: true
    readonly acquisitionAndExpansionContextRequired: true
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly leverageBandsApproved: false
    readonly interestCoverageBandsApproved: false
    readonly trendResilienceBandsApproved: false
    readonly finalAggregationApproved: false
    readonly universalBandsInherited: false
    readonly otherSubprofileBandsInherited: false
  }
  readonly missingEvidenceMayBecomeNeutral: false
  readonly numericBalanceSheetCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE:
  PharmaGlobalGenericsBalanceSheetMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
    canonicalDimension: "BALANCE_SHEET_CREDIT",
    parentDimensionAlignmentState: "REQUIRES_VERSIONED_PARENT_RECONCILIATION",
    parentDimensionReconciliationRequired: true,
    history: {
      minimumComparableAnnualPeriods: 3,
      preferredComparableAnnualPeriods: 5,
      latestBalanceSheetPeriodRequired: true,
      matchedDebtCashAndOperatingEarningsRequired: true,
      pointInTimeOnlySufficient: false,
      singleSnapshotSufficient: false,
    },
    reusableMethodologyShape: {
      netDebtLeverageRequired: true,
      interestCoverageRequired: true,
      trendAndResilienceRequired: true,
      reviewedCashDefinitionRequired: true,
      explicitNetCashTreatmentRequired: true,
      acquisitionAndExpansionContextRequired: true,
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      leverageBandsApproved: false,
      interestCoverageBandsApproved: false,
      trendResilienceBandsApproved: false,
      finalAggregationApproved: false,
      universalBandsInherited: false,
      otherSubprofileBandsInherited: false,
    },
    missingEvidenceMayBecomeNeutral: false,
    numericBalanceSheetCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export type PharmaGlobalGenericsBalanceSheetEvidenceState =
  | "READY_FOR_METHOD_SELECTION"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export interface PharmaGlobalGenericsBalanceSheetEvidenceInput {
  readonly comparableAnnualPeriodCount: number
  readonly latestBalanceSheetPeriodPresent: boolean
  readonly matchedDebtCashAndOperatingEarnings: boolean
}

export function assessGlobalGenericsBalanceSheetEvidence(
  input: PharmaGlobalGenericsBalanceSheetEvidenceInput,
): PharmaGlobalGenericsBalanceSheetEvidenceState {
  if (!Number.isInteger(input.comparableAnnualPeriodCount) || input.comparableAnnualPeriodCount < 0) {
    return "REVIEW_REQUIRED"
  }

  if (
    input.comparableAnnualPeriodCount < 3
    || !input.latestBalanceSheetPeriodPresent
    || !input.matchedDebtCashAndOperatingEarnings
  ) {
    return "INSUFFICIENT_EVIDENCE"
  }

  return "READY_FOR_METHOD_SELECTION"
}
