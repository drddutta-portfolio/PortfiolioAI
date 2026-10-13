import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import { ResultsPage } from "./ResultsPage"

beforeAll(() => {
  Object.defineProperty(Element.prototype, "scrollIntoView", { value: vi.fn(), configurable: true })
  it("renders banking template and switches demo chart metrics", () => {
    render(<ResultsPage />)
    const row = screen.getByText("HDFCBANK").closest("tr")
    const button = row?.querySelector("button")
    if (!button) throw new Error("Expected HDFCBANK result")
    fireEvent.click(button)
    expect(screen.getByRole("heading", { name: "Banking analysis" })).toBeInTheDocument()
    expect(screen.getByText(/Revenue must not substitute for NII/)).toBeInTheDocument()
    const metric = screen.getByRole("combobox", { name: "Chart metric" })
    fireEvent.change(metric, { target: { value: "eps" } })
    expect(screen.getByRole("heading", { name: "EPS — Last 6 Quarters" })).toBeInTheDocument()
  })

  it("shows pharma and fully closed context without fabricating evidence", () => {
    render(<ResultsPage />)
    const row = screen.getByText("AUROPHARMA").closest("tr")
    const firstAvailable = row?.querySelectorAll("button")[1]
    if (!firstAvailable) throw new Error("Expected an available demo result")
    fireEvent.click(firstAvailable)
    expect(screen.getByRole("heading", { name: "Pharmaceuticals analysis" })).toBeInTheDocument()
    expect(screen.getByText("Fully closed")).toBeInTheDocument()
    expect(screen.getByText("Publication time")).toBeInTheDocument()
    expect(screen.getByText("Not established")).toBeInTheDocument()
  })
})

afterEach(() => {
  cleanup()
})

describe("ResultsPage", () => {
  it("renders the R2 demo shell and keeps unavailable data explicit", () => {
    render(<ResultsPage />)
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument()
    expect(screen.getByText("R2 DEMO DATA")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Run Scan Now/i })).toBeDisabled()
    expect(screen.getByRole("tab", { name: /Annual Results/i })).toBeDisabled()
  })

  it("combines search and position filters", () => {
    render(<ResultsPage />)
    fireEvent.change(screen.getByPlaceholderText("Search stocks…"), { target: { value: "Auro" } })
    expect(screen.getByText("AUROPHARMA")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Current Holdings" }))
    expect(screen.getByText("No demonstration securities match the current filters.")).toBeInTheDocument()
  })

  it("updates the analysis panel when an available quarter is selected", () => {
    render(<ResultsPage />)
    const kvbRow = screen.getByText("KVB").closest("tr")
    expect(kvbRow).not.toBeNull()
    const buttons = kvbRow ? Array.from(kvbRow.querySelectorAll("button")) : []
    const q1Button = buttons[1]
    expect(q1Button).toBeDefined()
    if (!q1Button) throw new Error("Expected KVB Q1 FY27 result button")
    fireEvent.click(q1Button)
    expect(screen.getByRole("heading", { name: "KVB — Q1 FY27" })).toBeInTheDocument()
  })
})
