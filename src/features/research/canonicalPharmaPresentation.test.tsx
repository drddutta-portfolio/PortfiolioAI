import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PHARMA_SUBPROFILE_CODES } from "./pharmaSubprofileAssignment"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import type { SecurityResearch } from "./types"
const legacy = vi.hoisted(() => vi.fn(() => ({ data: null, error: null, isLoading: false })))
vi.mock("./usePharmaSubprofileResolution", () => ({ usePharmaSubprofileResolution: legacy }))
import { PharmaSubprofileSummary } from "./PharmaSubprofileSummary"
import { PharmaResearchWorkspacePanel } from "./PharmaResearchWorkspacePanel"
import { buildProgramBR6ScoringPresentation } from "./programBR6Presentation"
const snapshot = (subprofileCode: string | null, overrides: Partial<SecurityScoringSnapshot> = {}): SecurityScoringSnapshot => ({
  profileCode: "PHARMA_V1", profileName: "Pharma", profileSource: "CANONICAL_ASSIGNMENT", routeState: "RESOLVED", methodologyState: "AVAILABLE", scoringExecutionState: "BLOCKED", canonicalEvidenceState: "MISSING", modelName: "model", modelStatus: "BLOCKED", runState: null, overallScore: null, evidenceCoverage: null, scoreReadyCoverage: null, evidenceConfidence: null, asOfDate: "2026-10-08", dimensions: [], ratings: [], canonicalRoute: { profileCode: "PHARMA", subprofileCode, assignmentAuthority: "canonical-authority", assignmentVersion: "version-preserved", assignmentId: "canonical-id", snapshotId: "selected-id", asOfDate: "2026-10-08", methodologyAuthority: "pharma-approved", methodologyVersion: "V1", classificationVersion: "actual-classification" }, ...overrides,
})
const research: SecurityResearch = { securityId: "test", companyName: "Test", sector: "Pharma", industry: "Pharmaceuticals", marketCapCategory: null, freshUntil: null, state: "REVIEW_REQUIRED", metrics: [], documents: [] }
afterEach(() => { cleanup(); legacy.mockClear() })
describe("canonical Pharma consistency", () => {
  it.each(PHARMA_SUBPROFILE_CODES)("uses %s in header, workspace and R6 despite missing legacy rows", primary => {
    const selected = snapshot(primary)
    render(<><PharmaSubprofileSummary snapshot={selected} isLoading={false} error={null} /><PharmaResearchWorkspacePanel securityId="test" symbol="TEST" research={research} snapshot={selected} /></>)
    expect(screen.getAllByText(new RegExp(PHARMA_SUBPROFILE_CONTRACTS[primary].displayName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toHaveLength(3)
    expect(screen.queryByText(/Awaiting reviewed assignment/)).not.toBeInTheDocument()
    expect(legacy).not.toHaveBeenCalled()
    const r6 = buildProgramBR6ScoringPresentation({ securityId: "test", snapshot: selected, pharmaResolution: null })
    expect(r6).toMatchObject({ methodologyRole: primary, assignmentId: "canonical-id", assignmentVersion: "version-preserved", classificationVersion: "actual-classification", score: null, canScore: false })
  })
  it.each([null, "UNKNOWN"])("does not qualify a missing/unknown primary %s", primary => {
    const selected = snapshot(primary)
    render(<PharmaSubprofileSummary snapshot={selected} isLoading={false} error={null} />)
    expect(screen.getByText(/Awaiting reviewed assignment/)).toBeInTheDocument()
    expect(buildProgramBR6ScoringPresentation({ securityId: "test", snapshot: selected, pharmaResolution: null }).canScore).toBe(false)
  })
  it("does not resolve a review-required route or promote a legacy score", () => {
    render(<PharmaSubprofileSummary snapshot={snapshot("CDMO_CRAMS", { routeState: "REVIEW_REQUIRED" })} isLoading={false} error={null} />)
    expect(screen.getByText(/Awaiting reviewed assignment/)).toBeInTheDocument()
    const r6 = buildProgramBR6ScoringPresentation({ securityId: "test", snapshot: snapshot("CDMO_CRAMS", { scoringExecutionState: "AVAILABLE", canonicalEvidenceState: "FRESH", runState: "COMPLETE", scoreRunId: "legacy-score", overallScore: 99 }), pharmaResolution: null })
    expect(r6).toMatchObject({ score: null, canScore: false, blockers: ["CANONICAL_PHARMA_SCORE_ASSIGNMENT_BINDING_UNPROVEN"] })
  })
})
