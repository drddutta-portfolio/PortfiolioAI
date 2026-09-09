export const RESEARCH_DATASET_VERSION = "PORTFOLIOAI_RESEARCH_DATASET_V1" as const

export type ResearchDatasetContractStatus =
  | "VERIFIED_PROVIDER_FIELD"
  | "REQUIRES_PROVIDER_CONTRACT"
  | "DERIVED_LATER"
  | "DEFERRED"

export type ResearchDatasetDomain =
  | "IDENTITY"
  | "CLASSIFICATION"
  | "GROWTH"
  | "QUALITY"
  | "BALANCE_SHEET"
  | "VALUATION"
  | "OWNERSHIP"
  | "DOCUMENTS"

export type ResearchDatasetFreshnessDomain =
  | "VERIFIED_IDENTITY"
  | "TTM_FUNDAMENTALS"
  | "ANNUAL_FUNDAMENTALS"
  | "QUARTERLY_FUNDAMENTALS"
  | "VALUATION_EVIDENCE"
  | "OWNERSHIP"
  | "DOCUMENT_DISCOVERY"
  | "NONE"

export interface ResearchDatasetMetricContract {
  readonly code: string
  readonly label: string
  readonly domain: ResearchDatasetDomain
  readonly status: ResearchDatasetContractStatus
  readonly freshnessDomain: ResearchDatasetFreshnessDomain
  readonly providerField: string | null
  readonly periodRequirement: "POINT_IN_TIME" | "TTM" | "ANNUAL" | "QUARTERLY" | "ANY" | "DERIVED" | "NONE"
  readonly unitRequirement: string | null
  readonly notes: string
}

