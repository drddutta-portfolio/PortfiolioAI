import { describe, expect, it } from "vitest"
import { OUTSIDE_PHARMA_V1_CANDIDATES, PHARMA_SUBPROFILE_CANDIDATE_REGISTRY } from "./pharmaSubprofileCandidateRegistry"
import { PHARMA_SUBPROFILE_CODES } from "./pharmaSubprofileAssignment"

describe("fixture-only Pharma subprofile candidate registry", () => {
  it("contains 25 unique provisional Pharma candidates across all five subprofiles", () => {
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY).toHaveLength(25)
    expect(new Set(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.map((candidate) => candidate.symbol)).size).toBe(25)
    expect(new Set(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.map((candidate) => candidate.proposedPrimarySubprofileCode))).toEqual(new Set(PHARMA_SUBPROFILE_CODES))
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.every((candidate) => candidate.reviewState === "PROVISIONAL")).toBe(true)
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.every((candidate) => candidate.proposedEffectiveFrom === null)).toBe(true)
  })

  it("keeps the TORNTPHARM pilot separate from canonical assignment records", () => {
    const candidate = PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.find((entry) => entry.symbol === "TORNTPHARM")
    expect(candidate).toEqual(expect.objectContaining({ reviewState: "PROVISIONAL", proposedEffectiveFrom: null }))
    expect(candidate).not.toHaveProperty("securityId")
    expect(candidate).not.toHaveProperty("assignmentVersion")
  })

  it("keeps ZYDUSWELL outside PHARMA_V1 pending consumer-health review", () => {
    expect(PHARMA_SUBPROFILE_CANDIDATE_REGISTRY.some((candidate) => candidate.symbol === "ZYDUSWELL")).toBe(false)
    expect(OUTSIDE_PHARMA_V1_CANDIDATES).toEqual([expect.objectContaining({ symbol: "ZYDUSWELL", reviewState: "CONSUMER_HEALTH_REVIEW" })])
  })
})
