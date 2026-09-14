export const PHARMA_SOURCE_READINESS_VERSION = "PHARMA_SOURCE_READINESS_V5" as const

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
 * Retained provider or issuer evidence can be useful without satisfying the full
 * PHARMA_V1 history contract. R4M knows the R4L parent metric contract, but that
 * does not imply the repository migration or planned TORNTPHARM evidence writes
 * have been applied to production.
 */
export const PHARMA_V1_SOURCE_READINESS: readonly PharmaSourceReadinessItem[] = [
  {
    metricCode: "PHARMA_REVENUE_GROWTH_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["REVENUE_ANNUAL"],
    observedProviderLabels: ["Operating Rev. Ann.", "Total Rev. Ann. 1Y Ago", "Rev. Ann. 2Y ago", "Rev. Ann. 3Y ago", "Rev. Ann. 4Y ago", "Rev. Ann. 5Y ago"],
    approvedSource: "ISSUER_ANNUAL_REPORT / COMPANY_EXCHANGE_FILING",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Current provider history mixes operating-revenue and broader total-revenue semantics. The R4L parent contract therefore requires a consistent reviewed operating-revenue series; the planned official TORNTPHARM evidence set is separately production-gated.",
  },
  {
    metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER"],
    observedProviderLabels: ["Operating Profit Qtr", "Operating Profit 1Q Ago", "Operating Profit 2Q Ago", "Operating Profit 3Q Ago", "Operating Profit 4Q Ago", "Operating Profit 6Qtr Ago", "Operating Profit 7Qtr Ago", "Operating Rev. Qtr", "Operating Rev. 2Q ago", "Operating Rev. 3Q ago", "Operating Rev. 4Q ago", "Operating Rev. 5Q ago", "Operating Rev. 6Q ago", "Operating Rev. 7Q ago", "Operating Rev. 8Q ago"],
    approvedSource: "REVIEWED CANONICAL EVIDENCE + PORTFOLIOAI",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Only matched semantically consistent quarterly revenue/profit periods count. The retained provider history is useful but incomplete/conflicted; official issuer evidence is the preferred completion path.",
  },
  {
    metricCode: "PHARMA_ROCE_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["ROCE_MANAGEMENT_ANNUAL"],
    observedProviderLabels: ["ROCE Ann. %", "ROCE Ann. 1Y Ago %"],
    approvedSource: "ISSUER_ANNUAL_REPORT",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "PHARMA_V1 now requires a consistent issuer-reported ROCE series. Provider-calculated ROCE must not be mixed into the same history unless methodology equivalence is reviewed.",
  },
  {
    metricCode: "PHARMA_PAT_EPS_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["PAT_ATTRIBUTABLE_ANNUAL", "EPS_DILUTED_ANNUAL"],
    observedProviderLabels: ["Net Profit Ann.", "Net Profit Ann. 2Y Ago", "Net Profit Ann. 3Y Ago", "Net Profit Ann. 4Y Ago", "Net Profit Ann. 5Y Ago", "Cash EPS Ann. 1Y Ago", "Cash EPS Ann. 3Y ago", "Cash EPS Ann. 5Y ago"],
    approvedSource: "ISSUER_ANNUAL_REPORT / COMPANY_EXCHANGE_FILING",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "The parent contract uses PAT attributable to owners and diluted EPS with matched annual periods. Cash EPS is explicitly rejected as a diluted-EPS substitute.",
  },
  {
    metricCode: "PHARMA_CASH_CONVERSION_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["CFO_ANNUAL", "PAT_ATTRIBUTABLE_ANNUAL", "CAPEX_ANNUAL", "FREE_CASH_FLOW_ANNUAL"],
    observedProviderLabels: ["Cash from Operating Act. Ann. 1Y Ago", "Cash from Operating Act. Ann. 2Y Ago", "Cash from Operating Act. Ann. 3Y Ago", "Cash from Operating Act. Ann. 4Y Ago", "Cash from Operating Act. Ann. 5Y Ago"],
    approvedSource: "ISSUER_ANNUAL_REPORT + PORTFOLIOAI_DERIVED",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "CFO alone is insufficient. PHARMA_V1 requires matched CFO, attributable PAT and capex/FCF history; PortfolioAI-derived FCF is CFO minus approved capex.",
  },
  {
    metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["TOTAL_DEBT_ANNUAL", "CASH_EQUIVALENTS_ANNUAL", "EBITDA_ANNUAL", "NET_DEBT_EBITDA_ANNUAL", "INTEREST_COVERAGE_ANNUAL"],
    observedProviderLabels: ["Interest Coverage Ratio Ann. 1Y Ago", "Short Term Debt Ann. 1Y ago", "Interest TTM"],
    approvedSource: "ISSUER_ANNUAL_REPORT",
    canUseExistingCacheWithoutProviderCall: false,
    reason: "The R4L parent contract defines total debt, cash, EBITDA, net-debt/EBITDA and interest coverage with matched annual semantics. Short-term debt must never substitute for total debt.",
  },
  {
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    state: "OFFICIAL_SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: "OFFICIAL REGULATOR / ISSUER EVIDENCE",
    canUseExistingCacheWithoutProviderCall: false,
    reason: "Material regulated-export exposure requires official regulator/issuer event evidence for current site status, unresolved actions and remediation. Numeric fundamental rows are not a substitute.",
  },
  {
    metricCode: "PHARMA_DOMESTIC_REVENUE_GROWTH",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["INDIA_REVENUE_ANNUAL"],
    observedProviderLabels: [],
    approvedSource: "ISSUER_ANNUAL_REPORT",
    canUseExistingCacheWithoutProviderCall: false,
    reason: "The parent contract now has an India-revenue annual evidence code. The conditional domestic-growth contract still needs enough consistent periods before it can be evaluated.",
  },
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["USA_REVENUE_ANNUAL"],
    observedProviderLabels: [],
    approvedSource: "ISSUER_ANNUAL_REPORT",
    canUseExistingCacheWithoutProviderCall: false,
    reason: "The parent contract now has a USA-revenue annual evidence code. The conditional export/US growth contract still needs sufficient consistent history when regulated-export exposure is material.",
  },
  {
    metricCode: "PHARMA_RND_INTENSITY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["RND_EXPENSE_ANNUAL", "RND_INTENSITY_PERCENT"],
    observedProviderLabels: [],
    approvedSource: "ISSUER_ANNUAL_REPORT + PORTFOLIOAI_DERIVED",
    canUseExistingCacheWithoutProviderCall: false,
    reason: "R4L defines reviewed R&D expenditure plus PortfolioAI-derived R&D intensity. Higher spend is not automatically positive; productivity context remains necessary.",
  },
  {
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: "ISSUER / OFFICIAL / REVIEWED DOCUMENT EVIDENCE",
    canUseExistingCacheWithoutProviderCall: false,
    reason: "Pipeline, launches and approvals require a canonical event/document evidence target before they can influence Business Durability. They must not be forced into unrelated numeric fundamental fields.",
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
    approvedSource: "ANGEL_ONE + REVIEWED PORTFOLIOAI RESEARCH EVIDENCE",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Current authoritative market price and reviewed P/E evidence can contribute, but PHARMA_V1 valuation still needs reviewed earnings/cash history and peer/self-history context. Provider P/B remains non-primary for Pharma.",
  },
] as const

export function pharmaSourceReadiness(metricCode: string): PharmaSourceReadinessItem | null {
  return PHARMA_V1_SOURCE_READINESS.find((item) => item.metricCode === metricCode) ?? null
}
