import { describe, expect, it } from "vitest"
import { classifyP8B3MissingPriceBlocker } from "./p8MissingPriceBlocker"

describe("P8-B3 missing-price blocker policy", () => {
  it("returns no blocker when same-day price exists",()=>expect(classifyP8B3MissingPriceBlocker({
    eligible:true,sameDayBoundPrice:true,officialSourceDatePresent:true
  })).toBeNull())

  it("classifies absence from an available official bhavcopy as no trade",()=>expect(classifyP8B3MissingPriceBlocker({
    eligible:true,sameDayBoundPrice:false,officialSourceDatePresent:true,sourceRowForIsinPresent:false
  })).toBe("NO_TRADE_ON_DECISION_DATE"))

  it("prioritizes unresolved exact identity",()=>expect(classifyP8B3MissingPriceBlocker({
    eligible:true,sameDayBoundPrice:false,officialSourceDatePresent:true,sourceRowForIsinPresent:true,unresolvedPriceIdentity:true
  })).toBe("PRICE_IDENTITY_NOT_RESOLVED"))

  it("fails closed when the official source itself is unavailable",()=>expect(classifyP8B3MissingPriceBlocker({
    eligible:true,sameDayBoundPrice:false,officialSourceDatePresent:false
  })).toBe("RAW_PRICE_REQUIRED_BUT_UNAVAILABLE"))

  it("preserves complex-action blocker",()=>expect(classifyP8B3MissingPriceBlocker({
    eligible:true,sameDayBoundPrice:false,officialSourceDatePresent:true,complexCorporateActionBlocker:true
  })).toBe("COMPLEX_CORPORATE_ACTION_BLOCKER"))
})
