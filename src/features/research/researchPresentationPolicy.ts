export interface ResearchSnapshotGroup {
  readonly title: string
  readonly codes: readonly string[]
}

const OWNERSHIP_CODES = [
  "SHAREHOLDING_PROMOTER_PERCENT",
  "SHAREHOLDING_FII_FPI_PERCENT",
  "SHAREHOLDING_DII_PERCENT",
  "SHAREHOLDING_MUTUAL_FUND_PERCENT",
  "SHAREHOLDING_PUBLIC_PERCENT",
  "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT",
] as const

const GENERAL_GROUPS: readonly ResearchSnapshotGroup[] = [
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

const PHARMA_GROUPS: readonly ResearchSnapshotGroup[] = [
  {
    title: "Quality at a glance",
    codes: ["OPM_TTM", "ROCE_ANNUAL", "CFO_ANNUAL", "ROE_ANNUAL"],
  },
  {
    title: "Growth at a glance",
    codes: ["REVENUE_TTM", "NET_PROFIT_TTM", "EPS_GROWTH_YOY", "EPS_DILUTED"],
  },
  {
    title: "Valuation snapshot",
    codes: ["MARKET_CAP_PROVIDER_RAW", "MARKET_CAP", "PE_TTM", "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT"],
  },
  { title: "Ownership snapshot", codes: OWNERSHIP_CODES },
]

/**
 * Presentation policy only. It never reclassifies a security or invents research
 * evidence. The active scoring profile chooses which cached evidence is useful
 * in the compact Overview cards while the evidence ledger remains complete.
 *
 * BANK_NBFC intentionally retains the existing general/bank snapshot until its
 * own presentation policy is split out. PHARMA_V1 explicitly excludes bank-only
 * advances/deposits/NPA fields and provider P/B from the primary Pharma snapshot.
 */
export function researchSnapshotGroups(profileCode: string | null | undefined): readonly ResearchSnapshotGroup[] {
  return profileCode === "PHARMA_V1" ? PHARMA_GROUPS : GENERAL_GROUPS
}
