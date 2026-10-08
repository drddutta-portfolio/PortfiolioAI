import { beforeEach, describe, expect, it, vi } from "vitest"
import type { P7CurrentEvidenceSnapshot } from "./p7CurrentIntelligenceRepository"
import { CANONICAL_ROUTE_ASSIGNMENT_AUTHORITY, CANONICAL_ROUTE_ASSIGNMENT_VERSION } from "../features/research/scoringProfileResolution"

const mocks = vi.hoisted(() => ({ canonical: vi.fn(), pharma: vi.fn(), from: vi.fn() }))
vi.mock("../lib/supabase", () => ({ supabase: { from: mocks.from } }))
vi.mock("./p7CurrentIntelligenceRepository", () => ({ loadP7CurrentEvidenceSnapshot: mocks.canonical }))
vi.mock("./pharmaScoringRepository", () => ({ loadPharmaV1ScoringSnapshot: mocks.pharma }))
import { loadSecurityScoringSnapshot } from "./scoringRepository"

const fixture = (overrides: Partial<P7CurrentEvidenceSnapshot> = {}): P7CurrentEvidenceSnapshot => ({
  snapshotId: "snapshot", portfolioId: "portfolio", securityId: "security", asOfDate: "2026-10-05",
  snapshotStatus: "REVIEW_REQUIRED", profileCode: "BANK", subprofileCode: null,
  methodologyAuthority: "BANK_NBFC_STAGE_8_BANK_V1", methodologyVersion: "V1", classificationVersion: "classification",
  methodologyRole: "PRIMARY", assignmentId: "assignment", assignmentAuthority: CANONICAL_ROUTE_ASSIGNMENT_AUTHORITY,
  assignmentVersion: CANONICAL_ROUTE_ASSIGNMENT_VERSION, ...overrides,
})
const load = (assetClass = "EQUITY") => loadSecurityScoringSnapshot("security", "Pharma", "Pharmaceuticals", { portfolioId: "portfolio", assetClass })

describe("held-security canonical scoring boundary", () => {
  it("uses an explicitly selected snapshot without selecting another current snapshot", async () => {
    const selected = fixture()
    const result = await loadSecurityScoringSnapshot("security", null, null, { portfolioId: "portfolio", assetClass: "EQUITY", selectedSnapshot: selected })
    expect(result.canonicalRoute?.snapshotId).toBe(selected.snapshotId)
    expect(mocks.canonical).not.toHaveBeenCalled()
  })
  it.each([{ portfolioId: "another-portfolio" }, { securityId: "another-security" }])("rejects a selected snapshot belonging to another owner/security", async overrides => {
    await expect(loadSecurityScoringSnapshot("security", null, null, { portfolioId: "portfolio", assetClass: "EQUITY", selectedSnapshot: fixture(overrides) })).rejects.toThrow("does not belong")
    expect(mocks.canonical).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled()
  })
  it("keeps an explicit null selection unavailable instead of reselecting", async () => {
    expect(await loadSecurityScoringSnapshot("security", "Banking", "Banks", { portfolioId: "portfolio", assetClass: "EQUITY", selectedSnapshot: null })).toMatchObject({ routeState: "UNAVAILABLE", overallScore: null })
    expect(mocks.canonical).not.toHaveBeenCalled()
  })
  beforeEach(() => { vi.resetAllMocks(); mocks.from.mockImplementation(() => { throw new Error("Unexpected scoring query") }); mocks.canonical.mockResolvedValue(fixture()) })
  it.each(["INSUFFICIENT", "STALE", "CONFLICTING", "REVIEW_REQUIRED"] as const)("keeps %s evidence blocked even with an existing Bank engine", async snapshotStatus => {
    mocks.canonical.mockResolvedValue(fixture({ snapshotStatus }))
    expect(await load()).toMatchObject({ routeState: "RESOLVED", engineState: "AVAILABLE", scoringExecutionState: "BLOCKED", overallScore: null, dimensions: [], previewMode: false })
    expect(mocks.canonical).toHaveBeenCalledWith("portfolio", "security")
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.pharma).not.toHaveBeenCalled()
  })
  it("retains an approved route whose engine is absent, including when evidence is READY", async () => {
    mocks.canonical.mockResolvedValue(fixture({ profileCode: "RETAIL_COMMERCE", methodologyAuthority: "P7_IC1_RETAIL_COMMERCE_METHODOLOGY_V1", snapshotStatus: "READY" }))
    expect(await load()).toMatchObject({ profileCode: "RETAIL_COMMERCE", routeState: "RESOLVED", engineState: "PENDING_ADAPTER", overallScore: null })
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it("keeps a missing canonical route explicit without querying legacy assignments", async () => {
    mocks.canonical.mockResolvedValue(null)
    expect(await load()).toMatchObject({ routeState: "UNAVAILABLE", scoringExecutionState: "BLOCKED", overallScore: null })
    expect(mocks.from).not.toHaveBeenCalled()
  })
  it("surfaces canonical retrieval errors instead of choosing a classification fallback", async () => {
    mocks.canonical.mockRejectedValue(new Error("canonical unavailable"))
    await expect(load()).rejects.toThrow("canonical unavailable")
    expect(mocks.from).not.toHaveBeenCalled(); expect(mocks.pharma).not.toHaveBeenCalled()
  })
  it("does not score ETFs or query equity routing", async () => {
    expect(await load("ETF")).toMatchObject({ routeState: "NOT_APPLICABLE", overallScore: null })
    expect(mocks.canonical).not.toHaveBeenCalled(); expect(mocks.from).not.toHaveBeenCalled()
  })
  it("dispatches reviewed READY Pharma through its preserved adapter despite conflicting classification", async () => {
    mocks.canonical.mockResolvedValue(fixture({ profileCode: "PHARMA", subprofileCode: "API_BULK_DRUGS", methodologyAuthority: "PHARMA_V1_PLUS_REVIEWED_PRIMARY_SUBPROFILE", snapshotStatus: "READY" }))
    mocks.pharma.mockResolvedValue({ profileCode: "PHARMA_V1", overallScore: null })
    const result = await loadSecurityScoringSnapshot("security", "Banking", "Banks", { portfolioId: "portfolio", assetClass: "EQUITY" })
    expect(result).toMatchObject({ profileSource: "CANONICAL_ASSIGNMENT", canonicalRoute: { profileCode: "PHARMA" }, routeState: "RESOLVED" })
    expect(mocks.pharma).toHaveBeenCalledWith("security"); expect(mocks.from).not.toHaveBeenCalled()
  })
})
