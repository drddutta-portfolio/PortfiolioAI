import { describe, expect, it } from "vitest"
import type { P7CurrentEvidenceSnapshot } from "../../data/p7CurrentIntelligenceRepository"
import { CANONICAL_ROUTE_ASSIGNMENT_AUTHORITY, CANONICAL_ROUTE_ASSIGNMENT_VERSION, resolveScoringProfile } from "./scoringProfileResolution"
import approvedCensus from "./fixtures/v13ApprovedRouteCensus.json"

export const canonicalFixture = (overrides: Partial<P7CurrentEvidenceSnapshot> = {}): P7CurrentEvidenceSnapshot => ({
  snapshotId: "snapshot", portfolioId: "portfolio", securityId: "security", asOfDate: "2026-10-05",
  snapshotStatus: "REVIEW_REQUIRED", profileCode: "BANK", subprofileCode: null,
  methodologyAuthority: "BANK_NBFC_STAGE_8_BANK_V1", methodologyVersion: "V1",
  classificationVersion: "classification", methodologyRole: "PRIMARY", assignmentId: "assignment",
  assignmentAuthority: CANONICAL_ROUTE_ASSIGNMENT_AUTHORITY, assignmentVersion: CANONICAL_ROUTE_ASSIGNMENT_VERSION,
  ...overrides,
})

describe("canonical route precedence", () => {
  it("resolves all 45 approved held profiles without a second taxonomy; preserves the one Pharma review exception", () => {
    let resolvedMembers = 0
    let reviewMembers = 0
    for (const row of approvedCensus) {
      const resolved = resolveScoringProfile("Banking", "Banks", "GENERAL", canonicalFixture({
        profileCode: row.profile_code, methodologyAuthority: row.methodology_authority,
        subprofileCode: row.profile_code === "PHARMA" ? "API_BULK_DRUGS" : null,
      }))
      expect(resolved.routeState).toBe("RESOLVED")
      expect(resolved.canonicalRoute?.profileCode).toBe(row.profile_code)
      expect(resolved.ruleProfile).not.toBe("GENERAL")
      resolvedMembers += row.profile_code === "PHARMA" ? row.subprofile_members : row.members
      reviewMembers += row.profile_code === "PHARMA" ? row.members - row.subprofile_members : 0
    }
    expect(approvedCensus).toHaveLength(45)
    expect(resolvedMembers).toBe(238)
    expect(reviewMembers).toBe(1)
  })
  it("uses the approved assignment ahead of conflicting Pharma classification and GENERAL assignment", () => {
    expect(resolveScoringProfile("Pharma", "Pharmaceuticals", "GENERAL", canonicalFixture())).toMatchObject({
      profileCode: "BANK_NBFC", profileSource: "CANONICAL_ASSIGNMENT", routeState: "RESOLVED",
      ruleProfile: "BANK_NBFC", engineState: "AVAILABLE", canonicalRoute: { profileCode: "BANK" },
    })
  })
  it.each(["RETAIL_COMMERCE", "TEXTILES_APPAREL", "TELECOM_OPERATOR", "JEWELLERY", "ENVIRONMENTAL_SERVICES", "IT_BPM_SERVICES"])("preserves approved %s without substituting a scoring engine", profileCode => {
    expect(resolveScoringProfile("Banking", "Banks", "GENERAL", canonicalFixture({ profileCode, methodologyAuthority: `P7_IC1_${profileCode}_METHODOLOGY_V1` }))).toMatchObject({
      profileCode, ruleProfile: null, routeState: "RESOLVED", methodologyState: "AVAILABLE", engineState: "PENDING_ADAPTER",
    })
  })
  it.each([{ assignmentAuthority: "unreviewed" }, { assignmentVersion: "new-unreviewed" }, { assignmentId: "" }, { snapshotId: "" }, { methodologyAuthority: "" }])("blocks invalid lineage rather than using GENERAL: %j", override => {
    expect(resolveScoringProfile("Banking", "Banks", "GENERAL", canonicalFixture(override))).toMatchObject({
      routeState: "REVIEW_REQUIRED", ruleProfile: null, scoringExecutionState: "BLOCKED",
    })
  })
  it.each([null, "INVENTED"])("requires reviewed Pharma primary subprofile (%s)", subprofileCode => {
    expect(resolveScoringProfile("Pharma", "Pharmaceuticals", "PHARMA_V1", canonicalFixture({ profileCode: "PHARMA", subprofileCode, methodologyAuthority: "PHARMA_V1_PLUS_REVIEWED_PRIMARY_SUBPROFILE" }))).toMatchObject({
      routeState: "REVIEW_REQUIRED", ruleProfile: null, reasonCode: "CANONICAL_PHARMA_PRIMARY_REVIEW_REQUIRED",
    })
  })
  it("recognizes approved NBFC methodology while preserving its pending adapter", () => {
    expect(resolveScoringProfile(null, null, "GENERAL", canonicalFixture({ profileCode: "NBFC_LENDING", methodologyAuthority: "P7_IC1_NBFC_LENDING_METHODOLOGY_V1" }))).toMatchObject({
      routeState: "RESOLVED", methodologyState: "AVAILABLE", engineState: "PENDING_ADAPTER", ruleProfile: null,
    })
  })
  it("does not execute an existing engine against another methodology version", () => {
    expect(resolveScoringProfile(null, null, null, canonicalFixture({ methodologyVersion: "V2" }))).toMatchObject({ routeState: "RESOLVED", engineState: "PENDING_ADAPTER", ruleProfile: null })
  })
})
