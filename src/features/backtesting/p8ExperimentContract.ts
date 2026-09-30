export const P8_EXPERIMENT_CONTRACT_VERSION = "P8_EXPERIMENT_BIAS_CONTROL_V1" as const

export const P8_EXCLUSION_REASONS = [
  "UNIVERSE_MEMBERSHIP_NOT_PROVEN",
  "LISTING_VALIDITY_NOT_PROVEN",
  "DELISTING_STATUS_NOT_PROVEN",
  "PUBLICATION_TIME_UNKNOWN",
  "AVAILABILITY_TIME_UNKNOWN",
  "SOURCE_IDENTITY_MISSING",
  "OBSERVED_AFTER_DECISION",
  "PUBLISHED_NOT_STRICTLY_BEFORE_DECISION",
  "CAPTURED_AFTER_DECISION_WITHOUT_ARCHIVE",
  "CORPORATE_ACTION_HISTORY_INCOMPLETE",
  "ADJUSTED_PRICE_UNAVAILABLE",
  "BENCHMARK_UNAVAILABLE",
  "FUNDAMENTAL_REQUIREMENT_MISSING",
  "DOCUMENT_REQUIREMENT_MISSING",
  "CLASSIFICATION_VALIDITY_UNPROVEN",
  "METHODOLOGY_VALIDITY_UNPROVEN",
  "ASSIGNMENT_VALIDITY_UNPROVEN",
  "STALE_EVIDENCE",
  "REVIEW_REQUIRED",
  "CONFLICTING_EVIDENCE",
  "INSUFFICIENT_EVIDENCE",
  "OUTCOME_WINDOW_INCOMPLETE",
  "LIQUIDITY_LIMIT_EXCEEDED",
] as const

export type P8ExclusionReason = typeof P8_EXCLUSION_REASONS[number]

export type P8ExperimentPartition = "DEVELOPMENT" | "VALIDATION" | "HOLDOUT"

