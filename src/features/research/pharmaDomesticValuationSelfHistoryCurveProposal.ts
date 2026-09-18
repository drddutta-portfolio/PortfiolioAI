export const PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE_VERSION =
  "PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_V1_PROPOSAL" as const

export interface PharmaDomesticValuationSelfHistoryBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
}

export interface PharmaDomesticValuationSelfHistoryCurveProposal {
  readonly proposalVersion: typeof PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly metricCode: "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT"
  readonly canonicalDimension: "VALUATION"
  readonly statistic: "CURRENT_PE_VS_5Y_AVERAGE_PE_IMPLIED_UPSIDE_PERCENT"
  readonly history: {
    readonly preferredSelfHistoryYears: 5
    readonly currentAuthoritativeMarketPriceRequired: true
    readonly currentReviewedEarningsRequired: true
    readonly stalePriceAllowed: false
    readonly providerLabelMayOverridePriceAuthority: false
  }
  readonly bands: readonly PharmaDomesticValuationSelfHistoryBand[]
  readonly absolutePeBandUsed: false
  readonly bankNbfcDimensionWeightsInherited: false
  readonly bankPbOrRoeLogicInherited: false
  readonly peerRelativeComponentState: "UNAPPROVED"
  readonly fcfCorroborationComponentState: "UNAPPROVED"
  readonly wholeValuationDimensionReady: false
  readonly unsupportedPrimarySubprofilesFailClosed: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE: PharmaDomesticValuationSelfHistoryCurveProposal = {
  proposalVersion: PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  metricCode: "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT",
  canonicalDimension: "VALUATION",
  statistic: "CURRENT_PE_VS_5Y_AVERAGE_PE_IMPLIED_UPSIDE_PERCENT",
  history: {
    preferredSelfHistoryYears: 5,
    currentAuthoritativeMarketPriceRequired: true,
    currentReviewedEarningsRequired: true,
    stalePriceAllowed: false,
    providerLabelMayOverridePriceAuthority: false,
  },
  bands: [
    { minimumInclusive: 25, score: 100 },
    { minimumInclusive: 10, maximumExclusive: 25, score: 80 },
    { minimumInclusive: -5, maximumExclusive: 10, score: 60 },
    { minimumInclusive: -20, maximumExclusive: -5, score: 40 },
    { maximumExclusive: -20, score: 20 },
  ],
  absolutePeBandUsed: false,
  bankNbfcDimensionWeightsInherited: false,
  bankPbOrRoeLogicInherited: false,
  peerRelativeComponentState: "UNAPPROVED",
  fcfCorroborationComponentState: "UNAPPROVED",
  wholeValuationDimensionReady: false,
  unsupportedPrimarySubprofilesFailClosed: true,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
