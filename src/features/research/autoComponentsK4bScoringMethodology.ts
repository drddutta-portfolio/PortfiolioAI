import {
  AUTO_COMPONENTS_K4A_CONTRACT,
  type AutoK4aSubprofile,
  resolveAutoK4aSubprofile,
} from "./autoComponentsK4aMethodologyContract"

export const AUTO_COMPONENTS_K4B_SCORING_VERSION =
  "AUTO_COMPONENTS_K4B_SCORING_V1" as const

export type AutoEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface AutoNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: AutoEvidenceState
}

export interface AutoScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly AutoNormalizedSignal[]
}

export interface AutoSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface AutoScoringResult {
  readonly version: typeof AUTO_COMPONENTS_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: AutoK4aSubprofile | null
  readonly state: "SCORE_READY" | "SCORE_NOT_COMPUTABLE" | "METHOD_NOT_AVAILABLE"
  readonly overallScore: number | null
  readonly dimensionScores: Readonly<Record<string, number | null>>
  readonly reasonCodes: readonly string[]
  readonly deterministic: true
  readonly readOnly: true
  readonly scorePersistenceEnabled: false
  readonly recommendationPersistenceEnabled: false
}

const DIMENSION_WEIGHTS = {
  QUALITY: 14,
  GROWTH: 14,
  CAPITAL_EFFICIENCY: 11,
  CASH_FLOW: 12,
  BALANCE_SHEET_CREDIT: 8,
  BUSINESS_DURABILITY: 13,
  VALUATION: 11,
  MOMENTUM: 6,
  RISK: 7,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function commonRules(): AutoSignalRule[] {
  return [
    { signalCode: "OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: DIMENSION_WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "CYCLE_NORMALIZED_SELF_HISTORY_AND_SUBPROFILE_PEER_RELATIVE" },
    { signalCode: "ROCE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: DIMENSION_WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "CYCLE_AWARE_ABSOLUTE_PLUS_PEER_RELATIVE" },
    { signalCode: "CFO_OR_FCF_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: DIMENSION_WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CASH_CONVERSION_WITH_CAPEX_CONTEXT" },
    { signalCode: "NET_CASH_OR_LEVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: DIMENSION_WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 1, normalizationAuthority: "ABSOLUTE_SAFETY_BANDS" },
    { signalCode: "BUSINESS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: DIMENSION_WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 1, normalizationAuthority: "SUBPROFILE_DURABILITY_WITH_EV_TRANSITION_METADATA" },
    { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: DIMENSION_WEIGHTS.VALUATION, minimumObservations: 3, normalizationAuthority: "SUBPROFILE_VALUATION_AUTHORITY" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: DIMENSION_WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_AUTO_OR_APPROVED_CONTEXT_BENCHMARK" },
    { signalCode: "DRAWDOWN_VOLATILITY_RISK", dimensionCode: "RISK", dimensionWeight: DIMENSION_WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "ABSOLUTE_AND_SUBPROFILE_RELATIVE_RISK_WITH_EV_TRANSITION_CONTEXT" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: DIMENSION_WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: AutoK4aSubprofile): readonly AutoSignalRule[] {
  const shared = commonRules()
  if (subprofile === "AUTO_OEM") {
    return [
      ...shared,
      { signalCode: "VOLUME_AND_REVENUE_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "VOLUME_REVENUE_AND_MODEL_CYCLE_NORMALIZED" },
    ]
  }
  return [
    ...shared,
    { signalCode: "REVENUE_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "REVENUE_GROWTH_WITH_CUSTOMER_AND_PLATFORM_CONTEXT" },
  ]
}

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreAutoComponentsK4b(
  input: AutoScoringInput,
): AutoScoringResult {
  const subprofile = resolveAutoK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: AUTO_COMPONENTS_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["AUTO_INDUSTRY_METHOD_NOT_AVAILABLE"],
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
    if (
      !signal
      || signal.state !== "FRESH"
      || !validScore(signal.normalizedScore)
      || signal.observationCount < rule.minimumObservations
    ) failed.push(rule.signalCode)
  }

  if (failed.length) {
    return {
      version: AUTO_COMPONENTS_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile,
      state: "SCORE_NOT_COMPUTABLE",
      overallScore: null,
      dimensionScores: Object.fromEntries(
        [...new Set(rules.map((rule) => rule.dimensionCode))].map((dimension) => [dimension, null]),
      ),
      reasonCodes: failed.map((code) => `MANDATORY_SIGNAL_NOT_READY:${code}`),
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const dimensionScores: Record<string, number | null> = {}
  for (const rule of rules) dimensionScores[rule.dimensionCode] = byCode.get(rule.signalCode)!.normalizedScore!

  const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  if (totalWeight !== 100) throw new Error("AUTO dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(DIMENSION_WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) {
      throw new Error(`AUTO dimension ${dimensionCode} is not computable`)
    }
    return sum + score * weight / 100
  }, 0))

  return {
    version: AUTO_COMPONENTS_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["AUTO_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function autoComponentsK4bSignalRules(subprofile: AutoK4aSubprofile) {
  return rulesFor(subprofile)
}

export const AUTO_COMPONENTS_K4B_SAFETY = {
  sourceCheckpointA: AUTO_COMPONENTS_K4A_CONTRACT.version,
  evTransitionCreatesIndependentScore: false,
  noMissingInputRenormalization: true,
  noCrossSubprofilePercentiles: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
