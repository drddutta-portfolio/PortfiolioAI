import {
  normalizePharmaAnnualCfo,
  normalizePharmaAnnualRevenue,
  normalizePharmaQuarterlyOperatingProfit,
  normalizePharmaQuarterlyOperatingRevenue,
  type PharmaAnnualPeriod,
  type PharmaQuarterPeriod,
  type ProviderHistoryValue,
} from "./pharmaHistoryNormalization"
import { TORNTPHARM_PERIOD_IDENTITY, torntpharmPeriodEnd } from "./pharmaPeriodIdentity"
import type { ParsedTrendlyneDiscovery } from "./pharmaStoredDiscoveryParser"

export const PHARMA_CANONICAL_HISTORY_PILOT_VERSION = "PHARMA_CANONICAL_HISTORY_PILOT_V2" as const

export type PharmaPilotWriteState = "READY_AFTER_GATED_SCHEMA_AND_EVIDENCE_CAPTURE"

export interface PharmaStoredDiscoveryInput {
  readonly sourceRecordId: string
  readonly discovery: ParsedTrendlyneDiscovery
}

export type PharmaPilotMetricCode =
  | "REVENUE_ANNUAL"
  | "CFO_ANNUAL"
  | "OPERATING_REVENUE_QUARTER"
  | "OPERATING_PROFIT_QUARTER"

export interface PharmaPilotObservationPreview {
  readonly idempotencyKey: string
  readonly metricCode: PharmaPilotMetricCode
  readonly periodKey: PharmaAnnualPeriod | PharmaQuarterPeriod
  readonly periodType: "YEAR" | "QUARTER"
  readonly periodEnd: string
  readonly numericValue: string
  readonly canonicalUnit: "INR_CRORE"
  readonly sourceCode: "TRENDLYNE_MCP"
  readonly sourceRecordIds: readonly string[]
  readonly sourceLabels: readonly string[]
  readonly writeState: PharmaPilotWriteState
  readonly blocker: string | null
}

export interface PharmaPilotBlockedPoint {
  readonly metricCode: PharmaPilotMetricCode
  readonly periodKey: PharmaAnnualPeriod | PharmaQuarterPeriod
  readonly reason: "MISSING_PROVIDER_VALUE" | "PROVIDER_CONFLICT"
  readonly conflictingLabels: readonly string[]
}

export interface PharmaCanonicalHistoryPilotPreview {
  readonly version: typeof PHARMA_CANONICAL_HISTORY_PILOT_VERSION
  readonly symbol: "TORNTPHARM"
  readonly periodIdentityVersion: typeof TORNTPHARM_PERIOD_IDENTITY.version
  readonly periodIdentityEvidenceUrls: readonly string[]
  readonly observations: readonly PharmaPilotObservationPreview[]
  readonly blockedPoints: readonly PharmaPilotBlockedPoint[]
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
    values.push(...candidates)
  }

  return { values, conflicts: [...conflicts].sort() }
}

function sourceRecordIdsForLabels(values: readonly ProvenancedProviderHistoryValue[], labels: readonly string[]) {
  const wanted = new Set(labels.map(normalizedLabel))
  return [...new Set(values.filter((item) => wanted.has(normalizedLabel(item.label))).map((item) => item.sourceRecordId))].sort()
}

function previewObservation(
  metricCode: PharmaPilotMetricCode,
  periodKey: PharmaAnnualPeriod | PharmaQuarterPeriod,
  periodType: "YEAR" | "QUARTER",
  numericValue: string,
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
    canonicalUnit: "INR_CRORE",
    sourceCode: "TRENDLYNE_MCP",
    sourceRecordIds,
    sourceLabels,
    writeState: "READY_AFTER_GATED_SCHEMA_AND_EVIDENCE_CAPTURE",
    blocker: "Production still requires the separately approved metric-definition migration plus persistence/review of the official TORNTPHARM period-identity evidence.",
  }
}

