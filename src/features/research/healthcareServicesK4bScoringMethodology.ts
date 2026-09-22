import {
  HEALTHCARE_SERVICES_K4A_CONTRACT,
  type HealthcareServicesK4aSubprofile,
  resolveHealthcareServicesK4aSubprofile,
} from "./healthcareServicesK4aMethodologyContract"

export const HEALTHCARE_SERVICES_K4B_SCORING_VERSION =
  "HEALTHCARE_SERVICES_V1_K4B_SCORING_V1" as const

export type HealthcareServicesEvidenceState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"

export interface HealthcareServicesNormalizedSignal {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: HealthcareServicesEvidenceState
}

export interface HealthcareServicesScoringInput {
  readonly securitySymbol: string
  readonly industry: string | null
  readonly signals: readonly HealthcareServicesNormalizedSignal[]
}

export interface HealthcareServicesSignalRule {
  readonly signalCode: string
  readonly dimensionCode: string
  readonly dimensionWeight: number
  readonly minimumObservations: number
  readonly normalizationAuthority: string
}

export interface HealthcareServicesScoringResult {
  readonly version: typeof HEALTHCARE_SERVICES_K4B_SCORING_VERSION
  readonly securitySymbol: string
  readonly subprofile: HealthcareServicesK4aSubprofile | null
  readonly state: "SCORE_READY" | "SCORE_NOT_COMPUTABLE" | "METHOD_NOT_AVAILABLE" | "REVIEW_REQUIRED"
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
  CAPITAL_EFFICIENCY: 10,
  CASH_FLOW: 12,
  BALANCE_SHEET_CREDIT: 8,
  BUSINESS_DURABILITY: 15,
  VALUATION: 11,
  MOMENTUM: 5,
  RISK: 7,
  OWNERSHIP_GOVERNANCE: 4,
} as const

const HOSPITAL_RULES: readonly HealthcareServicesSignalRule[] = [
  { signalCode: "OPERATING_MARGIN_HISTORY", dimensionCode: "QUALITY", dimensionWeight: DIMENSION_WEIGHTS.QUALITY, minimumObservations: 8, normalizationAuthority: "SELF_HISTORY_AND_HOSPITAL_PEER_RELATIVE" },
  { signalCode: "REVENUE_AND_EBITDA_GROWTH_MULTI_PERIOD", dimensionCode: "GROWTH", dimensionWeight: DIMENSION_WEIGHTS.GROWTH, minimumObservations: 8, normalizationAuthority: "MULTI_PERIOD_GROWTH_WITH_BED_RAMP_CONTEXT" },
  { signalCode: "ROCE_OR_ROIC", dimensionCode: "CAPITAL_EFFICIENCY", dimensionWeight: DIMENSION_WEIGHTS.CAPITAL_EFFICIENCY, minimumObservations: 3, normalizationAuthority: "ROCE_WITH_BED_RAMP_AND_CAPEX_CONTEXT" },
  { signalCode: "CFO_OR_FCF_CONVERSION", dimensionCode: "CASH_FLOW", dimensionWeight: DIMENSION_WEIGHTS.CASH_FLOW, minimumObservations: 3, normalizationAuthority: "CASH_CONVERSION_WITH_CAPEX_AND_RECEIVABLE_CONTEXT" },
  { signalCode: "NET_CASH_OR_LEVERAGE", dimensionCode: "BALANCE_SHEET_CREDIT", dimensionWeight: DIMENSION_WEIGHTS.BALANCE_SHEET_CREDIT, minimumObservations: 1, normalizationAuthority: "ABSOLUTE_SAFETY_BANDS" },
  { signalCode: "HOSPITAL_OPERATING_DURABILITY", dimensionCode: "BUSINESS_DURABILITY", dimensionWeight: DIMENSION_WEIGHTS.BUSINESS_DURABILITY, minimumObservations: 8, normalizationAuthority: "OCCUPANCY_ARPOB_BED_RAMP_CASE_MIX_AND_PAYER_CONTEXT" },
  { signalCode: "VALUATION", dimensionCode: "VALUATION", dimensionWeight: DIMENSION_WEIGHTS.VALUATION, minimumObservations: 3, normalizationAuthority: "HOSPITAL_VALUATION_AUTHORITY" },
  { signalCode: "MOMENTUM_12M_RELATIVE", dimensionCode: "MOMENTUM", dimensionWeight: DIMENSION_WEIGHTS.MOMENTUM, minimumObservations: 252, normalizationAuthority: "NIFTY_HOSPITALS_PRIMARY_NIFTY_HEALTHCARE_CONTEXT" },
  { signalCode: "DRAWDOWN_VOLATILITY_RISK", dimensionCode: "RISK", dimensionWeight: DIMENSION_WEIGHTS.RISK, minimumObservations: 252, normalizationAuthority: "ABSOLUTE_AND_HOSPITAL_RELATIVE_RISK" },
  { signalCode: "OWNERSHIP_GOVERNANCE", dimensionCode: "OWNERSHIP_GOVERNANCE", dimensionWeight: DIMENSION_WEIGHTS.OWNERSHIP_GOVERNANCE, minimumObservations: 1, normalizationAuthority: "REVIEWED_GOVERNANCE_EVIDENCE" },
]

