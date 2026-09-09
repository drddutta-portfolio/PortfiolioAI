import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { PortfolioViewModel } from "../features/portfolio/types"
import type { SecurityResearch } from "../features/research/types"
import { formatResearchMetric } from "../features/research/researchPolicy"
import { ResearchPage } from "./ResearchPage"

const providerCall = vi.fn()
const position = {
  securityId: "s1", symbol: "BEL", company: "Bharat Electronics", sector: null, industry: null, assetClass: "EQUITY", exchange: "NSE", isin: null,
  instrumentType: "STOCK", series: "EQ", role: "CORE", settings: { id: null, portfolioRole: "CORE", targetWeight: null, minimumWeight: null, maximumWeight: null, priority: null, isWatchlisted: false, isFrozen: false, investmentHorizon: null, notes: null }, themes: [], snapshotEvidence: null,
  quantity: "10", totalQuantityAcquired: "10", transactionCount: 1, averageCost: "100", investedAmount: "1000", currentPrice: "120", currentValue: "1200", unrealisedPnl: "200", unrealisedPnlPercent: "20", portfolioWeightPercent: "5", realisedPnl: "0", realisedCostBasis: "0", realisedProceeds: "0", totalQuantitySold: "0",
  accountingBasis: "FIFO", accountingQuality: "COMPLETE", chargesComplete: true, accountingReason: null, brokerExposure: [], hasMissingDates: false, hasMissingBrokers: false, hasMissingPrices: false,
  priceTimestamp: "2026-09-09T09:00:00Z", priceRetrievedAt: "2026-09-09T09:01:00Z", priceProvider: "ANGEL_ONE", priceSessionStatus: "OPEN", isPriceStale: false, costBasisReason: null, realisedPnlReason: null,
} as const
const portfolio = { portfolio: { id: "p1", name: "Portfolio", currency: "INR" }, openPositions: [position], closedPositions: [], themes: [], brokerAnalytics: [], totals: {}, quality: {} } as unknown as PortfolioViewModel
const metric = { id: "pb", code: "PBV_ADJUSTED_PROVIDER", label: "Provider Adjusted P/B", value: "4.2", numericValue: "4.2", provider: "TRENDLYNE_MCP", sourceField: "PBV_ADJUSTED_PROVIDER", periodStart: null, periodEnd: "2026-09-08", periodType: "POINT_IN_TIME", scope: "CONSOLIDATED", unit: "RATIO", currency: null, retrievedAt: "2026-09-09T00:00:00Z", freshUntil: "2099-09-09T00:00:00Z", status: "CONFLICTING", selected: false } as const
const ownership = { ...metric, id: "own", code: "SHAREHOLDING_PROMOTER_PERCENT", label: "Promoter", value: "51", numericValue: "51", unit: "PERCENT", periodEnd: "2026-06-30", status: "PROVISIONAL" } as const
const research: SecurityResearch = { securityId: "s1", companyName: "Bharat Electronics Limited", sector: "Industrials", industry: "Defence", marketCapCategory: null, freshUntil: "2099-09-09T00:00:00Z", state: "VERIFIED", metrics: [metric, ownership], documents: [{ id: "d1", type: "ANNUAL_REPORT", title: "Annual Report appearance", publishedAt: "2026-08-01", periodStart: null, periodEnd: "2026-03-31", periodType: "YEAR", provider: "TRENDLYNE_MCP", retrievedAt: "2026-09-09T00:00:00Z", status: "REVIEW_REQUIRED", externalReference: null }] }

vi.mock("../features/portfolio/usePortfolioView", () => ({ usePortfolioView: () => ({ portfolio, error: null, isLoading: false }) }))
vi.mock("../features/research/useSecurityResearch", () => ({ useSecurityResearch: () => ({ data: research, error: null, isLoading: false }) }))

function renderPage(path = "/app/research/s1") {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/app/research/:security" element={<ResearchPage />} /></Routes></MemoryRouter>)
}

describe("ResearchPage", () => {
  afterEach(() => { cleanup(); providerCall.mockReset() })
  it("uses Angel One CMP and preserves unavailable instead of zero", () => {
    renderPage()
    expect(screen.getByText("₹120.00")).toBeInTheDocument()
    expect(screen.getByText("ANGEL_ONE", { exact: false })).toBeInTheDocument()
    expect(formatResearchMetric(undefined)).toBe("Unavailable")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("navigates by canonical id or ticker without provider activity", () => {
    renderPage("/app/research/s1")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("BEL")
    cleanup()
    renderPage("/app/research/BEL")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("BEL")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("changes tabs and filters evidence without a provider or budget action", () => {
    renderPage()
    fireEvent.click(screen.getByRole("tab", { name: "Valuation" }))
    expect(screen.getByText("Provider Adjusted P/B")).toBeInTheDocument()
    expect(screen.getByText("CONFLICTING")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("tab", { name: "Evidence" }))
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "CONFLICTING" } })
    expect(screen.getByText("Competing / unselected")).toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("retains ownership period and does not fabricate a trend", () => {
    renderPage(); fireEvent.click(screen.getByRole("tab", { name: "Ownership" }))
    expect(screen.getByText(/One reporting period is available/)).toBeInTheDocument()
    expect(screen.getByText(/30 Jun 2026/)).toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("shows review-required document metadata without an open action", () => {
    renderPage(); fireEvent.click(screen.getByRole("tab", { name: "Documents" }))
    expect(screen.getByText("REVIEW REQUIRED")).toBeInTheDocument()
    expect(screen.getByText("No lawful retained open reference")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /open/i })).not.toBeInTheDocument()
  })
  it.each([390, 768, 1024, 1440])("renders accessible tabs at %ipx without page-level overflow", (width) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
    renderPage()
    expect(screen.getAllByRole("tab")).toHaveLength(7)
    expect(screen.getByRole("tabpanel")).toBeInTheDocument()
    expect(document.querySelector(".research-table-wrap")).not.toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
})
