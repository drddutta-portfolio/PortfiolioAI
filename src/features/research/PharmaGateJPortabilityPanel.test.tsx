import { render, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PharmaGateJPortabilityPanel } from "./PharmaGateJPortabilityPanel"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"

function resolution(primary: "GLOBAL_GENERICS" | "CDMO_CRAMS"): PharmaSubprofileResolution {
  return {
    status: "RESOLVED",
    profileCode: "PHARMA_V1",
    blocksReadiness: false,
    assignment: {
      securityId: "ARBITRARY_NEW_PHARMA_SECURITY",
      profileCode: "PHARMA_V1",
      primarySubprofileCode: primary,
      assignmentVersion: 1,
      assignmentState: "REVIEWED",
      effectiveFrom: "2026-01-01",
      effectiveTo: null,
      sourceReference: "G10_FINAL_UI_TEST",
      reasonCode: "REVIEWED",
      confidence: "HIGH",
      reviewedBy: "G10-FINAL",
      reviewedAt: "2026-09-21T00:00:00Z",
      secondaryExposures: [],
    },
  }
}

describe("Gate J final Pharma portability panel", () => {
  it("renders methodology routing for an arbitrary new Global Generics stock", () => {
    const { container } = render(
      <PharmaGateJPortabilityPanel assignmentResolution={resolution("GLOBAL_GENERICS")} />,
    )
    const view = within(container)

    expect(view.getByText("Gate J · G10-FINAL · Runtime portability")).toBeInTheDocument()
    expect(view.getByText("Pharma methodology routing")).toBeInTheDocument()
    expect(view.getByText("Global Generics")).toBeInTheDocument()
    expect(view.getByText("AUROPHARMA")).toBeInTheDocument()
    expect(view.getByText(/Validation anchor only/)).toBeInTheDocument()
    expect(view.getByText(/Any Pharma stock with a reviewed subprofile assignment/)).toBeInTheDocument()
  })

  it("routes an arbitrary new CDMO stock without requiring SYNGENE identity", () => {
    const { container } = render(
      <PharmaGateJPortabilityPanel assignmentResolution={resolution("CDMO_CRAMS")} />,
    )
    const view = within(container)

    expect(view.getByText("CDMO / CRAMS")).toBeInTheDocument()
    expect(view.getByText("SYNGENE")).toBeInTheDocument()
    expect(view.getByText("Portable by subprofile · Symbol-independent")).toBeInTheDocument()
  })

  it("fails closed when a new Pharma stock has no reviewed subprofile", () => {
    const { container } = render(
      <PharmaGateJPortabilityPanel assignmentResolution={null} />,
    )
    const view = within(container)

    expect(view.getByText("Subprofile review required")).toBeInTheDocument()
    expect(view.getByText("No methodology guessed")).toBeInTheDocument()
    expect(view.getByText(/no score, no Gate I recommendation and no persistence/)).toBeInTheDocument()
  })
})
