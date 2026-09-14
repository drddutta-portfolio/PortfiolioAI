import {
  derivePharmaQuarterlyOperatingMargin,
  normalizePharmaAnnualCfo,
  normalizePharmaAnnualRevenue,
  type ProviderHistoryValue,
} from "./pharmaHistoryNormalization"
import type { ParsedTrendlyneDiscovery } from "./pharmaStoredDiscoveryParser"

export const PHARMA_CANONICAL_HISTORY_PILOT_VERSION = "PHARMA_CANONICAL_HISTORY_PILOT_V1" as const

export type PharmaPilotWriteState = "BLOCKED_PERIOD_IDENTITY" | "BLOCKED_PROVIDER_CONFLICT"

export interface PharmaStoredDiscoveryInput {
  readonly sourceRecordId: string
  readonly discovery: ParsedTrendlyneDiscovery
}

export interface PharmaPilotObservationPreview {
  readonly idempotencyKey: string
  readonly metricCode: "REVENUE_ANNUAL" | "CFO_ANNUAL" | "OPM_QUARTER_DERIVED"
  readonly periodKey: string
  readonly periodType: "YEAR" | "QUARTER"
  readonly numericValue: string
  readonly canonicalUnit: "INR_CRORE" | "PERCENT"
  readonly sourceCode: "TRENDLYNE_MCP" | "PORTFOLIOAI"
  readonly sourceRecordIds: readonly string[]
  readonly sourceLabels: readonly string[]
  readonly periodEnd: null
  readonly writeState: PharmaPilotWriteState
  readonly blocker: string
}

export interface PharmaCanonicalHistoryPilotPreview {
  readonly version: typeof PHARMA_CANONICAL_HISTORY_PILOT_VERSION
  readonly symbol: "TORNTPHARM"
  readonly observations: readonly PharmaPilotObservationPreview[]
  readonly providerConflicts: readonly string[]
  readonly productionWriteCount: 0
  readonly notice: string
}

interface ProvenancedProviderHistoryValue extends ProviderHistoryValue {
  readonly sourceRecordId: string
}

function normalizedLabel(value: string) {
  return value.trim().replaceAll(/\s+/gu, " ").toLocaleLowerCase()
}

function mergeDiscoveries(inputs: readonly PharmaStoredDiscoveryInput[]) {
  const conflicts = new Set(inputs.flatMap((item) => item.discovery.conflicts))
  const byLabel = new Map<string, ProvenancedProviderHistoryValue[]>()

  for (const input of inputs) {
    for (const item of input.discovery.values) {
      const key = normalizedLabel(item.label)
      byLabel.set(key, [...(byLabel.get(key) ?? []), { label: item.label, value: item.value, sourceRecordId: input.sourceRecordId }])
    }
  }

  const values: ProvenancedProviderHistoryValue[] = []
  for (const candidates of byLabel.values()) {
    const distinct = new Set(candidates.map((item) => item.value === null ? "<NULL>" : String(item.value)))
    if (distinct.size > 1) {
      conflicts.add(candidates[0]!.label)
      continue
    }
    values.push(candidates[0]!)
  }

  return { values, conflicts: [...conflicts].sort() }
}

function sourceRecordIdsForLabels(values: readonly ProvenancedProviderHistoryValue[], labels: readonly string[]) {
  const wanted = new Set(labels.map(normalizedLabel))
  return [...new Set(values.filter((item) => wanted.has(normalizedLabel(item.label))).map((item) => item.sourceRecordId))].sort()
}

function previewObservation(
  metricCode: PharmaPilotObservationPreview["metricCode"],
  periodKey: string,
  periodType: PharmaPilotObservationPreview["periodType"],
  numericValue: string,
  canonicalUnit: PharmaPilotObservationPreview["canonicalUnit"],
  sourceCode: PharmaPilotObservationPreview["sourceCode"],
  sourceRecordIds: readonly string[],
  sourceLabels: readonly string[],
  writeState: PharmaPilotWriteState,
  blocker: string,
): PharmaPilotObservationPreview {
  return {
    idempotencyKey: `${PHARMA_CANONICAL_HISTORY_PILOT_VERSION}:${sourceRecordIds.join("+")}:${metricCode}:${periodKey}`,
    metricCode,
    periodKey,
    periodType,
    numericValue,
    canonicalUnit,
    sourceCode,
    sourceRecordIds,
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
  inputs: readonly PharmaStoredDiscoveryInput[],
): PharmaCanonicalHistoryPilotPreview {
  const merged = mergeDiscoveries(inputs)
  if (merged.conflicts.length) {
    return {
      version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
      symbol: "TORNTPHARM",
      observations: [],
      providerConflicts: merged.conflicts,
      productionWriteCount: 0,
      notice: "Provider-label conflicts block canonical history ingestion. No value may be selected implicitly.",
    }
  }

  const providerValues: ProviderHistoryValue[] = merged.values
  const annualRevenue = normalizePharmaAnnualRevenue(providerValues)
  const annualCfo = normalizePharmaAnnualCfo(providerValues)
  const quarterlyOpm = derivePharmaQuarterlyOperatingMargin(providerValues)
  const blocker = "Exact provider fiscal/quarter period_end is not yet proven. Relative labels such as 1Y ago / 2Q ago must not be converted to calendar dates by inference."
  const observations: PharmaPilotObservationPreview[] = []

  for (const point of annualRevenue.points) {
    observations.push(previewObservation("REVENUE_ANNUAL", point.period, "YEAR", point.value, "INR_CRORE", "TRENDLYNE_MCP", sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel], "BLOCKED_PERIOD_IDENTITY", blocker))
  }
  for (const point of annualCfo.points) {
    observations.push(previewObservation("CFO_ANNUAL", point.period, "YEAR", point.value, "INR_CRORE", "TRENDLYNE_MCP", sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel], "BLOCKED_PERIOD_IDENTITY", blocker))
  }
  for (const point of quarterlyOpm.points) {
    observations.push(previewObservation("OPM_QUARTER_DERIVED", point.period, "QUARTER", point.marginPercent, "PERCENT", "PORTFOLIOAI", sourceRecordIdsForLabels(merged.values, point.sourceLabels), point.sourceLabels, "BLOCKED_PERIOD_IDENTITY", blocker))
  }

  return {
    version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
    symbol: "TORNTPHARM",
    observations,
    providerConflicts: [],
    productionWriteCount: 0,
    notice: "This is a deterministic write preview only. Canonical insertion remains blocked until exact period identities and required metric definitions are approved.",
  }
}
