import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { ResultsLivePage } from "./ResultsLivePage"

const mock = vi.hoisted(() => ({ load: vi.fn(), usePortfolio: vi.fn() }))
vi.mock("./resultsSourceRepository", () => ({ loadResultsSourceInventory: mock.load }))
vi.mock("../portfolio/usePortfolioView", () => ({ usePortfolioView: mock.usePortfolio }))

function position(id: string, symbol: string, kind: "CURRENT" | "CLOSED", assetClass = "EQUITY"): PortfolioPosition {
  return {
    securityId: id, symbol, company: symbol, industry: symbol === "HDFCBANK" ? "Private Banks" : "IT Services",
    assetClass, quantity: kind === "CURRENT" ? "15" : "0", averageCost: "20.25",
    currentPrice: "24.5", currentValue: kind === "CURRENT" ? "367.5" : null,
    unrealisedPnl: "50", realisedPnl: kind === "CLOSED" ? "80" : null,
  } as PortfolioPosition
}
const view = {
  portfolio: { currency: "INR" },
  openPositions: [position("a", "HDFCBANK", "CURRENT"), position("etf", "TESTETF", "CURRENT", "ETF")],
  closedPositions: [position("b", "INFY", "CLOSED"), position("a", "HDFCBANK", "CLOSED")],
} as unknown as PortfolioViewModel

function observation(code: string, value: string, selected = false): ResultsSourceObservation {
  return {
    id: code, securityId: "a", code, value, selected, periodEnd: "2026-06-30",
    unit: "PERCENT", scope: "STANDALONE", publishedAt: "2026-07-04T00:00:00Z",
    source: "COMPANY_EXCHANGE_FILING", retrievedAt: "2026-07-10T00:00:00Z",
  }
}
beforeAll(() => { Object.defineProperty(Element.prototype, "scrollIntoView", { value: vi.fn(), configurable: true }) })
afterEach(() => { cleanup(); vi.clearAllMocks() })

describe("Results live approved visual contract", () => {
  it("retains the four-card approved R2 presentation with real holdings, not fixture data", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    render(<ResultsLivePage />)
    expect(await screen.findByText("2 stocks")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Annual Results/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Run Scan Now/ })).toBeDisabled()
    expect(screen.getByText("HDFCBANK")).toBeInTheDocument()
    expect(screen.getByText("INFY")).toBeInTheDocument()
    expect(screen.queryByText("TESTETF")).not.toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Portfolio Position" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Last 6 Quarters/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Key Metrics/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "AI Insight" })).toBeInTheDocument()
    expect(screen.queryByText(/R2 DEMO DATA/)).not.toBeInTheDocument()
  })

  it("displays existing unselected numbers in compact cells and metrics, without inventing grades", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([
      observation("ADVANCES_GROWTH_YOY", "15.4"),
      observation("DEPOSITS_GROWTH_YOY", "14.7"),
    ])
    render(<ResultsLivePage />)
    expect(await screen.findByRole("heading", { name: "Key Metrics (Q1 FY27)" })).toBeInTheDocument()
    const metrics = screen.getByRole("heading", { name: "Key Metrics (Q1 FY27)" }).closest("section")
    if (!metrics) throw new Error("Missing metrics card")
    expect(within(metrics).getByText("+15.4%")).toBeInTheDocument()
    expect(within(metrics).getByText("+14.7%")).toBeInTheDocument()
    expect(within(metrics).getAllByText("Review pending").length).toBe(2)
    expect(screen.getByText("Thesis impact: Not assessed")).toBeInTheDocument()
    const row = screen.getByText("HDFCBANK").closest("tr")
    expect(row).not.toBeNull()
    const q1Cell = row?.querySelector('button[aria-label*="Q1 FY27"]')
    expect(q1Cell).not.toBeNull()
    expect(q1Cell?.textContent).toContain("+15.4%")
    expect(q1Cell?.textContent).not.toContain("STRONG")
  })

  it("preserves closed-history search and filters without stale analysis", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    render(<ResultsLivePage />)
    expect(await screen.findByText("2 stocks")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Closed Positions" }))
    expect(screen.getByText("INFY")).toBeInTheDocument()
    expect(screen.queryByText("HDFCBANK")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Clear Filters" }))
    expect(screen.getByText("HDFCBANK")).toBeInTheDocument()
  })

  it("shows a real quarter label without duplicate Q4 FY26 labels", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    render(<ResultsLivePage />)
    expect(await screen.findByText("2 stocks")).toBeInTheDocument()
    const headers = screen.getAllByRole("columnheader")
    const labels = headers.slice(1).map((h) => h.textContent?.replace("(Latest completed) ↓", ""))
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toContain("Q2 FY27")
    expect(labels).toContain("Q1 FY27")
  })
})
