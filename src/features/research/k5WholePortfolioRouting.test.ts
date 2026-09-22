import { describe, expect, it } from "vitest"
import {
  K5_FUTURE_STOCK_ROUTING_FIXTURES,
  k5SupportedProfileAuthorities,
  resolveK5PortfolioMethodState,
} from "./k5CrossSectorValidation"
import { K5_CURRENT_PORTFOLIO_ROUTING_ROWS } from "./k5CurrentPortfolioRoutingSnapshot"

describe("Gate K5 whole-portfolio and future-stock routing", () => {
  it("gives every frozen current-portfolio row an explicit research architecture state", () => {
    expect(K5_CURRENT_PORTFOLIO_ROUTING_ROWS).toHaveLength(238)

    const allowed = new Set([
      "SUPPORTED_ENGINE",
      "METHODOLOGY_NOT_AVAILABLE",
      "REVIEW_REQUIRED",
      "NOT_APPLICABLE",
    ])

    for (const row of K5_CURRENT_PORTFOLIO_ROUTING_ROWS) {
      const resolved = resolveK5PortfolioMethodState({
        assetClass: row.assetClass,
        sector: row.sector,
        industry: row.industry,
      })
      expect(allowed.has(resolved.state), row.symbol).toBe(true)
    }
  })

  it("routes an arbitrary future stock for every currently supported profile without ticker-specific logic", () => {
    const supportedProfiles = k5SupportedProfileAuthorities()
      .map((item) => item.profileCode)
      .sort()
    const fixtureProfiles = K5_FUTURE_STOCK_ROUTING_FIXTURES
      .map((item) => item.profileCode)
      .sort()

    expect(fixtureProfiles).toEqual(supportedProfiles)

    for (const fixture of K5_FUTURE_STOCK_ROUTING_FIXTURES) {
      const resolved = resolveK5PortfolioMethodState({
        assetClass: "EQUITY",
        sector: fixture.sector,
        industry: fixture.industry,
      })
      expect(resolved).toMatchObject({
        state: "SUPPORTED_ENGINE",
        engineCode: fixture.engineCode,
        profileCode: fixture.profileCode,
      })
    }
  })

  it("fails unsupported sectors safely instead of choosing a nearest-looking engine", () => {
    expect(resolveK5PortfolioMethodState({
      assetClass: "EQUITY",
      sector: "Telecommunication",
      industry: "Telecom Services",
    })).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: null,
    })
  })

  it("returns REVIEW_REQUIRED when canonical classification is missing or conflicting", () => {
    expect(resolveK5PortfolioMethodState({
      assetClass: "EQUITY",
      sector: null,
      industry: "Banks",
    }).state).toBe("REVIEW_REQUIRED")

    expect(resolveK5PortfolioMethodState({
      assetClass: "EQUITY",
      sector: "Banking",
      industry: "Pharmaceuticals",
    }).state).toBe("REVIEW_REQUIRED")
  })

  it("keeps intentionally pending profiles fail-closed", () => {
    expect(resolveK5PortfolioMethodState({
      assetClass: "EQUITY",
      sector: "Financial Services",
      industry: "NBFC",
    })).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: "BANK_NBFC",
      profileCode: "NBFC_LENDING",
      reasonCode: "REGISTERED_PROFILE_METHODOLOGY_PENDING",
    })

    expect(resolveK5PortfolioMethodState({
      assetClass: "EQUITY",
      sector: "Healthcare",
      industry: "Diagnostics",
    })).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: null,
      profileCode: "DIAGNOSTICS",
    })
  })
})
