import {
  CHEMICALS_K4A_CONTRACT,
  type ChemicalsK4aSubprofile,
  resolveChemicalsK4aSubprofile,
} from "./chemicalsK4aMethodologyContract"

export const CHEMICALS_K4B_SCORING_VERSION =
  "CHEMICALS_V1_K4B_SCORING_V1" as const

export type ChemicalsEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface ChemicalsNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: ChemicalsEvidenceState
}

export interface ChemicalsScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly ChemicalsNormalizedSignal[]
}

export interface ChemicalsSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface ChemicalsScoringResult {
  readonly version: typeof CHEMICALS_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: ChemicalsK4aSubprofile | null
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
  GROWTH: 13,
  CAPITAL_EFFICIENCY: 12,
  CASH_FLOW: 12,
  BALANCE_SHEET_CREDIT: 9,
  BUSINESS_DURABILITY: 11,
  VALUATION: 12,
  MOMENTUM: 6,
  RISK: 8,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function commonRules(): ChemicalsSignalRule[] {
  return [
    { signalCode: "OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: DIMENSION_WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "CYCLE_NORMALIZED_SELF_HISTORY_AND_SUBPROFILE_PEER_RELATIVE" },
    { signalCode: "ROCE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: DIMENSION_WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "THROUGH_CYCLE_ABSOLUTE_PLUS_PEER_RELATIVE" },
    { signalCode: "CFO_OR_FCF_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: DIMENSION_WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CASH_CONVERSION_THROUGH_CYCLE" },
    { signalCode: "NET_CASH_OR_LEVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: DIMENSION_WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 1, normalizationAuthority: "ABSOLUTE_SAFETY_BANDS_WITH_CYCLE_CONTEXT" },
    { signalCode: "BUSINESS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: DIMENSION_WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 1, normalizationAuthority: "SUBPROFILE_DURABILITY_EVIDENCE_CONTRACT" },
    { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: DIMENSION_WEIGHTS.VALUATION, minimumObservations: 3, normalizationAuthority: "SUBPROFILE_VALUATION_AUTHORITY" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: DIMENSION_WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_CHEMICALS_RELATIVE" },
    { signalCode: "DRAWDOWN_VOLATILITY_RISK", dimensionCode: "RISK", dimensionWeight: DIMENSION_WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "ABSOLUTE_AND_SUBPROFILE_RELATIVE_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: DIMENSION_WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: ChemicalsK4aSubprofile): readonly ChemicalsSignalRule[] {
  const shared = commonRules()
  if (subprofile === "SPECIALTY_CHEMICALS") {
    return [
      ...shared,
      { signalCode: "REVENUE_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "MULTI_PERIOD_GROWTH_WITH_PRODUCT_AND_CUSTOMER_MIX" },
    ]
  }
  if (subprofile === "AGRO_FERTILISER") {
    return [
      ...shared,
      { signalCode: "REVENUE_AND_VOLUME_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "VOLUME_REVENUE_AND_INPUT_PRICE_CONTEXT" },
    ]
  }
  return [
    ...shared,
    { signalCode: "VOLUME_PRICE_MIX_GROWTH", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "VOLUME_PRICE_MIX_AND_GLOBAL_PRICE_CONTEXT" },
  ]
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreChemicalsK4b(
  input: ChemicalsScoringInput,
): ChemicalsScoringResult {
  const subprofile = resolveChemicalsK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: CHEMICALS_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["CHEMICALS_INDUSTRY_METHOD_NOT_AVAILABLE"],
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
      version: CHEMICALS_K4B_SCORING_VERSION,
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
  if (totalWeight !== 100) throw new Error("CHEMICALS dimension weights must equal 100")

  const overallScore = Object.entries(DIMENSION_WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`CHEMICALS dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0)

  return {
    version: CHEMICALS_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["CHEMICALS_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function chemicalsK4bSignalRules(subprofile: ChemicalsK4aSubprofile) {
  return rulesFor(subprofile)
}

export const CHEMICALS_K4B_SAFETY = {
  sourceCheckpointA: CHEMICALS_K4A_CONTRACT.version,
  noMissingInputRenormalization: true,
  noCrossSubprofilePercentiles: true,
  cycleNormalizationRequired: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
