import { describe, expect, it } from "vitest"
import {
  buildPharmaGateJFinalPortabilityStatus,
  PHARMA_GATE_J_METHOD_AUTHORITIES,
} from "./pharmaGateJFinalPortability"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileCode,
  PharmaSubprofileResolution,
} from "./pharmaSubprofileAssignment"

function resolved(
  securityId: string,
  primarySubprofileCode: PharmaSubprofileCode,
  secondaryExposures: PharmaSubprofileAssignment["secondaryExposures"] = [],
): PharmaSubprofileResolution {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    blocksReadiness: false,
    assignment: {
      securityId,
      profileCode: "PHARMA_V1",
      primarySubprofileCode,
      assignmentVersion: 1,
      assignmentState: "REVIEWED",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      sourceReference: "G10_FINAL_PORTABILITY_TEST",
      reasonCode: "REVIEWED_TEST_ASSIGNMENT",
      confidence: "HIGH",
      reviewedBy: "G10-FINAL",
      reviewedAt: "2026-09-21T00:00:00Z",
      secondaryExposures,
    },
  }
}

describe("Gate J G10-FINAL Pharma portability authority", () => {
  it("covers all five Pharma subprofiles without symbol-specific runtime selection", () => {
    const codes = Object.keys(PHARMA_GATE_J_METHOD_AUTHORITIES).sort()
    expect(codes).toEqual([
      "API_BULK_DRUGS",
      "BIOPHARMA_BIOSIMILARS",
      "CDMO_CRAMS",
      "DOMESTIC_FORMULATIONS",
      "GLOBAL_GENERICS",
    ])
    expect(Object.values(PHARMA_GATE_J_METHOD_AUTHORITIES).every(
      (item) => item.symbolSpecificRuntimeRequired === false,
    )).toBe(true)
  })

  it.each([
    ["NEWDOM", "DOMESTIC_FORMULATIONS"],
    ["NEWAPI", "API_BULK_DRUGS"],
    ["NEWGLOBAL", "GLOBAL_GENERICS"],
    ["NEWBIO", "BIOPHARMA_BIOSIMILARS"],
    ["NEWCDMO", "CDMO_CRAMS"],
  ] as const)("resolves methodology authority for arbitrary future stock %s", (securityId, primary) => {
    const result = buildPharmaGateJFinalPortabilityStatus(
      resolved(securityId, primary),
      "2026-09-21",
    )
    expect(result.state).toBe("PORTABLE_METHOD_AUTHORITY_RESOLVED")
    if (result.state !== "PORTABLE_METHOD_AUTHORITY_RESOLVED") throw new Error("unreachable")
    expect(result.primarySubprofile).toBe(primary)
    expect(result.methodologyAuthority.subprofileCode).toBe(primary)
    expect(result.methodologyAuthority.symbolSpecificRuntimeRequired).toBe(false)
  })

  it("keeps Material Overlay and Emerging Watch contextual without second score authority", () => {
    const result = buildPharmaGateJFinalPortabilityStatus(
      resolved("NEWPHARMA", "DOMESTIC_FORMULATIONS", [
        {
          exposureCode: "GLOBAL_GENERICS",
          materiality: "MATERIAL",
          confidence: "HIGH",
          assignmentState: "REVIEWED",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          sourceReference: "G10_FINAL_TEST",
          reasonCode: "MATERIAL_TEST",
          reviewedBy: "G10-FINAL",
          reviewedAt: "2026-09-21T00:00:00Z",
        },
        {
          exposureCode: "CDMO_CRAMS",
          materiality: "EMERGING",
          confidence: "MEDIUM",
          assignmentState: "REVIEWED",
          effectiveFrom: "2026-01-01",
          effectiveTo: null,
          sourceReference: "G10_FINAL_TEST",
          reasonCode: "EMERGING_TEST",
          reviewedBy: "G10-FINAL",
          reviewedAt: "2026-09-21T00:00:00Z",
        },
      ]),
      "2026-09-21",
    )
    expect(result.state).toBe("PORTABLE_METHOD_AUTHORITY_RESOLVED")
    if (result.state !== "PORTABLE_METHOD_AUTHORITY_RESOLVED") throw new Error("unreachable")
    expect(result.materialOverlays).toEqual(["GLOBAL_GENERICS"])
    expect(result.emergingWatches).toEqual(["CDMO_CRAMS"])
    expect(result.secondIndependentStockScoreAllowed).toBe(false)
    expect(result.hiddenRenormalizationAllowed).toBe(false)
  })

  it("fails closed for a new Pharma stock without a reviewed subprofile assignment", () => {
    const result = buildPharmaGateJFinalPortabilityStatus(null, "2026-09-21")
    expect(result.state).toBe("BLOCKED_SUBPROFILE_REVIEW")
    expect(result.primarySubprofile).toBeNull()
    expect(result.methodologyAuthority).toBeNull()
    expect(result.scoreExecutionAllowed).toBe(false)
    expect(result.recommendationExecutionAllowed).toBe(false)
  })

  it("keeps persistence disabled for every resolved methodology authority", () => {
    for (const primary of Object.keys(PHARMA_GATE_J_METHOD_AUTHORITIES) as PharmaSubprofileCode[]) {
      const result = buildPharmaGateJFinalPortabilityStatus(
        resolved(`FUTURE_${primary}`, primary),
        "2026-09-21",
      )
      expect(result.scorePersistenceEnabled).toBe(false)
      expect(result.recommendationPersistenceEnabled).toBe(false)
    }
  })
})