export interface P8ExperimentContract {
  readonly version: typeof P8_EXPERIMENT_CONTRACT_VERSION
  readonly experimentId: string
  readonly methodologyVersion: string
  readonly universeVersion: string
  readonly classificationVersion: string
  readonly benchmarkVersion: string
  readonly costModelVersion: string
  readonly decisionCalendarVersion: string
  readonly exclusionRegistryVersion: string
  readonly universe: {
    readonly assetClass: "EQUITY"
    readonly exchange: "NSE"
    readonly authority: "OFFICIAL_NSE_LISTING_DELISTING"
    readonly survivorFreeRequired: true
    readonly currentHoldingsAsHistoricalUniverseProhibited: true
  }
  readonly period: {
    readonly startDate: "2023-10-01"
    readonly endDate: "2026-09-30"
    readonly targetMonthlyDecisionDates: 36
    readonly minimumProvenDecisionDates: 24
    readonly stopIfMinimumNotMet: true
  }
  readonly decisionCalendar: {
    readonly cadence: "MONTHLY"
    readonly sessionRule: "LAST_ELIGIBLE_NSE_TRADING_SESSION"
    readonly evaluationMoment: "AFTER_MARKET_CLOSE"
    readonly timeZone: "Asia/Kolkata"
  }
  readonly signalLag: {
    readonly rule: "FIRST_DECISION_STRICTLY_AFTER_PROVABLE_PUBLICATION_AND_AVAILABILITY"
    readonly equalityAtDecisionIsEligible: false
    readonly unknownPublicationIsEligible: false
    readonly unknownAvailabilityIsEligible: false
  }
  readonly outcomes: {
    readonly returnDefinition: "TOTAL_RETURN"
    readonly primaryHorizonMonths: 6
    readonly secondaryHorizonMonths: readonly [1, 3, 12]
    readonly incompleteForwardWindowBehavior: "EXCLUDE_SECURITY_DATE_HORIZON"
    readonly outcomeMustStartAfterDecision: true
  }
  readonly benchmarks: {
    readonly primary: "NIFTY_500_TOTAL_RETURN_INDEX"
    readonly primaryAuthority: "APPROVED_DATED_NIFTY_500_TRI_AUTHORITY"
    readonly priceOnlyMaySubstituteForTotalReturn: false
    readonly sectorBenchmarkPolicy: "HISTORICAL_SECTOR_TRI_ONLY_WITH_POINT_IN_TIME_CLASSIFICATION_AND_MAPPING"
    readonly currency: "INR"
  }
  readonly corporateActions: {
    readonly authority: "OFFICIAL_NSE_OR_COMPANY_CORPORATE_ACTION_EVIDENCE"
    readonly rawOhlcvImmutable: true
    readonly adjustedSeriesDerivedAndVersioned: true
    readonly unexplainedDiscontinuityAutoClassifiedAsAction: false
  }
  readonly fundamentalsAndDocuments: {
    readonly structuredFundamentalPolicy: "LICENSED_STRUCTURED_HISTORY_WITH_PROVABLE_PUBLICATION_AVAILABILITY"
    readonly documentAuthority: "OFFICIAL_NSE_BSE_OR_COMPANY_FILINGS"
    readonly immutableSourceIdentityRequired: true
    readonly unknownPublicationBehavior: "INELIGIBLE"
    readonly archiveIsCalculationAuthority: false
  }
  readonly missingData: {
    readonly policy: "FAIL_CLOSED_PER_SECURITY_DATE_REQUIREMENT"
    readonly crossSecurityImputationAllowed: false
    readonly unknownConvertedToZero: false
  }
  readonly historicalValidity: {
    readonly classificationBackdatingWithoutDatedEvidenceAllowed: false
    readonly methodologyBackdatingWithoutDatedEvidenceAllowed: false
    readonly assignmentBackdatingWithoutDatedEvidenceAllowed: false
  }
  readonly split: {
    readonly developmentPercent: 60
    readonly validationPercent: 20
    readonly holdoutPercent: 20
    readonly chronologyRequired: true
    readonly roundingRule: "FLOOR_DEVELOPMENT_AND_VALIDATION_REMAINDER_HOLDOUT"
    readonly holdoutMayBeInspectedDuringDevelopment: false
  }
  readonly multipleTesting: {
    readonly primaryExperimentFrozenBeforeOutcomes: true
    readonly allVariantsDisclosed: true
    readonly winningVariantMayReplaceFrozenPrimaryAutomatically: false
    readonly contractChangeRequiresNewExperimentVersion: true
    readonly originalHoldoutResultRemainsImmutable: true
  }
  readonly costs: {
    readonly brokeragePolicy: "DATED_BROKER_SCHEDULE_REQUIRED_ZERO_ONLY_WHEN_CONTEMPORANEOUS_RULE_PROVES_ZERO"
    readonly statutoryChargesPolicy: "DATED_AUDITABLE_STATUTORY_AND_EXCHANGE_SCHEDULE_BY_TRADE_DATE"
    readonly baseSlippageBpsPerExecutedSide: 10
    readonly liquidityLookbackSessions: 20
    readonly maxOrderShareOfMedianTradedValuePercent: 5
    readonly turnoverReporting: "GROSS_AND_NET_EVERY_REBALANCE"
    readonly zeroCostResultUse: "SEPARATELY_LABELLED_SENSITIVITY_ONLY"
  }
  readonly providerExecution: {
    readonly p8B1ProviderCallsAllowed: false
    readonly futureCampaignMode: "CACHE_FIRST_BOUNDED_OWNER_APPROVED"
    readonly proposedTrendlynePlannedAttemptsPerDay: 320
    readonly proposedTrendlyneReservedAttemptsPerDay: 80
  }
  readonly governance: {
    readonly livePolicyMutationAllowed: false
    readonly automaticPromotionToLivePolicyAllowed: false
    readonly performanceClaimsAllowedBeforeP8BFinal: false
    readonly p8CAllowedBeforeP8BFinalOwnerApproval: false
    readonly productionChangeAllowed: false
    readonly mainChangeAllowed: false
  }
}

