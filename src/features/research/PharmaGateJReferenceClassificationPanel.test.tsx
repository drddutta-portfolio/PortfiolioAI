import { render, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PharmaGateJReferenceClassificationPanel } from "./PharmaGateJReferenceClassificationPanel"

describe("Gate J reference classification panel", () => {
  it("renders the completed ALIVUS G10.1 lock and Checkpoint B result", () => {
    const { container } = render(<PharmaGateJReferenceClassificationPanel symbol="ALIVUS" />)
    const view = within(container)

    expect(view.getByText("Reference-company classification lock")).toBeInTheDocument()
    expect(view.getByText("Alivus Life Sciences Limited")).toBeInTheDocument()
    expect(view.getByText("API / Bulk Drugs")).toBeInTheDocument()
    expect(view.getByText("CDMO / CRAMS")).toBeInTheDocument()
    expect(view.getByText(/FY25: API 94% · CDMO 6%/)).toBeInTheDocument()
    expect(view.getByText(/FY26: API 93% · CDMO 7%/)).toBeInTheDocument()
    expect(view.getByText("API methodology → score → Gate I recommendation")).toBeInTheDocument()
    expect(view.getByText("76.7225")).toBeInTheDocument()
    expect(view.getByText("SATELLITE CANDIDATE")).toBeInTheDocument()
    expect(view.queryByText("Global Generics methodology completion candidate")).not.toBeInTheDocument()
  })

  it("renders the AUROPHARMA G10.2 re-confirmation and final fail-closed Checkpoint B result", () => {
    const { container } = render(<PharmaGateJReferenceClassificationPanel symbol="AUROPHARMA" />)
    const view = within(container)

    expect(view.getByText("Reference-company classification re-confirmation")).toBeInTheDocument()
    expect(view.getByText("Aurobindo Pharma Limited")).toBeInTheDocument()
    expect(view.getByText("Global Generics")).toBeInTheDocument()
    expect(view.getAllByText("API / Bulk Drugs").length).toBeGreaterThan(0)
    expect(view.getByText(/Biopharma \/ Biosimilars remains REVIEW_REQUIRED/)).toBeInTheDocument()
    expect(view.getByText(/FY25: Global Generics ≥ 73.04% · API 13.63%/)).toBeInTheDocument()
    expect(view.getByText(/FY26: Global Generics ≥ 73.46% · API 12.03%/)).toBeInTheDocument()
    expect(view.getByText(/Score not computable · methodology incomplete/)).toBeInTheDocument()
    expect(view.getByText("Global Generics controlled-expansion result")).toBeInTheDocument()
    expect(view.getByText("Checkpoint B complete · Fail-closed outcome")).toBeInTheDocument()
    expect(view.getByText("Reference-relative median")).toBeInTheDocument()
    expect(view.getAllByText("MANDATORY BLOCKER").length).toBeGreaterThanOrEqual(4)
    expect(view.queryByText("API methodology → score → Gate I recommendation")).not.toBeInTheDocument()
  })

  it("renders the BIOCON G10.3 classification lock and fail-closed Checkpoint B result", () => {
    const { container } = render(<PharmaGateJReferenceClassificationPanel symbol="BIOCON" />)
    const view = within(container)

    expect(view.getByText("Reference-company classification lock")).toBeInTheDocument()
    expect(view.getByText("Biocon Limited")).toBeInTheDocument()
    expect(view.getByText("Biopharma / Biosimilars")).toBeInTheDocument()
    const materialOverlayCard = view.getByText("Material Overlay").closest("div")
    expect(materialOverlayCard).not.toBeNull()
    expect(materialOverlayCard).toHaveTextContent("Global Generics")
    expect(materialOverlayCard).toHaveTextContent("CDMO / CRAMS")
    expect(view.getByText(/FY25: Biosimilars 58% · Generics 19% · CRDMO 23%/)).toBeInTheDocument()
    expect(view.getByText(/FY26: Biosimilars 60% · Generics 18% · CRDMO 22%/)).toBeInTheDocument()
    expect(view.getByText("Biosimilars controlled-expansion result")).toBeInTheDocument()
    expect(view.getByText("Checkpoint B candidate · Fail-closed outcome")).toBeInTheDocument()
    expect(view.getByText("Biosimilars-specific")).toBeInTheDocument()
    expect(view.getByText("SCORE NOT COMPUTABLE")).toBeInTheDocument()
    expect(view.getAllByText("MANDATORY BLOCKER").length).toBeGreaterThanOrEqual(5)
    expect(view.getByText(/AUROPHARMA/)).toBeInTheDocument()
  })

  it("renders nothing for unrelated symbols", () => {
    const { container } = render(<PharmaGateJReferenceClassificationPanel symbol="TORNTPHARM" />)
    expect(container).toBeEmptyDOMElement()
  })
})
