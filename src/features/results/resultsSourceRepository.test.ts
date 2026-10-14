import { afterEach, describe, expect, it, vi } from "vitest"
import { loadResultsSourceInventory } from "./resultsSourceRepository"

const db = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock("../../lib/supabase", () => ({ supabase: db }))

function makeRow(i: number) {
  return {
    id: "obs" + i, security_id: "held", metric_code: "NET_INTEREST_INCOME_QUARTER",
    numeric_value: String(i + 1), unit: "Cr", period_end: "2026-06-30",
    consolidation_scope: "STANDALONE", source_code: "COMPANY_EXCHANGE_FILING",
    published_at: null, retrieved_at: "2026-10-14T00:00:00Z",
  }
}
afterEach(() => { vi.clearAllMocks() })

describe("R3 existing-source reuse", () => {
  it("pages beyond the first Supabase response instead of discarding real quarterly rows", async () => {
    const observations = Array.from({ length: 701 }, (_, i) => makeRow(i))
    db.from.mockImplementation((table: string) => {
      const chain = {
        select: () => chain,
        in: () => chain,
        eq: () => chain,
        not: () => chain,
        order: () => chain,
        range: async (start: number, end: number) => {
          if (table === "fundamental_observation_decisions") {
            return { data: [{ selected_observation_id: "obs1" }], error: null }
          }
          return { data: observations.slice(start, end + 1), error: null }
        },
      }
      return chain
    })
    const rows = await loadResultsSourceInventory(["held"])
    expect(rows).toHaveLength(701)
    expect(rows.filter((row) => row.selected).map((row) => row.id)).toEqual(["obs1"])
    expect(rows[700]?.value).toBe("701")
    expect(db.from).toHaveBeenCalledWith("fundamental_observations")
  })

  it("does not invent an empty portfolio when a source read is rejected", async () => {
    db.from.mockImplementation(() => {
      const chain = {
        select: () => chain,
        in: () => chain,
        eq: () => chain,
        not: () => chain,
        order: () => chain,
        range: async () => ({ data: null, error: new Error("Read permission denied") }),
      }
      return chain
    })
    await expect(loadResultsSourceInventory(["held"])).rejects.toThrow("Read permission denied")
  })
})