export const P8_EXPERIMENT_CONTRACT: P8ExperimentContract = {
  version: P8_EXPERIMENT_CONTRACT_VERSION,
  experimentId: "P8_EXP_NSE_MONTHLY_6M_V1",
  methodologyVersion: "P8_R6_R10_REPLAY_V1",
  universeVersion: "P8_NSE_HISTORICAL_UNIVERSE_V1",
  classificationVersion: "P8_HISTORICAL_CLASSIFICATION_V1",
  benchmarkVersion: "P8_NIFTY500_TRI_V1",
  costModelVersion: "P8_COST_MODEL_V1",
  decisionCalendarVersion: "P8_MONTH_END_IST_V1",
  exclusionRegistryVersion: "P8_EXCLUSION_REGISTRY_V1",
  universe: {
    assetClass: "EQUITY",
    exchange: "NSE",
    authority: "OFFICIAL_NSE_LISTING_DELISTING",
    survivorFreeRequired: true,
    currentHoldingsAsHistoricalUniverseProhibited: true,
  },
  period: {
    startDate: "2023-10-01",
    endDate: "2026-09-30",
    targetMonthlyDecisionDates: 36,
    minimumProvenDecisionDates: 24,
    stopIfMinimumNotMet: true,
  },
  decisionCalendar: {
    cadence: "MONTHLY",
    sessionRule: "LAST_ELIGIBLE_NSE_TRADING_SESSION",
    evaluationMoment: "AFTER_MARKET_CLOSE",
    timeZone: "Asia/Kolkata",
  },
  signalLag: {
    rule: "FIRST_DECISION_STRICTLY_AFTER_PROVABLE_PUBLICATION_AND_AVAILABILITY",
    equalityAtDecisionIsEligible: false,
    unknownPublicationIsEligible: false,
    unknownAvailabilityIsEligible: false,
  },
  outcomes: {
    returnDefinition: "TOTAL_RETURN",
    primaryHorizonMonths: 6,
    secondaryHorizonMonths: [1, 3, 12],
    incompleteForwardWindowBehavior: "EXCLUDE_SECURITY_DATE_HORIZON",
    outcomeMustStartAfterDecision: true,
  },
  benchmarks: {
    primary: "NIFTY_500_TOTAL_RETURN_INDEX",
    primaryAuthority: "APPROVED_DATED_NIFTY_500_TRI_AUTHORITY",
    priceOnlyMaySubstituteForTotalReturn: false,
    sectorBenchmarkPolicy: "HISTORICAL_SECTOR_TRI_ONLY_WITH_POINT_IN_TIME_CLASSIFICATION_AND_MAPPING",
    currency: "INR",
  },
  corporateActions: {
    authority: "OFFICIAL_NSE_OR_COMPANY_CORPORATE_ACTION_EVIDENCE",
    rawOhlcvImmutable: true,
    adjustedSeriesDerivedAndVersioned: true,
    unexplainedDiscontinuityAutoClassifiedAsAction: false,
  },
  fundamentalsAndDocuments: {
    structuredFundamentalPolicy: "LICENSED_STRUCTURED_HISTORY_WITH_PROVABLE_PUBLICATION_AVAILABILITY",
    documentAuthority: "OFFICIAL_NSE_BSE_OR_COMPANY_FILINGS",
    immutableSourceIdentityRequired: true,
    unknownPublicationBehavior: "INELIGIBLE",
    archiveIsCalculationAuthority: false,
  },
  missingData: {
    policy: "FAIL_CLOSED_PER_SECURITY_DATE_REQUIREMENT",
    crossSecurityImputationAllowed: false,
    unknownConvertedToZero: false,
  },
  historicalValidity: {
    classificationBackdatingWithoutDatedEvidenceAllowed: false,
    methodologyBackdatingWithoutDatedEvidenceAllowed: false,
    assignmentBackdatingWithoutDatedEvidenceAllowed: false,
  },
  split: {
    developmentPercent: 60,
    validationPercent: 20,
    holdoutPercent: 20,
    chronologyRequired: true,
    roundingRule: "FLOOR_DEVELOPMENT_AND_VALIDATION_REMAINDER_HOLDOUT",
    holdoutMayBeInspectedDuringDevelopment: false,
  },
  multipleTesting: {
    primaryExperimentFrozenBeforeOutcomes: true,
    allVariantsDisclosed: true,
    winningVariantMayReplaceFrozenPrimaryAutomatically: false,
    contractChangeRequiresNewExperimentVersion: true,
    originalHoldoutResultRemainsImmutable: true,
  },
  costs: {
    brokeragePolicy: "DATED_BROKER_SCHEDULE_REQUIRED_ZERO_ONLY_WHEN_CONTEMPORANEOUS_RULE_PROVES_ZERO",
    statutoryChargesPolicy: "DATED_AUDITABLE_STATUTORY_AND_EXCHANGE_SCHEDULE_BY_TRADE_DATE",
    baseSlippageBpsPerExecutedSide: 10,
    liquidityLookbackSessions: 20,
    maxOrderShareOfMedianTradedValuePercent: 5,
    turnoverReporting: "GROSS_AND_NET_EVERY_REBALANCE",
    zeroCostResultUse: "SEPARATELY_LABELLED_SENSITIVITY_ONLY",
  },
  providerExecution: {
    p8B1ProviderCallsAllowed: false,
    futureCampaignMode: "CACHE_FIRST_BOUNDED_OWNER_APPROVED",
    proposedTrendlynePlannedAttemptsPerDay: 320,
    proposedTrendlyneReservedAttemptsPerDay: 80,
  },
  governance: {
    livePolicyMutationAllowed: false,
    automaticPromotionToLivePolicyAllowed: false,
    performanceClaimsAllowedBeforeP8BFinal: false,
    p8CAllowedBeforeP8BFinalOwnerApproval: false,
    productionChangeAllowed: false,
    mainChangeAllowed: false,
  },
}

