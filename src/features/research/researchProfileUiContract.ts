export interface ResearchSnapshotGroup {
  readonly title: string
  readonly codes: readonly string[]
}

export interface ResearchScoreSectionGroup {
  readonly label: string
  readonly codes: readonly string[]
}

export interface ResearchWorkspaceSection {
  readonly title: string
  readonly subtitle: string
  readonly codes: readonly string[]
}

export type ExternalRatingsMode = "FULL" | "COMPACT"
export type ResearchRefreshActionKind = "VALUATION_EVIDENCE" | "MARKET_HISTORY" | "BANK_BENCHMARK" | "BANK_GROWTH_DISCOVERY" | "INFORMATIONAL"
export type ResearchRefreshModuleState = "AVAILABLE_TO_PLAN" | "PLANNED" | "EXECUTION_DISABLED" | "EXECUTABLE" | "NOT_AVAILABLE"
export type ResearchRefreshModuleEligibility =
  | { readonly mode: "PROFILE" }
  | { readonly mode: "REFERENCE_SECURITY"; readonly symbol: string }

export interface ResearchRefreshModule {
  readonly code: string
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly actionKind: ResearchRefreshActionKind
  readonly state: ResearchRefreshModuleState
  readonly eligibility?: ResearchRefreshModuleEligibility
  readonly actionLabel?: string
  readonly note?: string
}

const BANK_NBFC_REFRESH_MODULES: readonly ResearchRefreshModule[] = [
  {
    code: "BANK_VALUATION_EVIDENCE",
    eyebrow: "Stage 8.8D.2 · Valuation evidence",
    title: "Refresh stale valuation evidence",
    description: "Refreshes only the reference bank's approved 5-year P/E self-history valuation evidence used by the BANK/NBFC recommendation gate. Planning uses zero calls; execution uses exactly one Trendlyne call.",
    actionKind: "VALUATION_EVIDENCE",
    state: "AVAILABLE_TO_PLAN",
    eligibility: { mode: "REFERENCE_SECURITY", symbol: "HDFCBANK" },
    actionLabel: "Plan valuation refresh",
    note: "This targeted action does not refresh prices, change your role, change target weight, create a score run or trade. It only revalidates the approved valuation input.",
  },
  {
    code: "BANK_MARKET_EVIDENCE",
    eyebrow: "Stage 8.6E · Market evidence",
    title: "Build Momentum & Risk from Angel One",
    description: "Loads daily price history and derives PortfolioAI's own 12M/6M momentum, 1Y max drawdown and 1Y volatility. Trendlyne technical scores are not used.",
    actionKind: "MARKET_HISTORY",
    state: "AVAILABLE_TO_PLAN",
    eligibility: { mode: "REFERENCE_SECURITY", symbol: "HDFCBANK" },
    actionLabel: "Plan market history refresh",
    note: "Momentum currently scores from absolute 12M + 6M returns. Risk uses GNPA + NNPA + max drawdown. The benchmark step below adds NIFTY Bank relative strength.",
  },
  {
    code: "BANK_BENCHMARK_RELATIVE_MOMENTUM",
    eyebrow: "Stage 8.6F · Benchmark-relative momentum",
    title: "Add NIFTY Bank Relative Strength",
    description: "Fetches NIFTY Bank daily history from Angel One, aligns it to the selected bank's stored daily closes and derives 12M relative strength as stock return minus benchmark return.",
    actionKind: "BANK_BENCHMARK",
    state: "AVAILABLE_TO_PLAN",
    eligibility: { mode: "REFERENCE_SECURITY", symbol: "HDFCBANK" },
    actionLabel: "Plan NIFTY Bank benchmark",
    note: "The benchmark instrument is resolved from the current Angel One instrument master using exact accepted aliases before any history is stored. No Trendlyne technical signal is involved.",
  },
  {
    code: "BANK_GROWTH_DISCOVERY",
    eyebrow: "Reference-stock completion",
    title: "Discover missing bank growth fields",
    description: "Targets Advances Growth YoY and Deposits Growth YoY only. This is discovery evidence, not automatic promotion or scoring.",
    actionKind: "BANK_GROWTH_DISCOVERY",
    state: "EXECUTABLE",
    eligibility: { mode: "REFERENCE_SECURITY", symbol: "HDFCBANK" },
    actionLabel: "Run growth discovery · 1 Trendlyne call",
  },
]

