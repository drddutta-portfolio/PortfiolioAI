export interface ResearchSnapshotGroup {
  readonly title: string
  readonly codes: readonly string[]
}

export interface ResearchScoreSectionGroup {
  readonly label: string
  readonly codes: readonly string[]
}

export type ExternalRatingsMode = "FULL" | "COMPACT"
export type ResearchRefreshActionKind = "MARKET_HISTORY" | "INFORMATIONAL"

export interface ResearchRefreshModule {
  readonly code: string
  readonly eyebrow: string
  readonly title: string
  readonly description: string
  readonly actionKind: ResearchRefreshActionKind
  readonly actionLabel?: string
  readonly note?: string
}

export interface ResearchProfileUiContract {
  readonly profileCode: string
  readonly snapshotGroups: readonly ResearchSnapshotGroup[]
  readonly scoreSectionGroups: readonly ResearchScoreSectionGroup[]
  readonly dimensionOrder: readonly string[]
  readonly dimensionLabels: Readonly<Record<string, string>>
  readonly notApplicableDimensions: readonly string[]
  readonly externalRatingsMode: ExternalRatingsMode
  readonly readinessPanel: "PHARMA_V1" | "NONE"
  readonly refreshModules: readonly ResearchRefreshModule[]
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
  { label: "Ownership", codes: ["OWNERSHIP_GOVERNANCE"] },
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
  { title: "Ownership snapshot", codes: OWNERSHIP_CODES },
]

const PHARMA_SNAPSHOT_GROUPS: readonly ResearchSnapshotGroup[] = [
  {
    title: "Quality & capital efficiency",
    codes: ["OPM_TTM", "ROCE_ANNUAL", "CFO_ANNUAL"],
  },
  {
    title: "Growth at a glance",
    codes: ["REVENUE_TTM", "NET_PROFIT_TTM", "EPS_GROWTH_YOY", "EPS_DILUTED"],
  },
  {
    title: "Financial strength",
    codes: ["TOTAL_DEBT_ANNUAL", "CASH_EQUIVALENTS_ANNUAL", "NET_DEBT_ANNUAL", "NET_DEBT_EBITDA_ANNUAL", "INTEREST_COVERAGE_ANNUAL"],
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
    eyebrow: "PHARMA_V1 · Core fundamentals",
    title: "Complete Pharma core evidence",
    description: "Revenue, operating-margin, ROCE, PAT/EPS, cash-conversion and leverage history are evaluated as one coherent Pharma evidence set.",
    actionKind: "INFORMATIONAL",
    note: "Canonical write/promotion remains explicitly gated. The current TORNTPHARM Phase-A manifest is not executed from this UI.",
  },
  {
    code: "PHARMA_BUSINESS_DURABILITY",
    eyebrow: "PHARMA_V1 · Business durability",
    title: "R&D, launches & pipeline",
    description: "Tracks R&D intensity and productivity context together with material launches, approvals and pipeline milestones.",
    actionKind: "INFORMATIONAL",
    note: "Higher R&D spend is not automatically positive; productivity and evidence quality remain part of the contract.",
  },
  {
    code: "PHARMA_REGULATORY",
    eyebrow: "PHARMA_V1 · Regulatory risk",
    title: "Official regulatory & site evidence",
    description: "Tracks material manufacturing-site status, inspections, unresolved actions and remediation using official issuer/regulator evidence where applicable.",
    actionKind: "INFORMATIONAL",
    note: "No provider discovery is executed merely by viewing this workspace.",
  },
  {
    code: "PHARMA_MARKET_VALUATION",
    eyebrow: "PHARMA_V1 · Market evidence",
    title: "Build Momentum & Market Risk from Angel One",
    description: "Loads daily market history and derives PortfolioAI 12M/6M momentum, 1Y maximum drawdown and 1Y volatility from the authoritative market-data source.",
    actionKind: "MARKET_HISTORY",
    actionLabel: "Plan market history refresh",
    note: "Benchmark-relative strength remains separately gated until the approved Pharma benchmark contract is implemented.",
  },
]

const GENERAL_CONTRACT: ResearchProfileUiContract = {
  profileCode: "GENERAL",
  snapshotGroups: GENERAL_SNAPSHOT_GROUPS,
  scoreSectionGroups: COMMON_SECTION_GROUPS,
  dimensionOrder: COMMON_DIMENSION_ORDER,
  dimensionLabels: {},
  notApplicableDimensions: [],
  externalRatingsMode: "FULL",
  readinessPanel: "NONE",
  refreshModules: [],
}

const BANK_NBFC_CONTRACT: ResearchProfileUiContract = {
  ...GENERAL_CONTRACT,
  profileCode: "BANK_NBFC",
  notApplicableDimensions: ["CASH_FLOW"],
}

const PHARMA_V1_CONTRACT: ResearchProfileUiContract = {
  profileCode: "PHARMA_V1",
  snapshotGroups: PHARMA_SNAPSHOT_GROUPS,
  scoreSectionGroups: PHARMA_SECTION_GROUPS,
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
  externalRatingsMode: "COMPACT",
  readinessPanel: "PHARMA_V1",
  refreshModules: PHARMA_REFRESH_MODULES,
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
