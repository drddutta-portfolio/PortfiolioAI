import {
  IT_TECH_K4A_CONTRACT,
  type ItTechSubprofile,
  resolveItTechK4aSubprofile,
} from "./itTechK4aMethodologyContract"

export const IT_TECH_K4B_SCORING_VERSION = "IT_TECH_K4B_SCORING_V1" as const

export type ItTechEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface ItTechNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: ItTechEvidenceState
}

export interface ItTechScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly ItTechNormalizedSignal[]
}

export interface ItTechSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly signalWeightWithinDimension: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface ItTechScoringResult {
  readonly version: typeof IT_TECH_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: ItTechSubprofile | null
  readonly state: "SCORE_READY" | "SCORE_NOT_COMPUTABLE" | "METHOD_NOT_AVAILABLE"
  readonly overallScore: number | null
  readonly dimensionScores: Readonly<Record<string, number | null>>
  readonly reasonCodes: readonly string[]
  readonly deterministic: true
  readonly readOnly: true
  readonly scorePersistenceEnabled: false
  readonly recommendationPersistenceEnabled: false
}

const COMMON_DIMENSION_WEIGHTS = {
  QUALITY: 15,
  GROWTH: 15,
  CAPITAL_EFFICIENCY: 10,
  CASH_FLOW: 12,
  BALANCE_SHEET_CREDIT: 8,
  BUSINESS_DURABILITY: 12,
  VALUATION: 12,
  MOMENTUM: 6,
  RISK: 5,
  OWNERSHIP_GOVERNANCE: 5,
} as const

