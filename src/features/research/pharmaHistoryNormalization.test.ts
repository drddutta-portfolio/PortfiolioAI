import { describe, expect, it } from "vitest"
import {
  derivePharmaQuarterlyOperatingMargin,
  normalizePharmaAnnualCfo,
  normalizePharmaAnnualRevenue,
  PHARMA_HISTORY_NORMALIZATION_CONTRACT,
} from "./pharmaHistoryNormalization"

describe("PHARMA history normalization", () => {
  it("normalizes validated annual revenue labels without using provider growth aggregates", () => {
    const result = normalizePharmaAnnualRevenue([
      { label: "Operating Rev. Ann.", value: "13979.73" },
      { label: "Rev. Ann. 1Y ago", value: "11835" },
      { label: "Rev. Ann. 2Y ago", value: "10456" },
      { label: "Rev. Ann. 3Y ago", value: "9665.29" },
      { label: "Rev. Ann. 3Y Growth %", value: "20.4" },
    ])

    expect(result.state).toBe("READY")
    expect(result.points.map((point) => point.period)).toEqual(["Y0", "Y1", "Y2", "Y3"])
    expect(result.points.map((point) => point.value)).toEqual(["13979.73", "11835", "10456", "9665.29"])
    expect(result.missingPeriods).toEqual(["Y4", "Y5"])
  })

  it("keeps missing annual CFO periods missing rather than coercing them to zero", () => {
    const result = normalizePharmaAnnualCfo([
      { label: "Cash from Operating Act. Ann. 1Y Ago", value: "2585.11" },
      { label: "Cash from Operating Act. Ann. 2Y Ago", value: null },
      { label: "Cash from Operating Act. Ann. 3Y Ago", value: "2368.13" },
    ])

    expect(result.state).toBe("INVALID")
    expect(result.points.map((point) => point.period)).toEqual(["Y1", "Y3"])
    expect(result.invalidLabels).toEqual(["Cash from Operating Act. Ann. 2Y Ago"])
    expect(result.points.some((point) => point.value === "0")).toBe(false)
  })

  it("derives OPM from matched quarterly operating profit and revenue with exact decimal arithmetic", () => {
    const result = derivePharmaQuarterlyOperatingMargin([
      { label: "Operating Profit Qtr", value: "1664" },
      { label: "Operating Rev. Qtr", value: "4921" },
      { label: "Operating Profit 1Q Ago", value: "1356" },
      { label: "Operating Rev. 1Q ago", value: "4197" },
      { label: "Operating Profit 2Q Ago", value: "1088" },
      { label: "Operating Rev. 2Q ago", value: "3303" },
      { label: "Operating Profit 3Q Ago", value: "1083" },
      { label: "Operating Rev. 3Q ago", value: "3302" },
      { label: "Operating Profit 4Q Ago", value: "1032" },
      { label: "Operating Rev. 4Q ago", value: "3178" },
      { label: "Operating Profit 5Q Ago", value: "1010" },
      { label: "Operating Rev. 5Q ago", value: "2959" },
      { label: "Operating Profit 6Q Ago", value: "914" },
      { label: "Operating Rev. 6Q ago", value: "2809" },
      { label: "Operating Profit 7Q Ago", value: "939" },
      { label: "Operating Rev. 7Q ago", value: "2889" },
    ])

    expect(result.state).toBe("READY")
    expect(result.points).toHaveLength(8)
    expect(result.points[0]).toMatchObject({
      period: "Q0",
      operatingProfit: "1664",
      operatingRevenue: "4921",
      marginPercent: "33.814266",
    })
    expect(result.missingPeriods).toEqual(["Q8"])
  })

  it("fails closed when operating revenue is zero or a matched period is missing", () => {
    const result = derivePharmaQuarterlyOperatingMargin([
      { label: "Operating Profit Qtr", value: "10" },
      { label: "Operating Rev. Qtr", value: "0" },
      { label: "Operating Profit 1Q Ago", value: "12" },
    ])

    expect(result.state).toBe("INVALID")
    expect(result.invalidPeriods).toEqual(["Q0"])
    expect(result.missingPeriods).toContain("Q1")
    expect(result.points).toHaveLength(0)
  })

  it("documents the validated provider tool and deterministic OPM ownership", () => {
    expect(PHARMA_HISTORY_NORMALIZATION_CONTRACT.providerTool).toBe("get_parameter_values_multi_stock")
    expect(PHARMA_HISTORY_NORMALIZATION_CONTRACT.rules.operatingMargin).toContain("PortfolioAI derives")
    expect(PHARMA_HISTORY_NORMALIZATION_CONTRACT.rules.missingData).toContain("never coerced to zero")
  })
})
