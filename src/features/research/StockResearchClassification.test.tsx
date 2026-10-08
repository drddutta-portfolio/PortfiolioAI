import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { StockResearchClassification } from "./StockResearchClassification"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"

const snapshot: SecurityScoringSnapshot = {
  profileCode: "PHARMA_V1", profileName: "Pharma", profileSource: "CANONICAL_ASSIGNMENT", routeState: "RESOLVED",
  modelName: "test", modelStatus: "DRAFT", runState: null, overallScore: null, evidenceCoverage: null, scoreReadyCoverage: null, evidenceConfidence: null, asOfDate: null, dimensions: [], ratings: [],
  canonicalEvidenceState: "MISSING", engineState: "PENDING_ADAPTER",
  canonicalRoute: { profileCode: "PHARMA", subprofileCode: "DOMESTIC_FORMULATIONS", methodologyAuthority: "approved-method", methodologyVersion: "V1", assignmentAuthority: "approved-assignment", assignmentVersion: "V2", assignmentId: "assignment-1", snapshotId: "snapshot-1", asOfDate: "2026-10-07" },
}
afterEach(cleanup)
describe("Industry-first shared identity", () => {
  it("separates industry, sector, unknown Basic Industry, assignment and readiness", () => {
    render(<StockResearchClassification industry="Pharmaceuticals & Biotechnology" sector="Healthcare" snapshot={snapshot} isLoading={false} error={null} />)
    const section = screen.getByRole("region", { name: "Industry and research assignment" })
    expect(section.querySelector("p")).toHaveTextContent("Industry: Pharmaceuticals & Biotechnology")
    expect(screen.getByText("Basic Industry:").closest("p")).toHaveTextContent("Unavailable")
    expect(screen.getByText("Sector context:").closest("p")).toHaveTextContent("Healthcare")
    expect(screen.getByText("Classification verification:").closest("p")).toHaveTextContent("Unavailable")
    expect(screen.getByText("Research assignment:").closest("p")).toHaveTextContent("RESOLVED")
    expect(screen.getByText("Evidence state:").closest("p")).toHaveTextContent("MISSING")
    expect(screen.getByText("Assessment engine:").closest("p")).toHaveTextContent("PENDING ADAPTER")
  })
  it.each(Object.values(PHARMA_SUBPROFILE_CONTRACTS))("shows the selected $displayName without reclassifying the business", contract => {
    const selected = { ...snapshot, canonicalRoute: { ...snapshot.canonicalRoute!, subprofileCode: contract.subprofileCode } }
    render(<StockResearchClassification industry="Pharmaceuticals" sector="Healthcare" snapshot={selected} isLoading={false} error={null} />)
    expect(screen.getByText("Primary subprofile:").closest("p")).toHaveTextContent(contract.displayName)
    expect(screen.getByText("Basic Industry:").closest("p")).not.toHaveTextContent(contract.displayName)
  })
  it("does not expose a primary from an unresolved assignment", () => {
    render(<StockResearchClassification industry={null} sector={null} snapshot={{ ...snapshot, routeState: "REVIEW_REQUIRED" }} isLoading={false} error={null} />)
    expect(screen.getByText("Primary subprofile:").closest("p")).toHaveTextContent("Awaiting reviewed assignment")
  })
  it.each(["loading", "error"])("hides retained assignment and readiness during %s", state => {
    render(<StockResearchClassification industry="Banks" sector="Financial Services" snapshot={snapshot} isLoading={state === "loading"} error={state === "error" ? "Read failed" : null} />)
    expect(screen.getByText("Research assignment:").closest("p")).not.toHaveTextContent("RESOLVED")
    expect(screen.getByText("Evidence state:").closest("p")).not.toHaveTextContent("MISSING")
    expect(screen.getByText("Primary subprofile:").closest("p")).not.toHaveTextContent("Domestic Formulations")
  })
})
