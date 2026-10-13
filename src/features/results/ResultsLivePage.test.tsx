import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import { ResultsLivePage } from "./ResultsLivePage"

const mock = vi.hoisted(() => ({
  load: vi.fn(),
  usePortfolio: vi.fn(),
}))
vi.mock("./resultsSourceRepository", () => ({ loadResultsSourceInventory: mock.load }))
vi.mock("../portfolio/usePortfolioView", () => ({ usePortfolioView: mock.usePortfolio }))

function position(id: string, symbol: string, kind: "CURRENT" | "CLOSED", assetClass = "EQUITY") {
  return { securityId: id, symbol, company: symbol, assetClass, industry: "IT Services", quantity: kind === "CURRENT" ? "15.0000" : "0", averageCost: "20.25", currentValue: kind === "CURRENT" ? "330.25" : null, unrealisedPnl: null, realisedPnl: null } as PortfolioPosition
}

const view = {
  portfolio: { currency: "INR" },
  openPositions: [position("a","TCS","CURRENT"), position("etf","TESTETF","CURRENT","ETF")],
  closedPositions: [position("b","INFY","CLOSED"), position("a","TCS","CLOSED")],
} as unknown as PortfolioViewModel

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe("ResultsLivePage R3 boundary", () => {
  it("uses canonical equity membership, excludes ETFs, and preserves exited equities", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    render(<ResultsLivePage/>)
    expect(await screen.findByText("2 equities")).toBeInTheDocument()
    expect(screen.getByText("TCS")).toBeInTheDocument()
    expect(screen.getByText("INFY")).toBeInTheDocument()
    expect(screen.queryByText("TESTETF")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Closed Positions" }))
    expect(screen.queryByText("TCS")).not.toBeInTheDocument()
    expect(screen.getByText("INFY")).toBeInTheDocument()
  })

  it("fails closed for unselected source data while revealing review state", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([{ id: "obs1", securityId: "a", code: "OPERATING_REVENUE_QUARTER",
      periodEnd: "2026-06-30", value: "123456.78", unit: "Cr", source: "TRENDLYNE_MCP",
      scope: "UNKNOWN", publishedAt: null, retrievedAt: "2026-07-20T00:00:00Z", selected: false }])
    render(<ResultsLivePage/>)
    expect(await screen.findByText("Review required")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Review required"))
    expect(screen.getByText(/No selected quarterly financial observation/)).toBeInTheDocument()
    expect(screen.queryByText("123456.78")).not.toBeInTheDocument()
  })

  it("shows explicit failure when evidence inventory cannot load", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockRejectedValue(new Error("Database read rejected"))
    render(<ResultsLivePage/>)
    expect(await screen.findByRole("alert")).toHaveTextContent("Database read rejected")
    expect(screen.getByText("TCS")).toBeInTheDocument()
  })
})
