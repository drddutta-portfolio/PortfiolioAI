export const PHARMA_HISTORICAL_SOURCE_CONTRACT_VERSION = "PHARMA_HISTORICAL_SOURCE_V1" as const

export type HistoricalSourceContractState =
  | "OBSERVED_EXACT_AGGREGATE"
  | "OBSERVED_CURRENT_POINT_ONLY"
  | "OBSERVED_RELATED_FIELD_ONLY"
  | "UNPROVEN_IN_STORED_DISCOVERY"

export interface PharmaHistoricalSourceContractCandidate {
  readonly profileMetricCode: string
  readonly state: HistoricalSourceContractState
  readonly provider: "TRENDLYNE_MCP"
  readonly providerTool: "get_parameter_values_multi_stock"
  readonly exactRequestedLabels: readonly string[]
  readonly observedExactLabels: readonly string[]
  readonly relatedObservedLabels: readonly string[]
  readonly canonicalMetricCodes: readonly string[]
  readonly canSatisfyPharmaV1HistoryRequirement: false
  readonly requiresNewProviderCallToProveContract: boolean
  readonly reason: string
}

/**
 * These candidates are derived only from already-stored contract-discovery
 * evidence. They are capability evidence, not production ingestion contracts.
 * Every entry intentionally keeps canSatisfyPharmaV1HistoryRequirement=false
 * until period semantics, raw-series retrieval, normalization, freshness and
 * idempotent ingestion are separately reviewed.
 */
export const PHARMA_HISTORICAL_SOURCE_CONTRACT_CANDIDATES: readonly PharmaHistoricalSourceContractCandidate[] = [
  {
    profileMetricCode: "PHARMA_REVENUE_GROWTH_HISTORY",
    state: "OBSERVED_RELATED_FIELD_ONLY",
    provider: "TRENDLYNE_MCP",
    providerTool: "get_parameter_values_multi_stock",
    exactRequestedLabels: ["Rev. Ann. 3Y ago"],
    observedExactLabels: [],
    relatedObservedLabels: ["Operating Rev. growth TTM %"],
    canonicalMetricCodes: ["REVENUE_TTM"],
    canSatisfyPharmaV1HistoryRequirement: false,
    requiresNewProviderCallToProveContract: true,
    reason: "The stored TORNTPHARM response did not validate the requested exact historical annual revenue label. A related TTM growth field was observed, but it cannot substitute for comparable 3–5 year raw history.",
  },
  {
    profileMetricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
    state: "OBSERVED_CURRENT_POINT_ONLY",
    provider: "TRENDLYNE_MCP",
    providerTool: "get_parameter_values_multi_stock",
    exactRequestedLabels: ["OPM TTM %"],
    observedExactLabels: ["OPM TTM %"],
    relatedObservedLabels: ["OPM Ann. 1Y ago %", "Operating Profit TTM YoY Growth %", "Operating Profit Growth Qtr YoY %"],
    canonicalMetricCodes: ["OPM_TTM"],
    canSatisfyPharmaV1HistoryRequirement: false,
    requiresNewProviderCallToProveContract: true,
    reason: "Current OPM capability is reviewed and an exact OPM label was observed, but the stored discovery did not establish an 8–12 quarter comparable OPM series contract.",
  },
  {
    profileMetricCode: "PHARMA_ROCE_HISTORY",
    state: "OBSERVED_CURRENT_POINT_ONLY",
    provider: "TRENDLYNE_MCP",
    providerTool: "get_parameter_values_multi_stock",
    exactRequestedLabels: ["ROCE Ann. %"],
    observedExactLabels: ["ROCE Ann. %"],
    relatedObservedLabels: ["ROCE Ann. 3Y Avg %"],
    canonicalMetricCodes: ["ROCE_ANNUAL"],
    canSatisfyPharmaV1HistoryRequirement: false,
    requiresNewProviderCallToProveContract: true,
    reason: "ROCE_ANNUAL is reviewed and the provider exposes current/aggregate ROCE evidence, but the stored capture does not prove raw annual observations for each of the required 3–5 years.",
  },
  {
    profileMetricCode: "PHARMA_PAT_EPS_HISTORY",
    state: "OBSERVED_EXACT_AGGREGATE",
    provider: "TRENDLYNE_MCP",
    providerTool: "get_parameter_values_multi_stock",
    exactRequestedLabels: ["Net Profit 3Y Growth %", "Cash EPS 3Y Growth %"],
    observedExactLabels: ["Net Profit 3Y Growth %", "Cash EPS 3Y Growth %"],
    relatedObservedLabels: ["Net Profit Qtr Growth YoY %", "Net Profit TTM 3Q Ago", "Cash EPS Ann. 3Y ago"],
    canonicalMetricCodes: ["NET_PROFIT_TTM", "EPS_DILUTED", "EPS_GROWTH_YOY"],
    canSatisfyPharmaV1HistoryRequirement: false,
    requiresNewProviderCallToProveContract: true,
    reason: "Exact 3Y PAT and cash-EPS growth aggregates are observed for TORNTPHARM. PHARMA_V1 still requires comparable underlying history rather than accepting a provider-computed aggregate without period lineage.",
  },
  {
    profileMetricCode: "PHARMA_CASH_CONVERSION_HISTORY",
    state: "OBSERVED_EXACT_AGGREGATE",
    provider: "TRENDLYNE_MCP",
    providerTool: "get_parameter_values_multi_stock",
    exactRequestedLabels: ["Operating Cash Flow 3Y Growth %"],
    observedExactLabels: ["Operating Cash Flow 3Y Growth %"],
    relatedObservedLabels: ["Operating Cash Flow 5Y Growth %", "Operating Cash Flow YoY Growth %", "Net Cash Flow 3Y Growth %"],
    canonicalMetricCodes: ["CFO_ANNUAL"],
    canSatisfyPharmaV1HistoryRequirement: false,
    requiresNewProviderCallToProveContract: true,
    reason: "Cash-flow growth capability is observed, but CFO_ANNUAL remains provisional and cash conversion additionally requires matched PAT and capex/FCF evidence.",
  },
  {
    profileMetricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
    state: "UNPROVEN_IN_STORED_DISCOVERY",
    provider: "TRENDLYNE_MCP",
    providerTool: "get_parameter_values_multi_stock",
    exactRequestedLabels: ["Debt Equity Ratio", "Interest Coverage Ratio"],
    observedExactLabels: [],
    relatedObservedLabels: [],
    canonicalMetricCodes: [],
    canSatisfyPharmaV1HistoryRequirement: false,
    requiresNewProviderCallToProveContract: true,
    reason: "The earlier generic discovery requested leverage fields, but the stored TORNTPHARM exact-label response did not validate those fields and no approved canonical debt/cash/interest-coverage definition currently satisfies the profile.",
  },
] as const

export function pharmaHistoricalSourceCandidate(profileMetricCode: string): PharmaHistoricalSourceContractCandidate | null {
  return PHARMA_HISTORICAL_SOURCE_CONTRACT_CANDIDATES.find((item) => item.profileMetricCode === profileMetricCode) ?? null
}
