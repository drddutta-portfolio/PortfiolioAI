export const PHARMA_SOURCE_READINESS_VERSION = "PHARMA_SOURCE_READINESS_V4" as const

export type PharmaSourceReadinessState =
  | "CACHE_PARTIAL"
  | "PROVIDER_CAPABILITY_OBSERVED"
  | "PROVIDER_HISTORY_VALIDATED"
  | "SOURCE_CONTRACT_PENDING"
  | "HISTORY_CONTRACT_PENDING"
  | "OFFICIAL_SOURCE_CONTRACT_PENDING"

export interface PharmaSourceReadinessItem {
  readonly metricCode: string
  readonly state: PharmaSourceReadinessState
  readonly canonicalEvidenceCodes: readonly string[]
  readonly observedProviderLabels: readonly string[]
  readonly approvedSource: string | null
  readonly canUseExistingCacheWithoutProviderCall: boolean
  readonly reason: string
}

/**
 * Source-readiness is deliberately separate from research-profile readiness.
 * Retained provider evidence can be useful without satisfying the complete
 * PHARMA_V1 history contract. R4H promotes only semantically exact, conflict-free
 * observations and never turns partial ingestion into scoring readiness.
 */
export const PHARMA_V1_SOURCE_READINESS: readonly PharmaSourceReadinessItem[] = [
  {
    metricCode: "PHARMA_REVENUE_GROWTH_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["REVENUE_ANNUAL"],
    observedProviderLabels: ["Operating Rev. Ann.", "Total Rev. Ann. 1Y Ago", "Rev. Ann. 2Y ago", "Rev. Ann. 3Y ago", "Rev. Ann. 4Y ago", "Rev. Ann. 5Y ago"],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: true,
    reason: "R4H found a semantic mismatch in the stored Trendlyne series: current Operating Rev. Ann. is operating revenue, while historical Total Rev./Rev. Ann. fields are not the same concept. Only the exact current operating-revenue point is eligible; multi-year revenue-growth readiness remains blocked.",
  },
  {
    metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER"],
    observedProviderLabels: ["Operating Profit Qtr", "Operating Profit 1Q Ago", "Operating Profit 2Q Ago", "Operating Profit 3Q Ago", "Operating Profit 4Q Ago", "Operating Profit 6Qtr Ago", "Operating Profit 7Qtr Ago", "Operating Rev. Qtr", "Operating Rev. 2Q ago", "Operating Rev. 3Q ago", "Operating Rev. 4Q ago", "Operating Rev. 5Q ago", "Operating Rev. 6Q ago", "Operating Rev. 7Q ago", "Operating Rev. 8Q ago"],
    approvedSource: "TRENDLYNE_MCP + PORTFOLIOAI",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "R4H validated a useful raw quarterly operating-profit/revenue path and exact period identity, but the retained capture is incomplete and contains a duplicate-value conflict for Operating Profit 6Qtr Ago. Conflict-free raw points may be ingested, while the PHARMA_V1 8-quarter operating-margin history remains pending.",
  },
  {
    metricCode: "PHARMA_ROCE_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["ROCE_ANNUAL"],
    observedProviderLabels: ["ROCE Ann. %", "ROCE Ann. 1Y Ago %"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Current and 1Y annual ROCE were validated, but the complete 3–5 year raw annual series required by PHARMA_V1 remains unproven.",
  },
  {
    metricCode: "PHARMA_PAT_EPS_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["NET_PROFIT_TTM", "EPS_DILUTED", "EPS_GROWTH_YOY"],
    observedProviderLabels: ["Net Profit Ann.", "Net Profit Ann. 2Y Ago", "Net Profit Ann. 3Y Ago", "Net Profit Ann. 4Y Ago", "Net Profit Ann. 5Y Ago", "Cash EPS Ann. 1Y Ago", "Cash EPS Ann. 3Y ago", "Cash EPS Ann. 5Y ago"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Live discovery proved useful multi-year PAT and cash-EPS fields, but the normalized complete period-by-period PAT/EPS lineage required by PHARMA_V1 is not yet approved.",
  },
  {
    metricCode: "PHARMA_CASH_CONVERSION_HISTORY",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["CFO_ANNUAL"],
    observedProviderLabels: ["Cash from Operating Act. Ann. 1Y Ago", "Cash from Operating Act. Ann. 2Y Ago", "Cash from Operating Act. Ann. 3Y Ago", "Cash from Operating Act. Ann. 4Y Ago", "Cash from Operating Act. Ann. 5Y Ago"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Five historical annual CFO points are conflict-free and period-resolvable for TORNTPHARM, but PHARMA_V1 cash conversion also requires matched PAT plus a reviewed capex/FCF contract. CFO alone cannot make this domain ready.",
  },
  {
    metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: ["Interest Coverage Ratio Ann. 1Y Ago", "Short Term Debt Ann. 1Y ago", "Interest TTM"],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "Live discovery exposed partial leverage evidence, but the matched total-debt, cash/net-debt and operating-earnings history contract remains unresolved.",
  },
  {
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    state: "OFFICIAL_SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "Material regulated-export exposure requires official regulator/issuer evidence. Trendlyne discovery does not replace the separate official-source contract for regulatory-site status.",
  },
  {
    metricCode: "PHARMA_DOMESTIC_REVENUE_GROWTH",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "No reviewed canonical domestic-formulations segment history contract exists yet.",
  },
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "No reviewed canonical regulated-export/US revenue history contract exists yet.",
  },
  {
    metricCode: "PHARMA_RND_INTENSITY",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "No reviewed canonical R&D expense/intensity history metric currently exists in the production definition set.",
  },
  {
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "Pipeline/launch/approval events need a reviewed issuer/official/document evidence contract before they can affect business durability.",
  },
  {
    metricCode: "PHARMA_OWNERSHIP_GOVERNANCE",
    state: "CACHE_PARTIAL",
    canonicalEvidenceCodes: [
      "SHAREHOLDING_PROMOTER_PERCENT",
      "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",
      "SHAREHOLDING_FII_FPI_PERCENT",
      "SHAREHOLDING_DII_PERCENT",
      "SHAREHOLDING_MUTUAL_FUND_PERCENT",
    ],
    observedProviderLabels: ["Institutional holding current Qtr %", "FII holding current Qtr %", "Promoter holding change QoQ %"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Several ownership metrics are reviewed and cached, but PHARMA_V1 requires multi-quarter ownership trend plus governance-event overlay; current Pharma cache remains incomplete for that history.",
  },
  {
    metricCode: "PHARMA_VALUATION_CONTEXT",
    state: "CACHE_PARTIAL",
    canonicalEvidenceCodes: ["PE_TTM"],
    observedProviderLabels: ["PE 3Yr Average"],
    approvedSource: "ANGEL_ONE + reviewed PortfolioAI research evidence",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Current authoritative market price and reviewed PE evidence can contribute, but PHARMA_V1 valuation still needs reviewed earnings/cash history and peer/self-history context. Quarantined provider PBV is not promoted.",
  },
] as const

export function pharmaSourceReadiness(metricCode: string): PharmaSourceReadinessItem | null {
  return PHARMA_V1_SOURCE_READINESS.find((item) => item.metricCode === metricCode) ?? null
}
