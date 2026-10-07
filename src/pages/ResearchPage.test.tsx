import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PortfolioViewModel } from "../features/portfolio/types"
import type { SecurityScoringSnapshot } from "../features/research/scoringTypes"
import type { SecurityResearch } from "../features/research/types"
import { formatResearchMetric } from "../features/research/researchPolicy"
import { ResearchPage } from "./ResearchPage"

const providerCall = vi.fn()
const position = {
  securityId: "s1", symbol: "BEL", company: "Bharat Electronics", sector: null, industry: null, assetClass: "EQUITY", exchange: "NSE", isin: null,
  instrumentType: "STOCK", series: "EQ", role: "CORE", settings: { id: null, portfolioRole: "CORE", targetWeight: null, minimumWeight: null, maximumWeight: null, priority: null, isWatchlisted: false, isFrozen: false, investmentHorizon: null, notes: null }, themes: [], snapshotEvidence: null,
  quantity: "10", totalQuantityAcquired: "10", transactionCount: 1, averageCost: "100", investedAmount: "1000", currentPrice: "120", currentValue: "1200", unrealisedPnl: "200", unrealisedPnlPercent: "20", portfolioWeightPercent: "5", realisedPnl: "0", realisedCostBasis: "0", realisedProceeds: "0", totalQuantitySold: "0",
  accountingBasis: "FIFO", accountingQuality: "COMPLETE", chargesComplete: true, accountingReason: null, brokerExposure: [{ broker: "Zerodha", quantity: "7" }, { broker: "Angel One", quantity: "3" }], hasMissingDates: false, hasMissingBrokers: false, hasMissingPrices: false,
  priceTimestamp: "2026-09-09T09:00:00Z", priceRetrievedAt: "2026-09-09T09:01:00Z", priceProvider: "ANGEL_ONE", priceSessionStatus: "OPEN", isPriceStale: false, costBasisReason: null, realisedPnlReason: null,
} as const
const portfolio = { portfolio: { id: "p1", name: "Portfolio", currency: "INR" }, openPositions: [position], closedPositions: [], themes: [], brokerAnalytics: [], totals: {}, quality: {} } as unknown as PortfolioViewModel
const metric = { id: "pb", code: "PBV_ADJUSTED_PROVIDER", label: "Provider Adjusted P/B", value: "4.2", numericValue: "4.2", provider: "TRENDLYNE_MCP", sourceField: "PBV_ADJUSTED_PROVIDER", periodStart: null, periodEnd: "2026-09-08", periodType: "POINT_IN_TIME", scope: "CONSOLIDATED", unit: "RATIO", currency: null, retrievedAt: "2026-09-09T00:00:00Z", freshUntil: "2099-09-09T00:00:00Z", status: "CONFLICTING", selected: false } as const
const ownership = { ...metric, id: "own", code: "SHAREHOLDING_PROMOTER_PERCENT", label: "Promoter", value: "51", numericValue: "51", unit: "PERCENT", periodEnd: "2026-06-30", status: "PROVISIONAL" } as const
const roe = { ...metric, id: "roe", code: "ROE_ANNUAL", label: "ROE", value: "18", numericValue: "18", unit: "PERCENT", periodEnd: "2026-03-31", status: "PROVISIONAL" } as const
const revenue = { ...metric, id: "revenue", code: "REVENUE_TTM", label: "Revenue (TTM)", value: "1000", numericValue: "1000", unit: "INR_CRORE", periodEnd: "2026-06-30", status: "PROVISIONAL" } as const
const research: SecurityResearch = { securityId: "s1", companyName: "Bharat Electronics Limited", sector: "Industrials", industry: "Defence", marketCapCategory: null, freshUntil: "2099-09-09T00:00:00Z", state: "VERIFIED", metrics: [metric, ownership, roe, revenue], documents: [{ id: "d1", type: "ANNUAL_REPORT", title: "Annual Report appearance", publishedAt: "2026-08-01", periodStart: null, periodEnd: "2026-03-31", periodType: "YEAR", provider: "TRENDLYNE_MCP", retrievedAt: "2026-09-09T00:00:00Z", status: "REVIEW_REQUIRED", externalReference: null }] }

vi.mock("../features/portfolio/usePortfolioView", () => ({ usePortfolioView: () => ({ portfolio, error: null, isLoading: false }) }))
const initialScoringSnapshot: SecurityScoringSnapshot = { profileCode: "BANK_NBFC", profileName: "Bank fixture", profileSource: "REVIEWED_ASSIGNMENT", modelName: "test", modelStatus: "DRAFT", runState: null, overallScore: null, evidenceCoverage: null, scoreReadyCoverage: null, evidenceConfidence: null, asOfDate: null, dimensions: [], ratings: [] }
const scoringState = { data: initialScoringSnapshot }
vi.mock("../features/research/useSecurityScoring", () => ({ useSecurityScoring: () => ({ data: scoringState.data, isLoading: false, error: null }) }))
const specialistState = { resolved: false }
vi.mock("../features/research/usePharmaSubprofileResolution", () => ({ usePharmaSubprofileResolution: () => ({ data: specialistState.resolved ? { status: "RESOLVED" } : null }) }))
vi.mock("../features/research/PharmaResearchWorkspacePanel", () => ({ PharmaResearchWorkspacePanel: () => <p>Retained pharmaceutical workspace</p> }))

