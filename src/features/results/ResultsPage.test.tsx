import { fireEvent, render, screen } from "@testing-library/react"
import { ResultsPage } from "./ResultsPage"

describe("ResultsPage", () => {
  it("renders the R1 demo shell and keeps unavailable data explicit", () => {
    render(<ResultsPage />)
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument()
    expect(screen.getByText("R1 DEMO DATA")).toBeInTheDocument()
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
