export const PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT_VERSION =
  "PHARMA_DOMESTIC_PEER_VALUATION_COHORT_V1_PROPOSAL" as const

export interface PharmaDomesticPeerValuationContract {
  readonly contractVersion: typeof PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "PEER_RELATIVE_VALUATION"
  readonly cohort: {
    readonly reviewedPrimarySubprofileMatchRequired: true
    readonly samePrimarySubprofileRequired: true
    readonly sectorOrIndustryMatchAloneSufficient: false
    readonly materialOverlayMatchAloneSufficient: false
    readonly emergingWatchEligibleAsPeerBasis: false
    readonly effectiveDatedAssignmentRequired: true
    readonly activeSecurityRequired: true
    readonly providerPeerLabelMayDefineCohort: false
  }
  readonly comparability: {
    readonly sameMetricSemanticsRequired: true
    readonly samePeriodBasisRequired: true
    readonly currentAuthoritativeMarketPriceRequired: true
    readonly staleValuationEvidenceAllowed: false
    readonly negativeOrNonMeaningfulDenominatorsRequireExclusionOrExplicitTreatment: true
    readonly acquisitionAndOneOffNormalizationRequired: true
  }
  readonly methodology: {
    readonly candidateEvidenceFamilies: readonly ["PE_TTM", "EV_EBITDA"]
    readonly approvedPeerMetricSetState: "UNAPPROVED"
    readonly minimumPeerCountState: "UNAPPROVED"
    readonly aggregationStatisticState: "UNAPPROVED"
    readonly relativeBandsState: "UNAPPROVED"
    readonly componentWeightState: "UNAPPROVED"
  }
  readonly cohortBuilderImplemented: false
  readonly numericPeerCurveReady: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT: PharmaDomesticPeerValuationContract = {
  contractVersion: PHARMA_DOMESTIC_PEER_VALUATION_CONTRACT_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "PEER_RELATIVE_VALUATION",
  cohort: {
    reviewedPrimarySubprofileMatchRequired: true,
    samePrimarySubprofileRequired: true,
    sectorOrIndustryMatchAloneSufficient: false,
    materialOverlayMatchAloneSufficient: false,
    emergingWatchEligibleAsPeerBasis: false,
    effectiveDatedAssignmentRequired: true,
    activeSecurityRequired: true,
    providerPeerLabelMayDefineCohort: false,
  },
  comparability: {
    sameMetricSemanticsRequired: true,
    samePeriodBasisRequired: true,
    currentAuthoritativeMarketPriceRequired: true,
    staleValuationEvidenceAllowed: false,
    negativeOrNonMeaningfulDenominatorsRequireExclusionOrExplicitTreatment: true,
    acquisitionAndOneOffNormalizationRequired: true,
  },
  methodology: {
    candidateEvidenceFamilies: ["PE_TTM", "EV_EBITDA"],
    approvedPeerMetricSetState: "UNAPPROVED",
    minimumPeerCountState: "UNAPPROVED",
    aggregationStatisticState: "UNAPPROVED",
    relativeBandsState: "UNAPPROVED",
    componentWeightState: "UNAPPROVED",
  },
  cohortBuilderImplemented: false,
  numericPeerCurveReady: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
