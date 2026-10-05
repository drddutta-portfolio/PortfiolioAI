import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SecurityScoringSnapshot } from "./scoringTypes"
const loader = vi.hoisted(() => vi.fn())
vi.mock("../../data/scoringRepository", () => ({ loadSecurityScoringSnapshot: loader }))
import { useSecurityScoring } from "./useSecurityScoring"
const snapshot = (overrides: Partial<SecurityScoringSnapshot> = {}): SecurityScoringSnapshot => ({
  profileCode: "BANK_NBFC", profileName: "Bank", profileSource: "CANONICAL_ASSIGNMENT", methodologyState: "AVAILABLE",
  routeState: "RESOLVED", engineState: "AVAILABLE", scoringExecutionState: "AVAILABLE", modelName: "model", modelStatus: "ACTIVE",
  runState: "COMPLETE", overallScore: 88, evidenceCoverage: 1, scoreReadyCoverage: 1, evidenceConfidence: 100,
  asOfDate: "2026-10-05", dimensions: [], ratings: [], previewMode: false, ...overrides,
})
describe("canonical scoring hook", () => {
  beforeEach(() => { loader.mockReset() })
  it("uses the shared canonical loader even for Pharma classification", async () => {
    loader.mockResolvedValue(snapshot())
    const { result } = renderHook(() => useSecurityScoring("hook-security-1", "Pharma", "Pharmaceuticals", "portfolio-a", "EQUITY"))
    await waitFor(() => expect(result.current.data?.profileCode).toBe("BANK_NBFC"))
    expect(loader).toHaveBeenCalledWith("hook-security-1", "Pharma", "Pharmaceuticals", { portfolioId: "portfolio-a", assetClass: "EQUITY" })
  })
  it("replaces a cached numeric score with the newer blocked canonical result", async () => {
    loader.mockResolvedValueOnce(snapshot()).mockResolvedValueOnce(snapshot({ overallScore: null, scoringExecutionState: "BLOCKED", runState: null }))
    const { result } = renderHook(() => useSecurityScoring("hook-security-2", null, null, "portfolio-a", "EQUITY"))
    await waitFor(() => expect(result.current.data?.overallScore).toBe(88))
    act(() => result.current.reload())
    await waitFor(() => expect(result.current.data?.scoringExecutionState).toBe("BLOCKED"))
    expect(result.current.data?.overallScore).toBeNull()
  })
  it("never displays another portfolio's cached result while its own request is pending", async () => {
    loader.mockResolvedValueOnce(snapshot()).mockReturnValueOnce(new Promise(() => {}))
    const { result, rerender } = renderHook(({ portfolio }) => useSecurityScoring("hook-security-3", null, null, portfolio, "EQUITY"), { initialProps: { portfolio: "portfolio-a" } })
    await waitFor(() => expect(result.current.data?.overallScore).toBe(88))
    rerender({ portfolio: "portfolio-b" })
    expect(result.current.data).toBeNull(); expect(result.current.isLoading).toBe(true)
  })
})
