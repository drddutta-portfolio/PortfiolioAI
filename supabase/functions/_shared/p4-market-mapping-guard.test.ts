import { describe, expect, it } from "vitest"
import { assertP4MarketMappingRequest, P4_MARKET_MAPPING_CONFIRMATION, P4_MARKET_PRICE_CONFIRMATION, P4_MARKET_MAPPING_PORTFOLIO_ID, P4_BANKBARODA_SECURITY_ID } from "./p4-market-mapping-guard"

const base = {
  supabaseUrl: "https://lrgpjimipfkyoqbpsqzz.supabase.co",
  portfolioId: P4_MARKET_MAPPING_PORTFOLIO_ID,
  securityId: P4_BANKBARODA_SECURITY_ID,
  confirmation: P4_MARKET_MAPPING_CONFIRMATION,
  action: "P4_SYNC_MAPPING",
}

describe("P4 market mapping guard", () => {
  it("accepts BANKBARODA mapping on PortfolioAI Dev", () => expect(assertP4MarketMappingRequest(base)).toEqual({ ok: true }))
  it("accepts BANKBARODA price refresh on PortfolioAI Dev", () => expect(assertP4MarketMappingRequest({ ...base, action: "P4_REFRESH_PRICE", confirmation: P4_MARKET_PRICE_CONFIRMATION })).toEqual({ ok: true }))
  it("refuses Production", () => expect(assertP4MarketMappingRequest({ ...base, supabaseUrl: "https://uxiyufbsbgzzdujzcdxe.supabase.co" })).toMatchObject({ ok: false, code: "UNEXPECTED_PRODUCTION_DB_TARGET" }))
  it("refuses other securities", () => expect(assertP4MarketMappingRequest({ ...base, securityId: "fdec39e9-08a7-418d-ae96-9d8ce834d26c" })).toMatchObject({ ok: false, code: "SECURITY_SCOPE_MISMATCH" }))
  it("refuses wrong confirmation", () => expect(assertP4MarketMappingRequest({ ...base, confirmation: "WRONG" })).toMatchObject({ ok: false, code: "AUTH_OR_CONFIG_ERROR" }))
})
