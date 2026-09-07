import { describe, expect, it } from "vitest"
import { verifiedIdentityChanged } from "./mapping-transition.ts"

const existing = { id: "mapping", mapping_status: "VERIFIED", provider_instrument_id: "101", exchange: "NSE", trading_symbol: "ABC-EQ" }

describe("verified provider identity transitions", () => {
  it("keeps an identical verified mapping", () => expect(verifiedIdentityChanged(existing, {
    mappingStatus: "VERIFIED", providerInstrumentId: "101", exchange: "NSE", tradingSymbol: "ABC-EQ",
  })).toBe(false))

  it("quarantines token, symbol, exchange, or resolution changes", () => {
    expect(verifiedIdentityChanged(existing, { mappingStatus: "VERIFIED", providerInstrumentId: "202", exchange: "NSE", tradingSymbol: "ABC-EQ" })).toBe(true)
    expect(verifiedIdentityChanged(existing, { mappingStatus: "UNRESOLVED", providerInstrumentId: null, exchange: "NSE", tradingSymbol: null })).toBe(true)
  })
})
