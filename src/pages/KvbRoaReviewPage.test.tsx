// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import { KvbRoaReviewPage } from "./KvbRoaReviewPage"
const { load, approve, save, config } = vi.hoisted(() => ({ load: vi.fn(), approve: vi.fn(), save: vi.fn(), config: { supabaseUrl: "https://lrgpjimipfkyoqbpsqzz.supabase.co" } }))
vi.mock("../data/kvbRoaReviewRepository", () => ({ loadKvbRoaProposal: load, approveKvbRoaProposal: approve, validateAndSaveKvbReadiness: save }))
vi.mock("../lib/config", () => ({ publicConfig: config }))
const proposal = { sourceRecordId: "issuer", sourcePayloadHash: "hash", supportingQuote: "Return on Assets 1.93", issuerUrl: "https://www.kvb.bank.in/ar-26/", regulatorUrl: "https://www.rbi.org.in/", roaPercent: "1.93", period: "FY2025-26", scope: "STANDALONE", publicationPrecision: "UNKNOWN" }
function view() { render(<MemoryRouter><KvbRoaReviewPage /></MemoryRouter>) }
beforeEach(() => { load.mockReset(); approve.mockReset(); save.mockReset(); config.supabaseUrl = "https://lrgpjimipfkyoqbpsqzz.supabase.co" })
afterEach(cleanup)
describe("KVB source-bound owner review", () => {
 it("requires explicit source loading and confirmation before submitting a review", async () => {
  load.mockResolvedValue(proposal); approve.mockResolvedValue("accepted-review")
  view(); expect(load).not.toHaveBeenCalled(); expect(approve).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText("Load registered source evidence"))
  await screen.findByText(proposal.supportingQuote)
  const button = screen.getByRole<HTMLButtonElement>("button", { name: "Approve source-bound ROA evidence" })
  expect(button.disabled).toBe(true)
  fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(button)
  await screen.findByRole("status")
  expect(approve).toHaveBeenCalledExactlyOnceWith(proposal)
  expect(screen.getByRole("status").textContent).toContain("does not establish FRESH or READY")
 })
 it("saves readiness only after an accepted owner review and a separate explicit action", async () => {
  load.mockResolvedValue(proposal); approve.mockResolvedValue("accepted-review"); save.mockResolvedValue("canonical-snapshot")
  view(); fireEvent.click(screen.getByText("Load registered source evidence")); await screen.findByText(proposal.supportingQuote)
  fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(screen.getByText("Approve source-bound ROA evidence"))
  await screen.findByText("Validate and save KVB readiness"); expect(save).not.toHaveBeenCalled()
  fireEvent.click(screen.getByText("Validate and save KVB readiness")); await screen.findByText(/canonical-snapshot/)
  expect(save).toHaveBeenCalledTimes(1)
 })
 it("resumes an existing accepted owner review after reload without approving again", async () => {
  load.mockResolvedValue({ ...proposal, acceptedReviewId: "51deb1ef-6105-4180-a139-30619ed6f5da" })
  save.mockReturnValue(new Promise(() => {}))
  view(); fireEvent.click(screen.getByText("Load registered source evidence"))
  await screen.findByText(/51deb1ef/)
  expect(screen.getByRole<HTMLButtonElement>("button", { name: "Approve source-bound ROA evidence" }).disabled).toBe(true)
  const button = screen.getByText("Validate and save KVB readiness")
  fireEvent.click(button); fireEvent.click(button)
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
  expect(approve).not.toHaveBeenCalled()
 })
 it("shows the failed save stage and exact backend code", async () => {
  load.mockResolvedValue({ ...proposal, acceptedReviewId: "51deb1ef-6105-4180-a139-30619ed6f5da" })
  save.mockRejectedValue(new Error("CANONICAL_MATERIALIZATION: P4_GRANT_ALREADY_USED"))
  view(); fireEvent.click(screen.getByText("Load registered source evidence"))
  fireEvent.click(await screen.findByText("Validate and save KVB readiness"))
  expect((await screen.findByRole("alert")).textContent).toBe("CANONICAL_MATERIALIZATION: P4_GRANT_ALREADY_USED")
  expect(approve).not.toHaveBeenCalled()
 })
 it("does not submit concurrent owner approvals", async () => {
  load.mockResolvedValue(proposal); approve.mockReturnValue(new Promise(() => {}))
  view(); fireEvent.click(screen.getByText("Load registered source evidence")); await screen.findByText(proposal.supportingQuote)
  fireEvent.click(screen.getByRole("checkbox")); const b=screen.getByText("Approve source-bound ROA evidence")
  fireEvent.click(b); fireEvent.click(b)
  await waitFor(() => expect(approve).toHaveBeenCalledTimes(1))
 })
 it("rejects a Production project and preserves source errors without pretending acceptance", async () => {
  config.supabaseUrl = "https://uxiyufbsbgzzdujzcdxe.supabase.co"; view()
  expect(screen.getByText(/only in the approved Development preview/)).toBeTruthy(); expect(load).not.toHaveBeenCalled()
  cleanup(); config.supabaseUrl = "https://lrgpjimipfkyoqbpsqzz.supabase.co"
  load.mockRejectedValue(new Error("REGISTERED_ORIGINAL_PROPOSAL_NOT_UNIQUE")); view()
  fireEvent.click(screen.getByText("Load registered source evidence"))
  await screen.findByRole("alert"); expect(approve).not.toHaveBeenCalled()
 })
})
