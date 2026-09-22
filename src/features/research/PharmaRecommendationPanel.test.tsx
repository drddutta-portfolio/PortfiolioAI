import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { buildAuropharmaG91AssignmentCandidate } from "./auropharmaG91ActivationReadiness"
import { PharmaRecommendationPanel } from "./PharmaRecommendationPanel"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileResolution,
} from "./pharmaSubprofileAssignment"

function resolved(assignment: PharmaSubprofileAssignment): PharmaSubprofileResolution {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    assignment,
    blocksReadiness: false,
  }
}

function tornAssignment(): PharmaSubprofileAssignment {
  return {
    securityId: "torn-security",
    profileCode: "PHARMA_V1",
    primarySubprofileCode: "DOMESTIC_FORMULATIONS",
    assignmentVersion: 1,
    assignmentState: "REVIEWED",
    effectiveFrom: "2026-03-31",
    effectiveTo: null,
    sourceReference: "GATE_I3_PANEL_TEST_TORN_ASSIGNMENT",
    reasonCode: "GATE_I3_PANEL_TEST",
    confidence: "HIGH",
    reviewedBy: "GATE_I3_PANEL_TEST",
    reviewedAt: "2026-09-21T00:00:00Z",
    secondaryExposures: [
      {
        exposureCode: "GLOBAL_GENERICS",
        materiality: "MATERIAL",
        confidence: "HIGH",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "GATE_I3_PANEL_TEST_GLOBAL",
        reasonCode: "GATE_I3_PANEL_TEST",
        reviewedBy: "GATE_I3_PANEL_TEST",
        reviewedAt: "2026-09-21T00:00:00Z",
      },
      {
        exposureCode: "CDMO_CRAMS",
        materiality: "EMERGING",
        confidence: "HIGH",
        assignmentState: "REVIEWED",
        effectiveFrom: "2026-03-31",
        effectiveTo: null,
        sourceReference: "GATE_I3_PANEL_TEST_CDMO",
        reasonCode: "GATE_I3_PANEL_TEST",
        reviewedBy: "GATE_I3_PANEL_TEST",
        reviewedAt: "2026-09-21T00:00:00Z",
      },
    ],
  }
}

describe("PharmaRecommendationPanel Gate I3", () => {
  afterEach(cleanup)

  it("shows the TORNTPHARM deterministic role separately from the user-selected role", () => {
    render(<PharmaRecommendationPanel
      securityId="torn-security"
      symbol="TORNTPHARM"
      assignmentResolution={resolved(tornAssignment())}
    />)

    expect(screen.getByRole("heading", { name: "PHARMA_V1 recommendation detail" })).toBeInTheDocument()
    expect(screen.getAllByText("Satellite candidate").length).toBeGreaterThan(0)
    expect(screen.getByText("75.1575")).toBeInTheDocument()
    expect(screen.getByText("Core workspace")).toBeInTheDocument()
    expect(screen.getByText("7/7 applicable floors passed")).toBeInTheDocument()
    expect(screen.getByText(/Valuation is below the PHARMA_V1 neutral anchor/u)).toBeInTheDocument()
    expect(screen.getByText(/PortfolioAI suggested research role ≠ your selected portfolio role in the core Decision Workspace/u)).toBeInTheDocument()
    expect(screen.getByText("No recommendation row · no weight or action bias")).toBeInTheDocument()
  })

  it("shows AUROPHARMA fail-closed without a fabricated score", () => {
    render(<PharmaRecommendationPanel
      securityId="auro-security"
      symbol="AUROPHARMA"
      assignmentResolution={resolved(buildAuropharmaG91AssignmentCandidate("auro-security"))}
    />)

    expect(screen.getAllByText("Insufficient").length).toBeGreaterThan(0)
    expect(screen.getByText("Not computable")).toBeInTheDocument()
    expect(screen.getByText("No score reconstruction")).toBeInTheDocument()
    expect(screen.getByText(/Global Generics Primary scoring methodology is incomplete/u)).toBeInTheDocument()
  })

  it("does not render a Gate I3 reference panel for an out-of-scope symbol", () => {
    const { container } = render(<PharmaRecommendationPanel
      securityId="other-security"
      symbol="OTHERPHARMA"
      assignmentResolution={resolved({ ...tornAssignment(), securityId: "other-security" })}
    />)
    expect(container).toBeEmptyDOMElement()
  })
})