function parseTime(value: string | null): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

export interface P8StrictAvailabilityInput {
  readonly decisionAt: string | null
  readonly publishedAt: string | null
  readonly availableAt: string | null
}

export interface P8StrictAvailabilityResult {
  readonly eligible: boolean
  readonly reasons: readonly Extract<
    P8ExclusionReason,
    "PUBLICATION_TIME_UNKNOWN" | "AVAILABILITY_TIME_UNKNOWN" | "PUBLISHED_NOT_STRICTLY_BEFORE_DECISION"
  >[]
}

export function evaluateP8StrictAvailability(input: P8StrictAvailabilityInput): P8StrictAvailabilityResult {
  const decision = parseTime(input.decisionAt)
  const published = parseTime(input.publishedAt)
  const available = parseTime(input.availableAt)
  const reasons: P8StrictAvailabilityResult["reasons"][number][] = []

  if (published === null) reasons.push("PUBLICATION_TIME_UNKNOWN")
  if (available === null) reasons.push("AVAILABILITY_TIME_UNKNOWN")

  if (
    decision !== null
    && ((published !== null && published >= decision) || (available !== null && available >= decision))
  ) {
    reasons.push("PUBLISHED_NOT_STRICTLY_BEFORE_DECISION")
  }

  return { eligible: decision !== null && reasons.length === 0, reasons }
}

export interface P8SplitBoundaries {
  readonly total: number
  readonly developmentCount: number
  readonly validationCount: number
  readonly holdoutCount: number
}

export function calculateP8SplitBoundaries(totalEligibleDecisionDates: number): P8SplitBoundaries {
  if (!Number.isInteger(totalEligibleDecisionDates) || totalEligibleDecisionDates < 0) {
    throw new RangeError("totalEligibleDecisionDates must be a non-negative integer")
  }

  const developmentCount = Math.floor(totalEligibleDecisionDates * 0.6)
  const validationCount = Math.floor(totalEligibleDecisionDates * 0.2)
  const holdoutCount = totalEligibleDecisionDates - developmentCount - validationCount

  return { total: totalEligibleDecisionDates, developmentCount, validationCount, holdoutCount }
}

export function partitionP8DecisionIndex(index: number, totalEligibleDecisionDates: number): P8ExperimentPartition {
  if (!Number.isInteger(index) || index < 0 || index >= totalEligibleDecisionDates) {
    throw new RangeError("index must reference an eligible decision date")
  }

  const boundaries = calculateP8SplitBoundaries(totalEligibleDecisionDates)
  if (index < boundaries.developmentCount) return "DEVELOPMENT"
  if (index < boundaries.developmentCount + boundaries.validationCount) return "VALIDATION"
  return "HOLDOUT"
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  return value
}

export function serializeP8ExperimentContract(contract: P8ExperimentContract = P8_EXPERIMENT_CONTRACT): string {
  return JSON.stringify(canonicalize(contract))
}

export async function fingerprintP8ExperimentContract(
  contract: P8ExperimentContract = P8_EXPERIMENT_CONTRACT,
): Promise<string> {
  const bytes = new TextEncoder().encode(serializeP8ExperimentContract(contract))
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes)
  const hex = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
  return `sha256:${hex}`
}