const contracts: readonly ResearchDatasetMetricContract[] = [
  { code: "COMPANY_IDENTITY", label: "Verified provider identity", domain: "IDENTITY", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "VERIFIED_IDENTITY", providerField: null, periodRequirement: "NONE", unitRequirement: null, notes: "Strict symbol/ISIN/name reconciliation; provider instrument id remains source-scoped." },
  { code: "SECTOR_PROVIDER", label: "Provider sector", domain: "CLASSIFICATION", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "VERIFIED_IDENTITY", providerField: "search candidate sector", periodRequirement: "NONE", unitRequirement: null, notes: "Provider evidence only until canonical taxonomy selection is approved." },
  { code: "INDUSTRY_PROVIDER", label: "Provider industry", domain: "CLASSIFICATION", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "VERIFIED_IDENTITY", providerField: "search candidate industry", periodRequirement: "NONE", unitRequirement: null, notes: "Provider evidence only until canonical taxonomy selection is approved." },

  { code: "REVENUE_TTM", label: "Revenue (TTM)", domain: "GROWTH", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "TTM_FUNDAMENTALS", providerField: "SR_TTM", periodRequirement: "TTM", unitRequirement: "INR_CRORE", notes: "Existing reviewed first-wave contract." },
  { code: "REVENUE_ANNUAL", label: "Revenue annual", domain: "GROWTH", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANNUAL", unitRequirement: "INR_CRORE", notes: "Requires exact provider field, period end, currency and consolidation scope." },
  { code: "REVENUE_QUARTERLY", label: "Revenue quarterly", domain: "GROWTH", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "QUARTERLY_FUNDAMENTALS", providerField: null, periodRequirement: "QUARTERLY", unitRequirement: "INR_CRORE", notes: "Requires exact quarter, currency and consolidation scope." },
  { code: "EBITDA", label: "EBITDA", domain: "GROWTH", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: "INR_CRORE", notes: "Must never be silently equated with operating profit." },
  { code: "OPERATING_MARGIN", label: "Operating margin", domain: "QUALITY", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: "PERCENT", notes: "Numerator, denominator and period semantics must be explicit." },
  { code: "NET_PROFIT_TTM", label: "PAT (TTM)", domain: "GROWTH", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "TTM_FUNDAMENTALS", providerField: "NP_TTM", periodRequirement: "TTM", unitRequirement: "INR_CRORE", notes: "Existing reviewed first-wave contract." },
  { code: "NET_PROFIT_ANNUAL", label: "PAT annual", domain: "GROWTH", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANNUAL", unitRequirement: "INR_CRORE", notes: "Requires period end, currency and consolidation scope." },
  { code: "NET_PROFIT_QUARTERLY", label: "PAT quarterly", domain: "GROWTH", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "QUARTERLY_FUNDAMENTALS", providerField: null, periodRequirement: "QUARTERLY", unitRequirement: "INR_CRORE", notes: "Requires quarter end, currency and consolidation scope." },
  { code: "EPS_DILUTED", label: "Diluted EPS", domain: "GROWTH", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: null, notes: "Dilution basis and period must be verified." },
  { code: "REVENUE_CAGR", label: "Revenue CAGR", domain: "GROWTH", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "PERCENT", notes: "PortfolioAI deterministic calculation from period-qualified series only." },
  { code: "PAT_CAGR", label: "PAT CAGR", domain: "GROWTH", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "PERCENT", notes: "PortfolioAI deterministic calculation from period-qualified series only." },
  { code: "EPS_CAGR", label: "EPS CAGR", domain: "GROWTH", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "PERCENT", notes: "PortfolioAI deterministic calculation from period-qualified series only." },

  { code: "ROE_ANNUAL", label: "ROE annual", domain: "QUALITY", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: "ROE_A", periodRequirement: "ANNUAL", unitRequirement: "PERCENT", notes: "Provider field is verified; current first-wave observations may still lack adequate period metadata." },
  { code: "ROCE_ANNUAL", label: "ROCE annual", domain: "QUALITY", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANNUAL", unitRequirement: "PERCENT", notes: "Exact provider field/formula and annual period required." },
  { code: "CFO_ANNUAL", label: "Cash flow from operations", domain: "QUALITY", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: "CFO_A", periodRequirement: "ANNUAL", unitRequirement: "INR_CRORE", notes: "Provider field is verified; current first-wave observations may still lack adequate period metadata." },
  { code: "CFO_PAT", label: "CFO / PAT", domain: "QUALITY", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "RATIO", notes: "Requires compatible CFO and PAT periods/scopes." },
  { code: "FREE_CASH_FLOW", label: "Free cash flow", domain: "QUALITY", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "INR_CRORE", notes: "Formula contract required; cannot be inferred from incomplete cash-flow evidence." },

  { code: "TOTAL_DEBT", label: "Total debt", domain: "BALANCE_SHEET", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: "INR_CRORE", notes: "Point/period date, currency and scope required." },
  { code: "CASH_EQUIVALENTS", label: "Cash and cash equivalents", domain: "BALANCE_SHEET", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: "INR_CRORE", notes: "Point/period date, currency and scope required." },
  { code: "NET_DEBT", label: "Net debt", domain: "BALANCE_SHEET", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "INR_CRORE", notes: "Derived only after approved debt and cash component contracts." },
  { code: "DEBT_EQUITY", label: "Debt / equity", domain: "BALANCE_SHEET", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: "RATIO", notes: "Denominator definition must be explicit." },
  { code: "INTEREST_COVERAGE", label: "Interest coverage", domain: "BALANCE_SHEET", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "ANNUAL_FUNDAMENTALS", providerField: null, periodRequirement: "ANY", unitRequirement: "RATIO", notes: "EBIT/EBITDA numerator definition must be explicit." },

  { code: "MARKET_CAP_PROVIDER_RAW", label: "Provider raw market cap", domain: "VALUATION", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "VALUATION_EVIDENCE", providerField: "MCAP_Q", periodRequirement: "POINT_IN_TIME", unitRequirement: "INR_CRORE", notes: "Evidence only; Angel One remains current-price authority." },
  { code: "PE_TTM", label: "P/E (TTM)", domain: "VALUATION", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "VALUATION_EVIDENCE", providerField: "PE_TTM", periodRequirement: "TTM", unitRequirement: "RATIO", notes: "Existing reviewed first-wave contract." },
  { code: "PBV_ADJUSTED_PROVIDER", label: "Provider Adjusted P/B", domain: "VALUATION", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "VALUATION_EVIDENCE", providerField: "PBV_A", periodRequirement: "POINT_IN_TIME", unitRequirement: "RATIO", notes: "Conflicting by design; not equivalent to generic P/B." },
  { code: "PBV_GENERIC", label: "P/B", domain: "VALUATION", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "VALUATION_EVIDENCE", providerField: null, periodRequirement: "POINT_IN_TIME", unitRequirement: "RATIO", notes: "Only an explicitly reviewed semantically equivalent source/calculation may satisfy generic P/B." },
  { code: "EV_EBITDA", label: "EV / EBITDA", domain: "VALUATION", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "VALUATION_EVIDENCE", providerField: null, periodRequirement: "ANY", unitRequirement: "RATIO", notes: "EV and EBITDA semantics required." },
  { code: "DIVIDEND_YIELD", label: "Dividend yield", domain: "VALUATION", status: "REQUIRES_PROVIDER_CONTRACT", freshnessDomain: "VALUATION_EVIDENCE", providerField: null, periodRequirement: "ANY", unitRequirement: "PERCENT", notes: "Dividend period and basis required." },
  { code: "FCF_YIELD", label: "FCF yield", domain: "VALUATION", status: "DERIVED_LATER", freshnessDomain: "NONE", providerField: null, periodRequirement: "DERIVED", unitRequirement: "PERCENT", notes: "Requires approved FCF and valuation denominator." },

  { code: "SHAREHOLDING_PROMOTER_PERCENT", label: "Promoter holding", domain: "OWNERSHIP", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "OWNERSHIP", providerField: "Promoter", periodRequirement: "QUARTERLY", unitRequirement: "PERCENT", notes: "Existing aggregate ownership contract." },
  { code: "SHAREHOLDING_FII_FPI_PERCENT", label: "FII/FPI holding", domain: "OWNERSHIP", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "OWNERSHIP", providerField: "FII", periodRequirement: "QUARTERLY", unitRequirement: "PERCENT", notes: "Existing aggregate ownership contract." },
  { code: "SHAREHOLDING_DII_PERCENT", label: "DII holding", domain: "OWNERSHIP", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "OWNERSHIP", providerField: "DII", periodRequirement: "QUARTERLY", unitRequirement: "PERCENT", notes: "Existing aggregate ownership contract." },
  { code: "SHAREHOLDING_MUTUAL_FUND_PERCENT", label: "Mutual-fund holding", domain: "OWNERSHIP", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "OWNERSHIP", providerField: "MF", periodRequirement: "QUARTERLY", unitRequirement: "PERCENT", notes: "Existing aggregate ownership contract." },
  { code: "SHAREHOLDING_PUBLIC_PERCENT", label: "Public holding", domain: "OWNERSHIP", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "OWNERSHIP", providerField: "Public", periodRequirement: "QUARTERLY", unitRequirement: "PERCENT", notes: "Existing aggregate ownership contract." },
  { code: "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT", label: "Promoter pledge", domain: "OWNERSHIP", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "OWNERSHIP", providerField: "Promoter Pledge", periodRequirement: "ANY", unitRequirement: "PERCENT_OF_PROMOTER_HOLDING", notes: "Denominator is promoter holding, not total shares." },

  { code: "ANNUAL_REPORT", label: "Annual reports", domain: "DOCUMENTS", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "DOCUMENT_DISCOVERY", providerField: "semantic document appearance", periodRequirement: "ANY", unitRequirement: null, notes: "Appearance metadata only; identity remains review-required until separately verified." },
  { code: "QUARTERLY_RESULT_DOCUMENT", label: "Quarterly results", domain: "DOCUMENTS", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "DOCUMENT_DISCOVERY", providerField: "semantic document appearance", periodRequirement: "ANY", unitRequirement: null, notes: "Appearance metadata only; body/open rights remain separate." },
  { code: "INVESTOR_PRESENTATION", label: "Investor presentations", domain: "DOCUMENTS", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "DOCUMENT_DISCOVERY", providerField: "semantic document appearance", periodRequirement: "ANY", unitRequirement: null, notes: "Appearance metadata only; body/open rights remain separate." },
  { code: "EARNINGS_CALL", label: "Earnings calls / concalls", domain: "DOCUMENTS", status: "VERIFIED_PROVIDER_FIELD", freshnessDomain: "DOCUMENT_DISCOVERY", providerField: "semantic document appearance", periodRequirement: "ANY", unitRequirement: null, notes: "Appearance metadata only; body/open rights remain separate." },
] as const

export const RESEARCH_DATASET_V1: readonly ResearchDatasetMetricContract[] = contracts

const byCode = new Map(contracts.map((contract) => [contract.code, contract]))

export function researchDatasetContract(code: string): ResearchDatasetMetricContract | null {
  return byCode.get(code) ?? null
}

export function researchUnavailableReason(code: string): string {
  const contract = researchDatasetContract(code)
  if (!contract) return "No production research contract is registered for this field."
  switch (contract.status) {
    case "VERIFIED_PROVIDER_FIELD": return "No usable cached provider observation is available."
    case "REQUIRES_PROVIDER_CONTRACT": return "Provider field semantics are not yet verified for production use."
    case "DERIVED_LATER": return "This metric will be calculated later from validated period-qualified inputs."
    case "DEFERRED": return "This research field is deferred from the current production dataset."
  }
}
