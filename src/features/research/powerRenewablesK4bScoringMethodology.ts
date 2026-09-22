import {
  POWER_RENEWABLES_K4A_CONTRACT,
  type PowerRenewablesK4aSubprofile,
  resolvePowerRenewablesK4aSubprofile,
} from "./powerRenewablesK4aMethodologyContract"

export const POWER_RENEWABLES_K4B_SCORING_VERSION =
  "POWER_RENEWABLES_V1_K4B_SCORING_V1" as const

export type PowerRenewablesEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface PowerRenewablesNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: PowerRenewablesEvidenceState
}

export interface PowerRenewablesScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly PowerRenewablesNormalizedSignal[]
}

export interface PowerRenewablesSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface PowerRenewablesScoringResult {
  readonly version: typeof POWER_RENEWABLES_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: PowerRenewablesK4aSubprofile | null
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
  GROWTH: 12,
  CAPITAL_EFFICIENCY: 10,
  CASH_FLOW: 12,
  BALANCE_SHEET_CREDIT: 13,
  BUSINESS_DURABILITY: 13,
  VALUATION: 11,
  MOMENTUM: 4,
  RISK: 10,
  OWNERSHIP_GOVERNANCE: 4,
} as const

function stableScore(value: number) {
  return Number(value.toFixed(6))
}

function commonRules(): PowerRenewablesSignalRule[] {
  return [
    { signalCode: "OPERATING_QUALITY_AND_AVAILABILITY", dimensionCode: "QUALITY", dimensionWeight: WEIGHTS.QUALITY, minimumObservations: 12, normalizationAuthority: "SUBPROFILE_OPERATING_QUALITY_AND_AVAILABILITY" },
    { signalCode: "ROCE_OR_ROIC_WITH_ASSET_CONTEXT", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 5, normalizationAuthority: "ASSET_AND_REGULATORY_RETURN_CONTEXT" },
    { signalCode: "CFO_OR_FCF_AND_PROJECT_CASH_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: WEIGHTS.CASH_FLOW, minimumObservations: 5, normalizationAuthority: "CASH_CONVERSION_AND_PROJECT_CASH_FLOW" },
    { signalCode: "NET_DEBT_INTEREST_COVERAGE_AND_REFINANCING", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 5, normalizationAuthority: "LEVERAGE_INTEREST_RATE_AND_REFINANCING_SENSITIVITY" },
    { signalCode: "POWER_ASSET_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 5, normalizationAuthority: "TARIFF_PPA_OFFTAKER_RESOURCE_NETWORK_AND_EXECUTION_DURABILITY" },
    { signalCode: "VALUATION_ASSET_AND_CASH_FLOW_CONTEXT", dimensionCode: "VALUATION", dimensionWeight: WEIGHTS.VALUATION, minimumObservations: 5, normalizationAuthority: "SUBPROFILE_PB_DCF_DIVIDEND_EV_EBITDA_FCF_OR_EV_MW_CONTEXT" },
    { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_POWER_RELATIVE_WITH_ENERGY_INFRA_CONTEXT" },
    { signalCode: "TARIFF_OFFTAKER_GRID_AND_RESOURCE_RISK", dimensionCode: "RISK", dimensionWeight: WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "REGULATION_OFFTAKER_GRID_RESOURCE_AND_INTEREST_RATE_RISK" },
    { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
  ]
}

function rulesFor(subprofile: PowerRenewablesK4aSubprofile): readonly PowerRenewablesSignalRule[] {
  const common = commonRules()
  if (subprofile === "REGULATED_NETWORK") {
    return [
      ...common,
      { signalCode: "REGULATED_ASSET_NETWORK_AND_COMMISSIONING_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 12, normalizationAuthority: "REGULATED_ASSET_BASE_NETWORK_AND_COMMISSIONING_GROWTH" },
    ]
  }
  if (subprofile === "GENERATION_INTEGRATED_UTILITY") {
    return [
      ...common,
      { signalCode: "CAPACITY_GENERATION_AND_ASSET_MIX_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 12, normalizationAuthority: "CAPACITY_GENERATION_PLF_RESOURCE_AND_ASSET_MIX_CONTEXT" },
    ]
  }
  return [
    ...common,
    { signalCode: "OPERATING_AND_PIPELINE_CAPACITY_GROWTH", dimensionCode: "GROWTH", dimensionWeight: WEIGHTS.GROWTH, minimumObservations: 12, normalizationAuthority: "OPERATING_MW_PIPELINE_CUF_EXECUTION_AND_GRID_CONTEXT" },
  ]
}

const READINESS_ONLY = [
  { signalCode: "TARIFF_PPA_OFFTAKER_GRID_CONTEXT", minimumObservations: 1 },
] as const

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scorePowerRenewablesK4b(input: PowerRenewablesScoringInput): PowerRenewablesScoringResult {
  const subprofile = resolvePowerRenewablesK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: POWER_RENEWABLES_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["POWER_RENEWABLES_METHOD_NOT_AVAILABLE"],
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
      version: POWER_RENEWABLES_K4B_SCORING_VERSION,
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
  if (totalWeight !== 100) throw new Error("POWER_RENEWABLES dimension weights must equal 100")

  const overallScore = stableScore(Object.entries(WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`POWER_RENEWABLES dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0))

  return {
    version: POWER_RENEWABLES_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["POWER_RENEWABLES_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function powerRenewablesK4bSignalRules(subprofile: PowerRenewablesK4aSubprofile) {
  return rulesFor(subprofile)
}

export const POWER_RENEWABLES_K4B_SAFETY = {
  sourceCheckpointA: POWER_RENEWABLES_K4A_CONTRACT.version,
  tariffPpaOfftakerGridContextRequired: true,
  noMissingInputRenormalization: true,
  noCrossSubprofilePercentiles: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
