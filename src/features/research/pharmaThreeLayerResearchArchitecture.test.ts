import { describe, expect, it } from "vitest"
import { buildPharmaThreeLayerResearchArchitecture } from "./pharmaThreeLayerResearchArchitecture"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"

const assignment: PharmaSubprofileAssignment = {
  securityId: "AUROPHARMA_TEST",
  profileCode: "PHARMA_V1",
  primarySubprofileCode: "GLOBAL_GENERICS",
  assignmentVersion: 1,
  assignmentState: "REVIEWED",
  effectiveFrom: "2026-03-31",
  effectiveTo: null,
  sourceReference: "G8.1",
  reasonCode: "G8_1_REVIEWED_ARCHITECTURE",
  confidence: "HIGH",
  reviewedBy: "G8.1_OWNER_VALIDATED",
  reviewedAt: "2026-09-19T18:30:00Z",
  secondaryExposures: [{
    exposureCode: "API_BULK_DRUGS",
    materiality: "EMERGING",
    confidence: "HIGH",
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "G8.1",
    reasonCode: "ECONOMIC_SHARE_5_TO_LT_15_TWO_PERIODS",
    reviewedBy: "G8.1_OWNER_VALIDATED",
    reviewedAt: "2026-09-19T18:30:00Z",
  }],
}

describe("PHARMA_V1 three-layer research architecture", () => {
  it("always composes common Pharma core + Primary + secondary exposure layers", () => {
    const result = buildPharmaThreeLayerResearchArchitecture(
      assignment,
      [],
      "2026-09-19",
      [{ exposureCode: "BIOPHARMA_BIOSIMILARS", reasonCode: "NO_REVENUE_OR_PROFIT_SHARE" }],
    )

    expect(result.commonCore.profileCode).toBe("PHARMA_V1")
    expect(result.commonCore.requirementCount).toBeGreaterThan(0)
    expect(result.primary.subprofileCode).toBe("GLOBAL_GENERICS")
    expect(result.secondaryExposures).toHaveLength(1)
    expect(result.secondaryExposures[0]?.exposureCode).toBe("API_BULK_DRUGS")
    expect(result.secondaryExposures[0]?.mode).toBe("EMERGING_WATCH")
    expect(result.unresolvedExposures[0]?.exposureCode).toBe("BIOPHARMA_BIOSIMILARS")
  })

  it("keeps raw evidence company scoped and interpretation assignment/role scoped", () => {
    const result = buildPharmaThreeLayerResearchArchitecture(
      assignment,
      [],
      "2026-09-19",
    )
    expect(result.rawEvidenceScope).toBe("SECURITY_COMPANY")
    expect(result.interpretationScope).toBe("COMPANY_ACTIVE_ASSIGNMENT_ROLE")
    expect(result.scoreExecutionEnabled).toBe(false)
  })
})
