// Exercise the actual HTTP handler with mocked transport, never a live database.
import coverage from "../../../docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json" with { type: "json" }
type Handler = (request: Request) => Promise<Response>
let handler: Handler
let projectRef = "lrgpjimipfkyoqbpsqzz"
let owned = true
let validUser = true
let nonEmpty = false
const requests: Array<{ method: string; path: string }> = []
const originalServe = Deno.serve
const originalEnvGet = Deno.env.get
const originalFetch = globalThis.fetch
const assert = (value: boolean, message: string) => { if (!value) throw new Error(message) }
const parameters = { action: "P7_IC3_VALIDATE_CANONICAL_INPUTS", portfolioId: "test-portfolio", offset: 0, limit: 40,
  selectionRunId: "00000000-0000-4000-8000-000000000001", evaluationAsOf: "2026-10-05T12:00:00Z", sourceCutoffAt: "2026-10-05T12:00:00Z" }

Deno.test("V1-4 read-only handler authenticates owner, rejects Production and never writes/consumes grants", async () => {
  try {
    Deno.serve = ((fn: Handler) => { handler = fn; return {} }) as typeof Deno.serve
    Deno.env.get = (name: string) => name === "SUPABASE_URL" ? `https://${projectRef}.supabase.co`
      : name === "SUPABASE_SERVICE_ROLE_KEY" ? "test-only-non-secret-key" : undefined
    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(input instanceof Request ? input.url : String(input))
      const method = init?.method ?? (input instanceof Request ? input.method : "GET")
      requests.push({ method, path: url.pathname })
      assert(method === "GET", "Read-only handler attempted a mutation or grant consumption")
      if (url.pathname === "/auth/v1/user") return new Response(JSON.stringify(validUser ? { id: "test-owner" } : { error: "Invalid session" }), { status: validUser ? 200 : 401, headers: { "Content-Type": "application/json" } })
      if (url.pathname === "/rest/v1/portfolios") {
        assert(url.searchParams.get("user_id") === "eq.test-owner", "Portfolio read did not verify owner")
        return new Response(JSON.stringify(owned ? { id: "test-portfolio" } : null), { headers: { "Content-Type": "application/json" } })
      }
      const fixture = coverage.rows[0]!
      const records = url.pathname === "/rest/v1/current_holdings" ? nonEmpty ? [{ security_id: fixture.securityId, current_quantity: "1" }] : []
        : url.pathname === "/rest/v1/securities" ? nonEmpty ? [{ id: fixture.securityId, symbol: fixture.symbol, isin: "TEST", exchange: "NSE", asset_class: "EQUITY" }] : []
        : ["market_benchmarks", "fundamental_metric_definitions", "fundamental_observations", "data_source_records", "market_price_history"].some(table => url.pathname === `/rest/v1/${table}`) ? [] : null
      if (records !== null) return new Response(JSON.stringify(records), { headers: { "Content-Type": "application/json" } })
      throw new Error("Unexpected database read: " + url.pathname)
    }) as typeof fetch
    await import("./index.ts")
    const request = (authorization = true, body = parameters) => new Request("https://example.invalid/validate", {
      method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: "Bearer test-only-session" } : {}) }, body: JSON.stringify(body),
    })
    let response = await handler(request(false))
    assert(response.status === 401 && requests.length === 0, "Unauthenticated request reached storage")
    validUser = false
    response = await handler(request())
    assert(response.status === 401, "Invalid app session accepted")
    validUser = true; owned = false
    response = await handler(request())
    assert(response.status === 404, "Cross-owner portfolio accepted")
    owned = true
    response = await handler(request())
    const body = await response.json()
    assert(response.status === 200 && body.dryRun === true && body.providerCalls === 0, "Owner read-only evaluation failed")
    assert(body.processed === 0 && body.writeTotals.snapshotsCreated === 0 && body.writeTotals.selectionsCreated === 0, "Empty portfolio caused writes")
    assert(requests.every(row => row.method === "GET" && !row.path.includes("rpc") && !row.path.includes("data_source_records")), "Read-only mode consumed a grant or invoked a write RPC")
    nonEmpty = true; requests.length = 0
    response = await handler(request())
    const populated = await response.json()
    assert(response.status === 200 && populated.processed === 1 && populated.results[0].status !== "READY", "Absent input was silently promoted to readiness")
    assert(populated.results[0].items.length > 0 && requests.every(row => row.method === "GET" && !row.path.includes("rpc")), "Populated validation attempted a write")
    nonEmpty = false
    requests.length = 0; projectRef = "uxiyufbsbgzzdujzcdxe"
    response = await handler(request())
    assert(response.status === 409 && requests.length === 0, "Production was not rejected before network access")
    projectRef = "unexpected"
    response = await handler(request())
    assert(response.status === 500 && requests.length === 0, "Unexpected environment was accepted")
    projectRef = "lrgpjimipfkyoqbpsqzz"
    response = await handler(request(true, { ...parameters, action: "REFRESH" }))
    assert(response.status === 400 && requests.length === 0, "Unknown/provider action was accepted")
    response = await handler(request(true, { ...parameters, action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS" }))
    assert(response.status === 401 && requests.length === 0, "Materialization bypassed its one-time grant")
  } finally {
    Deno.serve = originalServe; Deno.env.get = originalEnvGet; globalThis.fetch = originalFetch
  }
})
