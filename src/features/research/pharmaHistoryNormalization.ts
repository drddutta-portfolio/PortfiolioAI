import Decimal from "decimal.js"

export const PHARMA_HISTORY_NORMALIZATION_VERSION = "PHARMA_HISTORY_NORMALIZATION_V1" as const

export type PharmaAnnualPeriod = "Y0" | "Y1" | "Y2" | "Y3" | "Y4" | "Y5"
export type PharmaQuarterPeriod = "Q0" | "Q1" | "Q2" | "Q3" | "Q4" | "Q5" | "Q6" | "Q7" | "Q8"
export type PharmaHistoryState = "READY" | "PARTIAL" | "MISSING" | "INVALID"

export interface ProviderHistoryValue {
  readonly label: string
  readonly value: string | number | null
}

export interface NormalizedHistoryPoint<P extends string> {
  readonly period: P
  readonly value: string
  readonly sourceLabel: string
}

export interface NormalizedHistorySeries<P extends string> {
  readonly state: PharmaHistoryState
  readonly points: readonly NormalizedHistoryPoint<P>[]
  readonly missingPeriods: readonly P[]
  readonly invalidLabels: readonly string[]
}

export interface NormalizedOperatingMarginPoint {
  readonly period: PharmaQuarterPeriod
  readonly operatingProfit: string
  readonly operatingRevenue: string
  readonly marginPercent: string
  readonly sourceLabels: readonly [string, string]
}

export interface NormalizedOperatingMarginSeries {
  readonly state: PharmaHistoryState
  readonly points: readonly NormalizedOperatingMarginPoint[]
  readonly missingPeriods: readonly PharmaQuarterPeriod[]
  readonly invalidPeriods: readonly PharmaQuarterPeriod[]
}

const ANNUAL_REVENUE_LABELS: Readonly<Record<PharmaAnnualPeriod, string>> = {
  Y0: "Operating Rev. Ann.",
  Y1: "Operating Rev. Ann. 1Y Ago",
  Y2: "Operating Rev. Ann. 2Y Ago",
  Y3: "Operating Rev. Ann. 3Y Ago",
  Y4: "Operating Rev. Ann. 4Y Ago",
  Y5: "Operating Rev. Ann. 5Y Ago",
}

const ANNUAL_CFO_LABELS: Readonly<Record<PharmaAnnualPeriod, string>> = {
  Y0: "Cash from Operating Act. Ann.",
  Y1: "Cash from Operating Act. Ann. 1Y Ago",
  Y2: "Cash from Operating Act. Ann. 2Y Ago",
  Y3: "Cash from Operating Act. Ann. 3Y Ago",
  Y4: "Cash from Operating Act. Ann. 4Y Ago",
  Y5: "Cash from Operating Act. Ann. 5Y Ago",
}

const QUARTER_REVENUE_LABELS: Readonly<Record<PharmaQuarterPeriod, string>> = {
  Q0: "Operating Rev. Qtr",
  Q1: "Operating Rev. 1Q ago",
  Q2: "Operating Rev. 2Q ago",
  Q3: "Operating Rev. 3Q ago",
  Q4: "Operating Rev. 4Q ago",
  Q5: "Operating Rev. 5Q ago",
  Q6: "Operating Rev. 6Q ago",
  Q7: "Operating Rev. 7Q ago",
  Q8: "Operating Rev. 8Q ago",
}

const QUARTER_PROFIT_LABELS: Readonly<Record<PharmaQuarterPeriod, string>> = {
  Q0: "Operating Profit Qtr",
  Q1: "Operating Profit 1Q Ago",
  Q2: "Operating Profit 2Q Ago",
  Q3: "Operating Profit 3Q Ago",
  Q4: "Operating Profit 4Q Ago",
  Q5: "Operating Profit 5Q Ago",
  Q6: "Operating Profit 6Q Ago",
  Q7: "Operating Profit 7Q Ago",
  Q8: "Operating Profit 8Q Ago",
}

function normalizeLabel(value: string) {
  return value.trim().replaceAll(/\s+/gu, " ").toLocaleLowerCase()
}

function exactValueMap(values: readonly ProviderHistoryValue[]) {
  const map = new Map<string, ProviderHistoryValue>()
  for (const value of values) map.set(normalizeLabel(value.label), value)
  return map
}

