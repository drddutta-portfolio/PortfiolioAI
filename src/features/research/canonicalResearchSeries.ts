import Decimal from "decimal.js"
import type { ResearchMetric } from "./types"

export type CanonicalSeriesIssueReason =
  | "MULTIPLE_SELECTED_OBSERVATIONS"
  | "INCOMPATIBLE_SEMANTICS"
  | "CONFLICTING_VALUES"
  | "UNRESOLVED_REVIEW"

export interface CanonicalSeriesIssue {
  readonly code: string
  readonly periodEnd: string
  readonly reason: CanonicalSeriesIssueReason
  readonly observationIds: readonly string[]
}

export interface CanonicalSeriesSelection {
  readonly metrics: readonly ResearchMetric[]
  readonly issues: readonly CanonicalSeriesIssue[]
}

function decimalIdentity(value: string) {
  try {
    const parsed = new Decimal(value)
    return parsed.isFinite() ? parsed.toString() : value
  } catch {
    return value
  }
}

function semanticIdentity(metric: ResearchMetric) {
  return [
    metric.periodStart ?? "",
    metric.periodEnd ?? "",
    metric.periodType ?? "",
    metric.scope ?? "",
    metric.unit ?? "",
    metric.currency ?? "",
    metric.provider,
    metric.sourceField ?? "",
  ].join("\u001f")
}

function stableMetric(metrics: readonly ResearchMetric[]) {
  return [...metrics].sort((a, b) => a.id.localeCompare(b.id))[0]!
}

export function selectCanonicalResearchSeries(
  metrics: readonly ResearchMetric[],
  code: string,
  expectedPeriodType: string,
): CanonicalSeriesSelection {
  const byPeriod = new Map<string, ResearchMetric[]>()
  for (const metric of metrics) {
    if (metric.code !== code || !metric.periodEnd || !metric.numericValue || metric.periodType !== expectedPeriodType) continue
    const list = byPeriod.get(metric.periodEnd) ?? []
    list.push(metric)
    byPeriod.set(metric.periodEnd, list)
  }

  const selected: ResearchMetric[] = []
  const issues: CanonicalSeriesIssue[] = []

  for (const [periodEnd, periodMetrics] of byPeriod) {
    const decisionSelected = periodMetrics.filter((metric) => metric.selected)
    if (decisionSelected.length > 1) {
      issues.push({ code, periodEnd, reason: "MULTIPLE_SELECTED_OBSERVATIONS", observationIds: decisionSelected.map((metric) => metric.id).sort() })
      continue
    }
    if (decisionSelected.length === 1) {
      const chosen = decisionSelected[0]!
      if (chosen.status === "VERIFIED") selected.push(chosen)
      else issues.push({ code, periodEnd, reason: "UNRESOLVED_REVIEW", observationIds: periodMetrics.map((metric) => metric.id).sort() })
      continue
    }

    const usable = periodMetrics.filter((metric) => metric.status === "VERIFIED" || metric.status === "PROVISIONAL")
    const reviewed = usable.filter((metric) => metric.status === "VERIFIED")
    if (!reviewed.length) continue

    const semanticKeys = new Set(usable.map(semanticIdentity))
    if (semanticKeys.size !== 1) {
      issues.push({ code, periodEnd, reason: "INCOMPATIBLE_SEMANTICS", observationIds: usable.map((metric) => metric.id).sort() })
      continue
    }

    const values = new Set(usable.map((metric) => decimalIdentity(metric.numericValue!)))
    if (values.size !== 1) {
      issues.push({ code, periodEnd, reason: "CONFLICTING_VALUES", observationIds: usable.map((metric) => metric.id).sort() })
      continue
    }

    selected.push(stableMetric(reviewed))
  }

  return {
    metrics: selected.sort((a, b) => (a.periodEnd ?? "").localeCompare(b.periodEnd ?? "") || a.id.localeCompare(b.id)),
    issues: issues.sort((a, b) => a.periodEnd.localeCompare(b.periodEnd) || a.reason.localeCompare(b.reason)),
  }
}

export function compatibleForDerivedRatio(left: ResearchMetric, right: ResearchMetric) {
  if (!left.periodEnd || left.periodEnd !== right.periodEnd) return false
  if (left.periodStart !== right.periodStart) return false
  if (left.periodType !== right.periodType) return false
  if (left.scope !== right.scope) return false
  if (left.unit !== right.unit) return false
  if (left.currency !== right.currency) return false
  if (left.provider !== right.provider && !(left.selected && right.selected)) return false
  return true
}
