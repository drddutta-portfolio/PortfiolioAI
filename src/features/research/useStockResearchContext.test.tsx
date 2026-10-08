import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { P7CurrentEvidenceDetails } from "../../data/p7CurrentIntelligenceRepository"
import type { SecurityScoringSnapshot } from "./scoringTypes"
const mocks = vi.hoisted(() => ({ evidence: vi.fn(), scoring: vi.fn() }))
vi.mock("../../data/p7CurrentIntelligenceRepository", () => ({ loadP7CurrentEvidenceDetails: mocks.evidence }))
vi.mock("../../data/scoringRepository", () => ({ loadSecurityScoringSnapshot: mocks.scoring }))
import { useStockResearchContext } from "./useStockResearchContext"
const input = { portfolioId: "context-portfolio", securityId: "context-security", assetClass: "EQUITY", sector: "Pharma", industry: "Pharmaceuticals" }
const details = (snapshotId: string, portfolioId = input.portfolioId): P7CurrentEvidenceDetails => ({ snapshot: {
  snapshotId, portfolioId, securityId: input.securityId, asOfDate: "2026-10-08", snapshotStatus: "REVIEW_REQUIRED", profileCode: "PHARMA", subprofileCode: "CDMO_CRAMS", methodologyAuthority: "approved", methodologyVersion: "V1", classificationVersion: "taxonomy", methodologyRole: "PRIMARY", assignmentId: "assignment", assignmentAuthority: "approved", assignmentVersion: "V1",
}, requirements: [] })
const score: SecurityScoringSnapshot = { profileCode: "PHARMA_V1", profileName: "Pharma", profileSource: "CANONICAL_ASSIGNMENT", modelName: "model", modelStatus: "BLOCKED", runState: null, overallScore: null, evidenceCoverage: null, evidenceConfidence: null, scoreReadyCoverage: null, asOfDate: null, dimensions: [], ratings: [] }
afterEach(cleanup)
beforeEach(() => { vi.resetAllMocks(); mocks.scoring.mockResolvedValue(score) })
describe("one selected Research snapshot", () => {
  it("waits for the shared selection and supplies that exact snapshot to scoring", async () => {
    let finish!: (value: P7CurrentEvidenceDetails) => void
    mocks.evidence.mockReturnValue(new Promise(resolve => { finish = resolve }))
    const { result } = renderHook(() => useStockResearchContext(input))
    expect(result.current.scoring.isLoading).toBe(true)
    expect(mocks.scoring).not.toHaveBeenCalled()
    const selected = details("selected-one")
    await act(async () => { finish(selected) })
    await waitFor(() => expect(result.current.scoring.data).toEqual(score))
    expect(mocks.evidence).toHaveBeenCalledTimes(1)
    expect(mocks.scoring.mock.calls[0]?.[3].selectedSnapshot).toBe(selected.snapshot)
  })
  it("reloads selection and clears stale scoring while the new snapshot is pending", async () => {
    mocks.evidence.mockResolvedValueOnce(details("first"))
    let finish!: (value: P7CurrentEvidenceDetails) => void
    mocks.evidence.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const { result } = renderHook(() => useStockResearchContext(input))
    await waitFor(() => expect(result.current.scoring.data).toEqual(score))
    act(() => result.current.reload())
    expect(result.current.evidence.data).toBeNull()
    expect(result.current.scoring.data).toBeNull()
    await act(async () => { finish(details("second")) })
    await waitFor(() => expect(mocks.scoring).toHaveBeenCalledTimes(2))
    expect(mocks.scoring.mock.calls[1]?.[3].selectedSnapshot.snapshotId).toBe("second")
  })
  it("propagates failed selection without scoring or falling back to another assignment", async () => {
    mocks.evidence.mockRejectedValue(new Error("Selection unavailable"))
    const { result } = renderHook(() => useStockResearchContext(input))
    await waitFor(() => expect(result.current.scoring.error).toBe("Selection unavailable"))
    expect(result.current.scoring.data).toBeNull()
    expect(result.current.scoring.isLoading).toBe(false)
    expect(mocks.scoring).not.toHaveBeenCalled()
  })
  it("cannot reuse a prior portfolio selection during navigation", async () => {
    mocks.evidence.mockResolvedValueOnce(details("prior"))
    let finish!: (value: P7CurrentEvidenceDetails) => void
    mocks.evidence.mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    const { result, rerender } = renderHook(({ portfolioId }) => useStockResearchContext({ ...input, portfolioId }), { initialProps: { portfolioId: input.portfolioId } })
    await waitFor(() => expect(result.current.scoring.data).toEqual(score))
    rerender({ portfolioId: "other-portfolio" })
    expect(result.current.scoring.data).toBeNull()
    await act(async () => { finish(details("other", "other-portfolio")) })
    await waitFor(() => expect(mocks.scoring).toHaveBeenCalledTimes(2))
    expect(mocks.scoring.mock.calls[1]?.[3].selectedSnapshot.portfolioId).toBe("other-portfolio")
  })
})
