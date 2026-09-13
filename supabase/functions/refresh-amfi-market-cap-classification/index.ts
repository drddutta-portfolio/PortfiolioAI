import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as XLSX from "npm:xlsx@0.18.5"

const SOURCE_CODE = "AMFI_OFFICIAL"
const SOURCE_URL = "https://portal.amfiindia.com/spages/AverageMarketCapitalization30Jun2026.xlsx"
const SOURCE_PAGE = "https://www.amfiindia.com/otherdata/categorisation-of-stocks"
const AS_OF_DATE = "2026-06-30"
const FRESH_UNTIL = "2026-12-31T23:59:59.999Z"
const POLICY_CODE = "SEBI_AMFI_FULL_MARKET_CAP_RANK_V1"
const POLICY_VERSION = 1
const RECORD_KIND = "AMFI_MARKET_CAP_RANK_UNIVERSE"
const MAX_BYTES = 8 * 1024 * 1024
const ISIN_RE = /^IN[A-Z0-9]{10}$/

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })

const sha256 = async (bytes: Uint8Array) => {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))
  return Array.from(digest).map((v) => v.toString(16).padStart(2, "0")).join("")
}

const normText = (value: unknown) => typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim()
const normIsin = (value: unknown) => {
  const v = normText(value).toUpperCase().replace(/\s+/g, "")
  return ISIN_RE.test(v) ? v : null
}
const normCategory = (value: unknown): "LARGE_CAP" | "MID_CAP" | "SMALL_CAP" | null => {
  const v = normText(value).toUpperCase().replace(/[^A-Z]/g, "_")
  if (v.includes("LARGE_CAP")) return "LARGE_CAP"
  if (v.includes("MID_CAP")) return "MID_CAP"
  if (v.includes("SMALL_CAP")) return "SMALL_CAP"
  return null
}

interface ParsedRow {
  rank: number
  companyName: string
  isin: string
  nseSymbol: string | null
  marketCapCrore: number
  category: "LARGE_CAP" | "MID_CAP" | "SMALL_CAP"
}