function rulesFor(subprofile: ItTechSubprofile): readonly ItTechSignalRule[] {
  const common: ItTechSignalRule[] = [
    { signalCode: "REVENUE_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: COMMON_DIMENSION_WEIGHTS.GROWTH, signalWeightWithinDimension: 100, minimumObservations: 8, normalizationAuthority: "SELF_HISTORY_AND_SUBPROFILE_PEER_RELATIVE" },
    { signalCode: "OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: COMMON_DIMENSION_WEIGHTS.QUALITY, signalWeightWithinDimension: 100, minimumObservations: 8, normalizationAuthority: "SELF_HISTORY_AND_SUBPROFILE_PEER_RELATIVE" },
    { signalCode: "ROCE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: COMMON_DIMENSION_WEIGHTS.CAPITAL_EFFICIENCY, signalWeightWithinDimension: 100, minimumObservations: 3, normalizationAuthority: "ABSOLUTE_PLUS_SUBPROFILE_PEER_RELATIVE" },
    { signalCode: "NET_CASH_OR_LEVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: COMMON_DIMENSION_WEIGHTS.BALANCE_SHEET_CREDIT, signalWeightWithinDimension: 100, minimumObservations: 1, normalizationAuthority: "ABSOLUTE_SAFETY_BANDS" },
    { signalCode: "BUSINESS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: COMMON_DIMENSION_WEIGHTS.BUSINESS_DURABILITY, signalWeightWithinDimension: 100, minimumObservations: 1, normalizationAuthority: "SUBPROFILE_DURABILITY_EVIDENCE_CONTRACT" },
    { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: COMMON_DIMENSION_WEIGHTS.VALUATION, signalWeightWithinDimension: 100, minimumObservations: 3, normalizationAuthority: "SUBPROFILE_VALUATION_AUTHORITY" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: COMMON_DIMENSION_WEIGHTS.MOMENTUM, signalWeightWithinDimension: 100, minimumObservations: 252, normalizationAuthority: "NIFTY_IT_OR_APPROVED_SIZE_MATCHED_BENCHMARK" },
    { signalCode: "DRAWDOWN_VOLATILITY_RISK", dimensionCode: "RISK", dimensionWeight: COMMON_DIMENSION_WEIGHTS.RISK, signalWeightWithinDimension: 100, minimumObservations: 252, normalizationAuthority: "ABSOLUTE_AND_SUBPROFILE_RELATIVE_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: COMMON_DIMENSION_WEIGHTS.OWNERSHIP_GOVERNANCE, signalWeightWithinDimension: 100, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]

  if (subprofile === "IT_SERVICES") {
    return [
      ...common,
      { signalCode: "FCF_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: COMMON_DIMENSION_WEIGHTS.CASH_FLOW, signalWeightWithinDimension: 100, minimumObservations: 3, normalizationAuthority: "CFO_OR_FCF_CONVERSION_SELF_AND_PEER_RELATIVE" },
    ]
  }

  if (subprofile === "SOFTWARE_PRODUCTS_PLATFORMS") {
    return [
      ...common,
      { signalCode: "FCF_OR_CASH_BURN", dimensionCode: "CASH_FLOW", dimensionWeight: COMMON_DIMENSION_WEIGHTS.CASH_FLOW, signalWeightWithinDimension: 100, minimumObservations: 3, normalizationAuthority: "FCF_YIELD_OR_CASH_BURN_RUNWAY" },
    ]
  }

  return [
    ...common,
    { signalCode: "WORKING_CAPITAL_AND_CASH_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: COMMON_DIMENSION_WEIGHTS.CASH_FLOW, signalWeightWithinDimension: 100, minimumObservations: 3, normalizationAuthority: "WORKING_CAPITAL_AND_CFO_CONVERSION" },
  ]
}

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function validNormalizedScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreItTechK4b(input: ItTechScoringInput): ItTechScoringResult {
  const subprofile = resolveItTechK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: IT_TECH_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["IT_TECH_INDUSTRY_METHOD_NOT_AVAILABLE"],
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const byCode = new Map(input.signals.map((signal) => [signal.signalCode, signal]))
  const rules = rulesFor(subprofile)
  const failed: string[] = []

  for (const rule of rules) {
    const signal = byCode.get(rule.signalCode)
    if (!signal || signal.state !== "FRESH" || !validNormalizedScore(signal.normalizedScore) || signal.observationCount < rule.minimumObservations) {
      failed.push(rule.signalCode)
    }
  }

  if (failed.length > 0) {
    return {
      version: IT_TECH_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile,
      state: "SCORE_NOT_COMPUTABLE",
      overallScore: null,
      dimensionScores: Object.fromEntries([...new Set(rules.map((rule) => rule.dimensionCode))].map((dimension) => [dimension, null])),
      reasonCodes: failed.map((code) => `MANDATORY_SIGNAL_NOT_READY:${code}`),
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const dimensionCodes = [...new Set(rules.map((rule) => rule.dimensionCode))]
  const dimensionScores: Record<string, number | null> = {}
  for (const dimensionCode of dimensionCodes) {
    const dimensionRules = rules.filter((rule) => rule.dimensionCode === dimensionCode)
    const totalSignalWeight = dimensionRules.reduce((sum, rule) => sum + rule.signalWeightWithinDimension, 0)
    if (totalSignalWeight !== 100) throw new Error(`IT_TECH dimension ${dimensionCode} signal weights must equal 100`)
    dimensionScores[dimensionCode] = dimensionRules.reduce((sum, rule) => {
      const signal = byCode.get(rule.signalCode)!
      return sum + signal.normalizedScore! * rule.signalWeightWithinDimension / 100
    }, 0)
  }

  const totalDimensionWeight = Object.values(COMMON_DIMENSION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  if (totalDimensionWeight !== 100) throw new Error("IT_TECH dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(COMMON_DIMENSION_WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const value = dimensionScores[dimensionCode]
    if (value === null || value === undefined) throw new Error(`IT_TECH dimension ${dimensionCode} is not computable`)
    return sum + value * weight / 100
  }, 0))

  return {
    version: IT_TECH_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["IT_TECH_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function itTechK4bSignalRules(subprofile: ItTechSubprofile) {
  return rulesFor(subprofile)
}

export const IT_TECH_K4B_SAFETY = {
  sourceCheckpointA: IT_TECH_K4A_CONTRACT.version,
  noMissingInputRenormalization: true,
  noCrossSubprofilePercentiles: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
