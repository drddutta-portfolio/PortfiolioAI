import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS,
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW,
} from "./torntpharmGateH2BusinessDurabilityReview"

describe("TORNTPHARM H2 Business Durability owner-approved lock", () => {
  it("maps the approved independent AIOCD-derived Brand / Therapy cross-check to STRONG / 75", () => {
    const brand = TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.find(
      (row) => row.component === "BRAND_THERAPY_LEADERSHIP",
    )
    expect(brand?.reviewedState).toBe("STRONG")
    expect(brand?.normalizedScore).toBe(75)
    expect(brand?.contradictionState).toBe("NONE_IDENTIFIED")
    expect(brand?.sourceLineage).toContain("https://www.indiaratings.co.in/pressrelease/80734")
    expect(brand?.sourceLineage).toContain("https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf")
  })

  it("keeps the other three reviewed Business Durability components at STRONG / 75", () => {
    for (const component of [
      "FIELD_FORCE_PRODUCTIVITY",
      "RND_PRODUCTIVITY",
      "PIPELINE_CORPORATE_EXECUTION",
    ] as const) {
      const row = TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.find(
        (item) => item.component === component,
      )
      expect(row?.reviewedState).toBe("STRONG")
      expect(row?.normalizedScore).toBe(75)
    }
  })

  it("uses the frozen 35/25/20/20 aggregator to produce Business Durability = 75", () => {
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.readyComponentCount).toBe(4)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.requiredComponentCount).toBe(4)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.allComponentsScoreReady).toBe(true)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.combinedScore).toBe(75)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.blockerCodes).toEqual([])
  })

  it("records the bounded evidence-source decision without enabling a licensed provider call or H3 execution", () => {
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.licensedCrossCheckAcceptance)
      .toBe("INDEPENDENT_AIOCD_DERIVED_REPORT_PLUS_CURRENT_ISSUER_AIOCD_PHARMATRAC_TABLE")
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.licensedProviderCallPerformed).toBe(false)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.providerCallAuthorized).toBe(false)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.persistedScoreRunEnabled).toBe(false)
  })
})
