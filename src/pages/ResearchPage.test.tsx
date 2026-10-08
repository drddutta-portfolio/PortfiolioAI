import { cleanup, fireEvent, render, screen, within } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PortfolioViewModel } from "../features/portfolio/types"
import type { P7CurrentEvidenceDetails, P7EvidenceRequirement } from "../data/p7CurrentIntelligenceRepository"
import type { ExternalRatingObservation, SecurityScoringSnapshot } from "../features/research/scoringTypes"
import type { SecurityResearch } from "../features/research/types"
import { formatResearchMetric } from "../features/research/researchPolicy"
import { ResearchPage } from "./ResearchPage"

const providerCall = vi.hoisted(() => vi.fn())
// No unit test may initialise the live client or make an unmocked provider call.
vi.mock("../lib/supabase", () => ({ supabase: { functions: { invoke: providerCall }, from: () => { throw new Error("Unexpected database read in ResearchPage unit test") } } }))
vi.mock("../features/decision/useProgramCR10ActionCenter", () => ({ useProgramCR10ActionCenter: () => ({ data: null, isLoading: false, error: null }) }))
vi.mock("../data/companyProfileRepository", () => ({ companyLogoPublicUrl: () => null }))
vi.mock("../features/research/useCompanyProfile", () => ({ useCompanyProfile: () => ({ data: null, isLoading: false, error: null }) }))
vi.mock("../features/research/useExternalRatings", () => ({ useExternalRatings: () => ({ data: ratingState.data, isLoading: false, error: null }) }))
vi.mock("../features/research/useCanonicalEvidenceReadiness", () => ({ useCanonicalEvidenceReadiness: () => evidenceState }))
vi.mock("../data/positionDecisionRepository", () => ({ loadPositionDecisionSettings: () => Promise.resolve(null), savePositionDecisionSettings: vi.fn() }))
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

const portfolioState = { data: portfolio }
vi.mock("../features/portfolio/usePortfolioView", () => ({ usePortfolioView: () => ({ portfolio: portfolioState.data, error: null, isLoading: false }) }))
const initialScoringSnapshot: SecurityScoringSnapshot = { profileCode: "BANK_NBFC", profileName: "Bank fixture", profileSource: "REVIEWED_ASSIGNMENT", modelName: "test", modelStatus: "DRAFT", runState: null, overallScore: null, evidenceCoverage: null, scoreReadyCoverage: null, evidenceConfidence: null, asOfDate: null, dimensions: [], ratings: [] }
const scoringState = { data: initialScoringSnapshot as SecurityScoringSnapshot | null, isLoading: false, error: null as string | null }
vi.mock("../features/research/useSecurityScoring", () => ({ useSecurityScoring: () => scoringState }))
const specialistState = { resolved: false }
vi.mock("../features/research/usePharmaSubprofileResolution", () => ({ usePharmaSubprofileResolution: () => ({ data: specialistState.resolved ? { status: "RESOLVED", profileCode: "PHARMA_V1", blocksReadiness: false, assignment: { assignmentId: "pharma-primary-test", securityId: "s1", profileCode: "PHARMA_V1", primarySubprofileCode: "DOMESTIC_FORMULATIONS", assignmentVersion: 1, assignmentState: "REVIEWED", effectiveFrom: "2026-03-31", effectiveTo: null, sourceReference: "TEST_FIXTURE", reasonCode: "TEST_FIXTURE", confidence: "HIGH", reviewedBy: "test-owner", reviewedAt: "2026-10-07", secondaryExposures: [] } } : null }) }))
vi.mock("../features/research/PharmaResearchWorkspacePanel", () => ({ PharmaResearchWorkspacePanel: () => <p>Retained pharmaceutical workspace</p> }))

const researchState = { data: research as SecurityResearch | null, error: null as string | null, isLoading: false }
vi.mock("../features/research/useSecurityResearch", () => ({ useSecurityResearch: () => researchState }))

