import { describe, expect, it } from "vitest"
import {
  buildDomesticFormulationsPeerCohort,
  type PharmaDomesticPeerCandidate,
} from "./pharmaDomesticPeerCohortBuilder"

function reviewedAssignment(
  securityId: string,
  primarySubprofileCode:
    | "DOMESTIC_FORMULATIONS"
    | "GLOBAL_GENERICS"
    | "API_BULK_DRUGS"
    | "CDMO_CRAMS"
    | "BIOPHARMA_BIOSIMILARS",
) {
  return {
    securityId,
    profileCode: "PHARMA_V1" as const,
    primarySubprofileCode,
    assignmentVersion: 1,
    assignmentState: "REVIEWED" as const,
    effectiveFrom: "2026-01-01",
    effectiveTo: null,
    sourceReference: "TEST",
    reasonCode: "TEST",
    confidence: "HIGH" as const,
    reviewedBy: "reviewer",
    reviewedAt: "2026-01-01T00:00:00Z",
    secondaryExposures: [],
  }
}

describe("Domestic Formulations peer cohort builder", () => {
  it("includes only active securities with one resolved reviewed Domestic Formulations Primary", () => {
    const candidates: PharmaDomesticPeerCandidate[] = [
      {
        securityId: "TARGET",
        isActiveSecurity: true,
        assignments: [reviewedAssignment("TARGET", "DOMESTIC_FORMULATIONS")],
      },
      {
        securityId: "DOMESTIC_PEER",
        isActiveSecurity: true,
        assignments: [reviewedAssignment("DOMESTIC_PEER", "DOMESTIC_FORMULATIONS")],
      },
      {
        securityId: "GLOBAL_PEER",
        isActiveSecurity: true,
        assignments: [reviewedAssignment("GLOBAL_PEER", "GLOBAL_GENERICS")],
      },
    ]

    const result = buildDomesticFormulationsPeerCohort("TARGET", "2026-09-19", candidates)

    expect(result.eligiblePeerSecurityIds).toEqual(["DOMESTIC_PEER"])
    expect(result.excluded).toEqual([
      { securityId: "TARGET", reason: "TARGET_SECURITY" },
      { securityId: "GLOBAL_PEER", reason: "PRIMARY_MISMATCH" },
    ])
  })

  it("excludes inactive securities before assignment resolution", () => {
    const result = buildDomesticFormulationsPeerCohort("TARGET", "2026-09-19", [
      {
        securityId: "INACTIVE",
        isActiveSecurity: false,
        assignments: [reviewedAssignment("INACTIVE", "DOMESTIC_FORMULATIONS")],
      },
    ])

    expect(result.eligiblePeerSecurityIds).toEqual([])
    expect(result.excluded).toEqual([{ securityId: "INACTIVE", reason: "INACTIVE_SECURITY" }])
  })

  it("fails closed on provisional, disputed, missing or conflicting assignment state", () => {
    const provisional = {
      ...reviewedAssignment("PROVISIONAL", "DOMESTIC_FORMULATIONS"),
      assignmentState: "PROVISIONAL" as const,
      reviewedBy: null,
      reviewedAt: null,
    }

    const result = buildDomesticFormulationsPeerCohort("TARGET", "2026-09-19", [
      { securityId: "PROVISIONAL", isActiveSecurity: true, assignments: [provisional] },
      { securityId: "MISSING", isActiveSecurity: true, assignments: [] },
    ])

    expect(result.eligiblePeerSecurityIds).toEqual([])
    expect(result.excluded).toEqual([
      { securityId: "PROVISIONAL", reason: "SUBPROFILE_UNRESOLVED" },
      { securityId: "MISSING", reason: "SUBPROFILE_UNRESOLVED" },
    ])
  })

  it("preserves the unapproved minimum peer-count boundary", () => {
    const result = buildDomesticFormulationsPeerCohort("TARGET", "2026-09-19", [])
    expect(result.minimumPeerCountState).toBe("UNAPPROVED")
    expect(result.cohortScoreReady).toBe(false)
    expect(result.scoreExecutionEnabled).toBe(false)
  })
})
