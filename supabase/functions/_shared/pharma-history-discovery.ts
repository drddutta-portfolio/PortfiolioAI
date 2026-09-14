export const PHARMA_HISTORY_DISCOVERY_VERSION = "PHARMA_HISTORY_DISCOVERY_V2" as const

export interface PharmaHistoryDiscoveryTerm {
  readonly code: string
  readonly query: string
  readonly purpose: string
}

/**
 * Live R4E validation proved that Trendlyne's `search_parameters` tool is not
 * available on the current MCP contract. The validated discovery path is the
 * already-observed `get_parameter_values_multi_stock` tool with exact stock
 * identity language and narrowly-scoped history requests.
 *
 * These queries remain discovery-only. They may prove provider field/value
 * availability, but they do not promote canonical observations or make a
 * PHARMA_V1 metric READY by themselves.
 */
export const PHARMA_HISTORY_DISCOVERY_TERMS: readonly PharmaHistoryDiscoveryTerm[] = [
  {
    code: "EARNINGS_ROCE_HISTORY",
    query: "Exact stock Torrent Pharmaceuticals (TORNTPHARM), Trendlyne instrument 1409. Return exact parameter labels and values for annual operating revenue, net profit/PAT, cash EPS/diluted EPS, and ROCE for current annual period and 1 year ago, 2 years ago, 3 years ago, 4 years ago, 5 years ago where available. Do not substitute another company.",
    purpose: "Prove period-specific annual revenue, earnings/EPS and ROCE evidence for the reviewed PHARMA reference stock.",
  },
  {
    code: "OPM_QUARTER_HISTORY",
    query: "Exact stock Torrent Pharmaceuticals (TORNTPHARM), Trendlyne instrument 1409. Return exact parameter labels and values for operating profit margin OPM, operating profit and operating revenue for current quarter and 1Q ago, 2Q ago, 3Q ago, 4Q ago, 5Q ago, 6Q ago, 7Q ago, 8Q ago, 9Q ago, 10Q ago, 11Q ago, 12Q ago where available. Do not substitute another company.",
    purpose: "Prove quarter-specific margin inputs, preferring raw operating profit and revenue that PortfolioAI can use to derive OPM deterministically.",
  },
  {
    code: "CASH_LEVERAGE_HISTORY",
    query: "Exact stock Torrent Pharmaceuticals (TORNTPHARM), Trendlyne instrument 1409. Return exact parameter labels and values for cash from operating activities/CFO, capital expenditure/capex, free cash flow, total debt, cash and bank balance, net debt, debt-equity, interest coverage and EBITDA for current annual period and 1 year ago, 2 years ago, 3 years ago, 4 years ago where available. Do not substitute another company.",
    purpose: "Prove period-specific cash-conversion and leverage inputs without promoting provider-computed aggregates as canonical history.",
  },
] as const

export const PHARMA_HISTORY_DISCOVERY_MAX_PROVIDER_CALLS = PHARMA_HISTORY_DISCOVERY_TERMS.length

export const PHARMA_HISTORY_DISCOVERY_REFERENCE = {
  symbol: "TORNTPHARM",
  applicationSector: "Pharma",
  providerInstrumentId: "1409",
} as const
