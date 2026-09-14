import { describe, expect, it } from "vitest"
import { researchProfileUiContract } from "./researchProfileUiContract"

const BANK_ONLY_CODES = [
  "ADVANCES_GROWTH_YOY",
  "DEPOSITS_GROWTH_YOY",
  "GROSS_NPA_PERCENT",
  "NET_NPA_PERCENT",
  "PBV_ADJUSTED_PROVIDER",
] as const

describe("researchProfileUiContract", () => {
  it("keeps BANK_NBFC presentation behavior isolated from PHARMA_V1", () => {
    const bank = researchProfileUiContract("BANK_NBFC")
    const pharma = researchProfileUiContract("PHARMA_V1")
    const bankSnapshotCodes = bank.snapshotGroups.flatMap((group) => group.codes)
    const pharmaSnapshotCodes = pharma.snapshotGroups.flatMap((group) => group.codes)

    for (const code of BANK_ONLY_CODES) {
      expect(bankSnapshotCodes).toContain(code)
      expect(pharmaSnapshotCodes).not.toContain(code)
    }
  })

  it("treats Pharma business durability as applicable but evidence-gated", () => {
    const pharma = researchProfileUiContract("PHARMA_V1")
    expect(pharma.notApplicableDimensions).not.toContain("BUSINESS_DURABILITY")
    expect(pharma.scoreSectionGroups.some((group) => group.codes.includes("BUSINESS_DURABILITY"))).toBe(true)
    expect(pharma.dimensionLabels.BUSINESS_DURABILITY).toBe("Business Durability")
  })

  it("uses Pharma-specific investor labels and compact ratings prominence", () => {
    const pharma = researchProfileUiContract("PHARMA_V1")
    expect(pharma.dimensionLabels.CASH_FLOW).toBe("Cash Quality")
    expect(pharma.dimensionLabels.BALANCE_SHEET_CREDIT).toBe("Financial Strength / Leverage")
    expect(pharma.dimensionLabels.RISK).toBe("Regulatory & Market Risk")
    expect(pharma.externalRatingsMode).toBe("COMPACT")
    expect(pharma.readinessPanel).toBe("PHARMA_V1")
  })

  it("registers the four PHARMA_V1 specialist research modules", () => {
    const pharma = researchProfileUiContract("PHARMA_V1")
    expect(pharma.refreshModules.map((module) => module.code)).toEqual([
      "PHARMA_CORE_FUNDAMENTALS",
      "PHARMA_BUSINESS_DURABILITY",
      "PHARMA_REGULATORY",
      "PHARMA_MARKET_VALUATION",
    ])
    expect(pharma.refreshModules.filter((module) => module.actionKind === "MARKET_HISTORY")).toHaveLength(1)
    expect(pharma.refreshModules.find((module) => module.code === "PHARMA_MARKET_VALUATION")?.actionKind).toBe("MARKET_HISTORY")
    expect(pharma.completeResearchRefreshMode).toBe("PROFILE_GATED")
    expect(researchProfileUiContract("BANK_NBFC").completeResearchRefreshMode).toBe("ENABLED")
  })

  it("uses the metric codes registered by the current PHARMA_V1 parent evidence contract", () => {
    const pharma = researchProfileUiContract("PHARMA_V1")
    const pharmaSnapshotCodes = pharma.snapshotGroups.flatMap((group) => group.codes)
    expect(pharmaSnapshotCodes).toContain("TOTAL_DEBT_ANNUAL")
    expect(pharmaSnapshotCodes).toContain("CASH_EQUIVALENTS_ANNUAL")
    expect(pharmaSnapshotCodes).toContain("NET_DEBT_EBITDA_ANNUAL")
    expect(pharmaSnapshotCodes).toContain("INTEREST_COVERAGE_ANNUAL")
    expect(pharmaSnapshotCodes).toContain("RND_EXPENSE_ANNUAL")
    expect(pharmaSnapshotCodes).toContain("RND_INTENSITY_PERCENT")
  })

  it("routes detailed Financials and Quality & Growth through Pharma-specific sections", () => {
    const pharma = researchProfileUiContract("PHARMA_V1")
    const financialCodes = pharma.financialWorkspaceSections.flatMap((section) => section.codes)
    const qualityGrowthCodes = pharma.qualityGrowthWorkspaceSections.flatMap((section) => section.codes)

    expect(pharma.financialWorkspaceSections.map((section) => section.title)).toEqual([
      "Earnings & operating performance",
      "Cash quality",
      "Capital efficiency",
      "Financial strength / leverage",
    ])
    expect(financialCodes).toContain("PAT_ATTRIBUTABLE_ANNUAL")
    expect(financialCodes).toContain("FREE_CASH_FLOW_ANNUAL")
    expect(financialCodes).toContain("NET_DEBT_EBITDA_ANNUAL")
    expect(qualityGrowthCodes).toContain("RND_INTENSITY_PERCENT")
    expect(qualityGrowthCodes).toContain("INDIA_REVENUE_ANNUAL")
    expect(qualityGrowthCodes).not.toContain("ADVANCES_GROWTH_YOY")
    expect(qualityGrowthCodes).not.toContain("GROSS_NPA_PERCENT")
  })

  it("falls back safely for unknown profiles without inventing a sector contract", () => {
    const fallback = researchProfileUiContract("UNREGISTERED_PROFILE")
    expect(fallback.profileCode).toBe("GENERAL")
    expect(fallback.readinessPanel).toBe("NONE")
    expect(fallback.refreshModules).toHaveLength(0)
    expect(fallback.financialWorkspaceSections).toHaveLength(0)
    expect(fallback.qualityGrowthWorkspaceSections).toHaveLength(0)
  })
})
