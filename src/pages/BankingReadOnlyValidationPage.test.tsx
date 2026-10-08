// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import manifest from "../../docs/private/v1-4-industry-batches/Banking_13_Read_Only_Request_Manifest.json"
import { BankingReadOnlyValidationPage } from "./BankingReadOnlyValidationPage"

const { invoke, config } = vi.hoisted(() => ({
  invoke: vi.fn(),
  config: { supabaseUrl: "https://lrgpjimipfkyoqbpsqzz.supabase.co" },
}))
vi.mock("../data/bankingValidationRepository", () => ({ invokeBankingReadOnlyValidation: invoke }))
vi.mock("../lib/config", () => ({ publicConfig: config }))
vi.mock("../features/portfolio/usePortfolioView", () => ({
  usePortfolioView: () => ({ portfolio: { portfolio: { id: "owned-portfolio", name: "Test owner" } }, isLoading: false, error: null }),
}))

function view() { return render(<MemoryRouter><BankingReadOnlyValidationPage /></MemoryRouter>) }
function response(slice: (typeof manifest.slices)[number]) {
  return {
    status: "IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY",
    dryRun: true,
    processed: slice.securityIds.length,
    results: slice.securityIds.map(securityId => ({
      securityId, status: "REVIEW_REQUIRED", snapshotHash: "test-hash",
      items: [{ requirement_code: "OWNERSHIP_TREND_4Q", evidence_state: "REVIEW_REQUIRED", reason_code: "REPORTING_PERIOD_TYPE_NOT_PROVEN" }],
    })),
    providerCalls: 0,
    snapshotIds: [], selectionIds: [],
    writeTotals: { snapshotsCreated: 0, snapshotsReused: 0, selectionsCreated: 0, selectionsReused: 0 },
  }
}

beforeEach(() => { invoke.mockReset(); config.supabaseUrl = "https://lrgpjimipfkyoqbpsqzz.supabase.co" })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe("V1-4 banking read-only owner UI", () => {
  it("refuses a Production Supabase project even on localhost", () => {
    config.supabaseUrl = "https://uxiyufbsbgzzdujzcdxe.supabase.co"
    view()
    expect(screen.getByText(/unavailable outside the approved Development environment/)).toBeTruthy()
    expect(invoke).not.toHaveBeenCalled()
  })

  it("uses only the frozen four slices and exact read-only request contract", async () => {
    invoke.mockImplementation((body: { securityIds: readonly string[] }) => {
      const slice = manifest.slices.find(s => JSON.stringify(s.securityIds) === JSON.stringify(body.securityIds))
      if (!slice) throw Error("Unexpected slice")
      return response(slice)
    })
    view()
    for (const [index, slice] of manifest.slices.entries()) {
      const button = screen.getByText(new RegExp(slice.slice_id + ":")).closest(".panel")?.querySelector("button")
      if (!button) throw new Error(`Missing banking slice button: ${slice.slice_id}`)
      fireEvent.click(button)
      await waitFor(() => expect(invoke).toHaveBeenCalledTimes(index + 1))
      await waitFor(() => expect(screen.getAllByText(/Prospective only:/)).toHaveLength(index + 1))
      const request = invoke.mock.calls[index]?.[0] as { action: string; portfolioId: string; securityIds: string[]; selectionRunId: string; evaluationAsOf: string; sourceCutoffAt: string }
      expect(request).toEqual(expect.objectContaining({
        action: "P7_IC3_VALIDATE_CANONICAL_INPUTS",
        portfolioId: "owned-portfolio",
        securityIds: slice.securityIds,
      }))
      expect(request).not.toHaveProperty("offset")
      expect(request).not.toHaveProperty("limit")
      expect(request.selectionRunId).toMatch(/^[0-9a-f-]{36}$/i)
      expect(Date.parse(request.evaluationAsOf)).toBeGreaterThan(0)
      expect(request.sourceCutoffAt).toBe(request.evaluationAsOf)
    }
    expect(screen.getByText(/does not save or change persisted research readiness/)).toBeTruthy()
  })

  it("fails closed on missing write proof and permits safe retry", async () => {
    const slice = manifest.slices[0] as (typeof manifest.slices)[number]
    invoke.mockResolvedValueOnce({ ...response(slice), writeTotals: {} }).mockResolvedValueOnce(response(slice))
    view()
    fireEvent.click(screen.getAllByRole("button", { name: "Run read-only validation" })[0] as HTMLElement)
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("write counters"))
    expect(screen.queryByText(/Prospective only:/)).toBeNull()
    fireEvent.click(screen.getAllByRole("button", { name: "Run read-only validation" })[0] as HTMLElement)
    await waitFor(() => expect(screen.getByText(/Prospective only:/)).toBeTruthy())
    expect(invoke).toHaveBeenCalledTimes(2)
  })

  it("shows expired-session failures without claiming a successful slice", async () => {
    invoke.mockRejectedValueOnce(new Error("Session unavailable or expired. Sign in again."))
    view()
    fireEvent.click(screen.getAllByRole("button", { name: "Run read-only validation" })[0] as HTMLElement)
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Session unavailable"))
    expect(screen.queryByText(/Prospective only:/)).toBeNull()
  })

  it("prevents a concurrent second slice submission", async () => {
    let release!: (result: unknown) => void
    invoke.mockImplementationOnce(() => new Promise(resolve => { release = resolve }))
    view()
    const buttons = screen.getAllByRole("button", { name: "Run read-only validation" })
    fireEvent.click(buttons[0] as HTMLElement)
    expect((screen.getAllByRole("button", { name: "Run read-only validation" })[0] as HTMLElement).hasAttribute("disabled")).toBe(true)
    expect(invoke).toHaveBeenCalledTimes(1)
    release(response(manifest.slices[0] as (typeof manifest.slices)[number]))
    await waitFor(() => expect(screen.getByText(/Prospective only:/)).toBeTruthy())
  })
})