const ratingState = { data: [] as readonly ExternalRatingObservation[] }
const evidenceState = { applicable: true, data: null as P7CurrentEvidenceDetails | null, isLoading: false, error: null as string | null, reload: vi.fn() }
const canonicalRoute = { profileCode: "BANK", subprofileCode: "RETAIL_BANK", methodologyAuthority: "test-methodology", methodologyVersion: "test-v1", assignmentAuthority: "test-authority", assignmentVersion: "test-v1", assignmentId: "test-assignment", snapshotId: "test-snapshot", asOfDate: "2026-10-07" }
function retainedRequirement(): P7EvidenceRequirement {
  return { id: "test-requirement", snapshot_id: "test-snapshot", requirement_code: "TEST_RETAINED_REQUIREMENT", metric_code: null, required: true, minimum_history: 5, freshness_policy: "ANNUAL", benchmark_authority: [], applicability: "APPLICABLE", evidence_state: "REVIEW_REQUIRED", candidate_evidence_ids: ["test-candidate"], selected_evidence_id: null, evidence_as_of_date: "2026-03-31", retrieved_at: "2026-10-07", fresh_through: null, source_provider: "TEST_SOURCE", raw_source_record_id: "test-source-reference", normalized_value: { value: 0, unit: "RATIO", period_end: "2026-03-31", scope: "CONSOLIDATED" }, validation_state: "REVIEW_REQUIRED", canonical_selection_state: "UNSELECTED", reason_code: "SOURCE_REVIEW_REQUIRED", recommended_remediation_action: "REVIEW_SOURCE" }
}

function renderPage(path = "/app/research/s1") {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/app/research/:security" element={<ResearchPage />} /></Routes></MemoryRouter>)
}

