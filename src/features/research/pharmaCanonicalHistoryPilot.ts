import {
  derivePharmaQuarterlyOperatingMargin,
  normalizePharmaAnnualCfo,
  normalizePharmaAnnualRevenue,
  type PharmaAnnualPeriod,
  type PharmaQuarterPeriod,
  type ProviderHistoryValue,
} from "./pharmaHistoryNormalization"
import { TORNTPHARM_PERIOD_IDENTITY, torntpharmPeriodEnd } from "./pharmaPeriodIdentity"
import type { ParsedTrendlyneDiscovery } from "./pharmaStoredDiscoveryParser"

export const PHARMA_CANONICAL_HISTORY_PILOT_VERSION = "PHARMA_CANONICAL_HISTORY_PILOT_V1" as const

export type PharmaPilotWriteState = "READY_AFTER_GATED_SCHEMA_AND_EVIDENCE_CAPTURE" | "BLOCKED_PROVIDER_CONFLICT"

export interface PharmaStoredDiscoveryInput {
  readonly sourceRecordId: string
  readonly discovery: ParsedTrendlyneDiscovery
}

export interface PharmaPilotObservationPreview {
  readonly idempotencyKey: string
  readonly metricCode: "REVENUE_ANNUAL" | "CFO_ANNUAL" | "OPM_QUARTER_DERIVED"
  readonly periodKey: PharmaAnnualPeriod | PharmaQuarterPeriod
  readonly periodType: "YEAR" | "QUARTER"
  readonly periodEnd: string
  readonly numericValue: string
  readonly canonicalUnit: "INR_CRORE" | "PERCENT"
  readonly sourceCode: "TRENDLYNE_MCP"
  readonly calculationOwner: "PROVIDER_VALUE" | "PORTFOLIOAI_DERIVED"
  readonly sourceRecordIds: readonly string[]
  readonly sourceLabels: readonly string[]
  readonly writeState: PharmaPilotWriteState
  readonly blocker: string | null
}

export interface PharmaCanonicalHistoryPilotPreview {
  readonly version: typeof PHARMA_CANONICAL_HISTORY_PILOT_VERSION
  readonly symbol: "TORNTPHARM"
  readonly periodIdentityVersion: typeof TORNTPHARM_PERIOD_IDENTITY.version
  readonly periodIdentityEvidenceUrls: readonly string[]
  readonly observations: readonly PharmaPilotObservationPreview[]
  readonly providerConflicts: readonly string[]
  readonly proposedWriteCount: number
  readonly executedProductionWriteCount: 0
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
  periodKey: PharmaPilotObservationPreview["periodKey"],
  periodType: PharmaPilotObservationPreview["periodType"],
  numericValue: string,
  canonicalUnit: PharmaPilotObservationPreview["canonicalUnit"],
  calculationOwner: PharmaPilotObservationPreview["calculationOwner"],
  sourceRecordIds: readonly string[],
  sourceLabels: readonly string[],
): PharmaPilotObservationPreview {
  const periodEnd = torntpharmPeriodEnd(periodKey)
  return {
    idempotencyKey: `${PHARMA_CANONICAL_HISTORY_PILOT_VERSION}:${sourceRecordIds.join("+")}:${metricCode}:${periodEnd}`,
    metricCode,
    periodKey,
    periodType,
    periodEnd,
    numericValue,
    canonicalUnit,
    sourceCode: "TRENDLYNE_MCP",
    calculationOwner,
    sourceRecordIds,
    sourceLabels,
    writeState: "READY_AFTER_GATED_SCHEMA_AND_EVIDENCE_CAPTURE",
    blocker: "Production still requires the separately approved canonical metric-definition migration plus persistence of the reviewed official period-identity evidence.",
  }
}

/**
 * Builds the exact candidate write set from stored provider evidence. The
 * reporting dates are resolved only because issuer/exchange evidence establishes
 * TORNTPHARM's Apr-Mar fiscal year, FY26 year-end and Q1 FY27 quarter-end.
 * Generic/total-revenue labels are intentionally excluded from operating-revenue
 * history even when they carry useful numbers.
 */
export function buildTorntpharmCanonicalHistoryPilot(
  inputs: readonly PharmaStoredDiscoveryInput[],
): PharmaCanonicalHistoryPilotPreview {
  const merged = mergeDiscoveries(inputs)
  if (merged.conflicts.length) {
    return {
      version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
      symbol: "TORNTPHARM",
      periodIdentityVersion: TORNTPHARM_PERIOD_IDENTITY.version,
      periodIdentityEvidenceUrls: TORNTPHARM_PERIOD_IDENTITY.evidence.map((item) => item.url),
      observations: [],
      providerConflicts: merged.conflicts,
      proposedWriteCount: 0,
      executedProductionWriteCount: 0,
      notice: "Provider-label conflicts block canonical history ingestion. No value may be selected implicitly.",
    }
  }

  const providerValues: ProviderHistoryValue[] = merged.values
  const annualRevenue = normalizePharmaAnnualRevenue(providerValues)
  const annualCfo = normalizePharmaAnnualCfo(providerValues)
  const quarterlyOpm = derivePharmaQuarterlyOperatingMargin(providerValues)
  const observations: PharmaPilotObservationPreview[] = []

  for (const point of annualRevenue.points) {
    observations.push(previewObservation("REVENUE_ANNUAL", point.period, "YEAR", point.value, "INR_CRORE", "PROVIDER_VALUE", sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel]))
  }
  for (const point of annualCfo.points) {
    observations.push(previewObservation("CFO_ANNUAL", point.period, "YEAR", point.value, "INR_CRORE", "PROVIDER_VALUE", sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel]))
  }
  for (const point of quarterlyOpm.points) {
    observations.push(previewObservation("OPM_QUARTER_DERIVED", point.period, "QUARTER", point.marginPercent, "PERCENT", "PORTFOLIOAI_DERIVED", sourceRecordIdsForLabels(merged.values, point.sourceLabels), point.sourceLabels))
  }

  return {
    version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
    symbol: "TORNTPHARM",
    periodIdentityVersion: TORNTPHARM_PERIOD_IDENTITY.version,
    periodIdentityEvidenceUrls: TORNTPHARM_PERIOD_IDENTITY.evidence.map((item) => item.url),
    observations,
    providerConflicts: [],
    proposedWriteCount: observations.length,
    executedProductionWriteCount: 0,
    notice: "Deterministic candidate rows are prepared, but this repository stage executes zero production writes. The pilot must persist official period evidence and apply the approved metric definitions before insertion.",
  }
}
