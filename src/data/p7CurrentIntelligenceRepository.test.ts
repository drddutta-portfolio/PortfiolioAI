import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(), order: vi.fn() }))
vi.mock("../lib/supabase", () => ({ supabase: { from: mocks.from } }))
import { loadP7CurrentEvidenceSnapshot, loadP7CurrentEvidenceDetails } from "./p7CurrentIntelligenceRepository"
describe("canonical current snapshot access", () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mocks.from.mockReturnValue(mocks); mocks.select.mockReturnValue(mocks); mocks.eq.mockReturnValue(mocks)
  })
  it("scopes the canonical view to portfolio and security and retains assignment authority", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: "snapshot", portfolio_id: "portfolio", security_id: "security", assignment_authority: "approved" }, error: null })
    expect(await loadP7CurrentEvidenceSnapshot("portfolio", "security")).toMatchObject({ snapshotId: "snapshot", portfolioId: "portfolio", securityId: "security", assignmentAuthority: "approved" })
    expect(mocks.from).toHaveBeenCalledWith("current_research_evidence_snapshot_lineage_v1")
    expect(mocks.eq.mock.calls).toEqual([["portfolio_id", "portfolio"], ["security_id", "security"]])
    expect(mocks.select.mock.calls[0]?.[0]).toContain("assignment_authority")
  })
  it("preserves missing rows as null", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await loadP7CurrentEvidenceSnapshot("portfolio", "security")).toBeNull()
  })
  it("throws duplicate/permission errors without a legacy fallback", async () => {
    const error = { code: "PGRST116", message: "Multiple rows" }
    mocks.maybeSingle.mockResolvedValue({ data: null, error })
    await expect(loadP7CurrentEvidenceSnapshot("portfolio", "security")).rejects.toEqual(error)
    expect(mocks.from).toHaveBeenCalledTimes(1)
  })
  it("loads only immutable items of the portfolio/security-selected snapshot", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: "approved-snapshot", portfolio_id: "portfolio", security_id: "security", snapshot_status: "REVIEW_REQUIRED" }, error: null })
    const items = [{ id: "item", snapshot_id: "approved-snapshot", evidence_state: "INSUFFICIENT", normalized_value: { sessions: 217 }, reason_code: "INSUFFICIENT_LISTING_HISTORY" }]
    mocks.order.mockResolvedValue({ data: items, error: null })
    expect(await loadP7CurrentEvidenceDetails("portfolio", "security")).toMatchObject({ snapshot: { snapshotId: "approved-snapshot", snapshotStatus: "REVIEW_REQUIRED" }, requirements: items })
    expect(mocks.from.mock.calls).toEqual([["current_research_evidence_snapshot_lineage_v1"], ["research_evidence_snapshot_items"]])
    expect(mocks.eq.mock.calls).toEqual([["portfolio_id", "portfolio"], ["security_id", "security"], ["snapshot_id", "approved-snapshot"]])
  })
  it("does not query items or substitute legacy evidence when the canonical selection is missing", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null })
    expect(await loadP7CurrentEvidenceDetails("portfolio", "security")).toBeNull()
    expect(mocks.from).toHaveBeenCalledTimes(1)
  })
  it("propagates item permission failures rather than claiming readiness", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: "approved-snapshot" }, error: null })
    const error = { code: "42501", message: "Permission denied" }
    mocks.order.mockResolvedValue({ data: null, error })
    await expect(loadP7CurrentEvidenceDetails("portfolio", "security")).rejects.toEqual(error)
  })
})
