import { describe, expect, it } from "vitest"
import type { PharmaSubprofileAssignment } from "./pharmaSubprofileAssignment"
import {
  buildPharmaG93NormalizedResearchModel,
  buildTorntpharmLegacySemanticSnapshot,
  buildTorntpharmNormalizedSemanticSnapshot,
} from "./pharmaG93NormalizedResearch"

function torntpharmAssignment(): PharmaSubprofileAssignment {
  return {
    securityId: "torn-security",
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "torn-reviewed",
    reasonCode: "reviewed",
    confidence: "HIGH",
    reviewedBy: "owner",
    reviewedAt: "2026-09-17T13:00:00Z",
    secondaryExposures: [
      {
        exposureCode: "GLOBAL_GENERICS",
        materiality: "MATERIAL",
        confidence: "MEDIUM",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "torn-global",
        reasonCode: "material",
        reviewedBy: "owner",
        reviewedAt: "2026-09-17T13:00:00Z",
      },
      {
        exposureCode: "CDMO_CRAMS",
        materiality: "EMERGING",
        confidence: "MEDIUM",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "torn-cdmo",
        reasonCode: "emerging",
        reviewedBy: "owner",
        reviewedAt: "2026-09-17T13:00:00Z",
      },
    ],
  }
}

function auropharmaAssignment(): PharmaSubprofileAssignment {
  return {
    securityId: "auro-security",
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "GLOBAL_GENERICS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "auro-reviewed",
    reasonCode: "reviewed",
    confidence: "HIGH",
    reviewedBy: "owner",
    reviewedAt: "2026-09-20T00:00:00Z",
    secondaryExposures: [
      {
        exposureCode: "API_BULK_DRUGS",
        materiality: "EMERGING",
        confidence: "HIGH",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "auro-api",
        reasonCode: "emerging",
        reviewedBy: "owner",
        reviewedAt: "2026-09-20T00:00:00Z",
      },
    ],
  }
}

describe("G9.3 reciprocal PHARMA_V1 normalization", () => {
  it("gives TORNTPHARM the reusable three-layer architecture", () => {
    const model = buildPharmaG93NormalizedResearchModel(
      "TORNTPHARM",
      torntpharmAssignment(),
      [],
      "2026-09-20",
    )

    expect(model.architecture.commonCore.profileCode).toBe("PHARMA_V1")
    expect(model.architecture.primary.subprofileCode).toBe("DOMESTIC_FORMULATIONS")
    expect(model.architecture.secondaryExposures).toEqual(expect.arrayContaining([
      expect.objectContaining({ exposureCode: "GLOBAL_GENERICS", mode: "EVIDENCE_OVERLAY" }),
      expect.objectContaining({ exposureCode: "CDMO_CRAMS", mode: "EMERGING_WATCH" }),
    ]))
  })

  it("gives AUROPHARMA shared methodology with a distinct NOT_ENGAGED overlay state", () => {
    const model = buildPharmaG93NormalizedResearchModel(
      "AUROPHARMA",
      auropharmaAssignment(),
      [],
      "2026-09-20",
    )

    expect(model.architecture.primary.subprofileCode).toBe("GLOBAL_GENERICS")
    expect(model.architecture.secondaryExposures).toEqual([
      expect.objectContaining({ exposureCode: "API_BULK_DRUGS", mode: "EMERGING_WATCH" }),
    ])
    expect(model.architecture.unresolvedExposures).toEqual([
      expect.objectContaining({ exposureCode: "BIOPHARMA_BIOSIMILARS" }),
    ])
    expect(model.materialOverlayState).toBe("NOT_ENGAGED")
    expect(model.methodology.find((item) => item.code === "G2")).toMatchObject({
      state: "NOT_ENGAGED",
    })
    expect(model.methodology.find((item) => item.code === "G7_P1")).toMatchObject({
      state: "NOT_ENGAGED",
    })
  })

  it("keeps TORNTPHARM semantic outputs unchanged across normalization", () => {
    const assignment = torntpharmAssignment()
    const before = buildTorntpharmLegacySemanticSnapshot(
      assignment,
      [],
      "2026-09-20",
    )
    const after = buildTorntpharmNormalizedSemanticSnapshot(
      assignment,
      [],
      "2026-09-20",
    )

    expect(after).toEqual(before)
  })

  it("keeps normalization read-only for scoring/recommendation/sizing", () => {
    for (const [symbol, assignment] of [
      ["TORNTPHARM", torntpharmAssignment()],
      ["AUROPHARMA", auropharmaAssignment()],
    ] as const) {
      const model = buildPharmaG93NormalizedResearchModel(
        symbol,
        assignment,
        [],
        "2026-09-20",
      )
      expect(model.scoreExecutionEnabled).toBe(false)
      expect(model.recommendationEnabled).toBe(false)
      expect(model.positionSizingEnabled).toBe(false)
    }
  })
})
