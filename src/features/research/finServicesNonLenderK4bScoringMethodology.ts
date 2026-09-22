import {
  FIN_SERVICES_NON_LENDER_K4A_CONTRACT,
  type FinServicesNonLenderK4aSubprofile,
  resolveFinServicesNonLenderK4aSubprofile,
} from "./finServicesNonLenderK4aMethodologyContract"

export const FIN_SERVICES_NON_LENDER_K4B_SCORING_VERSION =
  "FIN_SERVICES_NON_LENDER_K4B_SCORING_V1" as const

export type FinServicesEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface FinServicesNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: FinServicesEvidenceState
}

export interface FinServicesScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly FinServicesNormalizedSignal[]
}

export interface FinServicesSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface FinServicesScoringResult {
  readonly version: typeof FIN_SERVICES_NON_LENDER_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: FinServicesNonLenderK4aSubprofile | null
  readonly state: "SCORE_READY" | "SCORE_NOT_COMPUTABLE" | "METHOD_NOT_AVAILABLE"
  readonly overallScore: number | null
  readonly dimensionScores: Readonly<Record<string, number | null>>
  readonly reasonCodes: readonly string[]
  readonly deterministic: true
  readonly readOnly: true
  readonly scorePersistenceEnabled: false
  readonly recommendationPersistenceEnabled: false
}

const WEIGHTS = {
  QUALITY: 13,
  GROWTH: 14,
  CAPITAL_EFFICIENCY: 10,
  CASH_FLOW: 10,
  BALANCE_SHEET_CREDIT: 8,
  BUSINESS_DURABILITY: 14,
  VALUATION: 12,
  MOMENTUM: 5,
  RISK: 10,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function commonRules(): FinServicesSignalRule[] {
  return [
    { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: WEIGHTS.VALUATION, minimumObservations: 3, normalizationAuthority: "SUBPROFILE_VALUATION_AUTHORITY" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "APPROVED_NON_LENDER_FINANCIAL_BENCHMARK" },
    { signalCode: "DRAWDOWN_VOLATILITY_RISK", dimensionCode: "RISK", dimensionWeight: WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "ABSOLUTE_AND_SUBPROFILE_RELATIVE_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: FinServicesNonLenderK4aSubprofile): readonly FinServicesSignalRule[] {
  const common = commonRules()
  if (subprofile === "CAPITAL_MARKETS_AMC") {
    return [
      ...common,
      { signalCode: "OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "SELF_HISTORY_AND_CAPITAL_MARKET_PEERS" },
      { signalCode: "AUM_CLIENT_ASSET_AND_EARNINGS_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "MARKET_CYCLE_NORMALIZED_GROWTH" },
      { signalCode: "ROE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "CYCLE_AWARE_RETURN_ON_CAPITAL" },
      { signalCode: "CFO_OR_FCF_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CASH_CONVERSION" },
      { signalCode: "NET_CASH_OR_LEVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 1, normalizationAuthority: "NON_LENDER_BALANCE_SHEET_SAFETY" },
      { signalCode: "CAPITAL_MARKETS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 8, normalizationAuthority: "AUM_CLIENT_ASSET_MARKET_SHARE_AND_DISTRIBUTION" },
    ]
  }

  if (subprofile === "INSURANCE") {
    return [
      ...common,
      { signalCode: "UNDERWRITING_OR_RESERVING_QUALITY", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "CLAIMS_LOSS_COMBINED_RATIO_AND_RESERVING" },
      { signalCode: "PREMIUM_OR_AUM_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "INSURANCE_GROWTH_WITH_MIX_CONTEXT" },
      { signalCode: "SOLVENCY_OR_CAPITAL_ADEQUACY", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 4, normalizationAuthority: "INSURANCE_CAPITAL_ADEQUACY" },
      { signalCode: "INSURANCE_CASH_OR_EARNINGS_QUALITY", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "INSURANCE_EARNINGS_CASH_CONTEXT" },
      { signalCode: "SOLVENCY_BALANCE_SHEET_BUFFER", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 4, normalizationAuthority: "SOLVENCY_AND_RESERVE_BUFFER" },
      { signalCode: "INSURANCE_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 8, normalizationAuthority: "PERSISTENCY_RENEWAL_DISTRIBUTION_UNDERWRITING" },
    ]
  }

  return [
    ...common,
    { signalCode: "CONTRIBUTION_MARGIN_OR_UNIT_ECONOMICS", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "PLATFORM_UNIT_ECONOMICS" },
    { signalCode: "REVENUE_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "PLATFORM_MULTI_PERIOD_GROWTH" },
    { signalCode: "CAPITAL_EFFICIENCY_OR_BURN_EFFICIENCY", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "CAPITAL_OR_CASH_BURN_EFFICIENCY" },
    { signalCode: "CFO_FCF_OR_CASH_BURN", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "FCF_OR_CASH_BURN_RUNWAY" },
    { signalCode: "NET_CASH_OR_FUNDING_RUNWAY", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 1, normalizationAuthority: "PLATFORM_FUNDING_SAFETY" },
    { signalCode: "FINTECH_PLATFORM_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 8, normalizationAuthority: "RETENTION_MONETIZATION_SCALE_REGULATORY_RESILIENCE" },
  ]
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreFinServicesNonLenderK4b(input: FinServicesScoringInput): FinServicesScoringResult {
  const subprofile = resolveFinServicesNonLenderK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: FIN_SERVICES_NON_LENDER_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["FIN_SERVICES_NON_LENDER_METHOD_NOT_AVAILABLE"],
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const rules = rulesFor(subprofile)
  const byCode = new Map(input.signals.map((signal) => [signal.signalCode, signal]))
  const failed: string[] = []

  for (const rule of rules) {
    const signal = byCode.get(rule.signalCode)
    if (!signal || signal.state !== "FRESH" || !validScore(signal.normalizedScore) || signal.observationCount < rule.minimumObservations) {
      failed.push(rule.signalCode)
    }
  }

  if (failed.length) {
    return {
      version: FIN_SERVICES_NON_LENDER_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile,
      state: "SCORE_NOT_COMPUTABLE",
      overallScore: null,
      dimensionScores: Object.fromEntries([...new Set(rules.map((rule) => rule.dimensionCode))].map((d) => [d, null])),
      reasonCodes: failed.map((code) => `MANDATORY_SIGNAL_NOT_READY:${code}`),
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const dimensionScores: Record<string, number | null> = {}
  for (const rule of rules) dimensionScores[rule.dimensionCode] = byCode.get(rule.signalCode)!.normalizedScore!

  const totalWeight = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  if (totalWeight !== 100) throw new Error("FIN_SERVICES_NON_LENDER dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`FIN_SERVICES_NON_LENDER dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0))

  return {
    version: FIN_SERVICES_NON_LENDER_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["FIN_SERVICES_NON_LENDER_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function finServicesNonLenderK4bSignalRules(subprofile: FinServicesNonLenderK4aSubprofile) {
  return rulesFor(subprofile)
}

export const FIN_SERVICES_NON_LENDER_K4B_SAFETY = {
  sourceCheckpointA: FIN_SERVICES_NON_LENDER_K4A_CONTRACT.version,
  lenderMetricInheritance: false,
  noMissingInputRenormalization: true,
  noCrossSubprofilePercentiles: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
