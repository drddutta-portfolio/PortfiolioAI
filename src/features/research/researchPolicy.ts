import type { ResearchEvidenceStatus, ResearchMetric } from "./types"

const LABELS: Readonly<Record<string, string>> = {
  MARKET_CAP_PROVIDER_RAW: "Provider Market Cap",
  MARKET_CAP: "Market Cap",
  PE_TTM: "P/E (TTM)",
  PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT: "P/E vs 5Y Average · Implied Upside",
  PBV_ADJUSTED_PROVIDER: "Provider Adjusted P/B",
  EV_EBITDA: "EV / EBITDA",
  FCF_YIELD_PERCENT: "Free Cash Flow Yield",
  REVENUE_TTM: "Revenue (TTM)",
  REVENUE: "Revenue",
  REVENUE_ANNUAL: "Revenue from Operations",
  OPERATING_REVENUE_QUARTER: "Quarterly Operating Revenue",
  OPERATING_PROFIT_QUARTER: "Quarterly Operating Profit",
  NET_PROFIT_TTM: "PAT (TTM)",
  NET_INCOME: "PAT",
  PAT_ATTRIBUTABLE_ANNUAL: "PAT Attributable to Owners",
  EPS_DILUTED: "Diluted EPS",
  EPS_DILUTED_ANNUAL: "Diluted EPS",
  EPS_GROWTH_YOY: "EPS Growth YoY",
  ADVANCES_GROWTH_YOY: "Gross Advances Growth YoY",
  DEPOSITS_GROWTH_YOY: "Deposits Growth YoY",
  CFO_ANNUAL: "Cash Flow from Operations",
  CAPEX_ANNUAL: "Capital Expenditure",
  FREE_CASH_FLOW_ANNUAL: "Free Cash Flow",
  ROE_ANNUAL: "ROE",
  ROCE_ANNUAL: "ROCE",
  ROCE_MANAGEMENT_ANNUAL: "Management-reported ROCE",
  EBITDA_TTM: "EBITDA (TTM)",
  EBITDA_ANNUAL: "Operating EBITDA",
  OPM_TTM: "Operating Margin (TTM)",
  NET_DEBT_EBITDA_ANNUAL: "Net Debt / EBITDA",
  INTEREST_COVERAGE_ANNUAL: "Interest Coverage",
  SHORT_TERM_DEBT_ANNUAL: "Short-term Debt",
  TOTAL_DEBT_ANNUAL: "Total Debt",
  CASH_EQUIVALENTS_ANNUAL: "Cash & Cash Equivalents",
  RND_EXPENSE_ANNUAL: "R&D Expenditure",
  RND_INTENSITY_PERCENT: "R&D Intensity",
  INDIA_REVENUE_ANNUAL: "India Revenue",
  USA_REVENUE_ANNUAL: "USA Revenue",
  GERMANY_REVENUE_ANNUAL: "Germany Revenue",
  BRAZIL_REVENUE_ANNUAL: "Brazil Revenue",
  OTHER_INTERNATIONAL_REVENUE_ANNUAL: "Other International Revenue",
  PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE: "Pipeline / Launch / Approval Evidence",
  GROSS_NPA_PERCENT: "Gross NPA Ratio",
  NET_NPA_PERCENT: "Net NPA Ratio",
  SHAREHOLDING_PROMOTER_PERCENT: "Promoter",
  SHAREHOLDING_FII_FPI_PERCENT: "FII / FPI",
  SHAREHOLDING_DII_PERCENT: "DII",
  SHAREHOLDING_MUTUAL_FUND_PERCENT: "Mutual Fund",
  SHAREHOLDING_PUBLIC_PERCENT: "Public",
  SHAREHOLDING_PROMOTER_PLEDGE_PERCENT: "Promoter Pledge",
}

export const OWNERSHIP_CODES = new Set([
  "SHAREHOLDING_PROMOTER_PERCENT", "SHAREHOLDING_FII_FPI_PERCENT", "SHAREHOLDING_DII_PERCENT",
  "SHAREHOLDING_MUTUAL_FUND_PERCENT", "SHAREHOLDING_PUBLIC_PERCENT", "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",
])
export const VALUATION_CODES = new Set([
  "MARKET_CAP_PROVIDER_RAW", "MARKET_CAP", "PE_TTM", "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT", "PBV_ADJUSTED_PROVIDER",
  "EV_EBITDA", "FCF_YIELD_PERCENT",
])
export const GROWTH_CODES = new Set([
  "ADVANCES_GROWTH_YOY", "DEPOSITS_GROWTH_YOY", "EPS_GROWTH_YOY",
  "REVENUE_TTM", "REVENUE", "REVENUE_ANNUAL", "NET_PROFIT_TTM", "NET_INCOME", "PAT_ATTRIBUTABLE_ANNUAL", "EPS_DILUTED", "EPS_DILUTED_ANNUAL",
  "INDIA_REVENUE_ANNUAL", "USA_REVENUE_ANNUAL", "GERMANY_REVENUE_ANNUAL", "BRAZIL_REVENUE_ANNUAL", "OTHER_INTERNATIONAL_REVENUE_ANNUAL",
])
export const QUALITY_CODES = new Set([
  "CFO_ANNUAL", "CAPEX_ANNUAL", "FREE_CASH_FLOW_ANNUAL", "ROE_ANNUAL", "ROCE_ANNUAL", "ROCE_MANAGEMENT_ANNUAL",
  "OPM_TTM", "OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER", "EBITDA_TTM", "EBITDA_ANNUAL",
  "NET_DEBT_EBITDA_ANNUAL", "INTEREST_COVERAGE_ANNUAL", "SHORT_TERM_DEBT_ANNUAL", "TOTAL_DEBT_ANNUAL", "CASH_EQUIVALENTS_ANNUAL",
  "RND_EXPENSE_ANNUAL", "RND_INTENSITY_PERCENT", "GROSS_NPA_PERCENT", "NET_NPA_PERCENT",
])

export function metricLabel(code: string, fallback?: string | null) {
  return LABELS[code] ?? fallback ?? code.replaceAll("_", " ")
}

export function evidenceStatus(
  status: string | null,
  freshUntil: string | null,
  selected = false,
  contractReviewed = false,
): ResearchEvidenceStatus {
  if (freshUntil && Date.parse(freshUntil) <= Date.now()) return "STALE"
  if (status === "CONFLICTING") return "CONFLICTING"
  if (status === "REJECTED") return "AMBIGUOUS"
  if (status === "REVIEW_REQUIRED") return "REVIEW_REQUIRED"
  if (status === "AVAILABLE" && contractReviewed) return "VERIFIED"
  return selected ? "VERIFIED" : "PROVISIONAL"
}

export function latestByCode(metrics: readonly ResearchMetric[]) {
  const result = new Map<string, ResearchMetric>()
  metrics.forEach((metric) => {
    const current = result.get(metric.code)
    if (!current || `${metric.periodEnd ?? ""}:${metric.retrievedAt}` > `${current.periodEnd ?? ""}:${current.retrievedAt}`) result.set(metric.code, metric)
  })
  return result
}

export function coverageStatus(metric: ResearchMetric | undefined): ResearchEvidenceStatus {
  return metric?.status ?? "UNAVAILABLE"
}

export function formatResearchMetric(metric: ResearchMetric | undefined) {
  if (!metric?.value) return "Unavailable"
  if (metric.unit?.includes("PERCENT")) return `${metric.value}%`
  if (metric.currency === "INR" || metric.unit === "INR") return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(metric.value))
  return metric.value
}
