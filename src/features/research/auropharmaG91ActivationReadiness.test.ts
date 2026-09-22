import { describe, expect, it } from "vitest"
import {
  buildAuropharmaG91ActivationReadinessContract,
  buildAuropharmaG91AssignmentCandidate,
} from "./auropharmaG91ActivationReadiness"

describe("AUROPHARMA G9.1 activation-readiness contract", () => {
  it("keeps activation layers independent", () => {
    const contract = buildAuropharmaG91ActivationReadinessContract(
      "auropharma-security",
      [],
      "2026-09-20",
    )

    expect(contract.parentProfile.state).toBe("READY")
    expect(contract.primaryAuthority.state).toBe("READY_FOR_ACTIVATION")
    expect(contract.secondaryAuthority.state).toBe("READY_EMERGING")
    expect(contract.unresolvedAuthority.state).toBe("REVIEW_REQUIRED")
    expect(contract.numericScoring.state).toBe("BLOCKED_METHODOLOGY")
    expect(contract.recommendation.state).toBe("BLOCKED_UPSTREAM_SCORING")
    expect(contract.positionSizing.state).toBe("BLOCKED_UPSTREAM_RECOMMENDATION")
  })

  it("re-confirms role-aware readiness on the G9.1 persistence candidate", () => {
    const contract = buildAuropharmaG91ActivationReadinessContract(
      "auropharma-security",
      [],
      "2026-09-20",
    )

    expect(contract.readinessRoleAwareness.confirmed).toBe(true)
    expect(contract.readinessRoleAwareness.interpretationScope).toBe(
      "COMPANY_ACTIVE_ASSIGNMENT_ROLE",
    )
    expect(contract.readinessRoleAwareness.denominatorPrimarySubprofile).toBe(
      "GLOBAL_GENERICS",
    )
    expect(contract.readinessRoleAwareness.excludedEmergingSubprofiles).toEqual([
      "API_BULK_DRUGS",
    ])
    expect(contract.readinessRoleAwareness.primaryRequirementCount).toBeGreaterThan(0)
    expect(contract.readinessRoleAwareness.emergingRequirementCount).toBe(0)
  })

  it("creates the exact non-persisted assignment candidate for G9.2 review", () => {
    const candidate = buildAuropharmaG91AssignmentCandidate("auropharma-security")

    expect(candidate.profileCode).toBe("PHARMA_V1")
    expect(candidate.primarySubprofileCode).toBe("GLOBAL_GENERICS")
    expect(candidate.assignmentState).toBe("REVIEWED")
    expect(candidate.confidence).toBe("HIGH")
    expect(candidate.effectiveFrom).toBe("2026-03-31")
    expect(candidate.secondaryExposures).toHaveLength(1)
    expect(candidate.secondaryExposures[0]).toMatchObject({
      exposureCode: "API_BULK_DRUGS",
      materiality: "EMERGING",
      assignmentState: "REVIEWED",
    })
    expect(
      candidate.secondaryExposures.some(
        (item) => item.exposureCode === "BIOPHARMA_BIOSIMILARS",
      ),
    ).toBe(false)
  })

  it("keeps Biosimilars unresolved rather than activation-eligible", () => {
    const contract = buildAuropharmaG91ActivationReadinessContract(
      "auropharma-security",
      [],
      "2026-09-20",
    )

    expect(contract.unresolvedAuthority).toEqual({
      subprofileCode: "BIOPHARMA_BIOSIMILARS",
      state: "REVIEW_REQUIRED",
      activeAssignmentRowAllowed: false,
    })
  })

  it("does not persist or activate scoring/recommendation/sizing", () => {
    const contract = buildAuropharmaG91ActivationReadinessContract(
      "auropharma-security",
      [],
      "2026-09-20",
    )

    expect(contract.canonicalAssignmentPersisted).toBe(false)
    expect(contract.productionMutationEnabled).toBe(false)
    expect(contract.scoreExecutionEnabled).toBe(false)
    expect(contract.recommendationPersistenceEnabled).toBe(false)
    expect(contract.positionSizingPersistenceEnabled).toBe(false)
  })
})
