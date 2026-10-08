import type { ResearchMetric } from "./types"

export interface CanonicalMetricSeriesSelection {
  readonly accepted: readonly ResearchMetric[]
  readonly unresolvedPeriods: readonly string[]
}

function semanticKey(metric: ResearchMetric) {
  return JSON.stringify([
    metric.periodStart,
    metric.periodEnd,
    metric.periodType,
    metric.scope,
    metric.unit,
    metric.currency,
    metric.provider,
  ])
}

function stableEvidenceOrder(a: ResearchMetric, b: ResearchMetric) {
  return a.retrievedAt.localeCompare(b.retrievedAt) || a.id.localeCompare(b.id)
}

/**
 * Interprets already-loaded research observations without creating a competing
 * reconciliation authority.
 *
 * The selected flag is populated by researchRepository from the canonical
 * fundamental_observation_decisions owner. A unique selected VERIFIED row wins.
 * Without a canonical decision, only semantically identical duplicate captures
 * with the same numeric value may be collapsed. Conflicts or incompatible
 * semantics remain unresolved and are omitted.
 */
export function selectCanonicalMetricSeries(
  metrics: readonly ResearchMetric[],
  code: string,
): CanonicalMetricSeriesSelection {
  const byPeriod = new Map<string, ResearchMetric[]>()
  for (const metric of metrics) {
    if (metric.code !== code || !metric.periodEnd || metric.numericValue === null) continue
    const rows = byPeriod.get(metric.periodEnd) ?? []
    rows.push(metric)
    byPeriod.set(metric.periodEnd, rows)
  }

  const accepted: ResearchMetric[] = []
  const unresolvedPeriods: string[] = []

  for (const [periodEnd, rows] of [...byPeriod.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const selected = rows.filter((row) => row.selected && row.status === "VERIFIED")
    if (selected.length === 1) {
      accepted.push(selected[0]!)
      continue
    }
    if (selected.length > 1) {
      unresolvedPeriods.push(periodEnd)
      continue
    }

    if (rows.some((row) => row.status === "CONFLICTING" || row.status === "AMBIGUOUS" || row.status === "REVIEW_REQUIRED")) {
      unresolvedPeriods.push(periodEnd)
      continue
    }

    const verified = rows.filter((row) => row.status === "VERIFIED")
    if (!verified.length) {
      unresolvedPeriods.push(periodEnd)
      continue
    }

    const semanticKeys = new Set(verified.map(semanticKey))
    const values = new Set(verified.map((row) => row.numericValue))
    if (semanticKeys.size !== 1 || values.size !== 1) {
      unresolvedPeriods.push(periodEnd)
      continue
    }

    accepted.push([...verified].sort(stableEvidenceOrder)[0]!)
  }

  return { accepted, unresolvedPeriods }
}

export function compatibleForDerivedRatio(left: ResearchMetric, right: ResearchMetric) {
  return left.periodStart === right.periodStart
    && left.periodEnd === right.periodEnd
    && left.periodType === right.periodType
    && left.scope === right.scope
    && left.unit === right.unit
    && left.currency === right.currency
    && left.provider === right.provider
}
