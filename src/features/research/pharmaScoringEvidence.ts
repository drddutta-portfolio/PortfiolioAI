export interface PharmaScoringObservation {
  readonly metric_code: string
  readonly numeric_value: number | string | null
  readonly evidence_status: string
  readonly period_end: string | null
  readonly fresh_until: string
}

export interface PharmaEvidenceAssessment {
  readonly inputCode: string
  readonly label: string
  readonly observedCount: number
  readonly minimumCount: number
  readonly evidenceFraction: number
  readonly contractSatisfied: boolean
}

const finite = (value: number | string | null) => value !== null && value !== "" && Number.isFinite(Number(value))

function usable(rows: readonly PharmaScoringObservation[], code: string, now: number) {
  return rows.filter((row) => row.metric_code === code && row.period_end && row.evidence_status === "AVAILABLE" && Date.parse(row.fresh_until) > now && finite(row.numeric_value))
}

function distinctPeriods(rows: readonly PharmaScoringObservation[], code: string, now: number) {
  return new Set(usable(rows, code, now).map((row) => row.period_end as string))
}

function fraction(count: number, minimum: number) {
  return minimum <= 0 ? 0 : Math.min(1, count / minimum)
}

function assessment(inputCode: string, label: string, observedCount: number, minimumCount: number, evidenceFraction = fraction(observedCount, minimumCount)): PharmaEvidenceAssessment {
  return {
    inputCode,
    label,
    observedCount,
    minimumCount,
    evidenceFraction: Math.max(0, Math.min(1, evidenceFraction)),
    contractSatisfied: observedCount >= minimumCount && evidenceFraction >= 1,
  }
}

/**
 * R4I evaluates evidence sufficiency only. PHARMA_V1 score curves remain
 * unapproved, so this function deliberately never emits a numeric investment
 * score. Partial history may increase evidence coverage without becoming
 * score-ready coverage.
 */
export function assessPharmaV1Evidence(inputCode: string, rows: readonly PharmaScoringObservation[], now = Date.now()): PharmaEvidenceAssessment | null {
  if (inputCode === "PHARMA_OPERATING_MARGIN_HISTORY") {
    const revenue = distinctPeriods(rows, "OPERATING_REVENUE_QUARTER", now)
    const profit = distinctPeriods(rows, "OPERATING_PROFIT_QUARTER", now)
    const matched = [...revenue].filter((period) => profit.has(period)).length
    return assessment(inputCode, "Operating margin history", matched, 8)
  }

  if (inputCode === "PHARMA_REVENUE_GROWTH_HISTORY") {
    const annual = distinctPeriods(rows, "REVENUE_ANNUAL", now).size
    return assessment(inputCode, "Revenue history", annual, 3)
  }

  if (inputCode === "PHARMA_ROCE_HISTORY") {
    const annual = distinctPeriods(rows, "ROCE_ANNUAL", now).size
    return assessment(inputCode, "ROCE history", annual, 3)
  }

  if (inputCode === "PHARMA_PAT_EPS_HISTORY") {
    const pat = distinctPeriods(rows, "NET_PROFIT_ANNUAL", now).size
    const eps = distinctPeriods(rows, "EPS_DILUTED_ANNUAL", now).size
    const observed = Math.min(pat, eps)
    const evidenceFraction = (fraction(pat, 3) + fraction(eps, 3)) / 2
    return assessment(inputCode, "PAT / EPS history", observed, 3, evidenceFraction)
  }

  if (inputCode === "PHARMA_CASH_CONVERSION_HISTORY") {
    const cfo = distinctPeriods(rows, "CFO_ANNUAL", now).size
    const pat = distinctPeriods(rows, "NET_PROFIT_ANNUAL", now).size
    const fcf = distinctPeriods(rows, "FREE_CASH_FLOW_ANNUAL", now).size
    const observed = Math.min(cfo, pat, fcf)
    const evidenceFraction = (fraction(cfo, 3) + fraction(pat, 3) + fraction(fcf, 3)) / 3
    return assessment(inputCode, "Cash conversion", observed, 3, evidenceFraction)
  }

  if (inputCode === "PHARMA_BALANCE_SHEET_LEVERAGE") {
    const debt = distinctPeriods(rows, "TOTAL_DEBT_ANNUAL", now).size
    const cash = distinctPeriods(rows, "CASH_EQUIVALENTS_ANNUAL", now).size
    const ebitda = distinctPeriods(rows, "EBITDA_ANNUAL", now).size
    const coverage = distinctPeriods(rows, "INTEREST_COVERAGE_ANNUAL", now).size
    const observed = Math.min(debt, cash, ebitda, coverage)
    const evidenceFraction = (fraction(debt, 3) + fraction(cash, 3) + fraction(ebitda, 3) + fraction(coverage, 3)) / 4
    return assessment(inputCode, "Balance-sheet strength", observed, 3, evidenceFraction)
  }

  return null
}
