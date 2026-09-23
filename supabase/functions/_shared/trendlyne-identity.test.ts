import { describe, expect, it } from "vitest"
import { reconcileTrendlyneIdentityDiscovery, type CanonicalIdentity, type TrendlyneIdentity } from "./trendlyne"

const canonical: CanonicalIdentity = { name: "Alivus Life Sciences Limited", symbol: "ALIVUS", isin: "INE03Q201024", bseCode: null }
const candidate: Omit<TrendlyneIdentity, "stockId"> = { name: canonical.name, symbol: canonical.symbol, isin: canonical.isin, bseCode: null, sector: "Pharma", industry: "Pharmaceuticals" }
const overview = (overrides: Partial<TrendlyneIdentity> = {}) => ({ identity: { stockId: "1234", ...candidate, ...overrides }, metrics: [] })

describe("Trendlyne provider identity discovery", () => {
  it("accepts exactly one candidate matching canonical symbol and ISIN", () => {
    expect(reconcileTrendlyneIdentityDiscovery(canonical, [candidate], overview())).toMatchObject({ stockId: "1234", symbol: "ALIVUS", isin: "INE03Q201024" })
  })
  it("fails closed for ambiguous exact candidates", () => {
    expect(() => reconcileTrendlyneIdentityDiscovery(canonical, [candidate, candidate], overview())).toThrow("AMBIGUOUS_PROVIDER_IDENTITY")
  })
  it("fails closed for symbol mismatch", () => {
    expect(() => reconcileTrendlyneIdentityDiscovery(canonical, [candidate], overview({ symbol: "WRONG" }))).toThrow("PROVIDER_SYMBOL_MISMATCH")
  })
  it("fails closed for ISIN mismatch", () => {
    expect(() => reconcileTrendlyneIdentityDiscovery(canonical, [candidate], overview({ isin: "INE000000000" }))).toThrow("PROVIDER_ISIN_MISMATCH")
  })
})
