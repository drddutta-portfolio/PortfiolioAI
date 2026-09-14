import Decimal from "decimal.js"
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
}

function verifiedByCode(metrics: readonly ResearchMetric[], code: string) {
  const latest = new Map<string, ResearchMetric>()
  for (const metric of metrics) {
    if (metric.code !== code || metric.status !== "VERIFIED" || !metric.numericValue || !metric.periodEnd) continue
    const current = latest.get(metric.periodEnd)
    if (!current || metric.retrievedAt > current.retrievedAt) latest.set(metric.periodEnd, metric)
  }
  return [...latest.values()].sort((a, b) => (a.periodEnd ?? "").localeCompare(b.periodEnd ?? ""))
}

function points(metrics: readonly ResearchMetric[], code: string): PharmaCanonicalPoint[] {
  return verifiedByCode(metrics, code).map((metric) => ({ periodEnd: metric.periodEnd!, value: metric.numericValue! }))
}

export function buildPharmaCanonicalHistoryView(research: SecurityResearch): PharmaCanonicalHistoryView | null {
  if (research.sector !== "Pharma") return null

  const annualRevenue = points(research.metrics, "REVENUE_ANNUAL")
  const annualCfo = points(research.metrics, "CFO_ANNUAL")
  const quarterlyOperatingRevenue = points(research.metrics, "OPERATING_REVENUE_QUARTER")
  const quarterlyOperatingProfit = points(research.metrics, "OPERATING_PROFIT_QUARTER")

  const revenueByPeriod = new Map(quarterlyOperatingRevenue.map((point) => [point.periodEnd, point.value]))
  const profitByPeriod = new Map(quarterlyOperatingProfit.map((point) => [point.periodEnd, point.value]))
  const quarterlyOpm: PharmaCanonicalOpmPoint[] = []

  for (const [periodEnd, revenueValue] of revenueByPeriod) {
    const profitValue = profitByPeriod.get(periodEnd)
    if (!profitValue) continue
    try {
      const revenue = new Decimal(revenueValue)
      const profit = new Decimal(profitValue)
      if (!revenue.isFinite() || !profit.isFinite() || revenue.lte(0)) continue
      quarterlyOpm.push({
        periodEnd,
        operatingRevenue: revenue.toString(),
        operatingProfit: profit.toString(),
        marginPercent: profit.div(revenue).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString(),
      })
    } catch {
      // Fail closed: invalid numeric evidence is omitted from the derived series.
    }
  }

  quarterlyOpm.sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
  return { annualRevenue, annualCfo, quarterlyOperatingRevenue, quarterlyOperatingProfit, quarterlyOpm }
}
