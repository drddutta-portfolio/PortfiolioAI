export const PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT_VERSION =
  "PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT_V1_PROPOSAL" as const

export type PharmaDomesticPeerValuationMetric = "PE_TTM" | "EV_EBITDA"

export interface PharmaDomesticPeerRelativeBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
  readonly interpretation: string
}

export interface PharmaDomesticPeerPremiumDiscountProposal {
  readonly proposalVersion: typeof PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly canonicalDimension: "VALUATION"
  readonly component: "PEER_RELATIVE_VALUATION"
  readonly metricFamilies: readonly ["PE_TTM", "EV_EBITDA"]
  readonly formula: "(PEER_MEDIAN_MULTIPLE / TARGET_MULTIPLE - 1) * 100"
  readonly signConvention: {
    readonly positiveMeans: "TARGET_DISCOUNT_TO_PEER_MEDIAN"
    readonly negativeMeans: "TARGET_PREMIUM_TO_PEER_MEDIAN"
    readonly zeroMeans: "AT_PEER_MEDIAN"
  }
  readonly denominatorRequirements: {
    readonly targetMultipleMustBeFiniteAndPositive: true
    readonly peerMedianMustBeFiniteAndPositive: true
    readonly invalidOrNonMeaningfulMultipleFailsClosed: true
  }
  readonly bands: readonly PharmaDomesticPeerRelativeBand[]
  readonly sameBandsUsedForPeAndEvEbitda: true
  readonly crossMetricAveragingApproved: false
  readonly peEvEbitdaWeightingApproved: false
  readonly peerComponentScoreReady: false
  readonly wholeValuationDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT: PharmaDomesticPeerPremiumDiscountProposal = {
  proposalVersion: PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT_VERSION,
  state: "PROPOSAL_ONLY",
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS",
  canonicalDimension: "VALUATION",
  component: "PEER_RELATIVE_VALUATION",
  metricFamilies: ["PE_TTM", "EV_EBITDA"],
  formula: "(PEER_MEDIAN_MULTIPLE / TARGET_MULTIPLE - 1) * 100",
  signConvention: {
    positiveMeans: "TARGET_DISCOUNT_TO_PEER_MEDIAN",
    negativeMeans: "TARGET_PREMIUM_TO_PEER_MEDIAN",
    zeroMeans: "AT_PEER_MEDIAN",
  },
  denominatorRequirements: {
    targetMultipleMustBeFiniteAndPositive: true,
    peerMedianMustBeFiniteAndPositive: true,
    invalidOrNonMeaningfulMultipleFailsClosed: true,
  },
  bands: [
    { minimumInclusive: 25, score: 100, interpretation: "Large discount to comparable peer median" },
    { minimumInclusive: 10, maximumExclusive: 25, score: 80, interpretation: "Meaningful discount to comparable peer median" },
    { minimumInclusive: -5, maximumExclusive: 10, score: 60, interpretation: "Near peer median / neutral relative valuation" },
    { minimumInclusive: -20, maximumExclusive: -5, score: 40, interpretation: "Meaningful premium to comparable peer median" },
    { maximumExclusive: -20, score: 20, interpretation: "Large premium to comparable peer median" },
  ],
  sameBandsUsedForPeAndEvEbitda: true,
  crossMetricAveragingApproved: false,
  peEvEbitdaWeightingApproved: false,
  peerComponentScoreReady: false,
  wholeValuationDimensionReady: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export interface PharmaDomesticPeerPremiumDiscountResult {
  readonly metricCode: PharmaDomesticPeerValuationMetric
  readonly targetMultiple: number
  readonly peerMedianMultiple: number
  readonly relativeDiscountPercent: number
}

export function calculateDomesticPeerRelativeDiscount(
  metricCode: PharmaDomesticPeerValuationMetric,
  targetMultiple: number,
  peerMedianMultiple: number,
): PharmaDomesticPeerPremiumDiscountResult | null {
  if (!Number.isFinite(targetMultiple) || targetMultiple <= 0) return null
  if (!Number.isFinite(peerMedianMultiple) || peerMedianMultiple <= 0) return null

  const relativeDiscountPercent = (peerMedianMultiple / targetMultiple - 1) * 100
  if (!Number.isFinite(relativeDiscountPercent)) return null

  return {
    metricCode,
    targetMultiple,
    peerMedianMultiple,
    relativeDiscountPercent,
  }
}

export function scoreDomesticPeerRelativeDiscount(relativeDiscountPercent: number): number | null {
  if (!Number.isFinite(relativeDiscountPercent)) return null

  for (const band of PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.bands) {
    const meetsMinimum =
      band.minimumInclusive === undefined || relativeDiscountPercent >= band.minimumInclusive
    const meetsMaximum =
      band.maximumExclusive === undefined || relativeDiscountPercent < band.maximumExclusive
    if (meetsMinimum && meetsMaximum) return band.score
  }

  return null
}
