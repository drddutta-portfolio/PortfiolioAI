import { beforeEach, describe, expect, it, vi } from "vitest"
import { readOnlySecurityIds } from "../../supabase/functions/_shared/p7-ic-read-only-targeting"
import { validateAndSaveKvbReadiness } from "./kvbRoaReviewRepository"
const { call, session } = vi.hoisted(() => ({ call: vi.fn<(name: string, options: { body: Record<string, unknown> }) => Promise<{ data: unknown; error: null }>>(), session: vi.fn() }))
vi.mock("../lib/supabase", () => ({ supabase: { auth: { getSession: session }, functions: { invoke: call } } }))
const security = "be55b3cc-0400-45af-84aa-2a95e2c361c5"
function validation(state = "FRESH", writes = 0) { return { status: "IC3_CANONICAL_INPUTS_VALIDATED_READ_ONLY", dryRun: true, providerCalls: 0, results: [{ securityId: security, items: [{ requirement_code: "ROA_ANNUAL", evidence_state: state }] }], writeTotals: { snapshotsCreated: writes, snapshotsReused: 0, selectionsCreated: 0, selectionsReused: 0 }, snapshotIds: [], selectionIds: [] } }
beforeEach(() => { call.mockReset(); session.mockReset(); session.mockResolvedValue({ data: { session: { user: { id: "owner" } } }, error: null }) })
describe("KVB canonical save admission gate", () => {
 it("does not request a grant when ROA is blocked or the read-only response reports writes", async () => {
  for (const result of [validation("REVIEW_REQUIRED"), validation("FRESH", 1)]) {
   call.mockReset(); call.mockResolvedValue({ data: result, error: null })
   await expect(validateAndSaveKvbReadiness()).rejects.toThrow(/No materialization grant requested/)
   expect(call).toHaveBeenCalledTimes(1); expect(call.mock.calls[0]?.[0]).toBe("p7-ic2-materialize-readiness")
  }
 })
 it("uses a single KVB-only grant after a complete canonical FRESH validation", async () => {
  call.mockResolvedValueOnce({ data: validation(), error: null })
   .mockResolvedValueOnce({ data: { code: "GRANT_ISSUED_SINGLE_USE", grantId: "grant", action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS", scope: "SECURITY_IDS:" + security, expiresAt: new Date(Date.now()+60000).toISOString() }, error: null })
   .mockResolvedValueOnce({ data: { status: "IC3_CANONICAL_SNAPSHOTS_MATERIALIZED", dryRun: false, providerCalls: 0, processed: 1, snapshotIds: ["snapshot"], selectionIds: ["selection"] }, error: null })
  expect(await validateAndSaveKvbReadiness()).toBe("snapshot")
  expect(call.mock.calls.map(x => x[0])).toEqual(["p7-ic2-materialize-readiness", "v14-bank-kvb-owner-materialize-grant", "p7-ic2-materialize-readiness"])
  expect(call.mock.calls[2]?.[1].body.securityIds).toEqual([security])
  expect(call.mock.calls[2]?.[1].body.grantId).toBe("grant")
  const materializeBody = call.mock.calls[2]?.[1].body
  expect(materializeBody).toBeDefined()
  expect(readOnlySecurityIds(materializeBody!)).toEqual([security])
 })
 it("requires an authenticated session before any handler invocation", async () => {
  session.mockResolvedValue({ data: { session: null }, error: null })
  await expect(validateAndSaveKvbReadiness()).rejects.toThrow(/Sign in/); expect(call).not.toHaveBeenCalled()
 })
})
