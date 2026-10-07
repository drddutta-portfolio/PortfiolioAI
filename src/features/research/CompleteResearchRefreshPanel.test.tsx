import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CompleteResearchRefreshPanel } from "./CompleteResearchRefreshPanel"

import { planCompleteResearchRefresh, executeCompleteResearchRefresh, type CompleteResearchRefreshPlan } from "../../data/completeResearchRefreshRepository"
import { discoverBankGrowthContract } from "../../data/bankGrowthDiscoveryRepository"
vi.mock("../../data/completeResearchRefreshRepository", () => ({ planCompleteResearchRefresh: vi.fn(), executeCompleteResearchRefresh: vi.fn() }))
vi.mock("../../data/bankGrowthDiscoveryRepository", () => ({ discoverBankGrowthContract: vi.fn() }))
const plan: CompleteResearchRefreshPlan = { mode: "COMPLETE_RESEARCH_REFRESH_PLAN", providerCalls: 0, security: "security-1", company: "HDFC Bank", providerInstrumentId: "provider-1", estimatedProviderCalls: 4, dailyObservedUsage: 10, projectedDailyUsage: 14, dailyLimit: 100, providerQuotaStatus: "AVAILABLE", ingestionEnabled: true, executionAllowed: true, components: [{ domain: "FUNDAMENTALS", calls: 1 }], note: "Plan only" }
const completed = vi.fn()
function renderRefresh() {
  return render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-1" symbol="HDFCBANK" profileCode="BANK_NBFC" onCompleted={completed} />)
}
beforeEach(() => { vi.mocked(planCompleteResearchRefresh).mockResolvedValue(plan) })
afterEach(() => { cleanup(); vi.resetAllMocks(); vi.restoreAllMocks() })

describe("CompleteResearchRefreshPanel", () => {
  it("renders the HDFCBANK pilot controls from refresh capability metadata", () => {
    render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-1" symbol="HDFCBANK" profileCode="BANK_NBFC" onCompleted={vi.fn()} />)

    expect(screen.getByRole("heading", { name: "Refresh stale valuation evidence" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Build Momentum & Risk from Angel One" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Add NIFTY Bank Relative Strength" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Discover missing bank growth fields" })).toBeInTheDocument()
  })

  it("does not expose reference-security controls to another BANK_NBFC security", () => {
    render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-2" symbol="ICICIBANK" profileCode="BANK_NBFC" onCompleted={vi.fn()} />)

    expect(screen.queryByRole("heading", { name: "Refresh stale valuation evidence" })).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Add NIFTY Bank Relative Strength" })).not.toBeInTheDocument()
  })

  it("keeps PHARMA_V1 modules profile-wide and fail-closed", () => {
    render(<CompleteResearchRefreshPanel portfolioId="portfolio-1" securityId="security-3" symbol="TORNTPHARM" profileCode="PHARMA_V1" onCompleted={vi.fn()} />)

    expect(screen.getByRole("heading", { name: "Pharma Fundamentals" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Market & Valuation" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Plan complete refresh" })).toBeDisabled()
    expect(screen.queryByRole("heading", { name: "Add NIFTY Bank Relative Strength" })).not.toBeInTheDocument()
  })
  it("does not plan or execute merely when mounted", () => {
    renderRefresh()
    expect(planCompleteResearchRefresh).not.toHaveBeenCalled()
    expect(executeCompleteResearchRefresh).not.toHaveBeenCalled()
    expect(discoverBankGrowthContract).not.toHaveBeenCalled()
  })
  it("discloses the quota block and prevents execution", async () => {
    vi.mocked(planCompleteResearchRefresh).mockResolvedValue({ ...plan, executionAllowed: false })
    renderRefresh()
    fireEvent.click(screen.getByRole("button", { name: "Plan complete refresh" }))
    const run = await screen.findByRole("button", { name: /Run Complete Research Refresh/ })
    expect(run).toBeDisabled()
    expect(screen.getByText("Quota gate").closest("article")).toHaveTextContent("Blocked")
    fireEvent.click(run)
    expect(executeCompleteResearchRefresh).not.toHaveBeenCalled()
  })
  it("requires confirmation and does not execute after cancellation", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
    renderRefresh()
    fireEvent.click(screen.getByRole("button", { name: "Plan complete refresh" }))
    fireEvent.click(await screen.findByRole("button", { name: /Run Complete Research Refresh/ }))
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("up to 4 Trendlyne calls"))
    expect(executeCompleteResearchRefresh).not.toHaveBeenCalled()
    expect(completed).not.toHaveBeenCalled()
  })
  it.each(["SUCCEEDED", "PARTIAL", "FAILED"] as const)("reports %s and reloads only accepted completion outcomes", async status => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.mocked(executeCompleteResearchRefresh).mockResolvedValue({ mode: "COMPLETE_RESEARCH_REFRESH", security: "security-1", providerInstrumentId: "provider-1", providerCalls: 4, providerSucceeded: status === "SUCCEEDED" ? 4 : status === "PARTIAL" ? 2 : 0, providerFailed: status === "SUCCEEDED" ? 0 : 2, releasedReservationUnits: 0, status, results: [], runId: "run-1", note: "Result" })
    renderRefresh()
    fireEvent.click(screen.getByRole("button", { name: "Plan complete refresh" }))
    fireEvent.click(await screen.findByRole("button", { name: /Run Complete Research Refresh/ }))
    expect(await screen.findByRole("status")).toHaveTextContent(status === "SUCCEEDED" ? "finished" : status === "PARTIAL" ? "partially" : "failed safely")
    expect(completed).toHaveBeenCalledTimes(status === "FAILED" ? 0 : 1)
    expect(executeCompleteResearchRefresh).toHaveBeenCalledTimes(1)
  })
  it("disables controls while planning and removes an obsolete plan when re-planning fails", async () => {
    renderRefresh()
    fireEvent.click(screen.getByRole("button", { name: "Plan complete refresh" }))
    await screen.findByRole("button", { name: /Run Complete Research Refresh/ })
    let rejectPlan!: (reason: Error) => void
    vi.mocked(planCompleteResearchRefresh).mockReturnValue(new Promise((_, reject) => { rejectPlan = reject }))
    fireEvent.click(screen.getByRole("button", { name: "Re-plan" }))
    expect(screen.getByRole("button", { name: "Planning…" })).toBeDisabled()
    expect(screen.queryByRole("button", { name: /Run Complete Research Refresh/ })).not.toBeInTheDocument()
    rejectPlan(new Error("Quota service unavailable"))
    expect(await screen.findByRole("alert")).toHaveTextContent("Quota service unavailable")
    await waitFor(() => expect(screen.getByRole("button", { name: "Plan complete refresh" })).toBeEnabled())
    expect(executeCompleteResearchRefresh).not.toHaveBeenCalled()
  })
  it("shows execution and capability failures as alerts", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true)
    vi.mocked(executeCompleteResearchRefresh).mockRejectedValue(new Error("Refresh request failed"))
    vi.mocked(discoverBankGrowthContract).mockRejectedValue(new Error("Discovery request failed"))
    renderRefresh()
    fireEvent.click(screen.getByRole("button", { name: "Plan complete refresh" }))
    fireEvent.click(await screen.findByRole("button", { name: /Run Complete Research Refresh/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Refresh request failed")
    await waitFor(() => expect(screen.getByRole("button", { name: /Run growth discovery/ })).toBeEnabled())
    fireEvent.click(screen.getByRole("button", { name: /Run growth discovery/ }))
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Discovery request failed"))
    expect(completed).not.toHaveBeenCalled()
  })

})
