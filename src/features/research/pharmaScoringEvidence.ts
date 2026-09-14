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

function distinctPeriods(rows: readonly PharmaScoringObservation[], codes: readonly string[], now: number) {
  const result = new Set<string>()
  for (const code of codes) for (const row of usable(rows, code, now)) if (row.period_end) result.add(row.period_end)
  return result
}

function matchedPeriods(rows: readonly PharmaScoringObservation[], codeGroups: readonly (readonly string[])[], now: number) {
  const groups = codeGroups.map((codes) => distinctPeriods(rows, codes, now))
  if (!groups.length) return new Set<string>()
  return new Set([...groups[0]!].filter((period) => groups.every((group) => group.has(period))))
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

export function resolveScoringRuleProfile(profileCode: string) {
  if (profileCode === "BANK_NBFC") return "BANK_NBFC"
  if (profileCode === "PHARMA_V1") return "PHARMA_V1"
  return "GENERAL"
}

export function pharmaProfileForCanonicalSector(sector: string | null) {
  return sector?.trim().toUpperCase() === "PHARMA" ? "PHARMA_V1" : null
}

/**
 * PHARMA_V1 evidence sufficiency only. Numeric Pharma score curves remain
 * separately reviewable. Partial history may increase verified-evidence coverage
 * without becoming score-ready coverage.
 */
export function assessPharmaV1Evidence(inputCode: string, rows: readonly PharmaScoringObservation[], now = Date.now()): PharmaEvidenceAssessment | null {
  if (inputCode === "PHARMA_OPERATING_MARGIN_HISTORY") {
    const matched = matchedPeriods(rows, [["OPERATING_REVENUE_QUARTER"], ["OPERATING_PROFIT_QUARTER"]], now).size
    return assessment(inputCode, "Operating margin history", matched, 8)
  }

  if (inputCode === "PHARMA_REVENUE_GROWTH_HISTORY") {
    const annual = distinctPeriods(rows, ["REVENUE_ANNUAL"], now).size
    return assessment(inputCode, "Revenue history", annual, 3)
  }

  if (inputCode === "PHARMA_ROCE_HISTORY") {
    const annual = distinctPeriods(rows, ["ROCE_ANNUAL"], now).size
    return assessment(inputCode, "ROCE history", annual, 3)
  }

  if (inputCode === "PHARMA_PAT_EPS_HISTORY") {
    const pat = distinctPeriods(rows, ["NET_PROFIT_ANNUAL", "PAT_ANNUAL"], now).size
    const eps = distinctPeriods(rows, ["EPS_DILUTED_ANNUAL", "EPS_DILUTED"], now).size
    const observed = matchedPeriods(rows, [["NET_PROFIT_ANNUAL", "PAT_ANNUAL"], ["EPS_DILUTED_ANNUAL", "EPS_DILUTED"]], now).size
    const evidenceFraction = (fraction(pat, 3) + fraction(eps, 3)) / 2
    return assessment(inputCode, "PAT / EPS history", observed, 3, evidenceFraction)
  }

  if (inputCode === "PHARMA_CASH_CONVERSION_HISTORY") {
    const cfo = distinctPeriods(rows, ["CFO_ANNUAL"], now).size
    const pat = distinctPeriods(rows, ["NET_PROFIT_ANNUAL", "PAT_ANNUAL"], now).size
    const fcfOrCapex = distinctPeriods(rows, ["FREE_CASH_FLOW_ANNUAL", "FCF_ANNUAL", "CAPEX_ANNUAL"], now).size
    const observed = matchedPeriods(rows, [["CFO_ANNUAL"], ["NET_PROFIT_ANNUAL", "PAT_ANNUAL"], ["FREE_CASH_FLOW_ANNUAL", "FCF_ANNUAL", "CAPEX_ANNUAL"]], now).size
    const evidenceFraction = (fraction(cfo, 3) + fraction(pat, 3) + fraction(fcfOrCapex, 3)) / 3
    return assessment(inputCode, "Cash conversion", observed, 3, evidenceFraction)
  }

  if (inputCode === "PHARMA_BALANCE_SHEET_LEVERAGE") {
    const debt = distinctPeriods(rows, ["TOTAL_DEBT_ANNUAL", "TOTAL_DEBT"], now).size
    const cash = distinctPeriods(rows, ["CASH_EQUIVALENTS_ANNUAL", "CASH_AND_EQUIVALENTS_ANNUAL", "CASH_AND_EQUIVALENTS"], now).size
    const ebitda = distinctPeriods(rows, ["EBITDA_ANNUAL", "EBITDA_TTM"], now).size
    const coverage = distinctPeriods(rows, ["INTEREST_COVERAGE_ANNUAL", "INTEREST_COVERAGE"], now).size
    const observed = matchedPeriods(rows, [["TOTAL_DEBT_ANNUAL", "TOTAL_DEBT"], ["CASH_EQUIVALENTS_ANNUAL", "CASH_AND_EQUIVALENTS_ANNUAL", "CASH_AND_EQUIVALENTS"], ["EBITDA_ANNUAL", "EBITDA_TTM"]], now).size
    const evidenceFraction = (fraction(debt, 3) + fraction(cash, 3) + fraction(ebitda, 3) + fraction(coverage, 3)) / 4
    return assessment(inputCode, "Financial strength / leverage", observed, 3, evidenceFraction)
  }

  if (inputCode === "PHARMA_OWNERSHIP_GOVERNANCE") {
    const matched = matchedPeriods(rows, [["SHAREHOLDING_PROMOTER_PERCENT"], ["SHAREHOLDING_FII_FPI_PERCENT"], ["SHAREHOLDING_DII_PERCENT"]], now).size
    return assessment(inputCode, "Ownership & governance history", matched, 4)
  }

  if (inputCode === "PHARMA_VALUATION_CONTEXT") {
    const componentCodes = ["PE_TTM", "EV_EBITDA", "FCF_YIELD", "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT"]
    const available = componentCodes.filter((code) => usable(rows, code, now).length > 0).length
    return assessment(inputCode, "Valuation context", available, componentCodes.length)
  }

  return null
}
