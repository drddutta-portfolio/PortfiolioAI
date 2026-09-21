import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PharmaGateJReferenceClassificationPanel } from "./PharmaGateJReferenceClassificationPanel"

describe("Gate J reference classification panel", () => {
  it("renders the completed ALIVUS G10.1 lock and Checkpoint B result", () => {
    render(<PharmaGateJReferenceClassificationPanel symbol="ALIVUS" />)

    expect(screen.getByText("Reference-company classification lock")).toBeInTheDocument()
    expect(screen.getByText("Alivus Life Sciences Limited")).toBeInTheDocument()
    expect(screen.getByText("API / Bulk Drugs")).toBeInTheDocument()
    expect(screen.getByText("CDMO / CRAMS")).toBeInTheDocument()
    expect(screen.getByText(/FY25: API 94% · CDMO 6%/)).toBeInTheDocument()
    expect(screen.getByText(/FY26: API 93% · CDMO 7%/)).toBeInTheDocument()
    expect(screen.getByText("API methodology → score → Gate I recommendation")).toBeInTheDocument()
    expect(screen.getByText("76.7225")).toBeInTheDocument()
    expect(screen.getByText("SATELLITE CANDIDATE")).toBeInTheDocument()
  })

  it("renders the AUROPHARMA G10.2 re-confirmation without a Checkpoint B score", () => {
    render(<PharmaGateJReferenceClassificationPanel symbol="AUROPHARMA" />)

    expect(screen.getByText("Reference-company classification re-confirmation")).toBeInTheDocument()
    expect(screen.getByText("Aurobindo Pharma Limited")).toBeInTheDocument()
    expect(screen.getByText("Global Generics")).toBeInTheDocument()
    expect(screen.getByText("API / Bulk Drugs")).toBeInTheDocument()
    expect(screen.getByText(/Biopharma \/ Biosimilars remains REVIEW_REQUIRED/)).toBeInTheDocument()
    expect(screen.getByText(/FY25: Global Generics ≥ 73.04% · API 13.63%/)).toBeInTheDocument()
    expect(screen.getByText(/FY26: Global Generics ≥ 73.46% · API 12.03%/)).toBeInTheDocument()
    expect(screen.getByText(/Score not computable · methodology incomplete/)).toBeInTheDocument()
    expect(screen.queryByText("API methodology → score → Gate I recommendation")).not.toBeInTheDocument()
  })

  it("renders nothing for unrelated symbols", () => {
    const { container } = render(<PharmaGateJReferenceClassificationPanel symbol="TORNTPHARM" />)
    expect(container).toBeEmptyDOMElement()
  })
})
