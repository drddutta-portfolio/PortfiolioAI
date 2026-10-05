import { render, screen, cleanup } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import { ResearchScorecardPanel } from "./ResearchScorecardPanel"
const blocked: SecurityScoringSnapshot = {
  profileCode: "BANK_NBFC", profileName: "Bank", profileSource: "CANONICAL_ASSIGNMENT", methodologyState: "AVAILABLE",
  scoringExecutionState: "BLOCKED", modelName: "model", modelStatus: "BLOCKED", runState: null, overallScore: null,
  evidenceCoverage: null, scoreReadyCoverage: null, evidenceConfidence: null, asOfDate: null, dimensions: [], ratings: [], previewMode: false,
}
afterEach(cleanup)
describe("Research fail-closed rendering", () => {
  it("shows evidence blocking without a numeric score or investment opinion", () => {
    render(<ResearchScorecardPanel snapshot={blocked} isLoading={false} error={null} />)
    expect(screen.getByText("Methodology resolved · scoring blocked")).toBeTruthy()
    expect(screen.queryByText("Overall stock score")).toBeNull()
  })
  it("keeps missing adapters distinct from unresolved routes", () => {
    render(<ResearchScorecardPanel snapshot={{ ...blocked, profileCode: "RETAIL_COMMERCE", profileName: "Retail commerce", scoringExecutionState: "PENDING_ADAPTER" }} isLoading={false} error={null} />)
    expect(screen.getByText("Sector methodology available")).toBeTruthy()
    expect(screen.queryByText("Overall stock score")).toBeNull()
  })
})