export interface ResearchProfileUiContract {
  readonly profileCode: string
  readonly profileDisplayName: string
  readonly snapshotGroups: readonly ResearchSnapshotGroup[]
  readonly scoreSectionGroups: readonly ResearchScoreSectionGroup[]
  readonly financialWorkspaceSections: readonly ResearchWorkspaceSection[]
  readonly qualityGrowthWorkspaceSections: readonly ResearchWorkspaceSection[]
  readonly dimensionOrder: readonly string[]
  readonly dimensionLabels: Readonly<Record<string, string>>
  readonly notApplicableDimensions: readonly string[]
  readonly excludedValuationMetricCodes: readonly string[]
  readonly externalRatingsMode: ExternalRatingsMode
  readonly readinessMode: "PROFILE_CONTRACT" | "NONE"
  readonly refreshModules: readonly ResearchRefreshModule[]
  readonly completeResearchRefreshMode: "ENABLED" | "PROFILE_GATED"
}

const OWNERSHIP_CODES = [
  "SHAREHOLDING_PROMOTER_PERCENT",
  "SHAREHOLDING_FII_FPI_PERCENT",
  "SHAREHOLDING_DII_PERCENT",
  "SHAREHOLDING_MUTUAL_FUND_PERCENT",
  "SHAREHOLDING_PUBLIC_PERCENT",
  "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",
] as const

const COMMON_DIMENSION_ORDER = [
  "QUALITY",
  "GROWTH",
  "CAPITAL_EFFICIENCY",
  "CASH_FLOW",
  "BALANCE_SHEET_CREDIT",
  "BUSINESS_DURABILITY",
  "VALUATION",
  "MOMENTUM",
  "OWNERSHIP_GOVERNANCE",
  "RISK",
] as const

const COMMON_SECTION_GROUPS = [
  { label: "Quality & Growth", codes: ["QUALITY", "GROWTH"] },
  { label: "Financial Strength", codes: ["CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT"] },
  { label: "Business Durability", codes: ["BUSINESS_DURABILITY"] },
  { label: "Valuation", codes: ["VALUATION"] },
  { label: "Momentum", codes: ["MOMENTUM"] },
  { label: "Ownership & Governance", codes: ["OWNERSHIP_GOVERNANCE"] },
  { label: "Risk", codes: ["RISK"] },
] as const

const GENERAL_SNAPSHOT_GROUPS: readonly ResearchSnapshotGroup[] = [
  {
    title: "Quality at a glance",
    codes: ["CFO_ANNUAL", "ROE_ANNUAL", "ROCE_ANNUAL", "OPM_TTM", "GROSS_NPA_PERCENT", "NET_NPA_PERCENT"],
  },
  {
    title: "Growth at a glance",
    codes: ["ADVANCES_GROWTH_YOY", "DEPOSITS_GROWTH_YOY", "EPS_GROWTH_YOY", "REVENUE_TTM", "REVENUE", "NET_PROFIT_TTM", "NET_INCOME", "EPS_DILUTED"],
  },
  {
    title: "Valuation snapshot",
    codes: ["MARKET_CAP_PROVIDER_RAW", "MARKET_CAP", "PE_TTM", "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT", "PBV_ADJUSTED_PROVIDER"],
  },
  { title: "Ownership & governance", codes: OWNERSHIP_CODES },
]

const PHARMA_SNAPSHOT_GROUPS: readonly ResearchSnapshotGroup[] = [
  {
    title: "Quality & capital efficiency",
    codes: ["OPM_TTM", "ROCE_MANAGEMENT_ANNUAL", "CFO_ANNUAL", "FREE_CASH_FLOW_ANNUAL"],
  },
  {
    title: "Growth at a glance",
    codes: ["REVENUE_ANNUAL", "PAT_ATTRIBUTABLE_ANNUAL", "EPS_DILUTED_ANNUAL", "INDIA_REVENUE_ANNUAL", "USA_REVENUE_ANNUAL", "PHARMA_EXPORT_US_REVENUE_GROWTH"],
  },
  {
    title: "Financial strength",
    codes: ["TOTAL_DEBT_ANNUAL", "CASH_EQUIVALENTS_ANNUAL", "NET_DEBT_EBITDA_ANNUAL", "INTEREST_COVERAGE_ANNUAL", "EBITDA_ANNUAL"],
  },
  {
    title: "Business durability",
    codes: ["RND_EXPENSE_ANNUAL", "RND_INTENSITY_PERCENT", "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"],
  },
  {
    title: "Valuation snapshot",
    codes: ["MARKET_CAP_PROVIDER_RAW", "MARKET_CAP", "PE_TTM", "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT", "EV_EBITDA", "FCF_YIELD_PERCENT"],
  },
  { title: "Ownership & governance", codes: OWNERSHIP_CODES },
]

