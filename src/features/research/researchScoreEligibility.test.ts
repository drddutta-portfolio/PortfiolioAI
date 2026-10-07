import { describe, expect, it } from "vitest"
import { buildProgramBR6ScoringPresentation } from "./programBR6Presentation"
import { isQualifiedResearchScore } from "./researchScoreEligibility"
import type { SecurityScoringSnapshot } from "./scoringTypes"
const ready: SecurityScoringSnapshot = { profileCode: "BANK_NBFC", profileName: "Bank", profileSource: "CANONICAL_ASSIGNMENT", routeState: "RESOLVED", methodologyState: "AVAILABLE", scoringExecutionState: "AVAILABLE", engineState: "AVAILABLE", canonicalEvidenceState: "FRESH", runState: "COMPLETE", scoreRunId: "current-run", overallScore: 82, previewMode: false, modelName: "test", modelStatus: "DRAFT", asOfDate: null, evidenceCoverage: 1, scoreReadyCoverage: 1, evidenceConfidence: null, dimensions: [], ratings: [] }
describe("shared research score display eligibility", () => {
  it.each([0, 82])("preserves a qualified score of %s", overallScore => {
    expect(isQualifiedResearchScore({ ...ready, overallScore }, false, null)).toBe(true)
  })
  it.each([
    { scoringExecutionState: "PENDING_ADAPTER" }, { scoringExecutionState: "BLOCKED" }, { engineState: "BLOCKED" },
    { routeState: "REVIEW_REQUIRED" }, { routeState: "UNAVAILABLE" }, { methodologyState: "NOT_APPLICABLE" },
    { methodologyState: "REVIEW_REQUIRED" }, { methodologyState: "METHODOLOGY_NOT_AVAILABLE" },
    { canonicalEvidenceState: "STALE" }, { canonicalEvidenceState: "CONFLICTING" }, { canonicalEvidenceState: "MISSING" }, { canonicalEvidenceState: "REVIEW_REQUIRED" },
    { previewMode: true }, { scoreRunId: null }, { runState: "PARTIAL" }, { overallScore: null }, { overallScore: NaN }, { overallScore: Infinity },
  ] satisfies Partial<SecurityScoringSnapshot>[])("suppresses retained numeric values for %j", override => {
    expect(isQualifiedResearchScore({ ...ready, ...override }, false, null)).toBe(false)
  })
  it("does not expose a retained score during loading or read failure", () => {
    expect(isQualifiedResearchScore(ready, true, null)).toBe(false)
    expect(isQualifiedResearchScore(ready, false, "Read failed")).toBe(false)
  })
  it("respects the existing Pharma primary-assignment prerequisites", () => {
    const pharma = { ...ready, profileCode: "PHARMA_V1" }
    const prerequisites = buildProgramBR6ScoringPresentation({ securityId: "s1", snapshot: pharma, pharmaResolution: null })
    expect(isQualifiedResearchScore(pharma, false, null, prerequisites)).toBe(false)
  })
})
