import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import { ResearchAssignmentSummary } from "./ResearchAssignmentSummary"
const snapshot: SecurityScoringSnapshot = {
  profileCode: "PHARMA_V1", profileName: "Pharma", profileSource: "CANONICAL_ASSIGNMENT", routeState: "RESOLVED",
  modelName: "test", modelStatus: "DRAFT", runState: null, overallScore: null, evidenceCoverage: null, scoreReadyCoverage: null, evidenceConfidence: null, asOfDate: null, dimensions: [], ratings: [],
  canonicalRoute: { profileCode: "PHARMA", subprofileCode: "DOMESTIC_FORMULATIONS", methodologyAuthority: "approved-method", methodologyVersion: "V1", assignmentAuthority: "approved-assignment", assignmentVersion: "V2", assignmentId: "assignment-1", snapshotId: "snapshot-1", asOfDate: "2026-10-07" },
}
afterEach(cleanup)
describe("canonical research assignment detail", () => {
  it("shows canonical subprofile and assignment lineage separately from classification", () => {
    render(<ResearchAssignmentSummary snapshot={snapshot} isLoading={false} error={null} />)
    expect(screen.getByText(/Research profile:/).closest("p")).toHaveTextContent("PHARMA")
    expect(screen.getByText(/Research subprofile:/).closest("p")).toHaveTextContent("DOMESTIC_FORMULATIONS")
    expect(screen.getByText(/Selected snapshot:/)).toHaveTextContent("snapshot-1 · as of 2026-10-07")
    expect(screen.getByText(/Macro-economic sector/).closest("p")).toHaveTextContent("Unavailable in the current shared classification projection")
  })
  it("does not invent lineage for legacy or unresolved presentation", () => {
    render(<ResearchAssignmentSummary snapshot={null} isLoading={false} error={null} />)
    expect(screen.getByText(/Research profile:/).closest("p")).toHaveTextContent("Unresolved")
    expect(screen.getByText(/No canonical assignment lineage supplied/)).toBeInTheDocument()
  })
  it.each(["loading", "error"])("exposes %s rather than stale assignment data", state => {
    render(<ResearchAssignmentSummary snapshot={snapshot} isLoading={state === "loading"} error={state === "error" ? "Read failed" : null} />)
    expect(screen.queryByText(/Selected snapshot:/)).not.toBeInTheDocument()
    expect(screen.getByRole(state === "loading" ? "status" : "alert")).toBeInTheDocument()
  })
})
