import Decimal from "decimal.js"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

/**
 * R5 current-display-only comparisons. Canonical source selection is owned by
 * fundamental_observation_decisions; this module NEVER promotes source evidence.
 * No point-in-time valuation, V1-4 score or investment advice is inferred.
 */
export const RESULTS_COMPARISON_VERSION = "RESULTS_R5_COMPARISON_V1"

export interface QuarterlyMetricComparison {
  readonly code: string
  readonly current: ResultsSourceObservation | null
  readonly qoq: string | null
  readonly yoy: string | null
  readonly qoqLimitation: string | null
  readonly yoyLimitation: string | null
}

const CORE_CODES = [
  "OPERATING_REVENUE_QUARTER", "NET_INTEREST_INCOME_QUARTER",
  "NET_PROFIT_QUARTER", "EPS_DILUTED", "OPERATING_PROFIT_QUARTER",
  "GROSS_NPA_PERCENT", "NET_NPA_PERCENT",
] as const

const EXPECTED_UNITS: Readonly<Record<string, string>> = {
  OPERATING_REVENUE_QUARTER: "INR_CRORE",
  NET_INTEREST_INCOME_QUARTER: "INR_CRORE",
  NET_PROFIT_QUARTER: "INR_CRORE",
  EPS_DILUTED: "INR_PER_SHARE",
  OPERATING_PROFIT_QUARTER: "INR_CRORE",
  GROSS_NPA_PERCENT: "PERCENT",
  NET_NPA_PERCENT: "PERCENT",
}

/** UTC date-only arithmetic avoids timezone and March/June 30/31 errors. */
function canonicalQuarter(end: string): { start: string; previous: string; priorYear: string } | null {
  const match = /^(\d{4})-(03|06|09|12)-(30|31)$/.exec(end)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const date = (y: number, m: number, d: number) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10)
  if (date(year, month, 0) !== end) return null
  return {
    start: date(year, month - 3, 1),
    previous: date(year, month - 3, 0),
    priorYear: date(year - 1, month, 0),
  }
}

function qualified(row: ResultsSourceObservation, code: string, end: string): boolean {
  const quarter = canonicalQuarter(end)
  return Boolean(
    quarter && row.selected && row.code === code && row.periodEnd === end
    && row.periodStart === quarter.start
    && (row.scope === "CONSOLIDATED" || row.scope === "STANDALONE")
    && row.unit === EXPECTED_UNITS[code] && row.currency === "INR"
    && row.source === "COMPANY_EXCHANGE_FILING"
    && row.sourceRecordId && row.securityId
    && /^-?\d+(?:\.\d+)?$/.test(row.value),
  )
}

function selectedFact(
  all: readonly ResultsSourceObservation[],
  securityId: string,
  code: string,
  end: string,
): ResultsSourceObservation | null {
  const candidates = all.filter(row =>
    row.securityId === securityId && row.code === code && row.periodEnd === end && row.selected,
  )
  return candidates.length === 1 && qualified(candidates[0]!, code, end) ? candidates[0]! : null
}

function percentage(
  current: ResultsSourceObservation | null,
  baseline: ResultsSourceObservation | null,
): { value: string | null; limitation: string | null } {
  if (!current) return { value: null, limitation: "Current quarter has no uniquely qualified R4 selection" }
  if (!baseline) return { value: null, limitation: "Comparison quarter has no uniquely qualified R4 selection" }
  if (current.scope !== baseline.scope || current.unit !== baseline.unit || current.currency !== baseline.currency) {
    return { value: null, limitation: "Accounting scope, reporting units or currency differ" }
  }
  if (current.code === "EPS_DILUTED" && (current.originalShareBasis || baseline.originalShareBasis)) {
    return { value: null, limitation: "Split-affected EPS is not comparable without an approved share adjustment" }
  }
  try {
    const present = new Decimal(current.value)
    const base = new Decimal(baseline.value)
    if (!present.isFinite() || !base.isFinite()) throw new Error("Non-finite financial value")
    if (!base.gt(0)) return { value: null, limitation: "Zero or negative baseline; percentage growth is not meaningful" }
    return {
      value: present.minus(base).dividedBy(base).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2),
      limitation: null,
    }
  } catch {
    return { value: null, limitation: "Financial value cannot be read as an exact decimal" }
  }
}

export function compareQuarterMetric(
  rows: readonly ResultsSourceObservation[],
  securityId: string,
  periodEnd: string,
  code: string,
): QuarterlyMetricComparison {
  const quarter = canonicalQuarter(periodEnd)
  const current = quarter ? selectedFact(rows, securityId, code, periodEnd) : null
  const previous = quarter ? selectedFact(rows, securityId, code, quarter.previous) : null
  const priorYear = quarter ? selectedFact(rows, securityId, code, quarter.priorYear) : null
  const qoq = percentage(current, previous)
  const yoy = percentage(current, priorYear)
  return { code, current, qoq: qoq.value, yoy: yoy.value,
    qoqLimitation: qoq.limitation, yoyLimitation: yoy.limitation }
}

export function compareQuarterMetrics(
  rows: readonly ResultsSourceObservation[], securityId: string, periodEnd: string,
): readonly QuarterlyMetricComparison[] {
  return CORE_CODES.map(code => compareQuarterMetric(rows, securityId, periodEnd, code))
}

/** Narration uses derived comparisons, never makes up causes or thesis impact. */
export function explainQuarterlyComparisons(
  comparisons: readonly QuarterlyMetricComparison[],
  bank: boolean,
): readonly string[] {
  const top = comparisons.find(c => c.code === (bank ? "NET_INTEREST_INCOME_QUARTER" : "OPERATING_REVENUE_QUARTER"))
  const profit = comparisons.find(c => c.code === "NET_PROFIT_QUARTER")
  const phrases: string[] = []
  for (const [title, item] of [[bank ? "Net interest income" : "Revenue", top], ["Profit after tax", profit]] as const) {
    if (!item?.current) continue
    if (item.qoq !== null) {
      const amount = new Decimal(item.qoq)
      phrases.push(title + (amount.gt(0) ? " increased " : amount.lt(0) ? " decreased " : " was unchanged ") +
        (amount.eq(0) ? "QoQ" : "by " + amount.abs().toFixed(2) + "% QoQ") + ".")
    } else {
      phrases.push(title + " is source-selected, but a comparable preceding quarter is unavailable.")
    }
    if (item.yoy !== null) {
      const amount = new Decimal(item.yoy)
      phrases.push(title + (amount.gt(0) ? " increased " : amount.lt(0) ? " decreased " : " was unchanged ") +
        (amount.eq(0) ? "YoY" : "by " + amount.abs().toFixed(2) + "% YoY") + ".")
    }
  }
  if (!phrases.length) phrases.push("No sufficiently qualified current-quarter core financial comparisons are available.")
  if (!comparisons.some(c => c.yoy !== null)) phrases.push("Prior-year qualified comparisons are not available; no YoY performance conclusion is drawn.")
  phrases.push("Thesis impact: Not assessed. No investment recommendation or V1-4 research score is inferred.")
  return phrases
}