function parseWorkbook(bytes: Uint8Array): ParsedRow[] {
  const workbook = XLSX.read(bytes, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) throw new Error("AMFI_WORKBOOK_HAS_NO_SHEET")
  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null })
  const parsed: ParsedRow[] = []
  const seenRanks = new Set<number>()
  const seenIsins = new Set<string>()

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue
    const rank = Number(row[0])
    if (!Number.isInteger(rank) || rank <= 0) continue
    const isin = normIsin(row[2])
    if (!isin) continue
    const categoryIndex = row.findIndex((value) => normCategory(value) !== null)
    if (categoryIndex < 0) continue
    const category = normCategory(row[categoryIndex])
    if (!category) continue

    let marketCapCrore: number | null = null
    for (let i = categoryIndex - 1; i >= 0; i--) {
      const n = typeof row[i] === "number" ? row[i] as number : Number(normText(row[i]).replace(/,/g, ""))
      if (Number.isFinite(n) && n > 0) { marketCapCrore = n; break }
    }
    if (marketCapCrore === null) continue

    const expected = rank <= 100 ? "LARGE_CAP" : rank <= 250 ? "MID_CAP" : "SMALL_CAP"
    if (category !== expected) throw new Error(`AMFI_RANK_CATEGORY_MISMATCH_${rank}`)
    if (seenRanks.has(rank)) throw new Error(`AMFI_DUPLICATE_RANK_${rank}`)
    if (seenIsins.has(isin)) throw new Error(`AMFI_DUPLICATE_ISIN_${isin}`)
    seenRanks.add(rank)
    seenIsins.add(isin)

    const companyName = normText(row[1])
    const nseSymbol = row.length > 5 && normText(row[5]) && normText(row[5]) !== "-" ? normText(row[5]).toUpperCase() : null
    parsed.push({ rank, companyName, isin, nseSymbol, marketCapCrore, category })
  }

  parsed.sort((a, b) => a.rank - b.rank)
  if (parsed.length < 251) throw new Error("AMFI_UNIVERSE_TOO_SMALL")
  if (parsed[0]?.rank !== 1) throw new Error("AMFI_UNIVERSE_RANK_DOES_NOT_START_AT_1")
  for (let i = 0; i < parsed.length; i++) {
    if (parsed[i].rank !== i + 1) throw new Error(`AMFI_NONCONTIGUOUS_RANK_${i + 1}`)
  }
  return parsed
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json(405, { error: "Method not allowed." })
  const token = request.headers.get("x-portfolioai-amfi-token")
  if (!token) return json(401, { error: "Internal authentication required." })

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!supabaseUrl || !serviceKey) return json(500, { error: "Supabase server configuration is incomplete." })
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const verified = await admin.rpc("verify_amfi_market_cap_refresh_token_v1", { p_token: token })
  if (verified.error || verified.data !== true) return json(401, { error: "Internal authentication failed." })

  let body: { action?: unknown }
  try { body = await request.json() } catch { return json(400, { error: "Invalid JSON body." }) }
  const action = body.action === "RUN" ? "RUN" : body.action === "DRY_RUN" ? "DRY_RUN" : null
  if (!action) return json(400, { error: "Invalid action." })

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), 30000)
  let response: Response
  try {
    response = await fetch(SOURCE_URL, { method: "GET", redirect: "follow", signal: abort.signal })
  } catch {
    clearTimeout(timer)
    return json(502, { error: "Official AMFI source fetch failed." })
  }
  clearTimeout(timer)
  if (!response.ok) return json(502, { error: "Official AMFI source returned a non-success status.", status: response.status })
  const contentLength = Number(response.headers.get("content-length") ?? "0")
  if (Number.isFinite(contentLength) && contentLength > MAX_BYTES) return json(413, { error: "Official AMFI source exceeds the configured size limit." })
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return json(413, { error: "Official AMFI source size is invalid." })

  let universe: ParsedRow[]
  try { universe = parseWorkbook(bytes) } catch (error) {
    return json(422, { error: "Official AMFI workbook validation failed.", code: error instanceof Error ? error.message : "AMFI_PARSE_FAILED" })
  }
  const sourceHash = await sha256(bytes)
  const byIsin = new Map(universe.map((row) => [row.isin, row]))

  const holdingsResult = await admin.from("current_holdings").select("security_id,current_quantity")
  if (holdingsResult.error) return json(500, { error: "Current holdings could not be loaded." })
  const openIds = [...new Set((holdingsResult.data ?? []).filter((row) => Number(row.current_quantity) > 0).map((row) => row.security_id as string))]
  if (!openIds.length) return json(200, { action, universeSize: universe.length, targetCount: 0, matchedCount: 0 })

  const securitiesResult = await admin.from("securities").select("id,symbol,isin,asset_class").in("id", openIds)
  if (securitiesResult.error) return json(500, { error: "Canonical securities could not be loaded." })
  const securities = (securitiesResult.data ?? []).filter((row) => row.asset_class === "EQUITY")
  const targetIds = securities.map((row) => row.id as string)

  const identityResult = await admin.from("security_identity_observations")
    .select("security_id,observed_isin,evidence_status,confidence,created_at")
    .eq("evidence_status", "MATCHED")
    .in("security_id", targetIds)
  if (identityResult.error) return json(500, { error: "Identity evidence could not be loaded." })

  const importResult = await admin.from("import_source_rows")
    .select("resolved_security_id,raw_data")
    .not("resolved_security_id", "is", null)
  if (importResult.error) return json(500, { error: "Imported identity evidence could not be loaded." })

  const isinSets = new Map<string, Set<string>>()
  const addIsin = (securityId: string, value: unknown) => {
    const isin = normIsin(value)
    if (!isin) return
    const set = isinSets.get(securityId) ?? new Set<string>()
    set.add(isin)
    isinSets.set(securityId, set)
  }
  for (const security of securities) addIsin(security.id as string, security.isin)
  for (const row of identityResult.data ?? []) addIsin(row.security_id as string, row.observed_isin)
  for (const row of importResult.data ?? []) {
    const raw = row.raw_data as Record<string, unknown> | null
    const cells = raw && typeof raw === "object" ? raw.cells as Record<string, unknown> | undefined : undefined
    const isinCell = cells?.["ISIN Code"] as Record<string, unknown> | undefined
    addIsin(row.resolved_security_id as string, isinCell?.value)
  }

  const classifications: Array<{ securityId: string; symbol: string; isin: string | null; status: "MATCHED" | "NO_ISIN" | "IDENTITY_CONFLICT" | "NOT_IN_AMFI"; row?: ParsedRow }> = []
  for (const security of securities) {
    const set = isinSets.get(security.id as string) ?? new Set<string>()
    if (set.size === 0) classifications.push({ securityId: security.id as string, symbol: security.symbol as string, isin: null, status: "NO_ISIN" })
    else if (set.size > 1) classifications.push({ securityId: security.id as string, symbol: security.symbol as string, isin: null, status: "IDENTITY_CONFLICT" })
    else {
      const isin = [...set][0]
      const row = byIsin.get(isin)
      classifications.push(row ? { securityId: security.id as string, symbol: security.symbol as string, isin, status: "MATCHED", row } : { securityId: security.id as string, symbol: security.symbol as string, isin, status: "NOT_IN_AMFI" })
    }
  }

  const counts = classifications.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] ?? 0) + 1
    if (item.row) acc[item.row.category] = (acc[item.row.category] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (action === "DRY_RUN") {
    return json(200, {
      action, sourceUrl: SOURCE_URL, sourcePage: SOURCE_PAGE, sourceHash,
      asOfDate: AS_OF_DATE, universeSize: universe.length,
      targetCount: classifications.length, matchedCount: counts.MATCHED ?? 0,
      noIsinCount: counts.NO_ISIN ?? 0, identityConflictCount: counts.IDENTITY_CONFLICT ?? 0,
      notInAmfiCount: counts.NOT_IN_AMFI ?? 0,
      categories: { largeCap: counts.LARGE_CAP ?? 0, midCap: counts.MID_CAP ?? 0, smallCap: counts.SMALL_CAP ?? 0 },
      writes: 0,
    })
  }

  const now = new Date().toISOString()
  const runInsert = await admin.from("data_ingestion_runs").insert({
    source_code: SOURCE_CODE, operation: "MARKET_CAP_CLASSIFICATION_REFRESH",
    orchestration_type: "OFFICIAL_REFERENCE_LIST", trigger_source: "MANUAL", status: "RUNNING",
    requested_count: classifications.length, estimated_call_count: 1, reserved_call_count: 0,
    attempted_call_count: 1, policy_version: POLICY_VERSION,
    metadata: { source_url: SOURCE_URL, source_page: SOURCE_PAGE, source_hash: sourceHash, as_of_date: AS_OF_DATE, universe_size: universe.length },
  }).select("id").single()
  if (runInsert.error) return json(500, { error: "AMFI ingestion run could not be created." })
  const runId = runInsert.data.id as string

  try {
    const sourcePayload = {
      source_url: SOURCE_URL, source_page: SOURCE_PAGE, source_hash: sourceHash,
      as_of_date: AS_OF_DATE, universe_size: universe.length,
      rank_method: "AMFI six-month average full market capitalization across exchanges",
      normalized_only: true,
    }
    const sourceRecord = await admin.from("data_source_records").upsert({
      source_code: SOURCE_CODE, ingestion_run_id: runId, record_kind: RECORD_KIND,
      external_record_id: `AMFI:${AS_OF_DATE}`, source_observed_at: `${AS_OF_DATE}T00:00:00Z`,
      retrieved_at: now, payload_hash: sourceHash, raw_payload: sourcePayload, source_url: SOURCE_URL,
      terms_snapshot: { public_official_source: true, retention_scope: "normalized_public_reference_facts_and_dataset_hash" },
    }, { onConflict: "source_code,record_kind,external_record_id,payload_hash", ignoreDuplicates: false }).select("id").single()
    if (sourceRecord.error) throw sourceRecord.error
    const sourceRecordId = sourceRecord.data.id as string

    let accepted = 0, rejected = 0, conflicting = 0
    const runItems: Record<string, unknown>[] = []
    for (const item of classifications) {
      if (item.status === "IDENTITY_CONFLICT") {
        conflicting++
        runItems.push({ ingestion_run_id: runId, security_id: item.securityId, data_domain: "MARKET_CAP_CLASSIFICATION", status: "CONFLICTING", completed_at: now, safe_reason_code: "IDENTITY_CONFLICT", attempted_call_count: 0, accepted_record_count: 0, metadata: { symbol: item.symbol } })
        continue
      }
      if (item.status === "NO_ISIN") {
        rejected++
        runItems.push({ ingestion_run_id: runId, security_id: item.securityId, data_domain: "MARKET_CAP_CLASSIFICATION", status: "REJECTED", completed_at: now, safe_reason_code: "NO_TRUSTED_ISIN", attempted_call_count: 0, accepted_record_count: 0, metadata: { symbol: item.symbol } })
        continue
      }
      if (item.status === "NOT_IN_AMFI") {
        const assessment = await admin.from("market_cap_category_assessments").upsert({
          security_id: item.securityId, policy_code: POLICY_CODE, policy_version: POLICY_VERSION,
          selected_observation_id: null, category: "INSUFFICIENT_EVIDENCE", rank_used: null,
          assessment_status: "UNAVAILABLE", assessed_at: now,
          reason_code: "NOT_IN_OFFICIAL_AMFI_UNIVERSE",
          evidence: { source_url: SOURCE_URL, as_of_date: AS_OF_DATE, universe_size: universe.length, isin: item.isin, source_hash: sourceHash },
        }, { onConflict: "security_id,policy_code,policy_version" })
        if (assessment.error) throw assessment.error
        rejected++
        runItems.push({ ingestion_run_id: runId, security_id: item.securityId, data_domain: "MARKET_CAP_CLASSIFICATION", status: "REJECTED", completed_at: now, safe_reason_code: "NOT_IN_AMFI_UNIVERSE", attempted_call_count: 0, accepted_record_count: 0, metadata: { symbol: item.symbol, isin: item.isin } })
        continue
      }

      const row = item.row!
      const marketCapInr = Math.round(row.marketCapCrore * 10_000_000 * 100) / 100
      const obs = await admin.from("market_cap_classification_observations").upsert({
        security_id: item.securityId, source_record_id: sourceRecordId, source_code: SOURCE_CODE,
        market_cap: marketCapInr, currency: "INR", capitalization_basis: "FULL",
        as_of_date: AS_OF_DATE, observed_at: `${AS_OF_DATE}T00:00:00Z`, retrieved_at: now,
        fresh_until: FRESH_UNTIL, universe_code: "AMFI_ALL_LISTED_2026H1",
        full_market_cap_rank: row.rank, comparable_status: "AVAILABLE",
      }, { onConflict: "security_id,source_code,as_of_date,capitalization_basis,source_record_id", ignoreDuplicates: false }).select("id").single()
      if (obs.error) throw obs.error

      const assessment = await admin.from("market_cap_category_assessments").upsert({
        security_id: item.securityId, policy_code: POLICY_CODE, policy_version: POLICY_VERSION,
        selected_observation_id: obs.data.id, category: row.category, rank_used: row.rank,
        assessment_status: "AVAILABLE", assessed_at: now, reason_code: "OFFICIAL_AMFI_RANK",
        evidence: { source_url: SOURCE_URL, source_page: SOURCE_PAGE, source_hash: sourceHash,
          as_of_date: AS_OF_DATE, universe_size: universe.length, isin: row.isin,
          nse_symbol: row.nseSymbol, company_name: row.companyName,
          source_market_cap_crore: row.marketCapCrore, normalized_market_cap_unit: "INR" },
      }, { onConflict: "security_id,policy_code,policy_version" })
      if (assessment.error) throw assessment.error
      accepted++
      runItems.push({ ingestion_run_id: runId, security_id: item.securityId, data_domain: "MARKET_CAP_CLASSIFICATION", status: "ACCEPTED", completed_at: now, safe_reason_code: null, attempted_call_count: 0, accepted_record_count: 1, metadata: { symbol: item.symbol, isin: row.isin, rank: row.rank, category: row.category } })
    }

    if (runItems.length) {
      const itemsInsert = await admin.from("data_ingestion_run_items").insert(runItems)
      if (itemsInsert.error) throw itemsInsert.error
    }

    const runUpdate = await admin.from("data_ingestion_runs").update({
      status: conflicting > 0 ? "PARTIAL" : "SUCCEEDED", completed_at: new Date().toISOString(),
      fetched_count: 1, unchanged_count: 0, accepted_count: accepted, conflicting_count: conflicting,
      rejected_count: rejected, failed_count: 0, skipped_count: rejected + conflicting,
      metadata: { source_url: SOURCE_URL, source_page: SOURCE_PAGE, source_hash: sourceHash,
        as_of_date: AS_OF_DATE, universe_size: universe.length,
        categories: { largeCap: counts.LARGE_CAP ?? 0, midCap: counts.MID_CAP ?? 0, smallCap: counts.SMALL_CAP ?? 0 },
        no_isin: counts.NO_ISIN ?? 0, identity_conflicts: counts.IDENTITY_CONFLICT ?? 0,
        not_in_amfi: counts.NOT_IN_AMFI ?? 0 },
    }).eq("id", runId)
    if (runUpdate.error) throw runUpdate.error

    return json(200, { action, runId, sourceHash, universeSize: universe.length,
      targetCount: classifications.length, accepted, rejected, conflicting,
      categories: { largeCap: counts.LARGE_CAP ?? 0, midCap: counts.MID_CAP ?? 0, smallCap: counts.SMALL_CAP ?? 0 } })
  } catch (error) {
    await admin.from("data_ingestion_runs").update({ status: "FAILED", completed_at: new Date().toISOString(), failed_count: 1, metadata: { source_url: SOURCE_URL, source_hash: sourceHash, safe_error: "AMFI_NORMALIZATION_FAILED" } }).eq("id", runId)
    return json(500, { error: "AMFI market-cap normalization failed.", code: error instanceof Error ? error.message : "AMFI_NORMALIZATION_FAILED", runId })
  }
})
