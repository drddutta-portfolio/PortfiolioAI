export const PHARMA_SOURCE_READINESS_VERSION = "PHARMA_SOURCE_READINESS_V1" as const

export type PharmaSourceReadinessState =
  | "CACHE_PARTIAL"
  | "PROVIDER_CAPABILITY_OBSERVED"
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
 * An observed provider label proves only that a capability was seen in a stored
 * discovery response. It does not automatically approve the label as a canonical
 * source contract or prove that required history can be ingested idempotently.
 */
export const PHARMA_V1_SOURCE_READINESS: readonly PharmaSourceReadinessItem[] = [
  {
    metricCode: "PHARMA_REVENUE_GROWTH_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["REVENUE_TTM"],
    observedProviderLabels: ["Operating Rev. growth TTM %"],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Current cache contains only snapshot/provisional revenue evidence. Stored discovery shows revenue-growth capability, but the reviewed multi-period history ingestion contract is not yet approved.",
  },
  {
    metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["OPM_TTM"],
    observedProviderLabels: ["OPM TTM %", "OPM Ann. 1Y ago %"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "OPM_TTM is reviewed and stored discovery proves historical margin labels exist, but PHARMA_V1 requires at least eight comparable quarters rather than one TTM/annual point.",
  },
  {
    metricCode: "PHARMA_ROCE_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["ROCE_ANNUAL"],
    observedProviderLabels: ["ROCE Ann. %", "ROCE Ann. 3Y Avg %"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "ROCE_ANNUAL is reviewed and the stored provider discovery proves historical ROCE capability, but the exact annual-series ingestion contract required for 3–5 years is not yet approved.",
  },
  {
    metricCode: "PHARMA_PAT_EPS_HISTORY",
    state: "HISTORY_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["NET_PROFIT_TTM", "EPS_DILUTED", "EPS_GROWTH_YOY"],
    observedProviderLabels: ["Net Profit 3Y Growth %", "Cash EPS 3Y Growth %", "Net Profit Qtr Growth YoY %"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Stored discovery proves multi-year profit/EPS growth labels exist, while production cache is snapshot-heavy. A reviewed canonical PAT/EPS history contract remains necessary before readiness can be satisfied.",
  },
  {
    metricCode: "PHARMA_CASH_CONVERSION_HISTORY",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: ["CFO_ANNUAL"],
    observedProviderLabels: ["Operating Cash Flow 3Y Growth %", "Operating Cash Flow 5Y Growth %", "Operating Cash Flow YoY Growth %"],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: true,
    reason: "CFO_ANNUAL is still provisional and PHARMA_V1 also requires matched PAT and capex/FCF semantics. Provider cash-growth labels alone cannot prove cash conversion.",
  },
  {
    metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
    state: "SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "No reviewed canonical debt/cash/interest-coverage input contract currently satisfies the PHARMA_V1 leverage requirement. Prior generic discovery requested debt-equity and interest coverage but the TORNTPHARM exact-label capture did not validate them.",
  },
  {
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    state: "OFFICIAL_SOURCE_CONTRACT_PENDING",
    canonicalEvidenceCodes: [],
    observedProviderLabels: [],
    approvedSource: null,
    canUseExistingCacheWithoutProviderCall: false,
    reason: "Material regulated-export exposure requires official regulator/issuer evidence. Trendlyne must not be treated as the canonical authority for regulatory site status without a separately reviewed official-source contract.",
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
    observedProviderLabels: ["Institutional holding current Qtr %", "FII holding current Qtr %", "Promoter pledge change QoQ %"],
    approvedSource: "TRENDLYNE_MCP",
    canUseExistingCacheWithoutProviderCall: true,
    reason: "Several ownership metrics are reviewed and cached, but PHARMA_V1 requires multi-quarter ownership trend plus governance-event overlay; current Pharma cache has only one shareholding quarter for the covered names.",
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
