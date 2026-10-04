import {
  METALS_COMMODITIES_K4A_CONTRACT,
  type MetalsCommoditiesK4aSubprofile,
  resolveMetalsCommoditiesK4aSubprofile,
} from "./metalsCommoditiesK4aMethodologyContract"

export const METALS_COMMODITIES_K4B_SCORING_VERSION =
  "METALS_COMMODITIES_K4B_SCORING_V1" as const

export type MetalsEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface MetalsNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: MetalsEvidenceState
}

export interface MetalsScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly MetalsNormalizedSignal[]
}

export interface MetalsSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface MetalsScoringResult {
  readonly version: typeof METALS_COMMODITIES_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: MetalsCommoditiesK4aSubprofile | null
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
  QUALITY: 12,
  GROWTH: 11,
  CAPITAL_EFFICIENCY: 13,
  CASH_FLOW: 13,
  BALANCE_SHEET_CREDIT: 12,
  BUSINESS_DURABILITY: 9,
  VALUATION: 13,
  MOMENTUM: 5,
  RISK: 8,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function commonRules(): MetalsSignalRule[] {
  return [
    { signalCode: "THROUGH_CYCLE_MARGIN_QUALITY", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 12, normalizationAuthority: "THROUGH_CYCLE_MARGIN_AND_COST_POSITION" },
    { signalCode: "ROCE_OR_ROIC_THROUGH_CYCLE", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 5, normalizationAuthority: "THROUGH_CYCLE_RETURN_ON_CAPITAL" },
    { signalCode: "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 5, normalizationAuthority: "THROUGH_CYCLE_CASH_CONVERSION" },
    { signalCode: "NET_DEBT_AND_INTEREST_COVERAGE_MID_CYCLE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 5, normalizationAuthority: "MID_CYCLE_LEVERAGE_AND_COVERAGE" },
    { signalCode: "METALS_BUSINESS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 5, normalizationAuthority: "COST_CURVE_INTEGRATION_SCALE_AND_CAPITAL_ALLOCATION" },
    { signalCode: "VALUATION_THROUGH_CYCLE", dimensionCode: "VALUATION", dimensionWeight: WEIGHTS.VALUATION, minimumObservations: 5, normalizationAuthority: "NORMALIZED_EV_EBITDA_PB_FCF_ROCE_NOT_SPOT_PE" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_METAL_RELATIVE" },
    { signalCode: "COMMODITY_CYCLE_DRAWDOWN_RISK", dimensionCode: "RISK", dimensionWeight: WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "COMMODITY_CYCLE_AND_MARKET_DRAWDOWN_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: MetalsCommoditiesK4aSubprofile): readonly MetalsSignalRule[] {
  const common = commonRules()
  if (subprofile === "STEEL_FERROUS") {
    return [
      ...common,
      { signalCode: "VOLUME_REALIZATION_AND_SPREAD_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 12, normalizationAuthority: "VOLUME_REALIZATION_STEEL_SPREAD_AND_UTILISATION" },
    ]
  }

  return [
    ...common,
    { signalCode: "PRODUCTION_VOLUME_REALIZATION_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 12, normalizationAuthority: "PRODUCTION_REALIZATION_METAL_PRICE_AND_RESOURCE_CONTEXT" },
  ]
}

export const METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS = [
  { signalCode: "COMMODITY_EXPOSURE_METADATA", minimumObservations: 1 },
] as const

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreMetalsCommoditiesK4b(input: MetalsScoringInput): MetalsScoringResult {
  const subprofile = resolveMetalsCommoditiesK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: METALS_COMMODITIES_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["METALS_COMMODITIES_METHOD_NOT_AVAILABLE"],
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

  for (const gate of METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS) {
    const signal = byCode.get(gate.signalCode)
    if (!signal || signal.state !== "FRESH" || signal.observationCount < gate.minimumObservations) {
      failed.push(gate.signalCode)
    }
  }

  if (failed.length) {
    return {
      version: METALS_COMMODITIES_K4B_SCORING_VERSION,
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
  if (totalWeight !== 100) throw new Error("METALS_COMMODITIES dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`METALS_COMMODITIES dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0))

  return {
    version: METALS_COMMODITIES_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["METALS_COMMODITIES_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function metalsCommoditiesK4bSignalRules(subprofile: MetalsCommoditiesK4aSubprofile) {
  return rulesFor(subprofile)
}

export const METALS_COMMODITIES_K4B_SAFETY = {
  sourceCheckpointA: METALS_COMMODITIES_K4A_CONTRACT.version,
  commodityExposureMetadataRequired: true,
  spotPeSoleAnchorAllowed: false,
  throughCycleNormalizationRequired: true,
  noMissingInputRenormalization: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
