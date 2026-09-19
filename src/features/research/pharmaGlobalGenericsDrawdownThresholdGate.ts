export const PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsDrawdownThresholdGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "RISK"
  readonly metricCode: "MAX_DRAWDOWN_1Y"
  readonly metricDefinition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE"
  readonly unit: "PERCENT"
  readonly direction: "LOWER_ABSOLUTE_LOSS_BETTER"
  readonly approvedBands: null
  readonly requiredApprovalProperties: {
    readonly monotonic: true
    readonly nonOverlapping: true
    readonly exhaustiveAcrossValidRange: true
    readonly validRangeMinimumPercent: -100
    readonly validRangeMaximumPercent: 0
    readonly zeroRepresentsNoObservedDrawdown: true
    readonly worseDrawdownCannotReceiveHigherScore: true
    readonly explicitlyVersioned: true
    readonly ownerApprovalRequired: true
  }
  readonly prohibitedDefaults: {
    readonly bankNbfcBandsMayBeInherited: false
    readonly equalWidthBandsMayBeAssumed: false
    readonly percentileBandsMayBeAssumed: false
    readonly benchmarkRelativeBandsMayBeAssumed: false
    readonly hiddenClippingAllowed: false
  }
  readonly candidateMethodologiesAreNotApprovedDefaults: true
  readonly candidateMethodologies: readonly [
    "ABSOLUTE_ECONOMIC_BANDS",
    "PHARMA_EMPIRICAL_DISTRIBUTION_BANDS",
    "HYBRID_ABSOLUTE_PLUS_EMPIRICAL_BANDS",
  ]
  readonly numericCurveReady: false
  readonly wholeRiskDimensionReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE:
  PharmaGlobalGenericsDrawdownThresholdGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_DRAWDOWN_THRESHOLD_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "RISK",
    metricCode: "MAX_DRAWDOWN_1Y",
    metricDefinition: "TRAILING_1Y_MAX_PEAK_TO_TROUGH_DAILY_CLOSE",
    unit: "PERCENT",
    direction: "LOWER_ABSOLUTE_LOSS_BETTER",
    approvedBands: null,
    requiredApprovalProperties: {
      monotonic: true,
      nonOverlapping: true,
      exhaustiveAcrossValidRange: true,
      validRangeMinimumPercent: -100,
      validRangeMaximumPercent: 0,
      zeroRepresentsNoObservedDrawdown: true,
      worseDrawdownCannotReceiveHigherScore: true,
      explicitlyVersioned: true,
      ownerApprovalRequired: true,
    },
    prohibitedDefaults: {
      bankNbfcBandsMayBeInherited: false,
      equalWidthBandsMayBeAssumed: false,
      percentileBandsMayBeAssumed: false,
      benchmarkRelativeBandsMayBeAssumed: false,
      hiddenClippingAllowed: false,
    },
    candidateMethodologiesAreNotApprovedDefaults: true,
    candidateMethodologies: [
      "ABSOLUTE_ECONOMIC_BANDS",
      "PHARMA_EMPIRICAL_DISTRIBUTION_BANDS",
      "HYBRID_ABSOLUTE_PLUS_EMPIRICAL_BANDS",
    ],
    numericCurveReady: false,
    wholeRiskDimensionReady: false,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function isStructurallyValidGlobalGenericsDrawdownBandCandidate(
  thresholdsDescendingTowardZero: readonly number[],
): boolean {
  if (!thresholdsDescendingTowardZero.length) return false
  if (thresholdsDescendingTowardZero.some((value) => !Number.isFinite(value) || value < -100 || value > 0)) {
    return false
  }

  for (let index = 1; index < thresholdsDescendingTowardZero.length; index += 1) {
    const previous = thresholdsDescendingTowardZero[index - 1]
    const current = thresholdsDescendingTowardZero[index]
    if (previous === undefined || current === undefined || current <= previous) return false
  }

  return true
}
