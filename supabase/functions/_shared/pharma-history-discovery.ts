export const PHARMA_HISTORY_DISCOVERY_VERSION = "PHARMA_HISTORY_DISCOVERY_V1" as const

export interface PharmaHistoryDiscoveryTerm {
  readonly code: string
  readonly query: string
  readonly purpose: string
}

/**
 * Parameter discovery only. These searches are intentionally narrow and exist
 * to prove provider field/history semantics before any value retrieval or
 * canonical research ingestion is attempted.
 */
export const PHARMA_HISTORY_DISCOVERY_TERMS: readonly PharmaHistoryDiscoveryTerm[] = [
  {
    code: "REVENUE_HISTORY",
    query: "annual operating revenue historical current 1 year ago 2 years ago 3 years ago 4 years ago revenue annual",
    purpose: "Find period-specific annual revenue fields suitable for a comparable 3-5 year raw history series.",
  },
  {
    code: "OPERATING_MARGIN_HISTORY",
    query: "operating profit margin OPM quarterly historical current 1 quarter ago 2 quarters ago 3 quarters ago 4 quarters ago 8 quarters ago",
    purpose: "Find period-specific quarterly OPM/margin fields suitable for an 8-12 quarter comparable history.",
  },
  {
    code: "ROCE_HISTORY",
    query: "ROCE annual historical current 1 year ago 2 years ago 3 years ago 4 years ago return on capital employed",
    purpose: "Find period-specific annual ROCE fields instead of provider-computed multi-year averages.",
  },
  {
    code: "PAT_EPS_HISTORY",
    query: "net profit PAT EPS annual historical current 1 year ago 2 years ago 3 years ago 4 years ago",
    purpose: "Find period-specific annual PAT and EPS fields underlying growth/consistency calculations.",
  },
  {
    code: "CASH_CONVERSION_HISTORY",
    query: "cash flow from operations CFO annual historical capex capital expenditure free cash flow current 1 year ago 2 years ago 3 years ago",
    purpose: "Find period-specific CFO and capex/FCF fields for matched-period cash conversion.",
  },
  {
    code: "BALANCE_SHEET_LEVERAGE",
    query: "debt equity interest coverage total debt cash net debt EBITDA annual historical current 1 year ago 2 years ago 3 years ago",
    purpose: "Find reviewed leverage/debt/cash/interest-cover inputs for PHARMA financial-strength history.",
  },
] as const

export const PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS = PHARMA_HISTORY_DISCOVERY_TERMS.length

export const PHARMA_HISTORY_DISCOVERY_REFERENCE = {
  symbol: "TORNTPHARM",
  applicationSector: "Pharma",
  providerInstrumentId: "1409",
} as const
