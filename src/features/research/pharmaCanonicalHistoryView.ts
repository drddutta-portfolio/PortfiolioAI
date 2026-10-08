import { compatibleForDerivedRatio, selectCanonicalMetricSeries } from "./canonicalMetricSeries"
import { deriveOperatingMarginPercent } from "./pharmaOperatingMargin"
import type { ResearchMetric, SecurityResearch } from "./types"

export interface PharmaCanonicalPoint {
  readonly periodEnd: string
  readonly value: string
}

export interface PharmaCanonicalOpmPoint {
  readonly periodEnd: string
  readonly operatingRevenue: string
  readonly operatingProfit: string
  readonly marginPercent: string
}

export interface PharmaCanonicalHistoryView {
  readonly annualRevenue: readonly PharmaCanonicalPoint[]
  readonly annualCfo: readonly PharmaCanonicalPoint[]
  readonly quarterlyOperatingRevenue: readonly PharmaCanonicalPoint[]
  readonly quarterlyOperatingProfit: readonly PharmaCanonicalPoint[]
  readonly quarterlyOpm: readonly PharmaCanonicalOpmPoint[]
  readonly unresolvedPeriods: {
    readonly annualRevenue: readonly string[]
    readonly annualCfo: readonly string[]
    readonly quarterlyOperatingRevenue: readonly string[]
    readonly quarterlyOperatingProfit: readonly string[]
    readonly quarterlyOpm: readonly string[]
  }
}

function points(metrics: readonly ResearchMetric[], code: string) {
  const selection = selectCanonicalMetricSeries(metrics, code)
  return {
    points: selection.accepted.map((metric) => ({ periodEnd: metric.periodEnd!, value: metric.numericValue! })),
    rows: selection.accepted,
    unresolvedPeriods: selection.unresolvedPeriods,
  }
}

export function buildPharmaCanonicalHistoryView(research: SecurityResearch): PharmaCanonicalHistoryView | null {
  if (research.sector !== "Pharma") return null

  const annualRevenueSelection = points(research.metrics, "REVENUE_ANNUAL")
  const annualCfoSelection = points(research.metrics, "CFO_ANNUAL")
  const quarterlyRevenueSelection = points(research.metrics, "OPERATING_REVENUE_QUARTER")
  const quarterlyProfitSelection = points(research.metrics, "OPERATING_PROFIT_QUARTER")

  const revenueByPeriod = new Map(quarterlyRevenueSelection.rows.map((row) => [row.periodEnd!, row]))
  const profitByPeriod = new Map(quarterlyProfitSelection.rows.map((row) => [row.periodEnd!, row]))
  const quarterlyOpm: PharmaCanonicalOpmPoint[] = []
  const unresolvedOpm = new Set([
    ...quarterlyRevenueSelection.unresolvedPeriods,
    ...quarterlyProfitSelection.unresolvedPeriods,
  ])

  for (const [periodEnd, revenue] of revenueByPeriod) {
    const profit = profitByPeriod.get(periodEnd)
    if (!profit) continue
    if (!compatibleForDerivedRatio(revenue, profit)) {
      unresolvedOpm.add(periodEnd)
      continue
    }
    const marginPercent = deriveOperatingMarginPercent(profit.numericValue!, revenue.numericValue!)
    if (marginPercent === null) {
      unresolvedOpm.add(periodEnd)
      continue
    }
    quarterlyOpm.push({
      periodEnd,
      operatingRevenue: revenue.numericValue!,
      operatingProfit: profit.numericValue!,
      marginPercent,
    })
  }

  quarterlyOpm.sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
  return {
    annualRevenue: annualRevenueSelection.points,
    annualCfo: annualCfoSelection.points,
    quarterlyOperatingRevenue: quarterlyRevenueSelection.points,
    quarterlyOperatingProfit: quarterlyProfitSelection.points,
    quarterlyOpm,
    unresolvedPeriods: {
      annualRevenue: annualRevenueSelection.unresolvedPeriods,
      annualCfo: annualCfoSelection.unresolvedPeriods,
      quarterlyOperatingRevenue: quarterlyRevenueSelection.unresolvedPeriods,
      quarterlyOperatingProfit: quarterlyProfitSelection.unresolvedPeriods,
      quarterlyOpm: [...unresolvedOpm].sort(),
    },
  }
}
