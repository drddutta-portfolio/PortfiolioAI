// Exercise the real capture writers; all transport is mocked, never a provider or database.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.115.0"
const assert = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }
Deno.test("IC2 detailed and ownership capture never append undated/UNKNOWN canonical observations", async () => {
  const originalServe = Deno.serve, originalFetch = globalThis.fetch
  const writes: { table: string; body: Record<string, unknown> }[] = []
  try {
    Deno.serve = (() => ({})) as unknown as typeof Deno.serve
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      assert(url.hostname === "lrgpjimipfkyoqbpsqzz.supabase.co", "Unexpected target or provider execution")
      assert(url.pathname === "/rest/v1/data_source_records" && init?.method === "POST", "Unexpected observation write or DB read")
      const body = JSON.parse(String(init?.body)) as Record<string, unknown>
      writes.push({ table: "data_source_records", body })
      return new Response(JSON.stringify([{ id: "00000000-0000-4000-8000-000000000001", retrieved_at: "2026-10-05T10:00:00Z", payload_hash: body.payload_hash }]), { headers: { "Content-Type": "application/json" } })
    }) as typeof fetch
    const { writeDetailed, writeOwnership } = await import("./index.ts")
    const admin = createClient("https://lrgpjimipfkyoqbpsqzz.supabase.co", "test-only-placeholder", { auth: { persistSession: false, autoRefreshToken: false } })
    const security = { id: "test-security", symbol: "TEST", name: "Test", asset_class: "EQUITY" }
    const plan = { version: "P7_IC_EVIDENCE_NORMALIZATION_V2_PERIOD_GUARD" as const, profileCode: "TEST", requirements: [], providerPlan: { structuredParameterCalls: 1, ownershipCalls: 1, documentCalls: 0, stockHistoryCalls: 0, benchmarkHistoryShared: false, parameterHints: [], documentKeywords: [] } }
    const detailed = await writeDetailed(admin, "test-run", security, "12", JSON.stringify({ markdown_data: "12|Test|TEST|1|2026-10-05\nROCE Ann. %\nTEST:12.1234567890123456789\n---" }), plan)
    assert(detailed.metricCount === 0 && detailed.metadataReviewRequired === true, "Detailed capture manufactured readiness")
    assert(detailed.exactFieldCandidates?.[0]?.value === "12.1234567890123456789", "Capture lost decimal precision")
    const ownership = await writeOwnership(admin, "test-run", security, "12", 'chartData:\n  Promoter:\n    ["Quarter","Promoter Holding (%)"], ["Jun 2026",0.0,"0.0 %"]', plan)
    assert(ownership.metricCount === 0 && ownership.metadataReviewRequired === true, "Ownership capture invented reporting scope")
    assert(ownership.quarterCandidates?.[0]?.value === "0.0", "Ownership zero lost")
    assert(writes.length === 2, "Capture exceeded one immutable source row per request")
  } finally { Deno.serve = originalServe; globalThis.fetch = originalFetch }
})
