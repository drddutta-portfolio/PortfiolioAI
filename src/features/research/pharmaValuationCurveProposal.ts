import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_SUBPROFILE_CODES, type PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const PHARMA_VALUATION_CURVE_PROPOSAL_VERSION =
  "PHARMA_VALUATION_CONTEXT_CURVE_V1_PROPOSAL" as const

const VALUATION_METRIC_CODE = "PHARMA_VALUATION_CONTEXT" as const
const valuationMetric = PHARMA_RESEARCH_PROFILE_V1.metrics.find(
  (metric) => metric.metricCode === VALUATION_METRIC_CODE,
)

if (!valuationMetric) {
  throw new Error("PHARMA_VALUATION_CONTEXT is missing from PHARMA_V1 parent contract")
}

export interface PharmaValuationCurveProposal {
  readonly proposalVersion: typeof PHARMA_VALUATION_CURVE_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: typeof VALUATION_METRIC_CODE
  readonly canonicalDimension: "VALUATION"
  readonly currentParentContractDimension: typeof valuationMetric.dimension
  readonly dimensionAlignmentState: "ALIGNED"
  readonly history: {
    readonly minimumComparableAnnualObservations: 1
    readonly preferredComparableAnnualObservations: 5
    readonly currentAuthoritativeMarketPriceRequired: true
    readonly currentReviewedEarningsAndCashInputsRequired: true
    readonly stalePriceAllowed: false
    readonly providerValuationLabelMayOverrideMarketPrice: false
  }
  readonly methodologyShape: {
    readonly components: readonly [
      "SELF_HISTORY_RELATIVE_VALUATION",
      "PEER_RELATIVE_VALUATION",
      "CASH_FLOW_CORROBORATION",
    ]
    readonly supportedEvidenceFamilies: readonly ["PE", "EV_EBITDA", "FCF_YIELD"]
    readonly componentWeightsState: "UNAPPROVED"
    readonly absoluteMultipleBandsState: "UNAPPROVED"
    readonly peerRelativeBandsState: "SUBPROFILE_CONTEXT_REQUIRED"
    readonly selfHistoryBandsState: "UNAPPROVED"
  }
  readonly subprofileThresholds: Readonly<Record<PharmaSubprofileCode, null>>
  readonly universalAbsoluteMultipleBandsAllowed: false
  readonly peerCohortMustRespectBusinessModel: true
  readonly priceToBookIncluded: false
  readonly negativeOrNonMeaningfulDenominatorsRequireExplicitTreatment: true
  readonly acquisitionAndOneOffEarningsNormalizationRequired: true
  readonly numericCurveReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

const subprofileThresholds = Object.fromEntries(
  PHARMA_SUBPROFILE_CODES.map((code) => [code, null]),
) as Readonly<Record<PharmaSubprofileCode, null>>

export const PHARMA_VALUATION_CURVE_PROPOSAL: PharmaValuationCurveProposal = {
  proposalVersion: PHARMA_VALUATION_CURVE_PROPOSAL_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: VALUATION_METRIC_CODE,
  canonicalDimension: "VALUATION",
  currentParentContractDimension: valuationMetric.dimension,
  dimensionAlignmentState: "ALIGNED",
  history: {
    minimumComparableAnnualObservations: 1,
    preferredComparableAnnualObservations: 5,
    currentAuthoritativeMarketPriceRequired: true,
    currentReviewedEarningsAndCashInputsRequired: true,
    stalePriceAllowed: false,
    providerValuationLabelMayOverrideMarketPrice: false,
  },
  methodologyShape: {
    components: [
      "SELF_HISTORY_RELATIVE_VALUATION",
      "PEER_RELATIVE_VALUATION",
      "CASH_FLOW_CORROBORATION",
    ],
    supportedEvidenceFamilies: ["PE", "EV_EBITDA", "FCF_YIELD"],
    componentWeightsState: "UNAPPROVED",
    absoluteMultipleBandsState: "UNAPPROVED",
    peerRelativeBandsState: "SUBPROFILE_CONTEXT_REQUIRED",
    selfHistoryBandsState: "UNAPPROVED",
  },
  subprofileThresholds,
  universalAbsoluteMultipleBandsAllowed: false,
  peerCohortMustRespectBusinessModel: true,
  priceToBookIncluded: false,
  negativeOrNonMeaningfulDenominatorsRequireExplicitTreatment: true,
  acquisitionAndOneOffEarningsNormalizationRequired: true,
  numericCurveReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
