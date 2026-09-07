import { describe, expect, it } from "vitest"
import { mapAngelInstruments } from "../../../supabase/functions/_shared/instrument-mapping"

const security = { id: "security-1", symbol: "RELIANCE", exchange: "NSE", assetClass: "EQUITY" }

describe("Angel One instrument mapping", () => {
  it("verifies only one exact exchange and symbol identity", () => {
    const result = mapAngelInstruments([security], [
      { token: "2885", symbol: "RELIANCE-EQ", name: "RELIANCE", exch_seg: "NSE", expiry: "", instrumenttype: "" },
      { token: "500325", symbol: "RELIANCE-A", name: "RELIANCE", exch_seg: "BSE", expiry: "", instrumenttype: "" },
    ], "2026-09-07T00:00:00.000Z")
    expect(result[0]).toMatchObject({ mappingStatus: "VERIFIED", providerInstrumentId: "2885", tradingSymbol: "RELIANCE-EQ", matchBasis: "EXCHANGE_SYMBOL_EXACT" })
  })

  it("reports ambiguous and unresolved identities without choosing", () => {
    const ambiguous = mapAngelInstruments([security], [
      { token: "1", symbol: "RELIANCE-EQ", name: "RELIANCE", exch_seg: "NSE", expiry: "" },
      { token: "2", symbol: "RELIANCE-BE", name: "RELIANCE", exch_seg: "NSE", expiry: "" },
    ], "2026-09-07T00:00:00.000Z")
    const unresolved = mapAngelInstruments([security], [], "2026-09-07T00:00:00.000Z")
    expect(ambiguous[0]!.mappingStatus).toBe("AMBIGUOUS")
    expect(ambiguous[0]!.providerInstrumentId).toBeNull()
    expect(unresolved[0]!.mappingStatus).toBe("UNRESOLVED")
  })

  it("does not send non-equity assets through the equity/ETF mapper", () => {
    expect(mapAngelInstruments([{ ...security, assetClass: "GOLD" }], [], "2026-09-07T00:00:00.000Z")).toEqual([])
  })
})
