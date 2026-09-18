export const PHARMA_DOMESTIC_FCF_YIELD_CURVE_VERSION =
  "PHARMA_DOMESTIC_FCF_YIELD_CURVE_V1_PROPOSAL" as const

export interface PharmaDomesticFcfYieldBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
  readonly interpretation: string
}

export interface PharmaDomesticFcfYieldCurveProposal {
  readonly proposalVersion: typeof PHARMA_DOMESTIC_FCF_YIELD_CURVE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "CASH_FLOW_CORROBORATION"
  readonly metricCode: "FCF_YIELD_PERCENT"
  readonly statistic: "CURRENT_ANNUAL_FCF_YIELD_PERCENT"
  readonly bands: readonly PharmaDomesticFcfYieldBand[]
  readonly impliedFcfMultipleContext: {
    readonly fivePercentYieldApproxMultiple: 20
    readonly threePercentYieldApproxMultiple: 33.3
    readonly onePointFivePercentYieldApproxMultiple: 66.7
  }
  readonly negativeFcfScore: 20
  readonly absolutePeBandsUsed: false
  readonly standaloneValuationVerdictAllowed: false
  readonly peerRelativeComponentState: "UNAPPROVED"
  readonly componentWeightState: "UNAPPROVED"
  readonly wholeValuationDimensionReady: false
  readonly unsupportedPrimarySubprofilesFailClosed: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_FCF_YIELD_CURVE: PharmaDomesticFcfYieldCurveProposal = {
  proposalVersion: PHARMA_DOMESTIC_FCF_YIELD_CURVE_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "CASH_FLOW_CORROBORATION",
  metricCode: "FCF_YIELD_PERCENT",
  statistic: "CURRENT_ANNUAL_FCF_YIELD_PERCENT",
  bands: [
    { minimumInclusive: 5, score: 100, interpretation: "High cash-flow yield / strong valuation corroboration" },
    { minimumInclusive: 3, maximumExclusive: 5, score: 80, interpretation: "Good cash-flow yield / positive corroboration" },
    { minimumInclusive: 1.5, maximumExclusive: 3, score: 60, interpretation: "Moderate cash-flow yield / neutral-to-positive corroboration" },
    { minimumInclusive: 0, maximumExclusive: 1.5, score: 40, interpretation: "Low positive cash-flow yield / weak corroboration" },
    { maximumExclusive: 0, score: 20, interpretation: "Negative free cash flow / adverse corroboration" },
  ],
  impliedFcfMultipleContext: {
    fivePercentYieldApproxMultiple: 20,
    threePercentYieldApproxMultiple: 33.3,
    onePointFivePercentYieldApproxMultiple: 66.7,
  },
  negativeFcfScore: 20,
  absolutePeBandsUsed: false,
  standaloneValuationVerdictAllowed: false,
  peerRelativeComponentState: "UNAPPROVED",
  componentWeightState: "UNAPPROVED",
  wholeValuationDimensionReady: false,
  unsupportedPrimarySubprofilesFailClosed: true,
  activationApproved: false,
  scoreExecutionEnabled: false,
}
