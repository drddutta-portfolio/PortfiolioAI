import { PHARMA_VALUATION_CURVE_PROPOSAL } from "./pharmaValuationCurveProposal"

export const PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsValuationMethodGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_VALUATION_CONTEXT"
  readonly canonicalDimension: "VALUATION"
  readonly parentDimensionAlignmentState: typeof PHARMA_VALUATION_CURVE_PROPOSAL.dimensionAlignmentState
  readonly reusableMethodologyShape: {
    readonly selfHistoryRelativeRequired: true
    readonly peerRelativeRequired: true
    readonly cashFlowCorroborationRequired: true
    readonly supportedEvidenceFamilies: readonly ["PE", "EV_EBITDA", "FCF_YIELD"]
    readonly currentAuthoritativeMarketPriceRequired: true
    readonly currentReviewedEarningsAndCashInputsRequired: true
    readonly peerCohortMustRespectBusinessModel: true
    readonly negativeOrNonMeaningfulDenominatorsRequireExplicitTreatment: true
    readonly acquisitionAndOneOffEarningsNormalizationRequired: true
  }
  readonly globalGenericsSpecificDecisions: {
    readonly componentWeightsApproved: false
    readonly selfHistoryBandsApproved: false
    readonly peerRelativeMetricMixApproved: false
    readonly peerRelativeBandsApproved: false
    readonly fcfCorroborationMethodApproved: false
    readonly finalAggregationApproved: false
    readonly domesticFortyFortyTwentyInherited: false
    readonly domesticPeerFiftyFiftyInherited: false
    readonly domesticBandsInherited: false
  }
  readonly missingComponentRenormalizationAllowed: false
  readonly hiddenReweightingAllowed: false
  readonly numericValuationCurveReady: false
  readonly ownerApprovalRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE:
  PharmaGlobalGenericsValuationMethodGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_VALUATION_CONTEXT",
    canonicalDimension: "VALUATION",
    parentDimensionAlignmentState: PHARMA_VALUATION_CURVE_PROPOSAL.dimensionAlignmentState,
    reusableMethodologyShape: {
      selfHistoryRelativeRequired: true,
      peerRelativeRequired: true,
      cashFlowCorroborationRequired: true,
      supportedEvidenceFamilies: ["PE", "EV_EBITDA", "FCF_YIELD"],
      currentAuthoritativeMarketPriceRequired: true,
      currentReviewedEarningsAndCashInputsRequired: true,
      peerCohortMustRespectBusinessModel: true,
      negativeOrNonMeaningfulDenominatorsRequireExplicitTreatment: true,
      acquisitionAndOneOffEarningsNormalizationRequired: true,
    },
    globalGenericsSpecificDecisions: {
      componentWeightsApproved: false,
      selfHistoryBandsApproved: false,
      peerRelativeMetricMixApproved: false,
      peerRelativeBandsApproved: false,
      fcfCorroborationMethodApproved: false,
      finalAggregationApproved: false,
      domesticFortyFortyTwentyInherited: false,
      domesticPeerFiftyFiftyInherited: false,
      domesticBandsInherited: false,
    },
    missingComponentRenormalizationAllowed: false,
    hiddenReweightingAllowed: false,
    numericValuationCurveReady: false,
    ownerApprovalRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }
