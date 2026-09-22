export const PHARMA_VALUATION_DISCOVERY_VERSION =
  "PHARMA_VALUATION_DISCOVERY_V1" as const

export const PHARMA_VALUATION_DISCOVERY_REFERENCE = {
  symbol: "TORNTPHARM",
  providerInstrumentId: "1409",
} as const

export const PHARMA_VALUATION_DISCOVERY_PEERS = [
  { symbol: "MANKIND", name: "Mankind Pharma Limited" },
  { symbol: "ERIS", name: "Eris Lifesciences Limited" },
  { symbol: "EMCURE", name: "Emcure Pharmaceuticals Limited" },
] as const

export const PHARMA_VALUATION_DISCOVERY_METRIC_QUERY =
  "Exact stocks Torrent Pharmaceuticals (TORNTPHARM), Mankind Pharma (MANKIND), Eris Lifesciences (ERIS), and Emcure Pharmaceuticals (EMCURE). Return exact Trendlyne stock identity/instrument code, symbol, and exact current parameter labels and values for trailing P/E / PE TTM and EV/EBITDA for each stock. Do not substitute other companies. Preserve provider labels exactly and indicate unavailable values explicitly." as const

export const PHARMA_VALUATION_DISCOVERY_MAX_PROVIDER_CALLS =
  PHARMA_VALUATION_DISCOVERY_PEERS.length + 1
