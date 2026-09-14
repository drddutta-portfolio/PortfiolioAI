import { describe, expect, it } from "vitest"
import { mapSectorToPortfolioAiV1 } from "./sectorResearchMapping"

describe("mapSectorToPortfolioAiV1", () => {
  it("maps equivalent FMCG labels to one canonical sector", () => {
    expect(mapSectorToPortfolioAiV1("Fast Moving Consumer Goods", null).canonicalSectorCode).toBe("FMCG")
    expect(mapSectorToPortfolioAiV1("FMCG", null).canonicalSectorCode).toBe("FMCG")
    expect(mapSectorToPortfolioAiV1("Consumer Staples", null).canonicalSectorCode).toBe("FMCG")
  })

  it("maps pharma and healthcare source labels to the same canonical sector", () => {
    expect(mapSectorToPortfolioAiV1("Pharma", null).canonicalSectorCode).toBe("PHARMA_HEALTHCARE")
    expect(mapSectorToPortfolioAiV1("Healthcare", null).canonicalSectorCode).toBe("PHARMA_HEALTHCARE")
  })

  it("maps energy and power families separately", () => {
    expect(mapSectorToPortfolioAiV1("Oil Gas & Consumable Fuels", null).canonicalSectorCode).toBe("OIL_GAS_ENERGY")
    expect(mapSectorToPortfolioAiV1("Renewable Energy", null).canonicalSectorCode).toBe("POWER_UTILITIES")
  })

  it("does not guess ambiguous broad labels", () => {
    const result = mapSectorToPortfolioAiV1("Consumer Services", "Hotels")
    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.canonicalSectorCode).toBeNull()
    expect(result.proposedResearchProfileCode).toBeNull()
  })

  it("keeps banking research subprofile unresolved at sector-only granularity", () => {
    const result = mapSectorToPortfolioAiV1("Banking", null)
    expect(result.canonicalSectorCode).toBe("BANKING_FINANCIAL_SERVICES")
    expect(result.proposedResearchProfileCode).toBeNull()
  })

  it("returns missing when source sector is absent", () => {
    expect(mapSectorToPortfolioAiV1(null, null).state).toBe("MISSING")
  })
})
