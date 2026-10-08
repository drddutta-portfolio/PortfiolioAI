import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { P7CurrentEvidenceDetails, P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"
const mocks = vi.hoisted(() => ({ hook: vi.fn() }))
vi.mock("./useCanonicalEvidenceReadiness", () => ({ useCanonicalEvidenceReadiness: mocks.hook }))
import { ProfileResearchBlocks } from "./ProfileResearchBlocks"
import { CanonicalEvidenceReadinessPanel } from "./CanonicalEvidenceReadinessPanel"

const snapshot: P7CurrentEvidenceDetails["snapshot"] = { snapshotId: "snapshot", portfolioId: "portfolio", securityId: "security", asOfDate: "2026-09-29", snapshotStatus: "REVIEW_REQUIRED", profileCode: "RETAIL_COMMERCE", subprofileCode: null, methodologyAuthority: "approved", methodologyVersion: "v1", classificationVersion: "v1", methodologyRole: "PRIMARY", assignmentId: "assignment", assignmentVersion: "v1" }
const requirement: P7EvidenceRequirement = { id: "item", snapshot_id: "snapshot", requirement_code: "APPROVED_BENCHMARK_HISTORY_252D", metric_code: null, required: true, minimum_history: 252, freshness_policy: "MARKET_5_TRADING_DAYS", benchmark_authority: ["NIFTY_CONSUMER_SERVICES"], applicability: "APPLICABLE", evidence_state: "MISSING", candidate_evidence_ids: [], selected_evidence_id: null, evidence_as_of_date: null, retrieved_at: null, fresh_through: null, source_provider: null, raw_source_record_id: null, normalized_value: null, validation_state: "FAIL_CLOSED", canonical_selection_state: "NO_SELECTION", reason_code: "BENCHMARK_HISTORY_NOT_READY", recommended_remediation_action: "REFRESH_EXACT_APPROVED_BENCHMARK_HISTORY" }
function mount() { return render(<CanonicalEvidenceReadinessPanel portfolioId="portfolio" securityId="security" assetClass="EQUITY" />) }
describe("canonical evidence requirement presentation", () => {
  afterEach(cleanup)
  beforeEach(() => { mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: null, data: { snapshot, requirements: [requirement] } }) })
  it("exposes missing approved benchmark requirements for a profile without requiring a scoring engine", () => {
    mount()
    expect(screen.getByText("REVIEW REQUIRED")).toBeTruthy()
    expect(screen.getByText(/RETAIL COMMERCE/)).toBeTruthy()
    expect(screen.getByText("BENCHMARK HISTORY NOT READY")).toBeTruthy()
    expect(screen.getByText(/Minimum history: 252/)).toBeTruthy()
    expect(screen.getByText(/NIFTY_CONSUMER_SERVICES/)).toBeTruthy()
    expect(screen.getByText("Normalized evidence unavailable")).toBeTruthy()
  })
  it.each(["FRESH", "STALE", "INSUFFICIENT", "CONFLICTING", "REVIEW_REQUIRED", "NOT_APPLICABLE"] as const)("preserves %s and the normalized evidence without promoting or converting it into a score", state => {
    mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: null, data: { snapshot, requirements: [{ ...requirement, evidence_state: state, normalized_value: { sessions: 217, minimumPeriods: 8, availablePeriods: 1, adjustmentStatus: "REVIEW_REQUIRED", benchmarkDates: "MISMATCH", currency: "INR", scope: "STANDALONE", unit: "PERCENT" } }] } })
    mount()
    expect(screen.getAllByText(state.replaceAll("_", " ")).length).toBeGreaterThan(0)
    expect(screen.getByText(/"sessions": 217/)).toBeTruthy()
    expect(screen.getByText(/"availablePeriods": 1/)).toBeTruthy()
    expect(screen.getByText(/"benchmarkDates": "MISMATCH"/)).toBeTruthy()
    expect(screen.queryByText("Research ready")).toBeNull()
  })
  it("retains source, reporting date and freshness metadata even in stale evidence", () => {
    mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: null, data: { snapshot: { ...snapshot, snapshotStatus: "STALE" }, requirements: [{ ...requirement, evidence_state: "STALE", source_provider: "TRENDLYNE_MCP", evidence_as_of_date: "2026-03-31", retrieved_at: "2026-04-01T00:00:00Z", fresh_through: "2026-08-01", normalized_value: { currency: "INR", unit: "PERCENT", scope: "CONSOLIDATED", periodEnd: "2026-03-31" } }] } })
    mount()
    expect(screen.getByText("TRENDLYNE_MCP")).toBeTruthy()
    expect(screen.getByText("Fresh through 2026-08-01")).toBeTruthy()
    expect(screen.getByText("Evidence as of 2026-03-31")).toBeTruthy()
    expect(screen.getByText(/"scope": "CONSOLIDATED"/)).toBeTruthy()
  })
  it("shows unavailable requirements when no snapshot exists", () => {
    mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: null, data: null })
    mount(); expect(screen.getByText(/no canonical evidence snapshot/)).toBeTruthy()
  })
  it("does not call an empty snapshot ready", () => {
    mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: null, data: { snapshot, requirements: [] } })
    mount(); expect(screen.getByRole("alert").textContent).toContain("completeness cannot be established")
  })
  it("exposes read failure rather than showing cached legacy readiness", () => {
    mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: "Permission denied", data: null })
    mount(); expect(screen.getByRole("alert").textContent).toContain("Permission denied")
  })
  it("keeps ETF equity-method readiness explicitly not applicable", () => {
    mocks.hook.mockReturnValue({ applicable: false, isLoading: false, error: null, data: null })
    mount(); expect(screen.getByText(/equity methodology requirements do not apply/)).toBeTruthy()
  })
  it("keeps the Overview summary compact with the complete immutable detail collapsed", () => {
    render(<CanonicalEvidenceReadinessPanel portfolioId="portfolio" securityId="security" assetClass="EQUITY" compact />)
    expect(screen.getByRole("heading", { name: "Research Readiness" })).toBeInTheDocument()
    expect(screen.getByText("Complete requirements and source lineage").closest("details")).not.toHaveAttribute("open")
    expect(screen.getByText(/Minimum history: 252/)).toBeInTheDocument()
    expect(screen.getByText("Snapshot provenance")).toBeInTheDocument()
  })

  it.each(["BANK", "PHARMA", "FINANCIAL_HOLDING", "UNRESOLVED"])("uses the selected %s requirement without importing bank templates", profileCode => {
    mocks.hook.mockReturnValue({ applicable: true, isLoading: false, error: null, data: { snapshot: { ...snapshot, profileCode, subprofileCode: profileCode === "PHARMA" ? "CDMO_CRAMS" : null }, requirements: [{ ...requirement, requirement_code: "SELECTED_CONTRACT_REQUIREMENT", normalized_value: { sourceValue: "12.5", scope: "STANDALONE" } }] } })
    render(<ProfileResearchBlocks portfolioId="portfolio" securityId="security" assetClass="EQUITY" onViewEvidence={vi.fn()} />)
    expect(screen.getByText("Selected Contract Requirement")).toBeInTheDocument()
    expect(screen.getByText(/"sourceValue": "12.5"/)).toBeInTheDocument()
    expect(screen.queryByText("Gross NPA Ratio")).not.toBeInTheDocument()
    expect(screen.getByText("View complete profile evidence")).toBeInTheDocument()
  })

  it("renders the shared selection and disables independent selection in both consumers", () => {
    const selected = { applicable: true, isLoading: false, error: null, data: { snapshot, requirements: [requirement] }, reload: vi.fn() }
    mocks.hook.mockReturnValue({ applicable: true, isLoading: true, data: null, error: null })
    render(<><CanonicalEvidenceReadinessPanel portfolioId="portfolio" securityId="security" assetClass="EQUITY" evidence={selected} /><ProfileResearchBlocks portfolioId="portfolio" securityId="security" assetClass="EQUITY" evidence={selected} onViewEvidence={vi.fn()} /></>)
    expect(mocks.hook.mock.calls.every(call => call[3] === false)).toBe(true)
    expect(screen.queryByText(/Loading canonical evidence/)).not.toBeInTheDocument()
    expect(screen.getAllByText(/RETAIL_COMMERCE|Retail Commerce/).length).toBeGreaterThan(0)
  })

})
