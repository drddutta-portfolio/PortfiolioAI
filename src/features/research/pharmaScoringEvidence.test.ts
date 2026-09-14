import { describe, expect, it } from "vitest"
import { assessPharmaV1Evidence, pharmaProfileForCanonicalSector, resolveScoringRuleProfile, type PharmaScoringObservation } from "./pharmaScoringEvidence"

const FUTURE = "2099-12-31T00:00:00Z"
const row = (metric_code: string, period_end: string, numeric_value = 100): PharmaScoringObservation => ({ metric_code, period_end, numeric_value, evidence_status: "AVAILABLE", fresh_until: FUTURE })

describe("PHARMA_V1 scoring evidence adapter", () => {
  it("routes the canonical Pharma sector to PHARMA_V1 without treating Healthcare as Pharma", () => {
    expect(pharmaProfileForCanonicalSector("Pharma")).toBe("PHARMA_V1")
    expect(pharmaProfileForCanonicalSector("Healthcare")).toBeNull()
    expect(pharmaProfileForCanonicalSector("Banking")).toBeNull()
  })

  it("loads PHARMA_V1 rules instead of silently falling back to GENERAL", () => {
    expect(resolveScoringRuleProfile("PHARMA_V1")).toBe("PHARMA_V1")
    expect(resolveScoringRuleProfile("BANK_NBFC")).toBe("BANK_NBFC")
    expect(resolveScoringRuleProfile("IT_TECH")).toBe("GENERAL")
  })

  it("keeps five matched OPM quarters partial against the eight-quarter minimum", () => {
    const rows = [0,1,2,3,4].flatMap((i) => [row("OPERATING_REVENUE_QUARTER", `202${i}-03-31`), row("OPERATING_PROFIT_QUARTER", `202${i}-03-31`, 20)])
    const result = assessPharmaV1Evidence("PHARMA_OPERATING_MARGIN_HISTORY", rows, 0)
    expect(result).toMatchObject({ observedCount: 5, minimumCount: 8, contractSatisfied: false })
    expect(result?.evidenceFraction).toBeCloseTo(0.625)
  })

  it("requires three annual operating-revenue observations for the revenue-history contract", () => {
    const rows = [row("REVENUE_ANNUAL", "2026-03-31")]
    expect(assessPharmaV1Evidence("PHARMA_REVENUE_GROWTH_HISTORY", rows, 0)).toMatchObject({ observedCount: 1, minimumCount: 3, contractSatisfied: false })
  })

  it("does not allow CFO history alone to satisfy cash conversion", () => {
    const rows = [2022,2023,2024,2025,2026].map((year) => row("CFO_ANNUAL", `${year}-03-31`))
    const result = assessPharmaV1Evidence("PHARMA_CASH_CONVERSION_HISTORY", rows, 0)
    expect(result?.contractSatisfied).toBe(false)
    expect(result?.observedCount).toBe(0)
    expect(result?.evidenceFraction).toBeCloseTo(1 / 3)
  })

  it("requires both PAT and EPS histories", () => {
    const rows = [2024,2025,2026].map((year) => row("NET_PROFIT_ANNUAL", `${year}-03-31`))
    const result = assessPharmaV1Evidence("PHARMA_PAT_EPS_HISTORY", rows, 0)
    expect(result?.contractSatisfied).toBe(false)
    expect(result?.evidenceFraction).toBeCloseTo(0.5)
  })

  it("recognizes ownership history as partial evidence rather than zero evidence", () => {
    const rows = [2025, 2026].flatMap((year) => [
      row("SHAREHOLDING_PROMOTER_PERCENT", `${year}-06-30`),
      row("SHAREHOLDING_FII_FPI_PERCENT", `${year}-06-30`),
      row("SHAREHOLDING_DII_PERCENT", `${year}-06-30`),
    ])
    const result = assessPharmaV1Evidence("PHARMA_OWNERSHIP_GOVERNANCE", rows, 0)
    expect(result).toMatchObject({ observedCount: 2, minimumCount: 4, contractSatisfied: false })
    expect(result?.evidenceFraction).toBeCloseTo(0.5)
  })

  it("recognizes current valuation inputs while keeping the full valuation contract partial", () => {
    const rows = [row("PE_TTM", "2026-09-14"), row("PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT", "2026-09-14")]
    const result = assessPharmaV1Evidence("PHARMA_VALUATION_CONTEXT", rows, 0)
    expect(result).toMatchObject({ observedCount: 2, minimumCount: 4, contractSatisfied: false })
    expect(result?.evidenceFraction).toBeCloseTo(0.5)
  })

  it("ignores stale and conflicting observations", () => {
    const rows: PharmaScoringObservation[] = [
      { ...row("REVENUE_ANNUAL", "2024-03-31"), evidence_status: "CONFLICTING" },
      { ...row("REVENUE_ANNUAL", "2025-03-31"), fresh_until: "2020-01-01T00:00:00Z" },
      row("REVENUE_ANNUAL", "2026-03-31"),
    ]
    expect(assessPharmaV1Evidence("PHARMA_REVENUE_GROWTH_HISTORY", rows, Date.parse("2026-09-14T00:00:00Z"))?.observedCount).toBe(1)
  })
})
