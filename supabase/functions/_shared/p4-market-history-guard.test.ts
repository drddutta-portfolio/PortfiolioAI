import { describe, expect, it } from "vitest"
import { assertP4MarketHistoryRequest, P4_MARKET_HISTORY_CONFIRMATION, P4_MARKET_HISTORY_PORTFOLIO_ID } from "./p4-market-history-guard"

const base = {
  supabaseUrl: "https://lrgpjimipfkyoqbpsqzz.supabase.co",
  portfolioId: P4_MARKET_HISTORY_PORTFOLIO_ID,
  securityId: "b47b007d-1990-4504-a5a2-4391c07687c5",
  confirmation: P4_MARKET_HISTORY_CONFIRMATION,
}

describe("P4 market history guard", () => {
  it("accepts the exact Development cohort", () => expect(assertP4MarketHistoryRequest(base)).toEqual({ ok: true }))
  it("refuses Production", () => expect(assertP4MarketHistoryRequest({ ...base, supabaseUrl: "https://uxiyufbsbgzzdujzcdxe.supabase.co" })).toMatchObject({ ok: false, code: "UNEXPECTED_PRODUCTION_DB_TARGET" }))
  it("refuses unknown hosted projects", () => expect(assertP4MarketHistoryRequest({ ...base, supabaseUrl: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co" })).toMatchObject({ ok: false, code: "UNAPPROVED_DEVELOPMENT_DB_TARGET" }))
  it("refuses a different portfolio", () => expect(assertP4MarketHistoryRequest({ ...base, portfolioId: "00000000-0000-0000-0000-000000000000" })).toMatchObject({ ok: false, code: "PORTFOLIO_SCOPE_MISMATCH" }))
  it("accepts BANKBARODA after verified mapping", () => expect(assertP4MarketHistoryRequest({ ...base, securityId: "6771f493-c29a-477e-8cc8-2bede0941e44" })).toEqual({ ok: true }))
  it("refuses securities outside the exact cohort", () => expect(assertP4MarketHistoryRequest({ ...base, securityId: "00000000-0000-0000-0000-000000000001" })).toMatchObject({ ok: false, code: "SECURITY_SCOPE_MISMATCH" }))
  it("refuses the wrong confirmation", () => expect(assertP4MarketHistoryRequest({ ...base, confirmation: "WRONG" })).toMatchObject({ ok: false, code: "AUTH_OR_CONFIG_ERROR" }))
})
