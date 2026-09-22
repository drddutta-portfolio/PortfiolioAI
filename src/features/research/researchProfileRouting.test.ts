import { describe, expect, it } from "vitest"
import { routeResearchProfileV1 } from "./researchProfileRouting"

describe("routeResearchProfileV1", () => {
  it("keeps non-equities outside equity research profiles", () => {
    expect(routeResearchProfileV1({ assetClass: "ETF", applicationSector: null, applicationIndustry: null })).toMatchObject({
      state: "NOT_APPLICABLE",
      profileCode: null,
    })
  })

  it("routes Banking to BANK without changing the displayed classification", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Banking", applicationIndustry: "Banks" })).toMatchObject({
      applicationSector: "Banking",
      applicationIndustry: "Banks",
      state: "ROUTED",
      profileCode: "BANK",
    })
  })

  it("keeps exchange-primary Healthcare visible while routing pharmaceutical industry evidence to PHARMA", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Healthcare", applicationIndustry: "Pharmaceuticals" })).toMatchObject({
      applicationSector: "Healthcare",
      applicationIndustry: "Pharmaceuticals",
      state: "ROUTED",
      profileCode: "PHARMA",
      basis: "SECTOR_AND_INDUSTRY",
    })
  })

  it("never routes a specialised methodology from sector alone", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Banking", applicationIndustry: null })).toMatchObject({
      state: "PROFILE_PENDING",
      profileCode: null,
      reasonCode: "BANKING_INDUSTRY_REQUIRED",
    })
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Pharma", applicationIndustry: null })).toMatchObject({
      state: "PROFILE_PENDING",
      profileCode: null,
      reasonCode: "PHARMA_INDUSTRY_REQUIRED",
    })
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Capital Goods", applicationIndustry: null })).toMatchObject({
      state: "PROFILE_PENDING",
      profileCode: null,
      reasonCode: "CAPITAL_GOODS_INDUSTRY_REQUIRED",
    })
  })

  it("routes Pharma to PHARMA", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Pharma", applicationIndustry: "Pharmaceuticals" })).toMatchObject({
      state: "ROUTED",
      profileCode: "PHARMA",
    })
  })

  it("uses industry evidence to prevent an IT-sector misroute", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Information Technology", applicationIndustry: "Aerospace & Defence" })).toMatchObject({
      applicationSector: "Information Technology",
      state: "ROUTED",
      profileCode: "DEFENCE_AEROSPACE",
      basis: "INDUSTRY_OVERRIDE",
    })
  })

  it("routes heavy electrical evidence to industrial methodology even when the sector label is IT", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Information Technology", applicationIndustry: "Heavy Electrical Equipment" })).toMatchObject({
      applicationSector: "Information Technology",
      state: "ROUTED",
      profileCode: "INDUSTRIAL_CAPITAL_GOODS",
      basis: "INDUSTRY_OVERRIDE",
    })
  })

  it("fails closed when Information Technology lacks a compatible subtype", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Information Technology", applicationIndustry: null })).toMatchObject({
      state: "PROFILE_PENDING",
      profileCode: null,
    })
  })

  it("distinguishes auto OEMs from auto-component companies", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Automobile and Auto Components", applicationIndustry: "Cars & Utility Vehicles" }).profileCode).toBe("AUTO_OEM")
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Automobile and Auto Components", applicationIndustry: "Auto Parts & Equipment" }).profileCode).toBe("AUTO_COMPONENTS")
  })

  it("uses Financial Services industry evidence rather than pretending all financial companies are banks", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Financial Services", applicationIndustry: "Asset Management Cos." }).profileCode).toBe("CAPITAL_MARKET_FINANCIAL")
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Financial Services", applicationIndustry: "Internet Software & Services" }).profileCode).toBe("DIGITAL_PLATFORM")
  })

  it("keeps ambiguous Financial Services holdings pending", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: "Financial Services", applicationIndustry: null })).toMatchObject({
      state: "PROFILE_PENDING",
      profileCode: null,
    })
  })

  it("requires review when application sector itself is missing", () => {
    expect(routeResearchProfileV1({ assetClass: "EQUITY", applicationSector: null, applicationIndustry: "Banks" })).toMatchObject({
      state: "REVIEW_REQUIRED",
      profileCode: null,
    })
  })
})