function addMissingBlocks<P extends PharmaAnnualPeriod | PharmaQuarterPeriod>(
  target: PharmaPilotBlockedPoint[],
  metricCode: PharmaPilotMetricCode,
  missingPeriods: readonly P[],
  conflicts: readonly string[],
) {
  for (const periodKey of missingPeriods) {
    const periodNumber = Number(periodKey.slice(1))
    const conflictLabels = conflicts.filter((label) => {
      const normalized = normalizedLabel(label)
      if (!normalized.includes("operating profit")) return false
      if (periodKey === "Q0") return normalized.includes("qtr") && !/\d+q/u.test(normalized)
      return normalized.includes(`${periodNumber}q`)
    })
    target.push({
      metricCode,
      periodKey,
      reason: conflictLabels.length ? "PROVIDER_CONFLICT" : "MISSING_PROVIDER_VALUE",
      conflictingLabels: conflictLabels,
    })
  }
}

/**
 * Builds the exact candidate raw-evidence write set from retained Trendlyne
 * captures. Derived OPM is intentionally not persisted here: the canonical
 * evidence is the matched raw operating-profit and operating-revenue series,
 * while PortfolioAI derives OPM deterministically downstream.
 *
 * Provider conflicts are local blockers. A conflict in Q6 operating profit does
 * not discard independently valid CFO or revenue observations.
 */
export function buildTorntpharmCanonicalHistoryPilot(
  inputs: readonly PharmaStoredDiscoveryInput[],
): PharmaCanonicalHistoryPilotPreview {
  const merged = mergeDiscoveries(inputs)
  const providerValues: ProviderHistoryValue[] = merged.values
  const annualRevenue = normalizePharmaAnnualRevenue(providerValues)
  const annualCfo = normalizePharmaAnnualCfo(providerValues)
  const quarterlyRevenue = normalizePharmaQuarterlyOperatingRevenue(providerValues)
  const quarterlyProfit = normalizePharmaQuarterlyOperatingProfit(providerValues)
  const observations: PharmaPilotObservationPreview[] = []
  const blockedPoints: PharmaPilotBlockedPoint[] = []

  for (const point of annualRevenue.points) {
    observations.push(previewObservation("REVENUE_ANNUAL", point.period, "YEAR", point.value, sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel]))
  }
  for (const point of annualCfo.points) {
    observations.push(previewObservation("CFO_ANNUAL", point.period, "YEAR", point.value, sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel]))
  }
  for (const point of quarterlyRevenue.points) {
    observations.push(previewObservation("OPERATING_REVENUE_QUARTER", point.period, "QUARTER", point.value, sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel]))
  }
  for (const point of quarterlyProfit.points) {
    observations.push(previewObservation("OPERATING_PROFIT_QUARTER", point.period, "QUARTER", point.value, sourceRecordIdsForLabels(merged.values, [point.sourceLabel]), [point.sourceLabel]))
  }

  addMissingBlocks(blockedPoints, "REVENUE_ANNUAL", annualRevenue.missingPeriods, [])
  addMissingBlocks(blockedPoints, "CFO_ANNUAL", annualCfo.missingPeriods, [])
  addMissingBlocks(blockedPoints, "OPERATING_REVENUE_QUARTER", quarterlyRevenue.missingPeriods, [])
  addMissingBlocks(blockedPoints, "OPERATING_PROFIT_QUARTER", quarterlyProfit.missingPeriods, merged.conflicts)

  observations.sort((a, b) => a.metricCode.localeCompare(b.metricCode) || a.periodEnd.localeCompare(b.periodEnd))
  blockedPoints.sort((a, b) => a.metricCode.localeCompare(b.metricCode) || a.periodKey.localeCompare(b.periodKey))

  return {
    version: PHARMA_CANONICAL_HISTORY_PILOT_VERSION,
    symbol: "TORNTPHARM",
    periodIdentityVersion: TORNTPHARM_PERIOD_IDENTITY.version,
    periodIdentityEvidenceUrls: TORNTPHARM_PERIOD_IDENTITY.evidence.map((item) => item.url),
    observations,
    blockedPoints,
    providerConflicts: merged.conflicts,
    proposedWriteCount: observations.length,
    executedProductionWriteCount: 0,
    notice: "Repository-only write manifest. It promotes only exact stored provider values with proven period identity. Generic/total annual revenue is not substituted for operating revenue; provider-conflicted periods stay blocked; derived OPM is calculated downstream rather than written as provider evidence.",
  }
}
