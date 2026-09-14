import { describe, expect, it } from "vitest"
import { mapSectorToPortfolioAiV1 } from "./sectorResearchMapping"

describe("mapSectorToPortfolioAiV1", () => {
  it("preserves dashboard sector labels exactly instead of consolidating them", () => {
    expect(mapSectorToPortfolioAiV1("Fast Moving Consumer Goods", null).applicationSector).toBe("Fast Moving Consumer Goods")
    expect(mapSectorToPortfolioAiV1("FMCG", null).applicationSector).toBe("FMCG")
    expect(mapSectorToPortfolioAiV1("Consumer Staples", null).applicationSector).toBe("Consumer Staples")
  })

  it("keeps Pharma and Healthcare as separate application sectors", () => {
    expect(mapSectorToPortfolioAiV1("Pharma", null).applicationSector).toBe("Pharma")
    expect(mapSectorToPortfolioAiV1("Healthcare", null).applicationSector).toBe("Healthcare")
  })

  it("keeps Banking and Financial Services as separate application sectors", () => {
    expect(mapSectorToPortfolioAiV1("Banking", null).applicationSector).toBe("Banking")
    expect(mapSectorToPortfolioAiV1("Financial Services", null).applicationSector).toBe("Financial Services")
  })

  it("accepts broad dashboard labels as valid classifications without guessing a research profile", () => {
    const result = mapSectorToPortfolioAiV1("Consumer Services", "Hotels")
    expect(result.state).toBe("MAPPED")
    expect(result.applicationSector).toBe("Consumer Services")
    expect(result.proposedResearchProfileCode).toBeNull()
  })

  it("can propose a research profile without changing the dashboard sector", () => {
    const result = mapSectorToPortfolioAiV1("Information Technology", "IT Services")
    expect(result.applicationSector).toBe("Information Technology")
    expect(result.proposedResearchProfileCode).toBe("IT_SERVICES_TECH")
  })

  it("returns missing only when the shared enrichment sector is absent", () => {
    expect(mapSectorToPortfolioAiV1(null, null).state).toBe("MISSING")
  })
})
