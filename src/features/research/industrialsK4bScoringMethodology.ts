import {
  INDUSTRIALS_K4A_CONTRACT,
  type IndustrialsK4aSubprofile,
  resolveIndustrialsK4aSubprofile,
} from "./industrialsK4aMethodologyContract"

export const INDUSTRIALS_K4B_SCORING_VERSION =
  "INDUSTRIALS_CAPITAL_GOODS_K4B_SCORING_V1" as const

export type IndustrialsEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface IndustrialsNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: IndustrialsEvidenceState
}

export interface IndustrialsScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly IndustrialsNormalizedSignal[]
}

export interface IndustrialsSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface IndustrialsScoringResult {
  readonly version: typeof INDUSTRIALS_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: IndustrialsK4aSubprofile | null
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
  QUALITY: 13,
  GROWTH: 14,
  CAPITAL_EFFICIENCY: 11,
  CASH_FLOW: 14,
  BALANCE_SHEET_CREDIT: 10,
  BUSINESS_DURABILITY: 12,
  VALUATION: 11,
  MOMENTUM: 5,
  RISK: 6,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function commonRules(): IndustrialsSignalRule[] {
  return [
    { signalCode: "OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: DIMENSION_WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "SELF_HISTORY_AND_SUBPROFILE_PEER_RELATIVE" },
    { signalCode: "ROCE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: DIMENSION_WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "CYCLE_AWARE_ABSOLUTE_PLUS_PEER_RELATIVE" },
    { signalCode: "NET_DEBT_AND_INTEREST_COVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: DIMENSION_WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 3, normalizationAuthority: "ABSOLUTE_SAFETY_BANDS" },
    { signalCode: "BUSINESS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: DIMENSION_WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 1, normalizationAuthority: "SUBPROFILE_DURABILITY_EVIDENCE_CONTRACT" },
    { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: DIMENSION_WEIGHTS.VALUATION, minimumObservations: 3, normalizationAuthority: "SUBPROFILE_VALUATION_AUTHORITY" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: DIMENSION_WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "APPROVED_INDUSTRIAL_BENCHMARK" },
    { signalCode: "DRAWDOWN_VOLATILITY_RISK", dimensionCode: "RISK", dimensionWeight: DIMENSION_WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "ABSOLUTE_AND_SUBPROFILE_RELATIVE_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: DIMENSION_WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: IndustrialsK4aSubprofile): readonly IndustrialsSignalRule[] {
  const shared = commonRules()

  if (subprofile === "PROJECT_EPC") {
    return [
      ...shared,
      { signalCode: "ORDER_BOOK_AND_REVENUE_GROWTH", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 4, normalizationAuthority: "ORDER_BOOK_PLUS_EXECUTION_NORMALIZED" },
      { signalCode: "WORKING_CAPITAL_AND_CASH_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: DIMENSION_WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CFO_FCF_AND_WORKING_CAPITAL_DISCIPLINE" },
    ]
  }

  if (subprofile === "CAPITAL_EQUIPMENT_ELECTRICAL") {
    return [
      ...shared,
      { signalCode: "REVENUE_AND_ORDER_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "MULTI_PERIOD_GROWTH_WITH_ORDER_CONTEXT" },
      { signalCode: "CFO_FCF_AND_WORKING_CAPITAL", dimensionCode: "CASH_FLOW", dimensionWeight: DIMENSION_WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CFO_FCF_CONVERSION_AND_WORKING_CAPITAL" },
    ]
  }

  return [
    ...shared,
    { signalCode: "ORDER_BOOK_AND_EXECUTION_GROWTH", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 4, normalizationAuthority: "ORDER_INFLOW_EXECUTION_AND_REVENUE_GROWTH" },
    { signalCode: "CFO_FCF_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: DIMENSION_WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CFO_FCF_CONVERSION_WITH_PROGRAM_CONTEXT" },
  ]
}

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreIndustrialsK4b(
  input: IndustrialsScoringInput,
): IndustrialsScoringResult {
  const subprofile = resolveIndustrialsK4aSubprofile(input.industry)

  if (!subprofile) {
    return {
      version: INDUSTRIALS_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["INDUSTRIALS_INDUSTRY_METHOD_NOT_AVAILABLE"],
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
    ) {
      failed.push(rule.signalCode)
    }
  }

  if (failed.length) {
    return {
      version: INDUSTRIALS_K4B_SCORING_VERSION,
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
  for (const rule of rules) {
    dimensionScores[rule.dimensionCode] = byCode.get(rule.signalCode)!.normalizedScore!
  }

  const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  if (totalWeight !== 100) throw new Error("INDUSTRIALS dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(DIMENSION_WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) {
      throw new Error(`INDUSTRIALS dimension ${dimensionCode} is not computable`)
    }
    return sum + score * weight / 100
  }, 0))

  return {
    version: INDUSTRIALS_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["INDUSTRIALS_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function industrialsK4bSignalRules(subprofile: IndustrialsK4aSubprofile) {
  return rulesFor(subprofile)
}

export const INDUSTRIALS_K4B_SAFETY = {
  sourceCheckpointA: INDUSTRIALS_K4A_CONTRACT.version,
  noMissingInputRenormalization: true,
  noCrossSubprofilePercentiles: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
