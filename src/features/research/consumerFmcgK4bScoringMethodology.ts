import {
  CONSUMER_FMCG_K4A_CONTRACT,
  resolveConsumerFmcgK4aSubprofile,
} from "./consumerFmcgK4aMethodologyContract"

export const CONSUMER_FMCG_K4B_SCORING_VERSION =
  "CONSUMER_FMCG_K4B_SCORING_V1" as const

export type ConsumerFmcgEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface ConsumerFmcgNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: ConsumerFmcgEvidenceState
}

export interface ConsumerFmcgScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly ConsumerFmcgNormalizedSignal[]
}

export interface ConsumerFmcgSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface ConsumerFmcgScoringResult {
  readonly version: typeof CONSUMER_FMCG_K4B_SCORING_VERSION
  readonly securitySymbol: string
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
  QUALITY: 15,
  GROWTH: 14,
  CAPITAL_EFFICIENCY: 10,
  CASH_FLOW: 12,
  BALANCE_SHEET_CREDIT: 8,
  BUSINESS_DURABILITY: 16,
  VALUATION: 11,
  MOMENTUM: 5,
  RISK: 5,
  OWNERSHIP_GOVERNANCE: 4,
} as const

const RULES: readonly ConsumerFmcgSignalRule[] = [
  { signalCode: "GROSS_AND_OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "SELF_HISTORY_AND_FMCG_PEER_RELATIVE" },
  { signalCode: "REVENUE_AND_VOLUME_PRICE_MIX_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "MULTI_PERIOD_GROWTH_WITH_VOLUME_PRICE_MIX_WHEN_DISCLOSED" },
  { signalCode: "ROCE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "ABSOLUTE_PLUS_FMCG_PEER_RELATIVE" },
  { signalCode: "CFO_OR_FCF_CONVERSION_AND_WORKING_CAPITAL", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CASH_CONVERSION_AND_WORKING_CAPITAL_DISCIPLINE" },
  { signalCode: "NET_CASH_OR_LEVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 1, normalizationAuthority: "ABSOLUTE_SAFETY_BANDS" },
  { signalCode: "BRAND_DISTRIBUTION_CATEGORY_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 8, normalizationAuthority: "BRAND_DISTRIBUTION_CATEGORY_PREMIUMIZATION_AND_CHANNEL_DIVERSIFICATION" },
  { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: WEIGHTS.VALUATION, minimumObservations: 3, normalizationAuthority: "PE_EV_EBITDA_FCF_ROCE_CONTEXT" },
  { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_FMCG_RELATIVE" },
  { signalCode: "CATEGORY_AND_MARKET_RISK", dimensionCode: "RISK", dimensionWeight: WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "DEMAND_RAW_MATERIAL_COMPETITION_EXCISE_WHEN_RELEVANT" },
  { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
]

const READINESS_ONLY = [
  { signalCode: "PRODUCT_CATEGORY_METADATA", minimumObservations: 1 },
] as const

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreConsumerFmcgK4b(input: ConsumerFmcgScoringInput): ConsumerFmcgScoringResult {
  const profile = resolveConsumerFmcgK4aSubprofile(input.industry)
  if (!profile) {
    return {
      version: CONSUMER_FMCG_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["CONSUMER_FMCG_METHOD_NOT_AVAILABLE"],
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const byCode = new Map(input.signals.map((signal) => [signal.signalCode, signal]))
  const failed: string[] = []

  for (const rule of RULES) {
    const signal = byCode.get(rule.signalCode)
    if (!signal || signal.state !== "FRESH" || !validScore(signal.normalizedScore) || signal.observationCount < rule.minimumObservations) {
      failed.push(rule.signalCode)
    }
  }

  for (const gate of READINESS_ONLY) {
    const signal = byCode.get(gate.signalCode)
    if (!signal || signal.state !== "FRESH" || signal.observationCount < gate.minimumObservations) {
      failed.push(gate.signalCode)
    }
  }

  if (failed.length) {
    return {
      version: CONSUMER_FMCG_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      state: "SCORE_NOT_COMPUTABLE",
      overallScore: null,
      dimensionScores: Object.fromEntries(RULES.map((rule) => [rule.dimensionCode, null])),
      reasonCodes: failed.map((code) => `MANDATORY_SIGNAL_NOT_READY:${code}`),
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const dimensionScores: Record<string, number | null> = {}
  for (const rule of RULES) dimensionScores[rule.dimensionCode] = byCode.get(rule.signalCode)!.normalizedScore!

  const totalWeight = Object.values(WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  if (totalWeight !== 100) throw new Error("CONSUMER_FMCG dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`CONSUMER_FMCG dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0))

  return {
    version: CONSUMER_FMCG_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["CONSUMER_FMCG_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function consumerFmcgK4bSignalRules() {
  return RULES
}

export const CONSUMER_FMCG_K4B_SAFETY = {
  sourceCheckpointA: CONSUMER_FMCG_K4A_CONTRACT.version,
  productCategoryMetadataRequired: true,
  alcoholSeparateUniversalCurve: false,
  noMissingInputRenormalization: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
