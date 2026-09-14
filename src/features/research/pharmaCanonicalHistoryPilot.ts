import {
  derivePharmaQuarterlyOperatingMargin,
  normalizePharmaAnnualCfo,
  normalizePharmaAnnualRevenue,
  type ProviderHistoryValue,
} from "./pharmaHistoryNormalization"
import type { ParsedTrendlyneDiscovery } from "./pharmaStoredDiscoveryParser"

export const PHARMA_CANONICAL_HISTORY_PILOT_VERSION = "PHARMA_CANONICAL_HISTORY_PILOT_V1" as const

export type PharmaPilotWriteState = "BLOCKED_PERIOD_IDENTITY" | "BLOCKED_PROVIDER_CONFLICT"

export interface PharmaPilotObservationPreview {
  readonly idempotencyKey: string
  readonly metricCode: "REVENUE_ANNUAL" | "CFO_ANNUAL" | "OPM_QUARTER_DERIVED"
  readonly periodKey: string
  readonly periodType: "YEAR" | "QUARTER"
  readonly numericValue: string
  readonly canonicalUnit: "INR_CRORE" | "PERCENT"
  readonly sourceCode: "TRENDLYNE_MCP" | "PORTFOLIOAI"
  readonly sourceRecordId: string
  readonly sourceLabels: readonly string[]
  readonly periodEnd: null
  readonly writeState: PharmaPilotWriteState
  readonly blocker: string
}

export interface PharmaCanonicalHistoryPilotPreview {
  readonly version: typeof PHARMA_CANONICAL_HISTORY_PILOT_VERSION
  readonly symbol: "TORNTPHARM"
  readonly sourceRecordId: string
  readonly observations: readonly PharmaPilotObservationPreview[]
  readonly providerConflicts: readonly string[]
  readonly productionWriteCount: 0
  readonly notice: string
}

function asProviderValues(discovery: ParsedTrendlyneDiscovery): ProviderHistoryValue[] {
  return discovery.values.map((item) => ({ label: item.label, value: item.value }))
}

function previewObservation(
  sourceRecordId: string,
  metricCode: PharmaPilotObservationPreview["metricCode"],
  periodKey: string,
  periodType: PharmaPilotObservationPreview["periodType"],
  numericValue: string,
  canonicalUnit: PharmaPilotObservationPreview["canonicalUnit"],
  sourceCode: PharmaPilotObservationPreview["sourceCode"],
  sourceLabels: readonly string[],
  writeState: PharmaPilotWriteState,
  blocker: string,
): PharmaPilotObservationPreview {
  return {
    idempotencyKey: `${PHARMA_CANONICAL_HISTORY_PILOT_VERSION}:${sourceRecordId}:${metricCode}:${periodKey}`,
    metricCode,
    periodKey,
    periodType,
    numericValue,
    canonicalUnit,
    sourceCode,
    sourceRecordId,
    sourceLabels,
    periodEnd: null,
    writeState,
    blocker,
  }
}

/**
 * Builds the exact production-write preview from stored provider evidence.
 * R4H V1 intentionally writes nothing because Trendlyne discovery labels are
 * relative (Y1/Q3) and do not prove the fiscal/quarter period_end required for
 * canonical time-series observations. Dates must never be guessed.
 */
export function buildTorntpharmCanonicalHistoryPilot(
  discoveries: readonly ParsedTrendlyneDiscovery[],
  sourceRecordId: string,
): PharmaCanonicalHistoryPilotPreview {
  const conflicts = [...new Set(discoveries.flatMap((item) => item.conflicts))].sort()
  if (conflicts.length) {
    return {
      version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
      symbol: "TORNTPHARM",
      sourceRecordId,
      observations: [],
      providerConflicts: conflicts,
      productionWriteCount: 0,
      notice: "Provider-label conflicts block canonical history ingestion. No value may be selected implicitly.",
    }
  }

  const providerValues = discoveries.flatMap(asProviderValues)
  const annualRevenue = normalizePharmaAnnualRevenue(providerValues)
  const annualCfo = normalizePharmaAnnualCfo(providerValues)
  const quarterlyOpm = derivePharmaQuarterlyOperatingMargin(providerValues)
  const blocker = "Exact provider fiscal/quarter period_end is not yet proven. Relative labels such as 1Y ago / 2Q ago must not be converted to calendar dates by inference."
  const observations: PharmaPilotObservationPreview[] = []

  for (const point of annualRevenue.points) {
    observations.push(previewObservation(sourceRecordId, "REVENUE_ANNUAL", point.period, "YEAR", point.value, "INR_CRORE", "TRENDLYNE_MCP", [point.sourceLabel], "BLOCKED_PERIOD_IDENTITY", blocker))
  }
  for (const point of annualCfo.points) {
    observations.push(previewObservation(sourceRecordId, "CFO_ANNUAL", point.period, "YEAR", point.value, "INR_CRORE", "TRENDLYNE_MCP", [point.sourceLabel], "BLOCKED_PERIOD_IDENTITY", blocker))
  }
  for (const point of quarterlyOpm.points) {
    observations.push(previewObservation(sourceRecordId, "OPM_QUARTER_DERIVED", point.period, "QUARTER", point.marginPercent, "PERCENT", "PORTFOLIOAI", point.sourceLabels, "BLOCKED_PERIOD_IDENTITY", blocker))
  }

  return {
    version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
    symbol: "TORNTPHARM",
    sourceRecordId,
    observations,
    providerConflicts: [],
    productionWriteCount: 0,
    notice: "This is a deterministic write preview only. Canonical insertion remains blocked until exact period identities and required metric definitions are approved.",
  }
}
