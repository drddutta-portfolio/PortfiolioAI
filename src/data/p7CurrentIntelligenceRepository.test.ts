import { beforeEach, describe, expect, it, vi } from "vitest"
const mocks = vi.hoisted(() => ({ from: vi.fn(), select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }))
vi.mock("../lib/supabase", () => ({ supabase: { from: mocks.from } }))
import { loadP7CurrentEvidenceSnapshot } from "./p7CurrentIntelligenceRepository"
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
})