const PHARMA_FINANCIAL_WORKSPACE_SECTIONS: readonly ResearchWorkspaceSection[] = [
  {
    title: "Earnings & operating performance",
    subtitle: "Annual and quarterly operating evidence used to establish business scale and profitability.",
    codes: ["REVENUE_ANNUAL", "OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER", "PAT_ATTRIBUTABLE_ANNUAL", "EPS_DILUTED_ANNUAL", "EBITDA_ANNUAL"],
  },
  {
    title: "Cash quality",
    subtitle: "Matched-period operating cash generation, investment and PortfolioAI-derived free cash flow.",
    codes: ["CFO_ANNUAL", "CAPEX_ANNUAL", "FREE_CASH_FLOW_ANNUAL"],
  },
  {
    title: "Capital efficiency",
    subtitle: "Consistent annual return-on-capital evidence without mixing incompatible methodologies.",
    codes: ["ROCE_MANAGEMENT_ANNUAL", "ROCE_ANNUAL"],
  },
  {
    title: "Financial strength / leverage",
    subtitle: "Debt burden, liquidity and debt-service capacity using matched annual evidence.",
    codes: ["TOTAL_DEBT_ANNUAL", "SHORT_TERM_DEBT_ANNUAL", "CASH_EQUIVALENTS_ANNUAL", "NET_DEBT_EBITDA_ANNUAL", "INTEREST_COVERAGE_ANNUAL"],
  },
]

const PHARMA_QUALITY_GROWTH_WORKSPACE_SECTIONS: readonly ResearchWorkspaceSection[] = [
  {
    title: "Quality & margin durability",
    subtitle: "Operating-margin evidence and capital efficiency are evaluated as multi-period histories, not single snapshots.",
    codes: ["OPM_TTM", "OPERATING_REVENUE_QUARTER", "OPERATING_PROFIT_QUARTER", "ROCE_MANAGEMENT_ANNUAL", "CFO_ANNUAL", "FREE_CASH_FLOW_ANNUAL"],
  },
  {
    title: "Growth & earnings",
    subtitle: "Revenue, attributable PAT and diluted EPS with geographic growth evidence where separately disclosed.",
    codes: ["REVENUE_ANNUAL", "PAT_ATTRIBUTABLE_ANNUAL", "EPS_DILUTED_ANNUAL", "INDIA_REVENUE_ANNUAL", "USA_REVENUE_ANNUAL", "PHARMA_EXPORT_US_REVENUE_GROWTH", "GERMANY_REVENUE_ANNUAL", "BRAZIL_REVENUE_ANNUAL", "OTHER_INTERNATIONAL_REVENUE_ANNUAL"],
  },
  {
    title: "Business durability",
    subtitle: "R&D investment is interpreted with productivity, launch, approval and pipeline context rather than rewarded mechanically.",
    codes: ["RND_EXPENSE_ANNUAL", "RND_INTENSITY_PERCENT", "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"],
  },
]

const PHARMA_SECTION_GROUPS = [
  { label: "Quality & Growth", codes: ["QUALITY", "GROWTH"] },
  { label: "Financial Strength", codes: ["CAPITAL_EFFICIENCY", "CASH_FLOW", "BALANCE_SHEET_CREDIT"] },
  { label: "Business Durability", codes: ["BUSINESS_DURABILITY"] },
  { label: "Valuation", codes: ["VALUATION"] },
  { label: "Momentum", codes: ["MOMENTUM"] },
  { label: "Ownership & Governance", codes: ["OWNERSHIP_GOVERNANCE"] },
  { label: "Risk", codes: ["RISK"] },
] as const

const PHARMA_REFRESH_MODULES: readonly ResearchRefreshModule[] = [
  {
    code: "PHARMA_CORE_FUNDAMENTALS",
    eyebrow: "Pharma fundamentals",
    title: "Pharma Fundamentals",
    description: "Revenue, margins, capital efficiency, earnings, cash conversion and financial strength in one Pharma-focused view.",
    actionKind: "INFORMATIONAL",
    state: "EXECUTION_DISABLED",
    note: "Execution is not yet enabled for this profile.",
  },
  {
    code: "PHARMA_BUSINESS_DURABILITY",
    eyebrow: "Business durability",
    title: "Business Durability",
    description: "R&D intensity and productivity alongside material launches, approvals and pipeline milestones.",
    actionKind: "INFORMATIONAL",
    state: "EXECUTION_DISABLED",
    note: "Higher R&D spend is not automatically positive; productivity and evidence quality remain part of the contract.",
  },
  {
    code: "PHARMA_REGULATORY",
    eyebrow: "Regulatory risk",
    title: "Regulatory Risk",
    description: "Material manufacturing-site status, inspections, unresolved actions and remediation from appropriate official evidence.",
    actionKind: "INFORMATIONAL",
    state: "EXECUTION_DISABLED",
    note: "Research will appear when approved official evidence is available.",
  },
  {
    code: "PHARMA_MARKET_VALUATION",
    eyebrow: "Market & valuation",
    title: "Market & Valuation",
    description: "Daily market history supports momentum, drawdown and volatility analysis using the approved market-data source.",
    actionKind: "MARKET_HISTORY",
    state: "AVAILABLE_TO_PLAN",
    actionLabel: "Plan market history refresh",
    note: "Market-history planning is available. Benchmark-relative analysis is not yet enabled for this profile.",
  },
]

