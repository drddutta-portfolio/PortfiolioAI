import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { PharmaGateJReferenceClassificationPanel } from "./PharmaGateJReferenceClassificationPanel"

describe("Gate J reference classification panel", () => {
  it("renders the ALIVUS G10.1 Checkpoint A lock without exposing a score", () => {
    render(<PharmaGateJReferenceClassificationPanel symbol="ALIVUS" />)

    expect(screen.getByText("Reference-company classification lock")).toBeInTheDocument()
    expect(screen.getByText("Alivus Life Sciences Limited")).toBeInTheDocument()
    expect(screen.getByText("API / Bulk Drugs")).toBeInTheDocument()
    expect(screen.getByText("CDMO / CRAMS")).toBeInTheDocument()
    expect(screen.getByText(/FY25: API 94% · CDMO 6%/)).toBeInTheDocument()
    expect(screen.getByText(/FY26: API 93% · CDMO 7%/)).toBeInTheDocument()
    expect(screen.getByText(/Score not started/)).toBeInTheDocument()
  })

  it("renders nothing for unrelated symbols", () => {
    const { container } = render(<PharmaGateJReferenceClassificationPanel symbol="TORNTPHARM" />)
    expect(container).toBeEmptyDOMElement()
  })
})
