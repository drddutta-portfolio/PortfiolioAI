import {
  routeHistoricalResearchProfileV1,
  type HistoricalResearchProfileRoutingInput,
} from "./researchProfileRouting"
import {
  METALS_COMMODITIES_K4A_CONTRACT,
  resolveMetalsCommoditiesK4aSubprofile,
} from "./metalsCommoditiesK4aMethodologyContract"
import {
  METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS,
  METALS_COMMODITIES_K4B_SCORING_VERSION,
  metalsCommoditiesK4bSignalRules,
  type MetalsEvidenceState,
} from "./metalsCommoditiesK4bScoringMethodology"
import { sectorEngineForProfileCode } from "./sectorEngineRegistry"

export const P8_HISTORICAL_STEEL_FERROUS_ADAPTER_VERSION =
  "P8_HISTORICAL_STEEL_FERROUS_READINESS_ADAPTER_V1" as const

export type HistoricalSteelFerrousReadinessState =
  | "ROUTE_REJECTED"
  | "INPUTS_INCOMPLETE"
  | "INPUTS_COMPLETE"

export interface HistoricalSteelFerrousSignalEvidence {
  readonly signalCode: string
  readonly normalizedScore: number | null
  readonly observationCount: number
  readonly state: MetalsEvidenceState
  readonly evidenceAsOf: string
  readonly normalizationAuthority: string
}

export interface HistoricalSteelFerrousSignalReadiness {
  readonly signalCode: string
  readonly minimumObservations: number
  readonly normalizationAuthority: string
  readonly state:
    | "READY"
    | "MISSING"
    | "STALE_OR_CONFLICTING"
    | "INSUFFICIENT_HISTORY"
    | "FUTURE_EVIDENCE"
    | "NORMALIZATION_AUTHORITY_MISMATCH"
    | "INVALID_NORMALIZED_SCORE"
  readonly observationCount: number
}

export interface HistoricalSteelFerrousReadinessResult {
  readonly adapterVersion: typeof P8_HISTORICAL_STEEL_FERROUS_ADAPTER_VERSION
  readonly methodologyVersion: typeof METALS_COMMODITIES_K4A_CONTRACT.version
  readonly scoringVersion: typeof METALS_COMMODITIES_K4B_SCORING_VERSION
  readonly engineCode: "METALS_COMMODITIES" | null
  readonly profileCode: "STEEL_FERROUS" | null
  readonly state: HistoricalSteelFerrousReadinessState
  readonly reasonCodes: readonly string[]
  readonly signalReadiness: readonly HistoricalSteelFerrousSignalReadiness[]
  readonly deterministic: true
  readonly readOnly: true
  readonly providerCalls: 0
  readonly writes: 0
}

function validScore(value: number | null) {
  return value !== null && Number.isFinite(value) && value >= 0 && value <= 100
}

export function assessHistoricalSteelFerrousReadiness(input: {
  readonly route: HistoricalResearchProfileRoutingInput
  readonly signals: readonly HistoricalSteelFerrousSignalEvidence[]
}): HistoricalSteelFerrousReadinessResult {
  const routed = routeHistoricalResearchProfileV1(input.route)
  const base = {
    adapterVersion: P8_HISTORICAL_STEEL_FERROUS_ADAPTER_VERSION,
    methodologyVersion: METALS_COMMODITIES_K4A_CONTRACT.version,
    scoringVersion: METALS_COMMODITIES_K4B_SCORING_VERSION,
    deterministic: true as const,
    readOnly: true as const,
    providerCalls: 0 as const,
    writes: 0 as const,
  }

  if (routed.state !== "ROUTED" || routed.profileCode !== "STEEL_FERROUS") {
    return {
      ...base,
      engineCode: null,
      profileCode: null,
      state: "ROUTE_REJECTED",
      reasonCodes: [routed.reasonCode],
      signalReadiness: [],
    }
  }

  const engine = sectorEngineForProfileCode(routed.profileCode)
  if (!engine || engine.engineCode !== "METALS_COMMODITIES" || engine.lifecycle !== "IMPLEMENTED") {
    return {
      ...base,
      engineCode: null,
      profileCode: routed.profileCode,
      state: "ROUTE_REJECTED",
      reasonCodes: ["STEEL_FERROUS_IMPLEMENTED_ENGINE_REQUIRED"],
      signalReadiness: [],
    }
  }

  const subprofile = resolveMetalsCommoditiesK4aSubprofile(routed.economicHierarchy.basicIndustryName)
  if (subprofile !== "STEEL_FERROUS") {
    return {
      ...base,
      engineCode: "METALS_COMMODITIES",
      profileCode: routed.profileCode,
      state: "ROUTE_REJECTED",
      reasonCodes: ["LOCKED_IRON_STEEL_PRODUCTS_SELECTOR_REQUIRED"],
      signalReadiness: [],
    }
  }

  const decisionMs = Date.parse(input.route.decisionAt)
  const byCode = new Map(input.signals.map((signal) => [signal.signalCode, signal]))
  const requirements = [
    ...metalsCommoditiesK4bSignalRules("STEEL_FERROUS").map((rule) => ({
      signalCode: rule.signalCode,
      minimumObservations: rule.minimumObservations,
      normalizationAuthority: rule.normalizationAuthority,
      scoreRequired: true,
    })),
    ...METALS_COMMODITIES_K4B_READINESS_ONLY_SIGNALS.map((gate) => ({
      signalCode: gate.signalCode,
      minimumObservations: gate.minimumObservations,
      normalizationAuthority: "METALS_COMMODITIES_K4A_METHODOLOGY_V1:COMMODITY_EXPOSURE_METADATA",
      scoreRequired: false,
    })),
  ]

  const signalReadiness: HistoricalSteelFerrousSignalReadiness[] = requirements.map((requirement) => {
    const signal = byCode.get(requirement.signalCode)
    if (!signal) {
      return { ...requirement, state: "MISSING" as const, observationCount: 0 }
    }

    const evidenceMs = Date.parse(signal.evidenceAsOf)
    if (!Number.isFinite(evidenceMs) || evidenceMs >= decisionMs) {
      return { ...requirement, state: "FUTURE_EVIDENCE" as const, observationCount: signal.observationCount }
    }
    if (signal.normalizationAuthority !== requirement.normalizationAuthority) {
      return { ...requirement, state: "NORMALIZATION_AUTHORITY_MISMATCH" as const, observationCount: signal.observationCount }
    }
    if (signal.state !== "FRESH") {
      return { ...requirement, state: "STALE_OR_CONFLICTING" as const, observationCount: signal.observationCount }
    }
    if (signal.observationCount < requirement.minimumObservations) {
      return { ...requirement, state: "INSUFFICIENT_HISTORY" as const, observationCount: signal.observationCount }
    }
    if (requirement.scoreRequired && !validScore(signal.normalizedScore)) {
      return { ...requirement, state: "INVALID_NORMALIZED_SCORE" as const, observationCount: signal.observationCount }
    }
    return { ...requirement, state: "READY" as const, observationCount: signal.observationCount }
  })

  const failed = signalReadiness.filter((signal) => signal.state !== "READY")
  return {
    ...base,
    engineCode: "METALS_COMMODITIES",
    profileCode: "STEEL_FERROUS",
    state: failed.length ? "INPUTS_INCOMPLETE" : "INPUTS_COMPLETE",
    reasonCodes: failed.length
      ? failed.map((signal) => `MANDATORY_SIGNAL_NOT_READY:${signal.signalCode}:${signal.state}`)
      : ["HISTORICAL_STEEL_FERROUS_INPUTS_COMPLETE"],
    signalReadiness,
  }
}