function parseFiniteDecimal(value: string | number | null): Decimal | null {
  if (value === null || value === "") return null
  try {
    const parsed = new Decimal(value)
    return parsed.isFinite() ? parsed : null
  } catch {
    return null
  }
}

function normalizeMappedSeries<P extends string>(
  values: readonly ProviderHistoryValue[],
  labels: Readonly<Record<P, string>>,
  minimumObservations: number,
): NormalizedHistorySeries<P> {
  const byLabel = exactValueMap(values)
  const points: NormalizedHistoryPoint<P>[] = []
  const missingPeriods: P[] = []
  const invalidLabels: string[] = []

  for (const period of Object.keys(labels) as P[]) {
    const sourceLabel = labels[period]
    const item = byLabel.get(normalizeLabel(sourceLabel))
    if (!item) {
      missingPeriods.push(period)
      continue
    }
    const parsed = parseFiniteDecimal(item.value)
    if (!parsed) {
      invalidLabels.push(item.label)
      continue
    }
    points.push({ period, value: parsed.toString(), sourceLabel: item.label })
  }

  const state: PharmaHistoryState = invalidLabels.length
    ? "INVALID"
    : points.length >= minimumObservations
      ? "READY"
      : points.length
        ? "PARTIAL"
        : "MISSING"

  return { state, points, missingPeriods, invalidLabels }
}

export function normalizePharmaAnnualRevenue(values: readonly ProviderHistoryValue[]) {
  return normalizeMappedSeries(values, ANNUAL_REVENUE_LABELS, 3)
}

export function normalizePharmaAnnualCfo(values: readonly ProviderHistoryValue[]) {
  return normalizeMappedSeries(values, ANNUAL_CFO_LABELS, 3)
}

export function derivePharmaQuarterlyOperatingMargin(values: readonly ProviderHistoryValue[]): NormalizedOperatingMarginSeries {
  const byLabel = exactValueMap(values)
  const points: NormalizedOperatingMarginPoint[] = []
  const missingPeriods: PharmaQuarterPeriod[] = []
  const invalidPeriods: PharmaQuarterPeriod[] = []

  for (const period of Object.keys(QUARTER_REVENUE_LABELS) as PharmaQuarterPeriod[]) {
    const revenueLabel = QUARTER_REVENUE_LABELS[period]
    const profitLabel = QUARTER_PROFIT_LABELS[period]
    const revenueItem = byLabel.get(normalizeLabel(revenueLabel))
    const profitItem = byLabel.get(normalizeLabel(profitLabel))
    if (!revenueItem || !profitItem) {
      missingPeriods.push(period)
      continue
    }
    const revenue = parseFiniteDecimal(revenueItem.value)
    const profit = parseFiniteDecimal(profitItem.value)
    if (!revenue || !profit || revenue.lte(0)) {
      invalidPeriods.push(period)
      continue
    }
    const margin = profit.div(revenue).mul(100)
    points.push({
      period,
      operatingProfit: profit.toString(),
      operatingRevenue: revenue.toString(),
      marginPercent: margin.toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toString(),
      sourceLabels: [profitItem.label, revenueItem.label],
    })
  }

  const state: PharmaHistoryState = invalidPeriods.length
    ? "INVALID"
    : points.length >= 8
      ? "READY"
      : points.length
        ? "PARTIAL"
        : "MISSING"

  return { state, points, missingPeriods, invalidPeriods }
}

export const PHARMA_HISTORY_NORMALIZATION_CONTRACT = {
  version: PHARMA_HISTORY_NORMALIZATION_VERSION,
  provider: "TRENDLYNE_MCP",
  providerTool: "get_parameter_values_multi_stock",
  rules: {
    annualRevenue: "Only exact operating-revenue annual labels may satisfy the series. Generic Rev. Ann. or Total Rev. Ann. values are not interchangeable with Operating Rev. Ann. and are never substituted.",
    annualCfo: "Exact annual CFO labels are normalized to Y0-Y5; CFO alone does not satisfy PHARMA cash-conversion readiness.",
    operatingMargin: "PortfolioAI derives each quarterly OPM from matched-period operating profit / operating revenue × 100 using Decimal arithmetic.",
    missingData: "Missing, invalid or unmatched period values remain missing/invalid and are never coerced to zero.",
  },
} as const
