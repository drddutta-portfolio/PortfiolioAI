import { describe, expect, it } from "vitest"
import { CANONICAL_DATA_AUTHORITIES, canonicalAuthorityFor, type CanonicalFactKey } from "./canonicalDataAuthorities"

const REQUIRED_FACTS: readonly CanonicalFactKey[] = [
  "TRANSACTIONS",
  "OPEN_QUANTITY",
  "AVERAGE_COST",
  "INVESTED_AMOUNT",
  "CURRENT_PRICE",
  "CURRENT_VALUE",
  "UNREALISED_PNL",
  "PORTFOLIO_WEIGHT",
  "SECTOR",
  "INDUSTRY",
  "MARKET_CAP_CATEGORY",
  "RESEARCH_SUBPROFILE_ASSIGNMENT",
  "PORTFOLIO_ROLE",
  "THEMES",
  "FUNDAMENTAL_EVIDENCE",
  "OWNERSHIP_EVIDENCE",
  "RESEARCH_DOCUMENTS",
  "DAILY_OHLCV",
  "OFFICIAL_NEWS",
  "DETERMINISTIC_SCORE",
  "RECOMMENDATION",
  "POSITION_SIZING_ASSESSMENT",
  "CORE_HEALTH",
  "EXIT_RISK",
]

describe("canonical data authority registry", () => {
  it("registers every required PortfolioAI business fact exactly once", () => {
    expect(Object.keys(CANONICAL_DATA_AUTHORITIES).sort()).toEqual([...REQUIRED_FACTS].sort())
    expect(new Set(Object.values(CANONICAL_DATA_AUTHORITIES).map((entry) => entry.fact)).size).toBe(REQUIRED_FACTS.length)
  })

  it("gives every fact an authority, source object, shared access path and explicit missing-data rule", () => {
    for (const entry of Object.values(CANONICAL_DATA_AUTHORITIES)) {
      expect(entry.canonicalAuthority.trim().length).toBeGreaterThan(0)
      expect(entry.canonicalSourceObject.trim().length).toBeGreaterThan(0)
      expect(entry.sharedAccessPath.trim().length).toBeGreaterThan(0)
      expect(entry.pageLocalDerivationAllowed).toBe(false)
      expect(["PRESERVE_NULL", "PRESERVE_STATE", "NOT_APPLICABLE_WHEN_UNSUPPORTED"]).toContain(entry.missingDataBehavior)
    }
  })

  it("keeps sector, industry and market-cap classification on the same enrichment authority", () => {
    const sector = canonicalAuthorityFor("SECTOR")
    const industry = canonicalAuthorityFor("INDUSTRY")
    const marketCap = canonicalAuthorityFor("MARKET_CAP_CATEGORY")

    expect(sector.canonicalAuthority).toBe(industry.canonicalAuthority)
    expect(industry.canonicalAuthority).toBe(marketCap.canonicalAuthority)
    expect(sector.canonicalSourceObject).toContain("current_security_enrichment_v1")
    expect(industry.canonicalSourceObject).toContain("current_security_enrichment_v1")
    expect(marketCap.canonicalSourceObject).toContain("current_security_enrichment_v1")
  })

  it("keeps research subprofile assignment separate from application classification", () => {
    const subprofile = canonicalAuthorityFor("RESEARCH_SUBPROFILE_ASSIGNMENT")
    expect(subprofile.canonicalAuthority).not.toBe(canonicalAuthorityFor("SECTOR").canonicalAuthority)
    expect(subprofile.sharedAccessPath).toContain("resolvePharmaSubprofileAssignment")
    expect(subprofile.notes).toContain("block readiness")
  })

  it("keeps owner settings separate from engine outputs", () => {
    expect(canonicalAuthorityFor("PORTFOLIO_ROLE").layer).toBe("OWNER_SETTING")
    expect(canonicalAuthorityFor("THEMES").layer).toBe("OWNER_SETTING")
    expect(canonicalAuthorityFor("POSITION_SIZING_ASSESSMENT").layer).toBe("SCORED")
  })

  it("does not treat future Core Health or Exit Risk UI readiness as canonical engine output", () => {
    expect(canonicalAuthorityFor("CORE_HEALTH").layer).toBe("FUTURE_ENGINE")
    expect(canonicalAuthorityFor("EXIT_RISK").layer).toBe("FUTURE_ENGINE")
  })
})
