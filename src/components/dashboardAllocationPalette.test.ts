import { describe, expect, it } from "vitest"
import { MARKET_CAP_COLORS } from "./dashboardAllocationPalette"

describe("Dashboard market-cap palette", () => {
  it("keeps the approved semantic colors distinct and stable", () => {
    expect(MARKET_CAP_COLORS).toEqual({
      "Small Cap": "#2F7D57",
      "Large Cap": "#8FC56A",
      "Mid Cap": "#4F86C6",
      ETF: "#D9A441",
      Unclassified: "#7B8794",
    })
    expect(new Set(Object.values(MARKET_CAP_COLORS))).toHaveLength(5)
  })
})
