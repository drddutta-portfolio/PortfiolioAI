// Exercise the actual HTTP handler with mocked transport, never a live database.
import coverage from "../../../docs/p7-ic/PortfolioAI_P7_IC1_PORTFOLIO_METHODOLOGY_COVERAGE_2026-09-29.json" with { type: "json" }
type Handler = (request: Request) => Promise<Response>
let handler: Handler
let projectRef = "lrgpjimipfkyoqbpsqzz"
let owned = true
let validUser = true
let nonEmpty = false
let pagedReviews = false
let heldFixtures = [coverage.rows[0]!]
const requests: Array<{ method: string; path: string; range: string | null }> = []
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
      requests.push({ method, path: url.pathname, range: new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).get("range") })
      assert(method === "GET", "Read-only handler attempted a mutation or grant consumption")
      if (url.pathname === "/auth/v1/user") return new Response(JSON.stringify(validUser ? { id: "test-owner" } : { error: "Invalid session" }), { status: validUser ? 200 : 401, headers: { "Content-Type": "application/json" } })
      if (url.pathname === "/rest/v1/portfolios") {
        if (url.searchParams.has("user_id")) {
          assert(url.searchParams.get("user_id") === "eq.test-owner", "Portfolio read did not verify owner")
          return new Response(JSON.stringify(owned ? { id: "test-portfolio" } : null), { headers: { "Content-Type": "application/json" } })
        }
        return new Response(JSON.stringify(owned ? { user_id: "test-owner" } : null), { headers: { "Content-Type": "application/json" } })
      }
      if (url.pathname === "/rest/v1/research_evidence_requirement_reviews") {
        if (!pagedReviews) return new Response("[]", { headers: { "Content-Type": "application/json" } })
        const start = Number(url.searchParams.get("offset") ?? 0)
        const count = start === 0 ? 500 : start === 500 ? 1 : 0
        const rows = Array.from({ length: count }, (_, i) => ({
          id: "review-" + (start + i), portfolio_id: "test-portfolio", security_id: coverage.rows[0]!.securityId,
          requirement_code: "NON_MATCHING_TEST_REQUIREMENT", review_kind: "OWNER_DOCUMENT_REVIEW", decision: "INSUFFICIENT",
          source_record_id: null, research_document_id: null, provider_document_id: null, source_payload_hash: null,
          supporting_quote: null, period_start: null, period_end: null, period_type: null, unit: null, currency: null,
          consolidation_scope: null, published_at: null, retrieved_at: null, fresh_through: null,
          review_version: "V1_4_REQUIREMENT_REVIEW_V2", reviewed_by: "test-owner", reviewed_at: "2026-10-05T11:00:00Z",
          review_hash: "a".repeat(64), supersedes_review_id: null, metadata: {}, created_at: "2026-10-05T11:00:00Z",
        }))
        return new Response(JSON.stringify(rows), { headers: { "Content-Type": "application/json" } })
      }
      if (url.pathname === "/rest/v1/research_documents" || url.pathname === "/rest/v1/research_document_sources")
        return new Response("[]", { headers: { "Content-Type": "application/json" } })
      const records = url.pathname === "/rest/v1/current_holdings" ? nonEmpty ? heldFixtures.map(fixture => ({ security_id: fixture.securityId, current_quantity: "1" })) : []
        : url.pathname === "/rest/v1/securities" ? nonEmpty ? heldFixtures.map(fixture => ({ id: fixture.securityId, symbol: fixture.symbol, isin: "TEST", exchange: "NSE", asset_class: "EQUITY" })) : []
        : ["market_benchmarks", "fundamental_metric_definitions", "fundamental_observations", "data_source_records", "market_price_history"].some(table => url.pathname === `/rest/v1/${table}`) ? [] : null
      if (records !== null) return new Response(JSON.stringify(records), { headers: { "Content-Type": "application/json" } })
      throw new Error("Unexpected database read: " + url.pathname)
    }) as typeof fetch
    await import("./index.ts")
    const request = (authorization = true, body: Record<string, unknown> = parameters) => new Request("https://example.invalid/validate", {
      method: "POST", headers: { "Content-Type": "application/json", ...(authorization ? { Authorization: "Bearer test-only-session" } : {}) }, body: JSON.stringify(body),
    })
    let response = await handler(new Request("https://example.invalid/validate", { method: "OPTIONS", headers: { Origin: "https://portfiolio-ai-git-codex-v1-4-bank-owner-ui-dibyendu-dutta.vercel.app", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "authorization,apikey,content-type,x-client-info" } }))
    assert(response.status === 204 && requests.length === 0, "Browser preflight did not succeed without accessing storage")
    assert(response.headers.get("Access-Control-Allow-Origin") === "*" && response.headers.get("Access-Control-Allow-Methods")?.includes("POST") === true, "Preflight is missing browser CORS headers")
    for (const header of ["authorization", "apikey", "content-type", "x-client-info"]) assert(response.headers.get("Access-Control-Allow-Headers")?.includes(header) === true, "Preflight does not allow Supabase client headers")
    response = await handler(request(false))
    assert(response.headers.get("Access-Control-Allow-Origin") === "*", "Authentication error cannot be read by the browser")
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
    assert(response.headers.get("Access-Control-Allow-Origin") === "*", "Successful validation cannot be read by the browser")
    assert(response.status === 200 && body.dryRun === true && body.providerCalls === 0, "Owner read-only evaluation failed")
    assert(body.processed === 0 && body.writeTotals.snapshotsCreated === 0 && body.writeTotals.selectionsCreated === 0, "Empty portfolio caused writes")
    assert(requests.every(row => row.method === "GET" && !row.path.includes("rpc")), "Read-only mode consumed a grant or invoked a write RPC")
    nonEmpty = true; requests.length = 0
    response = await handler(request())
    const populated = await response.json()
    assert(response.status === 200 && populated.processed === 1 && populated.results[0].status !== "READY", "Absent input was silently promoted to readiness")
    assert(populated.results[0].items.length > 0 && requests.every(row => row.method === "GET" && !row.path.includes("rpc")), "Populated validation attempted a write")
    pagedReviews = true; requests.length = 0
    response = await handler(request())
    assert(response.status === 200, "Paginated review load failed")
    const reviewReads = requests.filter(row => row.path === "/rest/v1/research_evidence_requirement_reviews")
    assert(reviewReads.length >= 2, "Review loading silently stopped at the first API page")
    pagedReviews = false
    const bankSlices = [
      ["BANKBARODA", "ICICIBANK", "SBIN", "FEDERALBNK"],
      ["KARURVYSYA", "KOTAKBANK", "HDFCBANK", "AXISBANK"],
      ["IDFCFIRSTB", "BANDHANBNK", "IDBI", "INDIANB"],
      ["AUBANK"],
    ]
    heldFixtures = coverage.rows.filter(row => bankSlices.flat().includes(row.symbol))
    assert(heldFixtures.length === 13, "Bank fixture must match all thirteen planned identities")
    const targeted: Record<string, unknown> = { ...parameters }
    delete targeted.offset; delete targeted.limit
    for (const symbols of bankSlices) {
      const ids = symbols.map(symbol => heldFixtures.find(row => row.symbol === symbol)!.securityId)
      requests.length = 0
      response = await handler(request(true, { ...targeted, securityIds: ids }))
      const result = await response.json()
      assert(response.status === 200, "Explicit banking slice was rejected")
      assert(result.processed === ids.length && result.nextOffset === null && result.offset === null, "Targeted slice was treated as a pagination window")
      assert(JSON.stringify(result.results.map((row: { securityId: string }) => row.securityId)) === JSON.stringify(ids), "Handler evaluated different banks or changed request order")
      assert(result.providerCalls === 0 && result.writeTotals.snapshotsCreated === 0 && result.writeTotals.selectionsCreated === 0, "Targeted validation mutated snapshots")
      assert(requests.every(row => row.method === "GET" && !row.path.includes("rpc")), "Targeted validation attempted a write or grant consumption")
    }
    const bankId = heldFixtures[0]!.securityId
    for (const ids of [[bankId, bankId], [], ["invalid"], Array(41).fill(bankId)]) {
      requests.length = 0
      response = await handler(request(true, { ...targeted, securityIds: ids }))
      assert(response.status === 400 && requests.length === 0, "Malformed targeting reached storage")
    }
    requests.length = 0
    response = await handler(request(true, { ...targeted, securityIds: [bankId, "00000000-0000-4000-8000-000000000099"] }))
    assert(response.status === 403, "Mixed-portfolio or unheld security was accepted")
    assert(!requests.some(row => row.path.includes("fundamental") || row.path.includes("data_source_records")), "Rejected selection loaded source evidence")
    requests.length = 0
    response = await handler(request(false, { ...targeted, securityIds: [bankId] }))
    assert(response.status === 401 && requests.length === 0, "Targeted validation bypassed owner authentication")
    owned = false
    response = await handler(request(true, { ...targeted, securityIds: [bankId] }))
    assert(response.status === 404, "Targeted validation bypassed portfolio ownership")
    owned = true; requests.length = 0
    response = await handler(request(true, { ...targeted, securityIds: [bankId], sourceCutoffAt: "2026-10-04T12:00:00Z" }))
    assert(response.status === 400 && requests.length === 0, "Targeted validation accepted an invalid cutoff")
    response = await handler(request(true, { ...targeted, securityIds: [bankId], action: "P7_IC3_MATERIALIZE_CANONICAL_SNAPSHOTS" }))
    assert(response.status === 400 && requests.length === 0, "Targeted selection extended write-grant scope")
    heldFixtures = [coverage.rows[0]!]
    pagedReviews = false; nonEmpty = false
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
