import { describe, expect, it } from "vitest"
import {
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS,
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW,
} from "./torntpharmGateH2BusinessDurabilityReview"

describe("TORNTPHARM H2 Business Durability review candidate", () => {
  it("keeps licensed Brand / Therapy Leadership fail-closed", () => {
    const brand = TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.find(
      (row) => row.component === "BRAND_THERAPY_LEADERSHIP",
    )
    expect(brand?.reviewedState).toBe("REVIEW_REQUIRED")
    expect(brand?.normalizedScore).toBeNull()
  })

  it("uses three directly disclosed field-force / India-revenue periods", () => {
    const fieldForce = TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.find(
      (row) => row.component === "FIELD_FORCE_PRODUCTIVITY",
    )
    expect(fieldForce?.reviewedState).toBe("STRONG")
    expect(fieldForce?.normalizedScore).toBe(75)
  })

  it("maps reviewed R&D and pipeline evidence through the approved rubric", () => {
    const rnd = TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.find(
      (row) => row.component === "RND_PRODUCTIVITY",
    )
    const pipeline = TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.find(
      (row) => row.component === "PIPELINE_CORPORATE_EXECUTION",
    )
    expect(rnd?.reviewedState).toBe("STRONG")
    expect(rnd?.normalizedScore).toBe(75)
    expect(pipeline?.reviewedState).toBe("STRONG")
    expect(pipeline?.normalizedScore).toBe(75)
  })

  it("keeps the whole dimension non-numeric until all four components are ready", () => {
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.readyComponentCount).toBe(3)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.requiredComponentCount).toBe(4)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.allComponentsScoreReady).toBe(false)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.combinedScore).toBeNull()
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.providerCallAuthorized).toBe(false)
    expect(TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.scoreExecutionEnabled).toBe(false)
  })
})
