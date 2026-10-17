import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import { ResultsLivePage } from "./ResultsReferenceLivePage"

const mocks = vi.hoisted(() => ({
  usePortfolio: vi.fn(),
  load: vi.fn(),
  status: vi.fn(),
  start: vi.fn(),
  step: vi.fn(),
}))
vi.mock("../portfolio/usePortfolioView", () => ({ usePortfolioView: mocks.usePortfolio }))
vi.mock("./resultsSourceRepository", () => ({ loadResultsSourceInventory: mocks.load }))
vi.mock("./resultsScanRepository", () => ({
  getResultsScanStatus: mocks.status,
  startResultsScan: mocks.start,
  stepResultsScan: mocks.step,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("Results rolling-quarter navigator", () => {
  it("makes the bottom slider usable and synchronizes both directions with the Results table", () => {
    const stock = {
      securityId: "sample", symbol: "SAMPLE", company: "Sample Company",
      sector: "Manufacturing", industry: "Industrial Products", assetClass: "EQUITY",
      quantity: "10", averageCost: "100", currentPrice: "101", currentValue: "1010",
      unrealisedPnl: "10", realisedPnl: null,
    } as PortfolioPosition
    const view = {
      portfolio: { id: "example", currency: "INR" },
      openPositions: [stock], closedPositions: [],
    } as unknown as PortfolioViewModel
    mocks.usePortfolio.mockReturnValue({ portfolio: view, isLoading: false, error: null })
    mocks.load.mockResolvedValue([])
    mocks.status.mockResolvedValue({ lastScan: null, newResults: 0, run: null })
    render(<ResultsLivePage />)
    const matrix = document.querySelector<HTMLElement>(".results-matrix-shell")
    if (!matrix) throw new Error("Missing quarterly results matrix")
    const table = matrix.querySelector<HTMLTableElement>("table")
    if (!table) throw new Error("Missing quarterly results table")
    // More quarters must actually create horizontal overflow on desktop.
    expect(parseFloat(table.style.minWidth)).toBeGreaterThan(100)

    Object.defineProperties(matrix, {
      scrollWidth: { configurable: true, value: 2400 },
      clientWidth: { configurable: true, value: 1000 },
    })
    act(() => { window.dispatchEvent(new Event("resize")) })

    const slider = screen.getByRole("slider", { name: "Scroll quarterly results horizontally" })
    expect(slider).not.toBeDisabled()
    expect(slider).toHaveAttribute("max", "1400")

    fireEvent.change(slider, { target: { value: "700" } })
    expect(matrix.scrollLeft).toBe(700)

    act(() => {
      matrix.scrollLeft = 1200
      fireEvent.scroll(matrix)
    })
    expect((slider as HTMLInputElement).value).toBe("1200")

    fireEvent.click(screen.getByRole("button", { name: "Scroll towards older quarters" }))
    expect(matrix.scrollLeft).toBe(1400)
    fireEvent.click(screen.getByRole("button", { name: "Scroll towards latest quarters" }))
    expect(matrix.scrollLeft).toBe(700)
  })

  it("shows one custom financial tooltip without an overlapping browser title", () => {
    const stock = {
      securityId: "sample", symbol: "SAMPLE", company: "Sample Company",
      sector: "Manufacturing", industry: "Industrial Products", assetClass: "EQUITY",
      quantity: "10", averageCost: "100", currentPrice: "101", currentValue: "1010",
      unrealisedPnl: "10", realisedPnl: null,
    } as PortfolioPosition
    const view = {
      portfolio: { id: "example", currency: "INR" },
      openPositions: [stock], closedPositions: [],
    } as unknown as PortfolioViewModel
    mocks.usePortfolio.mockReturnValue({ portfolio: view, isLoading: false, error: null })
    mocks.load.mockResolvedValue([])
    mocks.status.mockResolvedValue({ lastScan: null, newResults: 0, run: null })
    render(<ResultsLivePage />)
    const cell = screen.getByRole("button", { name: /SAMPLE Q1 FY27/ })
    expect(cell.hasAttribute("title")).toBe(false)
    fireEvent.mouseEnter(cell)
    expect(screen.getAllByRole("tooltip")).toHaveLength(1)
    expect(screen.getByText("SAMPLE — Q1 FY27")).toBeInTheDocument()
    fireEvent.mouseLeave(cell)
    expect(screen.queryByRole("tooltip")).toBeNull()
    // The complete assessment reason is shown only after explicitly
    // selecting the quarter; it must not appear as a second hover tooltip.
    fireEvent.click(cell)
    expect(screen.getByText("Why this quarterly grade?")).toBeInTheDocument()
  })
})
