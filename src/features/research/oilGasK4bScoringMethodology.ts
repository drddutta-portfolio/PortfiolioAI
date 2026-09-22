import {
  OIL_GAS_K4A_CONTRACT,
  type OilGasK4aSubprofile,
  resolveOilGasK4aSubprofile,
} from "./oilGasK4aMethodologyContract"

export const OIL_GAS_K4B_SCORING_VERSION =
  "OIL_GAS_V1_K4B_SCORING_V1" as const

export type OilGasEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface OilGasNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: OilGasEvidenceState
}

export interface OilGasScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly OilGasNormalizedSignal[]
}

export interface OilGasSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface OilGasScoringResult {
  readonly version: typeof OIL_GAS_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: OilGasK4aSubprofile | null
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
  QUALITY: 11,
  GROWTH: 11,
  CAPITAL_EFFICIENCY: 12,
  CASH_FLOW: 13,
  BALANCE_SHEET_CREDIT: 11,
  BUSINESS_DURABILITY: 10,
  VALUATION: 13,
  MOMENTUM: 5,
  RISK: 10,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function commonRules(): OilGasSignalRule[] {
  return [
    { signalCode: "CYCLE_NORMALIZED_EARNINGS_QUALITY", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 12, normalizationAuthority: "COMMODITY_OR_REFINING_CYCLE_NORMALIZED_QUALITY" },
    { signalCode: "ROCE_OR_ROIC_THROUGH_CYCLE", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 5, normalizationAuthority: "THROUGH_CYCLE_RETURN_ON_CAPITAL" },
    { signalCode: "CFO_OR_FCF_CONVERSION_THROUGH_CYCLE", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 5, normalizationAuthority: "THROUGH_CYCLE_CASH_CONVERSION" },
    { signalCode: "NET_DEBT_AND_INTEREST_COVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 5, normalizationAuthority: "LEVERAGE_AND_COVERAGE_THROUGH_CYCLE" },
    { signalCode: "OIL_GAS_BUSINESS_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 5, normalizationAuthority: "SUBPROFILE_RESERVE_NETWORK_OR_INTEGRATION_DURABILITY" },
    { signalCode: "VALUATION_THROUGH_CYCLE", dimensionCode: "VALUATION", dimensionWeight: WEIGHTS.VALUATION, minimumObservations: 5, normalizationAuthority: "SUBPROFILE_NORMALIZED_EV_EBITDA_PB_FCF_DIVIDEND_DCF_OR_SOTP" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_OIL_GAS_RELATIVE" },
    { signalCode: "COMMODITY_POLICY_TRANSITION_RISK", dimensionCode: "RISK", dimensionWeight: WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "COMMODITY_POLICY_FX_AND_ENERGY_TRANSITION_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: OilGasK4aSubprofile): readonly OilGasSignalRule[] {
  const common = commonRules()
  if (subprofile === "UPSTREAM_E_AND_P") {
    return [
      ...common,
      { signalCode: "PRODUCTION_RESERVE_AND_REALIZATION_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 5, normalizationAuthority: "PRODUCTION_RESERVE_REPLACEMENT_AND_REALIZATION_CONTEXT" },
    ]
  }
  if (subprofile === "MIDSTREAM_CITY_GAS") {
    return [
      ...common,
      { signalCode: "VOLUME_THROUGHPUT_AND_NETWORK_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "VOLUME_THROUGHPUT_NETWORK_AND_TARIFF_CONTEXT" },
    ]
  }
  return [
    ...common,
    { signalCode: "THROUGHPUT_SEGMENT_AND_MARGIN_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 12, normalizationAuthority: "REFINING_PETCHEM_SEGMENT_AND_GRM_CONTEXT" },
  ]
}

const READINESS_ONLY = [
  { signalCode: "SUBPROFILE_OPERATING_CONTEXT", minimumObservations: 1 },
] as const

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreOilGasK4b(input: OilGasScoringInput): OilGasScoringResult {
  const subprofile = resolveOilGasK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: OIL_GAS_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["OIL_GAS_METHOD_NOT_AVAILABLE"],
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

  for (const gate of READINESS_ONLY) {
    const signal = byCode.get(gate.signalCode)
    if (!signal || signal.state !== "FRESH" || signal.observationCount < gate.minimumObservations) {
      failed.push(gate.signalCode)
    }
  }

  if (failed.length) {
    return {
      version: OIL_GAS_K4B_SCORING_VERSION,
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
  if (totalWeight !== 100) throw new Error("OIL_GAS dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`OIL_GAS dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0))

  return {
    version: OIL_GAS_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["OIL_GAS_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function oilGasK4bSignalRules(subprofile: OilGasK4aSubprofile) {
  return rulesFor(subprofile)
}

export const OIL_GAS_K4B_SAFETY = {
  sourceCheckpointA: OIL_GAS_K4A_CONTRACT.version,
  subprofileOperatingContextRequired: true,
  mixedBusinessControlIsSoleAnchor: false,
  noMissingInputRenormalization: true,
  cycleNormalizationRequired: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
