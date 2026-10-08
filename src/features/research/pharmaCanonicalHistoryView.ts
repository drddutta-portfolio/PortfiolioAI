import Decimal from "decimal.js"
import { compatibleForDerivedRatio, selectCanonicalResearchSeries, type CanonicalSeriesIssue } from "./canonicalResearchSeries"
import { derivePharmaOperatingMarginPercent } from "./pharmaHistoryNormalization"
import type { ResearchMetric, SecurityResearch } from "./types"

export interface PharmaCanonicalPoint {
  readonly periodEnd: string
  readonly value: string
  readonly observationId: string
  readonly periodStart: string | null
  readonly periodType: string
  readonly scope: string | null
  readonly unit: string | null
  readonly currency: string | null
  readonly provider: string
}

export interface PharmaCanonicalOpmPoint {
  readonly periodEnd: string
  readonly operatingRevenue: string
  readonly operatingProfit: string
  readonly marginPercent: string
  readonly revenueObservationId: string
  readonly profitObservationId: string
}

export interface PharmaCanonicalHistoryView {
  readonly annualRevenue: readonly PharmaCanonicalPoint[]
  readonly annualCfo: readonly PharmaCanonicalPoint[]
  readonly quarterlyOperatingRevenue: readonly PharmaCanonicalPoint[]
  readonly quarterlyOperatingProfit: readonly PharmaCanonicalPoint[]
  readonly quarterlyOpm: readonly PharmaCanonicalOpmPoint[]
  readonly unresolvedIssues: readonly CanonicalSeriesIssue[]
  readonly incompatibleOpmPeriods: readonly string[]
}

function point(metric: ResearchMetric): PharmaCanonicalPoint {
  return {
    periodEnd: metric.periodEnd!,
    value: new Decimal(metric.numericValue!).toString(),
    observationId: metric.id,
    periodStart: metric.periodStart,
    periodType: metric.periodType!,
    scope: metric.scope,
    unit: metric.unit,
    currency: metric.currency,
    provider: metric.provider,
  }
}

function series(metrics: readonly ResearchMetric[], code: string, periodType: "YEAR" | "QUARTER") {
  const selection = selectCanonicalResearchSeries(metrics, code, periodType)
  return { points: selection.metrics.map(point), metrics: selection.metrics, issues: selection.issues }
}

export function buildPharmaCanonicalHistoryView(research: SecurityResearch): PharmaCanonicalHistoryView | null {
  if (research.sector !== "Pharma") return null

  const annualRevenueSelection = series(research.metrics, "REVENUE_ANNUAL", "YEAR")
  const annualCfoSelection = series(research.metrics, "CFO_ANNUAL", "YEAR")
  const quarterlyRevenueSelection = series(research.metrics, "OPERATING_REVENUE_QUARTER", "QUARTER")
  const quarterlyProfitSelection = series(research.metrics, "OPERATING_PROFIT_QUARTER", "QUARTER")

  const revenueByPeriod = new Map(quarterlyRevenueSelection.metrics.map((metric) => [metric.periodEnd!, metric]))
  const profitByPeriod = new Map(quarterlyProfitSelection.metrics.map((metric) => [metric.periodEnd!, metric]))
  const quarterlyOpm: PharmaCanonicalOpmPoint[] = []
  const incompatibleOpmPeriods: string[] = []

  for (const [periodEnd, revenueMetric] of revenueByPeriod) {
    const profitMetric = profitByPeriod.get(periodEnd)
    if (!profitMetric) continue
    if (!compatibleForDerivedRatio(revenueMetric, profitMetric)) {
      incompatibleOpmPeriods.push(periodEnd)
      continue
    }
    const marginPercent = derivePharmaOperatingMarginPercent(profitMetric.numericValue, revenueMetric.numericValue)
    if (marginPercent === null) {
      incompatibleOpmPeriods.push(periodEnd)
      continue
    }
    quarterlyOpm.push({
      periodEnd,
      operatingRevenue: new Decimal(revenueMetric.numericValue!).toString(),
      operatingProfit: new Decimal(profitMetric.numericValue!).toString(),
      marginPercent,
      revenueObservationId: revenueMetric.id,
      profitObservationId: profitMetric.id,
    })
  }

  quarterlyOpm.sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
  incompatibleOpmPeriods.sort()

  return {
    annualRevenue: annualRevenueSelection.points,
    annualCfo: annualCfoSelection.points,
    quarterlyOperatingRevenue: quarterlyRevenueSelection.points,
    quarterlyOperatingProfit: quarterlyProfitSelection.points,
    quarterlyOpm,
    unresolvedIssues: [
      ...annualRevenueSelection.issues,
      ...annualCfoSelection.issues,
      ...quarterlyRevenueSelection.issues,
      ...quarterlyProfitSelection.issues,
    ].sort((a, b) => a.periodEnd.localeCompare(b.periodEnd) || a.reason.localeCompare(b.reason)),
    incompatibleOpmPeriods,
  }
}