function key(value: string | null) {
  return value?.trim().toUpperCase().replace(/[^A-Z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") ?? ""
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function scoreHealthcareServicesK4b(
  input: HealthcareServicesScoringInput,
): HealthcareServicesScoringResult {
  const industryKey = key(input.industry)

  if (industryKey === "DIAGNOSTICS" || industryKey === "DIAGNOSTIC_SERVICES") {
    return {
      version: HEALTHCARE_SERVICES_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "REVIEW_REQUIRED",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["DIAGNOSTICS_REQUIRES_SEPARATE_METHODOLOGY"],
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const subprofile = resolveHealthcareServicesK4aSubprofile(input.industry)
  if (!subprofile) {
    return {
      version: HEALTHCARE_SERVICES_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile: null,
      state: "METHOD_NOT_AVAILABLE",
      overallScore: null,
      dimensionScores: {},
      reasonCodes: ["HEALTHCARE_SERVICES_METHOD_NOT_AVAILABLE"],
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const byCode = new Map(input.signals.map((signal) => [signal.signalCode, signal]))
  const failed: string[] = []

  for (const rule of HOSPITAL_RULES) {
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
      version: HEALTHCARE_SERVICES_K4B_SCORING_VERSION,
      securitySymbol: input.securitySymbol,
      subprofile,
      state: "SCORE_NOT_COMPUTABLE",
      overallScore: null,
      dimensionScores: Object.fromEntries(HOSPITAL_RULES.map((rule) => [rule.dimensionCode, null])),
      reasonCodes: failed.map((code) => `MANDATORY_SIGNAL_NOT_READY:${code}`),
      deterministic: true,
      readOnly: true,
      scorePersistenceEnabled: false,
      recommendationPersistenceEnabled: false,
    }
  }

  const dimensionScores: Record<string, number | null> = {}
  for (const rule of HOSPITAL_RULES) dimensionScores[rule.dimensionCode] = byCode.get(rule.signalCode)!.normalizedScore!

  const totalWeight = Object.values(DIMENSION_WEIGHTS).reduce((sum, weight) => sum + weight, 0)
  if (totalWeight !== 100) throw new Error("HEALTHCARE_SERVICES dimension weights must equal 100")

  const overallScore = Object.entries(DIMENSION_WEIGHTS).reduce((sum, [dimensionCode, weight]) => {
    const score = dimensionScores[dimensionCode]
    if (score === null || score === undefined) throw new Error(`HEALTHCARE_SERVICES dimension ${dimensionCode} is not computable`)
    return sum + score * weight / 100
  }, 0)

  return {
    version: HEALTHCARE_SERVICES_K4B_SCORING_VERSION,
    securitySymbol: input.securitySymbol,
    subprofile,
    state: "SCORE_READY",
    overallScore,
    dimensionScores,
    reasonCodes: ["HEALTHCARE_SERVICES_DETERMINISTIC_SCORE_READY"],
    deterministic: true,
    readOnly: true,
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
  }
}

export function healthcareServicesK4bSignalRules() {
  return HOSPITAL_RULES
}

export const HEALTHCARE_SERVICES_K4B_SAFETY = {
  sourceCheckpointA: HEALTHCARE_SERVICES_K4A_CONTRACT.version,
  diagnosticsScoringEnabled: false,
  noMissingInputRenormalization: true,
  runtimeSymbolSpecific: false,
  providerCalls: 0,
  writes: 0,
} as const
