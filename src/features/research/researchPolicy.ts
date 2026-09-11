import type { ResearchEvidenceStatus, ResearchMetric } from "./types"

const LABELS: Readonly<Record<string, string>> = {
  MARKET_CAP_PROVIDER_RAW: "Provider Market Cap",
  MARKET_CAP: "Market Cap",
  PE_TTM: "P/E (TTM)",
  PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT: "P/E vs 5Y Average · Implied Upside",
  PBV_ADJUSTED_PROVIDER: "Provider Adjusted P/B",
  REVENUE_TTM: "Revenue (TTM)",
  REVENUE: "Revenue",
  NET_PROFIT_TTM: "PAT (TTM)",
  NET_INCOME: "PAT",
  EPS_DILUTED: "Diluted EPS",
  EPS_GROWTH_YOY: "EPS Growth YoY",
  ADVANCES_GROWTH_YOY: "Gross Advances Growth YoY",
  DEPOSITS_GROWTH_YOY: "Deposits Growth YoY",
  CFO_ANNUAL: "Cash Flow from Operations",
  ROE_ANNUAL: "ROE",
  ROCE_ANNUAL: "ROCE",
  EBITDA_TTM: "EBITDA (TTM)",
  OPM_TTM: "Operating Margin (TTM)",
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
])
export const GROWTH_CODES = new Set([
  "ADVANCES_GROWTH_YOY", "DEPOSITS_GROWTH_YOY", "EPS_GROWTH_YOY",
  "REVENUE_TTM", "REVENUE", "NET_PROFIT_TTM", "NET_INCOME", "EPS_DILUTED",
])
export const QUALITY_CODES = new Set(["CFO_ANNUAL", "ROE_ANNUAL", "ROCE_ANNUAL", "OPM_TTM", "GROSS_NPA_PERCENT", "NET_NPA_PERCENT"])

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
