import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { P7CurrentEvidenceDetails } from "../../data/p7CurrentIntelligenceRepository"
const mocks = vi.hoisted(() => ({ load: vi.fn() }))
vi.mock("../../data/p7CurrentIntelligenceRepository", () => ({ loadP7CurrentEvidenceDetails: mocks.load }))
import { useCanonicalEvidenceReadiness } from "./useCanonicalEvidenceReadiness"

describe("portfolio-scoped canonical evidence lifecycle", () => {
  afterEach(cleanup)
  beforeEach(() => vi.resetAllMocks())
  it("does not fetch equity requirements for ETFs", () => {
    const { result } = renderHook(() => useCanonicalEvidenceReadiness("portfolio", "security", "ETF"))
    expect(result.current.applicable).toBe(false); expect(mocks.load).not.toHaveBeenCalled()
  })
  it("clears the previous portfolio and ignores its delayed response", async () => {
    let resolveOld!: (value: P7CurrentEvidenceDetails | null) => void
    mocks.load.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve })).mockResolvedValueOnce(null)
    const { result, rerender } = renderHook(({ portfolio }) => useCanonicalEvidenceReadiness(portfolio, "security", "EQUITY"), { initialProps: { portfolio: "old" } })
    rerender({ portfolio: "new" })
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(async () => { resolveOld({ snapshot: { snapshotId: "old" }, requirements: [] } as unknown as P7CurrentEvidenceDetails); await Promise.resolve() })
    expect(result.current.data).toBeNull()
    expect(mocks.load.mock.calls).toEqual([["old", "security"], ["new", "security"]])
  })
  it("propagates canonical read errors without a provider refresh", async () => {
    mocks.load.mockRejectedValue(new Error("Canonical read failed"))
    const { result } = renderHook(() => useCanonicalEvidenceReadiness("portfolio", "security", "EQUITY"))
    await waitFor(() => expect(result.current.error).toContain("Canonical read failed"))
    expect(result.current.data).toBeNull(); expect(mocks.load).toHaveBeenCalledTimes(1)
  })
})
