export const TRENDLYNE_PARAMETER_CONTRACT_VERSION = "TRENDLYNE_PARAMETER_CONTRACT_V1" as const

export const TRENDLYNE_PARAMETER_TOOLS = {
  searchParameters: "search_parameters",
  getParameterValues: "get_parameter_values",
} as const

export type TrendlyneParameterPeriod = "ANNUAL" | "QUARTERLY" | "TTM" | "POINT_IN_TIME"

export interface TrendlyneParameterTarget {
  readonly researchCode: string
  readonly searchQuery: string
  readonly expectedVerboseNames: readonly string[]
  readonly period: TrendlyneParameterPeriod
  readonly expectedUnit: "INR_CRORE" | "PERCENT" | "RATIO" | "PER_SHARE" | null
  /**
   * Intentionally null until a subscribed `search_parameters` response is captured
   * and reviewed. Human-readable Trendlyne parameter names are not silently treated
   * as MCP `field_name` identifiers.
   */
  readonly verifiedFieldName: null
  readonly notes: string
}

export const TRENDLYNE_PARAMETER_TARGETS: readonly TrendlyneParameterTarget[] = [
  { researchCode: "REVENUE_ANNUAL", searchQuery: "Operating Revenue Annual", expectedVerboseNames: ["Operating Revenue Annual", "Total Revenue Annual"], period: "ANNUAL", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "Prefer operating revenue when the company contract supports it; total revenue is not silently substituted." },
  { researchCode: "REVENUE_QUARTERLY", searchQuery: "Operating Revenue Qtr", expectedVerboseNames: ["Operating Revenue Qtr"], period: "QUARTERLY", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "Quarter end and consolidation scope must be retained." },
  { researchCode: "NET_PROFIT_ANNUAL", searchQuery: "Net Profit Annual", expectedVerboseNames: ["Net Profit Annual"], period: "ANNUAL", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "PAT semantics and minority-interest treatment must be confirmed from the returned parameter metadata." },
  { researchCode: "NET_PROFIT_QUARTERLY", searchQuery: "Net Profit Qtr", expectedVerboseNames: ["Net Profit Qtr"], period: "QUARTERLY", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "Quarter end and scope are mandatory." },
  { researchCode: "EPS_DILUTED", searchQuery: "Diluted EPS", expectedVerboseNames: ["Diluted EPS Annual", "Diluted EPS Qtr"], period: "ANNUAL", expectedUnit: "PER_SHARE", verifiedFieldName: null, notes: "Annual and quarterly fields are separate contracts; adjusted/basic EPS are not substitutes." },
  { researchCode: "EBITDA", searchQuery: "EBITDA Annual", expectedVerboseNames: ["EBITDA Annual"], period: "ANNUAL", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "EBITDA remains distinct from Operating Profit." },
  { researchCode: "OPERATING_MARGIN", searchQuery: "Operating Profit Margin Annual", expectedVerboseNames: ["Operating Profit Margin Annual %", "Operting Profit Margin Annual %"], period: "ANNUAL", expectedUnit: "PERCENT", verifiedFieldName: null, notes: "Trendlyne exposes legacy spelling variants; exact returned field metadata must decide the production contract." },
  { researchCode: "ROCE_ANNUAL", searchQuery: "ROCE Annual %", expectedVerboseNames: ["ROCE Annual %"], period: "ANNUAL", expectedUnit: "PERCENT", verifiedFieldName: null, notes: "Do not substitute ROIC or an industry-level ROCE parameter." },
  { researchCode: "TOTAL_DEBT", searchQuery: "Total Debt Annual", expectedVerboseNames: ["Total Debt Annual"], period: "ANNUAL", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "Balance-sheet date and consolidation scope are required." },
  { researchCode: "CASH_EQUIVALENTS", searchQuery: "Cash Plus Cash Equivalents Annual", expectedVerboseNames: ["Cash Plus Cash Equivalents Annual"], period: "ANNUAL", expectedUnit: "INR_CRORE", verifiedFieldName: null, notes: "Do not infer broader cash/investment balances." },
  { researchCode: "DEBT_EQUITY", searchQuery: "Debt To Equity Annual", expectedVerboseNames: ["Long Term Debt To Equity Annual"], period: "ANNUAL", expectedUnit: "RATIO", verifiedFieldName: null, notes: "Long-term debt/equity is not automatically equivalent to total debt/equity; denominator/numerator contract must be reviewed." },
  { researchCode: "INTEREST_COVERAGE", searchQuery: "Interest Coverage Ratio Annual", expectedVerboseNames: ["Interest Coverage Ratio Annual", "Interest Coverage Post Tax Annual %"], period: "ANNUAL", expectedUnit: "RATIO", verifiedFieldName: null, notes: "The ratio formula must be captured before production promotion." },
  { researchCode: "EV_EBITDA", searchQuery: "EV Per EBITDA Annual", expectedVerboseNames: ["EV Per EBITDA Annual"], period: "ANNUAL", expectedUnit: "RATIO", verifiedFieldName: null, notes: "Enterprise-value and EBITDA basis must match the reported period." },
  { researchCode: "DIVIDEND_YIELD", searchQuery: "Dividend yield", expectedVerboseNames: ["Dividend yield"], period: "POINT_IN_TIME", expectedUnit: "PERCENT", verifiedFieldName: null, notes: "Trailing/forward basis must be explicit in the provider metadata." },
] as const

export function trendlyneParameterTarget(code: string): TrendlyneParameterTarget | null {
  return TRENDLYNE_PARAMETER_TARGETS.find((target) => target.researchCode === code) ?? null
}

export function hasVerifiedTrendlyneFieldName(code: string): boolean {
  return trendlyneParameterTarget(code)?.verifiedFieldName !== null
}
