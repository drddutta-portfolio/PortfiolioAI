import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { PortfolioPosition, PortfolioViewModel } from "../portfolio/types"
import type { ResultsSourceObservation } from "./resultsSourceRepository"
import { ResultsLivePage } from "./ResultsLivePage"

const mock = vi.hoisted(() => ({ load: vi.fn(), usePortfolio: vi.fn(), status: vi.fn(), start: vi.fn(), step: vi.fn() }))
vi.mock("./resultsSourceRepository", () => ({ loadResultsSourceInventory: mock.load }))
vi.mock("./resultsScanRepository", () => ({ getResultsScanStatus: mock.status, startResultsScan: mock.start, stepResultsScan: mock.step }))
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
  portfolio: { id: "p", currency: "INR" },
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
mock.status.mockResolvedValue({ lastScan: null, newResults: 0, run: null })

describe("Results live approved visual contract", () => {
  it("retains the four-card approved R2 presentation with real holdings, not fixture data", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    render(<ResultsLivePage />)
    expect(await screen.findByText("2 stocks")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Results" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /Annual Results/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Run Scan Now/ })).toBeEnabled()
    expect(screen.getByText("HDFCBANK")).toBeInTheDocument()
    expect(screen.getByText("INFY")).toBeInTheDocument()
    expect(screen.queryByText("TESTETF")).not.toBeInTheDocument()
    expect(await screen.findByRole("heading", { name: "Portfolio Position" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Last \d+ Quarters/ })).toBeInTheDocument()
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
    expect(screen.getByText("Investment Action")).toBeInTheDocument()
    expect(screen.getByText("Not assessed")).toBeInTheDocument()
    const row = screen.getByText("HDFCBANK").closest("tr")
    expect(row).not.toBeNull()
    const q1Cell = row?.querySelector('button[aria-label*="Q1 FY27"]')
    expect(q1Cell).not.toBeNull()
    expect(q1Cell?.textContent).toContain("+15.4%")
    expect(q1Cell?.textContent).not.toContain("STRONG")
  })

  it("integrates newly recovered bank NII, PAT, EPS and asset-quality values without issuing an investment grade", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([
      { ...observation("NET_INTEREST_INCOME_QUARTER", "33533.95"), unit: "Cr", publishedAt: null },
      { ...observation("NET_PROFIT_QUARTER", "19059.72"), unit: "Cr", publishedAt: null },
      { ...observation("OPERATING_PROFIT_QUARTER", "28168.06"), unit: "Cr", publishedAt: null },
      { ...observation("EPS_DILUTED", "12.35"), unit: "INR_PER_SHARE", publishedAt: null },
      observation("GROSS_NPA_PERCENT", "1.17"),
      observation("NET_NPA_PERCENT", "0.41"),
    ])
    render(<ResultsLivePage />)
    expect(await screen.findByRole("heading", { name: "Key Metrics (Q1 FY27)" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /Net Interest Income — Last \d+ Quarters/ })).toBeInTheDocument()
    const card = screen.getByRole("heading", { name: "Key Metrics (Q1 FY27)" }).closest("section")
    if (!card) throw new Error("Metrics card missing")
    expect(within(card).getByText("₹33,533.95 Cr")).toBeInTheDocument()
    expect(within(card).getByText("₹19,059.72 Cr")).toBeInTheDocument()
    expect(within(card).getByText("₹12.35")).toBeInTheDocument()
    expect(within(card).getByText("+1.17%")).toBeInTheDocument()
    expect(within(card).getAllByText("Review pending").length).toBe(6)
    expect(screen.getByText("Investment Action")).toBeInTheDocument()
    expect(screen.getByText("Not assessed")).toBeInTheDocument()
  })

  it("shows source-backed banking NII even when portfolio industry is unclassified", async () => {
    const unclassified = { ...position("a", "HDFCBANK", "CURRENT"), industry: null }
    const unclassifiedView = { ...view, openPositions: [unclassified], closedPositions: [] }
    mock.usePortfolio.mockReturnValue({ portfolio: unclassifiedView, error: null, isLoading: false })
    mock.load.mockResolvedValue([
      { ...observation("NET_INTEREST_INCOME_QUARTER", "33533.95"), unit: "INR_CRORE" },
      { ...observation("NET_PROFIT_QUARTER", "19059.72"), unit: "INR_CRORE" },
      observation("GROSS_NPA_PERCENT", "1.17"),
    ])
    render(<ResultsLivePage />)
    const row = await screen.findByText("HDFCBANK")
    const q1 = row.closest("tr")?.querySelector('button[aria-label*="Q1 FY27"]')
    expect(q1?.textContent).toContain("Net Interest Income")
    expect(q1?.textContent).toContain("33,533.95")
    expect(screen.getByText(/1 of 1 with results/)).toBeInTheDocument()
  })

  it("displays R4 source reconciliation without inventing a performance grade", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([
      { ...observation("NET_INTEREST_INCOME_QUARTER", "33533.95", true), unit: "INR_CRORE", publishedAt: null },
      { ...observation("NET_PROFIT_QUARTER", "19059.72", true), unit: "INR_CRORE", publishedAt: null },
      { ...observation("EPS_DILUTED", "12.35", true), unit: "INR_PER_SHARE", publishedAt: null },
    ])
    render(<ResultsLivePage />)
    expect((await screen.findAllByText(/Source reconciled.*publication unverified/)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Source reconciled/).length).toBeGreaterThan(0)
    expect(screen.getByText("Investment Action")).toBeInTheDocument()
    expect(screen.getByText("Not assessed")).toBeInTheDocument()
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

  it("starts a real authenticated source scan and reloads observations after completion", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    const started = { lastScan: null, newResults: 0, run: {
      id: "run-1", status: "RUNNING", requested_count: 2, processed: 0, pending: 2,
      started_at: "2026-10-14T03:00:00Z", completed_at: null, accepted_count: 0, failed_count: 0,
    }}
    mock.start.mockResolvedValue(started)
    mock.step.mockResolvedValue({ lastScan: "2026-10-14T03:01:00Z", newResults: 1, run: {
      ...started.run, status: "PARTIAL", processed: 2, pending: 0,
      completed_at: "2026-10-14T03:01:00Z", accepted_count: 1,
    }})
    render(<ResultsLivePage />)
    fireEvent.click(await screen.findByRole("button", { name: /Run Scan Now/ }))
    await waitFor(() => expect(mock.step).toHaveBeenCalledWith("p", "run-1"))
    await waitFor(() => expect(mock.load).toHaveBeenCalledTimes(2))
    expect(screen.getByText("1")).toBeInTheDocument()
  })

  it("shows a real quarter label without duplicate Q4 FY26 labels", async () => {
    mock.usePortfolio.mockReturnValue({ portfolio: view, error: null, isLoading: false })
    mock.load.mockResolvedValue([])
    render(<ResultsLivePage />)
    expect(await screen.findByText("2 stocks")).toBeInTheDocument()
    const headers = screen.getAllByRole("columnheader")
    const labels = headers.slice(1).map((h) => h.textContent?.replace("(Latest completed) ↓", ""))
    expect(new Set(labels).size).toBe(labels.length)
    expect(labels).toContain("Q2 FY26")
    expect(labels).toContain("Q1 FY27")
  })
})