const researchState = { data: research as SecurityResearch | null, error: null as string | null, isLoading: false }
vi.mock("../features/research/useSecurityResearch", () => ({ useSecurityResearch: () => researchState }))

function renderPage(path = "/app/research/s1") {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/app/research/:security" element={<ResearchPage />} /></Routes></MemoryRouter>)
}

describe("ResearchPage", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/app/research/s1")
    vi.stubGlobal("scrollTo", vi.fn())
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); providerCall.mockReset(); scoringState.data = initialScoringSnapshot; specialistState.resolved = false; Object.assign(researchState, { data: research, error: null, isLoading: false }) })
  it.each(["PENDING_ADAPTER", "BLOCKED"] as const)("keeps the header and cockpit consistent when execution is %s", state => {
    scoringState.data = { ...initialScoringSnapshot, runState: "COMPLETE", scoreRunId: "old-run", overallScore: 97, methodologyState: "AVAILABLE", scoringExecutionState: state }
    renderPage()
    expect(document.querySelector(".portfolioai-primary-state")).toHaveTextContent("Canonical scoreNot ready")
    expect(screen.queryByText("97")).not.toBeInTheDocument()
    expect(document.querySelector(".portfolioai-advisory-slots")).toHaveTextContent("Suggested roleNot ready")
    expect(document.querySelector(".portfolioai-advisory-slots")).toHaveTextContent("Suggested weight rangeNot available")
    expect(document.getElementById("stock-insights")).toHaveTextContent("Your saved portfolio role")
  })
  it("suppresses the same retained Pharma score in the header and cockpit without a reviewed primary assignment", () => {
    scoringState.data = { ...initialScoringSnapshot, profileCode: "PHARMA_V1", runState: "COMPLETE", scoreRunId: "old-run", overallScore: 97, methodologyState: "AVAILABLE", scoringExecutionState: "AVAILABLE" }
    renderPage()
    expect(document.querySelector(".portfolioai-primary-state")).toHaveTextContent("Canonical scoreNot ready")
    expect(screen.queryByText("97")).not.toBeInTheDocument()
  })
  it.each(["loading", "error", "empty"])("preserves overview regions when research is %s without fabricated counts", (state) => {
    Object.assign(researchState, { data: null, isLoading: state === "loading", error: state === "error" ? "Cache read failed" : null })
    renderPage()
    const ids = ["stock-summary", "stock-refresh", "stock-workspace", "stock-assessment", "stock-readiness", "stock-snapshots", "stock-health", "stock-specialist"]
    const nodes = ids.map(id => document.getElementById(id)!)
    nodes.forEach(node => expect(node).not.toBeNull())
    nodes.slice(1).forEach((node, index) => expect(nodes[index]!.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy())
    expect(document.getElementById("stock-health")).toHaveTextContent("ConflictsUnavailable")
    expect(screen.getByRole("navigation", { name: "Stock page sections" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("tab", { name: "Documents" }))
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Documents unavailable")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("preserves the pharmaceutical specialist selected by its canonical resolution", () => {
    specialistState.resolved = true
    renderPage()
    expect(document.getElementById("stock-specialist")).toHaveTextContent("Retained pharmaceutical workspace")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("does not attach pharmaceutical content without an applicable canonical resolution", () => {
    renderPage()
    expect(screen.queryByText("Retained pharmaceutical workspace")).not.toBeInTheDocument()
  })
  it("uses Angel One CMP and preserves unavailable instead of zero", () => {
    renderPage()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bharat Electronics Limited")
    expect(document.querySelector(".security-identity-line")).toHaveTextContent("BEL · NSE · Stock")
    expect(screen.getByText("₹120.00")).toBeInTheDocument()
    expect(screen.getByText("ANGEL_ONE", { exact: false })).toBeInTheDocument()
    expect(formatResearchMetric(undefined)).toBe("Unavailable")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("navigates by canonical id or ticker without provider activity", () => {
    renderPage("/app/research/s1")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bharat Electronics Limited")
    cleanup()
    renderPage("/app/research/BEL")
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Bharat Electronics Limited")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("reuses the Holdings position contract in compact cards and shows actual brokers", () => {
    renderPage()
    expect(screen.getByText("10", { selector: ".research-metric-card strong" })).toBeInTheDocument()
    expect(screen.getByText("₹100.00")).toBeInTheDocument()
    expect(screen.getByText("₹1,000.00")).toBeInTheDocument()
    expect(screen.getByText("₹1,200.00")).toBeInTheDocument()
    expect(screen.getByText("+₹200.00")).toBeInTheDocument()
    expect(screen.getByText("+20.00% · Gain")).toBeInTheDocument()
    expect(screen.getByText("5.00%")).toBeInTheDocument()
    expect(screen.getByText("Zerodha")).toBeInTheDocument()
    expect(screen.getByText("Angel One")).toBeInTheDocument()
    expect(screen.queryByText("Target price")).not.toBeInTheDocument()
    expect(screen.queryByText("Stop loss")).not.toBeInTheDocument()
  })
  it("uses Overview as a research cockpit without repeating position cards", () => {
    renderPage()
    const panel = screen.getByRole("tabpanel")
    expect(panel).toHaveTextContent("Quality at a glance")
    expect(panel).toHaveTextContent("ROE18%")
    expect(panel).toHaveTextContent("Growth at a glance")
    expect(panel).toHaveTextContent("Revenue (TTM)₹1,000 Cr")
    expect(panel).toHaveTextContent("P/E (TTM)Unavailable")
    expect(panel).toHaveTextContent("Conflicts1")
    expect(panel).toHaveTextContent("Promoter51%")
    expect(panel).toHaveTextContent("30 Jun 2026")
    expect(panel).toHaveTextContent("Research health")
    expect(panel).not.toHaveTextContent("Total quantity")
    fireEvent.click(screen.getByRole("button", { name: "View Evidence" }))
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Evidence ledger")
    expect(screen.getByRole("tabpanel")).toHaveFocus()
    expect(window.location.hash).toBe("#stock-evidence")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("changes tabs and filters evidence without a provider or budget action", () => {
    renderPage()
    fireEvent.click(screen.getByRole("tab", { name: "Valuation" }))
    expect(screen.getAllByText("Provider Adjusted P/B")).not.toHaveLength(0)
    expect(screen.getAllByText("CONFLICTING")).not.toHaveLength(0)
    fireEvent.click(screen.getByRole("tab", { name: "Evidence" }))
    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "CONFLICTING" } })
    expect(screen.getByText("Competing / unselected")).toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("retains ownership period and does not fabricate a trend", () => {
    renderPage(); fireEvent.click(screen.getByRole("tab", { name: "Ownership" }))
    expect(screen.getByText("reporting periods").closest("div")).toHaveTextContent("1reporting periods")
    expect(screen.getByRole("heading", { name: "Quarterly ownership trend" })).toBeInTheDocument()
    expect(screen.getAllByText(/30 Jun 2026/)).not.toHaveLength(0)
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("shows review-required document metadata without an open action", () => {
    renderPage(); fireEvent.click(screen.getByRole("tab", { name: "Documents" }))
    expect(screen.getByText("REVIEW REQUIRED")).toBeInTheDocument()
    expect(screen.getByText("No lawful retained open reference")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /open/i })).not.toBeInTheDocument()
  })
  it.each([390, 768, 1024, 1440])("renders accessible tab semantics with a %ipx viewport setting", (width) => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
    renderPage()
    expect(screen.getAllByRole("tab")).toHaveLength(7)
    expect(screen.getByRole("tabpanel")).toBeInTheDocument()
    expect(document.querySelector(".research-table-wrap")).not.toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("supports arrow, Home and End keys with one tabbable tab", () => {
    renderPage()
    const overview = screen.getByRole("tab", { name: "Overview" })
    overview.focus()
    fireEvent.keyDown(overview, { key: "ArrowLeft" })
    const evidence = screen.getByRole("tab", { name: "Evidence" })
    expect(evidence).toHaveFocus()
    expect(evidence).toHaveAttribute("aria-selected", "true")
    expect(screen.getAllByRole("tab").filter(tab => tab.tabIndex === 0)).toEqual([evidence])
    expect(screen.getByRole("tabpanel")).toHaveAttribute("aria-labelledby", evidence.id)
    fireEvent.keyDown(evidence, { key: "Home" })
    expect(overview).toHaveFocus()
    fireEvent.keyDown(overview, { key: "ArrowRight" })
    expect(screen.getByRole("tab", { name: "Financials" })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: "End" })
    expect(evidence).toHaveFocus()
  })
  it("opens a bookmarked Evidence tab and preserves original source values", () => {
    window.history.replaceState(null, "", "#stock-evidence")
    renderPage()
    expect(screen.getByRole("tab", { name: "Evidence" })).toHaveAttribute("aria-selected", "true")
    expect(document.activeElement?.id).toBe("stock-evidence")
    expect(screen.getAllByText("Original source value")).toHaveLength(research.metrics.length)
  })
  it("retains the complete long company name and exposes archive references without inventing open actions", () => {
    const name = "SRHHYPLTD International Speciality Research and Manufacturing Limited"
    researchState.data = { ...research, companyName: name, documents: [{ ...research.documents[0]!, externalReference: "archive/vendor/report-id-123456789" }] }
    renderPage()
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(name)
    fireEvent.click(screen.getByRole("tab", { name: "Documents" }))
    expect(screen.getByText("Retained archive reference")).toBeInTheDocument()
    expect(screen.getByText("archive/vendor/report-id-123456789")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /open/i })).not.toBeInTheDocument()
  })

})