describe("ResearchPage", () => {
  it("keeps terminal research errors distinct from loading in the common shell", () => {
    Object.assign(scoringState, { data: null, isLoading: false, error: "Canonical read failed" })
    renderPage()
    expect(document.querySelector(".stock-research-classification")).toHaveTextContent("Research assignment: Unavailable")
    expect(document.querySelector(".portfolioai-state-grid")).not.toHaveTextContent("Canonical profile loading")
    expect(document.getElementById("stock-insights")).not.toHaveTextContent("Canonical profile loading")
    expect(document.querySelector(".research-title")).toHaveTextContent("Your portfolio role:")
    expect(screen.getByRole("navigation", { name: "Stock page sections" })).toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
  beforeEach(() => {
    window.history.replaceState(null, "", "/app/research/s1")
    vi.stubGlobal("scrollTo", vi.fn())
  })
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); providerCall.mockReset(); Object.assign(scoringState, { data: initialScoringSnapshot, isLoading: false, error: null }); specialistState.resolved = false; portfolioState.data = portfolio; ratingState.data = []; Object.assign(evidenceState, { applicable: true, data: null, isLoading: false, error: null }); Object.assign(researchState, { data: research, error: null, isLoading: false }) })
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
    scoringState.data = { ...initialScoringSnapshot, profileCode: "PHARMA_V1", profileSource: "CANONICAL_ASSIGNMENT", routeState: "RESOLVED", canonicalRoute: { ...canonicalRoute, profileCode: "PHARMA", subprofileCode: "CDMO_CRAMS" } }
    specialistState.resolved = false
    renderPage()
    expect(document.getElementById("stock-specialist")).toHaveTextContent("Retained pharmaceutical workspace")
    expect(providerCall).not.toHaveBeenCalled()
  })
  it("does not attach pharmaceutical content from a resolved legacy row without an applicable canonical resolution", () => {
    specialistState.resolved = true
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

  // UI-G5.1: integrated common-shell/selected-contract fixtures, not live research proof.
  it.each([
    ["HDFCBANK", "BANK", "RETAIL_BANK"],
    ["TORNTPHARM", "PHARMA", "DOMESTIC_FORMULATIONS"],
    ["ALIVUS", "PHARMA", "API_BULK_DRUGS"],
    ["AUROPHARMA", "PHARMA", "GLOBAL_GENERICS"],
    ["BIOCON", "PHARMA", "BIOPHARMA_BIOSIMILARS"],
    ["AKUMS", "PHARMA", "CDMO_CRAMS"],
    ["HOLDING_TEST", "FINANCIAL_HOLDING_COMPANY", null],
    ["RETAIL_TEST", "RETAIL_COMMERCE", null],
    ["UTILITY_TEST", "REGULATED_NETWORK", null],
    ["UNKNOWN_TEST", "UNREGISTERED_PROFILE", null],
    ["UNRESOLVED_TEST", "UNRESOLVED", null],
  ] as const)("retains the same shell and selected contract for %s / %s", (symbol, profileCode, subprofileCode) => {
    const unresolved = profileCode === "UNRESOLVED"
    const isPharma = profileCode === "PHARMA"
    portfolioState.data = { ...portfolio, openPositions: [{ ...portfolio.openPositions[0]!, symbol }] }
    scoringState.data = { ...initialScoringSnapshot, profileCode: isPharma ? "PHARMA_V1" : profileCode, profileName: profileCode, profileSource: "CANONICAL_ASSIGNMENT", canonicalRoute: { ...canonicalRoute, profileCode, subprofileCode }, routeState: unresolved ? "UNAVAILABLE" : "RESOLVED", methodologyState: unresolved ? "METHODOLOGY_NOT_AVAILABLE" : "AVAILABLE", scoringExecutionState: "PENDING_ADAPTER", engineState: "PENDING_ADAPTER", canonicalEvidenceState: "REVIEW_REQUIRED" }
    specialistState.resolved = isPharma
    evidenceState.data = { snapshot: { ...canonicalRoute, portfolioId: "p1", securityId: "s1", snapshotStatus: "REVIEW_REQUIRED", classificationVersion: "test-classification", methodologyRole: "PRIMARY", profileCode, subprofileCode }, requirements: [retainedRequirement()] }
    renderPage()
    for (const id of ["stock-summary", "stock-position", "stock-plan", "stock-insights", "stock-refresh", "stock-assessment", "stock-readiness", "stock-snapshots", "stock-health", "stock-specialist"]) expect(document.getElementById(id)).not.toBeNull()
    expect(screen.getAllByRole("tab")).toHaveLength(7)
    expect(document.querySelector(".research-assignment-summary")).toHaveTextContent(`Research profile: ${profileCode}`)
    const workspace = within(screen.getByRole("region", { name: "Stock-specific research" }))
    expect(workspace.getByRole("heading", { name: "Test Retained Requirement" })).toBeInTheDocument()
    expect(workspace.getByText("Source reference: test-source-reference")).toBeInTheDocument()
    expect(workspace.getByText(/CONSOLIDATED/, { selector: "pre" })).toBeInTheDocument()
    expect(document.querySelector(".portfolioai-primary-state")).toHaveTextContent("Canonical scoreNot ready")
    expect(document.querySelector(".portfolioai-advisory-slots")).toHaveTextContent("Suggested roleNot ready")
    if (isPharma) expect(screen.getByText("Retained pharmaceutical workspace")).toBeInTheDocument()
    if (!["BANK", "PHARMA", "UNRESOLVED"].includes(profileCode)) expect(workspace.getByText(/Specialist snapshot presentation is not registered/)).toBeInTheDocument()
    if (unresolved) expect(workspace.getByText(/Research profile is unresolved/)).toBeInTheDocument()
    fireEvent.click(workspace.getByRole("button", { name: "View complete profile evidence" }))
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Evidence ledger")
    expect(screen.getByRole("tabpanel")).toHaveFocus()
    expect(screen.getByRole("heading", { name: "Methodology evidence requirements" })).toBeInTheDocument()
    expect(providerCall).not.toHaveBeenCalled()
  })
  it.each(["STALE", "MISSING", "CONFLICTING", "REVIEW_REQUIRED"] as const)("keeps %s evidence separate from independent rating opinions and owner settings", canonicalEvidenceState => {
    scoringState.data = { ...initialScoringSnapshot, canonicalRoute, routeState: "RESOLVED", methodologyState: "AVAILABLE", scoringExecutionState: "AVAILABLE", engineState: "AVAILABLE", canonicalEvidenceState, scoreRunId: "retained-run", runState: "COMPLETE", overallScore: 97 }
    ratingState.data = [{ id: "test-rating", agencyCode: "TEST_AGENCY", instrumentType: "LONG_TERM", instrumentDescription: "Test instrument", ratingSymbol: "AAA", outlook: "Stable", ratingAction: "Affirmed", ratingDate: "2026-10-01", sourceUrl: "https://example.test/rating", retrievedAt: "2026-10-07", freshUntil: "2099-10-07", evidenceStatus: "VERIFIED" }]
    renderPage()
    expect(document.querySelector(".portfolioai-primary-state")).toHaveTextContent("Canonical scoreNot ready")
    expect(screen.queryByText("97")).not.toBeInTheDocument()
    expect(screen.getAllByText("AAA / Stable").length).toBeGreaterThan(0)
    expect(screen.getByText("Source reference: https://example.test/rating")).toBeInTheDocument()
    expect(document.getElementById("stock-insights")).toHaveTextContent("Your saved portfolio role")
    expect(document.querySelector(".portfolioai-advisory-slots")).toHaveTextContent("Suggested weight rangeNot available")
  })
  it.each(["loading", "error"])("hides retained scoring numbers when the canonical read is %s", state => {
    Object.assign(scoringState, { data: { ...initialScoringSnapshot, scoreRunId: "old-run", runState: "COMPLETE", overallScore: 97 }, isLoading: state === "loading", error: state === "error" ? "Canonical read failed" : null })
    renderPage()
    expect(screen.queryByText("97")).not.toBeInTheDocument()
    expect(document.querySelector(".portfolioai-primary-state")).toHaveTextContent("Canonical scoreNot ready")
    expect(screen.getAllByRole("tab")).toHaveLength(7)
  })
  it("preserves a qualified zero score without creating role or sizing recommendations", () => {
    scoringState.data = { ...initialScoringSnapshot, canonicalRoute, routeState: "RESOLVED", methodologyState: "AVAILABLE", scoringExecutionState: "AVAILABLE", engineState: "AVAILABLE", canonicalEvidenceState: "FRESH", scoreRunId: "qualified-run", runState: "COMPLETE", overallScore: 0 }
    renderPage()
    expect(document.querySelector(".portfolioai-primary-state")).toHaveTextContent("Canonical score0Current authoritative run")
    expect(document.querySelector(".portfolioai-advisory-slots")).toHaveTextContent("Suggested roleNot ready")
    expect(document.querySelector(".portfolioai-advisory-slots")).toHaveTextContent("Suggested weight rangeNot available")
  })
  it("retains portfolio facts while equity methodology is not applicable", () => {
    portfolioState.data = { ...portfolio, openPositions: [{ ...portfolio.openPositions[0]!, assetClass: "ETF" }] }
    evidenceState.applicable = false
    scoringState.data = { ...initialScoringSnapshot, routeState: "NOT_APPLICABLE", methodologyState: "NOT_APPLICABLE" }
    renderPage()
    expect(screen.getByText("₹120.00")).toBeInTheDocument()
    expect(screen.getByText("10", { selector: ".research-metric-card strong" })).toBeInTheDocument()
    expect(screen.getByText("Equity research is not applicable to this asset class.")).toBeInTheDocument()
    expect(screen.getAllByRole("tab")).toHaveLength(7)
    expect(providerCall).not.toHaveBeenCalled()
  })

})
