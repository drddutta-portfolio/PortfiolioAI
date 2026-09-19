import { describe, expect, it } from "vitest"
import type { PharmaGlobalGenericsPipelineEvidenceItem } from "./pharmaGlobalGenericsPipelineEvidenceContract"
import {
  PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE,
  combineGlobalGenericsPipelineScores,
} from "./pharmaGlobalGenericsPipelineCombinedScoreContract"

function event(
  productOrMolecule: string,
  geography: string,
  stage: PharmaGlobalGenericsPipelineEvidenceItem["stage"],
  eventDate: string,
  overrides: Partial<PharmaGlobalGenericsPipelineEvidenceItem> = {},
): PharmaGlobalGenericsPipelineEvidenceItem {
  return {
    productOrMolecule,
    geography,
    stage,
    eventDate,
    sourceType: "OFFICIAL_REGULATOR",
    materialityEstablished: true,
    economicRelevanceEstablished: true,
    evidenceReference: `${productOrMolecule}-${geography}-${eventDate}-${stage}`,
    ...overrides,
  }
}

describe("PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE", () => {
  it("is owner-approved but remains not active", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE.state).toBe("OWNER_APPROVED_NOT_ACTIVE")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE.combinedPipelineScoreReady).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE.activationApproved).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE.persistedScoreRunEnabled).toBe(false)
  })

  it("uses only the latest reviewed state per product/geography identity", () => {
    const result = combineGlobalGenericsPipelineScores([
      event("Molecule A", "US", "FILED_OR_SUBMITTED", "2026-01-01"),
      event("Molecule A", "US", "FINAL_APPROVAL", "2026-04-01"),
      event("Molecule A", "US", "LAUNCHED", "2026-08-01"),
      event("Molecule B", "US", "FINAL_APPROVAL", "2026-07-01"),
    ])

    expect(result.state).toBe("READY")
    expect(result.distinctPipelineIdentityCount).toBe(2)
    expect(result.latestIdentityStates).toEqual([
      {
        productOrMolecule: "Molecule A",
        geography: "US",
        latestEventDate: "2026-08-01",
        latestStage: "LAUNCHED",
        normalizedScore: 85,
        historicalEventCount: 3,
      },
      {
        productOrMolecule: "Molecule B",
        geography: "US",
        latestEventDate: "2026-07-01",
        latestStage: "FINAL_APPROVAL",
        normalizedScore: 70,
        historicalEventCount: 1,
      },
    ])
    expect(result.combinedScore).toBe(77.5)
  })

  it("treats the same molecule in different geographies as distinct identities", () => {
    const result = combineGlobalGenericsPipelineScores([
      event("Molecule A", "US", "LAUNCHED", "2026-08-01"),
      event("Molecule A", "EU", "FINAL_APPROVAL", "2026-08-01"),
      event("Molecule B", "US", "COMMERCIAL_TRACTION_CONFIRMED", "2026-08-01"),
    ])

    expect(result.state).toBe("READY")
    expect(result.distinctPipelineIdentityCount).toBe(3)
    expect(result.combinedScore).toBe(85)
  })

  it("blocks numeric aggregation when any latest identity state is adverse", () => {
    const result = combineGlobalGenericsPipelineScores([
      event("Molecule A", "US", "COMMERCIAL_TRACTION_CONFIRMED", "2026-08-01"),
      event("Molecule B", "US", "DELAYED_OR_BLOCKED", "2026-08-01"),
      event("Molecule C", "US", "FINAL_APPROVAL", "2026-08-01"),
    ])

    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.reason).toBe("LATEST_ADVERSE_STATE_PRESENT")
    expect(result.adverseIdentityCount).toBe(1)
    expect(result.combinedScore).toBeNull()
  })

  it("allows a later reviewed non-adverse state to supersede an older adverse lifecycle state for the same identity", () => {
    const result = combineGlobalGenericsPipelineScores([
      event("Molecule A", "US", "DELAYED_OR_BLOCKED", "2026-01-01"),
      event("Molecule A", "US", "FINAL_APPROVAL", "2026-08-01"),
      event("Molecule B", "US", "LAUNCHED", "2026-08-01"),
    ])

    expect(result.state).toBe("READY")
    expect(result.adverseIdentityCount).toBe(0)
    const moleculeAUs = result.latestIdentityStates.find(
      (item) => item.productOrMolecule === "Molecule A" && item.geography === "US",
    )
    expect(moleculeAUs?.historicalEventCount).toBe(2)
    expect(result.combinedScore).toBe(77.5)
  })

  it("fails closed when the latest date has contradictory stages for one identity", () => {
    const result = combineGlobalGenericsPipelineScores([
      event("Molecule A", "US", "FINAL_APPROVAL", "2026-08-01"),
      event("Molecule A", "US", "DELAYED_OR_BLOCKED", "2026-08-01"),
    ])

    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.reason).toBe("CONTRADICTORY_LATEST_STATE")
    expect(result.combinedScore).toBeNull()
  })

  it("fails closed if any event is ineligible for G6.20 normalization", () => {
    const result = combineGlobalGenericsPipelineScores([
      event("Molecule A", "US", "FINAL_APPROVAL", "2026-08-01"),
      event("Molecule B", "US", "LAUNCHED", "2026-08-01", { materialityEstablished: false }),
    ])

    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.reason).toBe("INELIGIBLE_EVENT_PRESENT")
    expect(result.combinedScore).toBeNull()
  })

  it("returns insufficient evidence for an empty event set", () => {
    expect(combineGlobalGenericsPipelineScores([])).toEqual({
      state: "INSUFFICIENT_EVIDENCE",
      combinedScore: null,
      distinctPipelineIdentityCount: 0,
      adverseIdentityCount: 0,
      latestIdentityStates: [],
      reason: "NO_ELIGIBLE_EVENTS",
    })
  })
})