const GENERAL_CONTRACT: ResearchProfileUiContract = {
  profileCode: "GENERAL",
  profileDisplayName: "General Research",
  snapshotGroups: GENERAL_SNAPSHOT_GROUPS,
  scoreSectionGroups: COMMON_SECTION_GROUPS,
  financialWorkspaceSections: [],
  qualityGrowthWorkspaceSections: [],
  dimensionOrder: COMMON_DIMENSION_ORDER,
  dimensionLabels: { OWNERSHIP_GOVERNANCE: "Ownership & Governance" },
  notApplicableDimensions: [],
  excludedValuationMetricCodes: [],
  externalRatingsMode: "FULL",
  readinessMode: "NONE",
  refreshModules: [],
  completeResearchRefreshMode: "ENABLED",
}

const BANK_NBFC_CONTRACT: ResearchProfileUiContract = {
  ...GENERAL_CONTRACT,
  profileCode: "BANK_NBFC",
  profileDisplayName: "Banks / NBFCs",
  notApplicableDimensions: ["CASH_FLOW"],
  readinessMode: "PROFILE_CONTRACT",
  refreshModules: BANK_NBFC_REFRESH_MODULES,
}

const PHARMA_V1_CONTRACT: ResearchProfileUiContract = {
  profileCode: "PHARMA_V1",
  profileDisplayName: "Pharmaceuticals",
  snapshotGroups: PHARMA_SNAPSHOT_GROUPS,
  scoreSectionGroups: PHARMA_SECTION_GROUPS,
  financialWorkspaceSections: PHARMA_FINANCIAL_WORKSPACE_SECTIONS,
  qualityGrowthWorkspaceSections: PHARMA_QUALITY_GROWTH_WORKSPACE_SECTIONS,
  dimensionOrder: COMMON_DIMENSION_ORDER,
  dimensionLabels: {
    CAPITAL_EFFICIENCY: "Capital Efficiency",
    CASH_FLOW: "Cash Quality",
    BALANCE_SHEET_CREDIT: "Financial Strength / Leverage",
    BUSINESS_DURABILITY: "Business Durability",
    OWNERSHIP_GOVERNANCE: "Ownership & Governance",
    RISK: "Regulatory & Market Risk",
  },
  notApplicableDimensions: [],
  excludedValuationMetricCodes: ["PBV_ADJUSTED_PROVIDER"],
  externalRatingsMode: "COMPACT",
  readinessMode: "PROFILE_CONTRACT",
  refreshModules: PHARMA_REFRESH_MODULES,
  completeResearchRefreshMode: "PROFILE_GATED",
}

const CONTRACTS: Readonly<Record<string, ResearchProfileUiContract>> = {
  BANK_NBFC: BANK_NBFC_CONTRACT,
  PHARMA_V1: PHARMA_V1_CONTRACT,
}

/**
 * Presentation contract only. It never reclassifies a security, changes a score,
 * or creates evidence. The already-resolved scoring profile chooses the UI contract.
 */
export function researchProfileUiContract(profileCode: string | null | undefined): ResearchProfileUiContract {
  return profileCode ? (CONTRACTS[profileCode] ?? GENERAL_CONTRACT) : GENERAL_CONTRACT
}

export function researchRefreshModulesForSecurity(profileCode: string | null | undefined, symbol: string): readonly ResearchRefreshModule[] {
  return researchProfileUiContract(profileCode).refreshModules.filter((module) => {
    const eligibility = module.eligibility ?? { mode: "PROFILE" }
    return eligibility.mode === "PROFILE" || eligibility.symbol === symbol
  })
}


/**
 * Chooses the profile contract that drives research presentation.
 * Canonical reviewed research authority takes precedence over a downstream
 * scoring fallback. This does not activate or alter numeric scoring.
 */
export function resolveResearchPresentationProfileCode(
  scoringProfileCode: string | null | undefined,
  canonicalResearchProfileCode: string | null | undefined,
): string | null | undefined {
  return canonicalResearchProfileCode ?? scoringProfileCode
}
