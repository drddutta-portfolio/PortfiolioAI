import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import {
  ACTION,
  CAMPAIGN_ID,
  COMPLETION_KIND,
  CONSUMED_KIND,
  DEV_REF,
  EXPERIMENT_ID,
  GRANT_SOURCE,
  PLAN_HASH,
  PORTFOLIO_ID,
  PROD_REF,
  Json,
  campaignCounts,
  clean,
  deterministicUuid,
  isHash,
  projectRef,
  reply,
  sha256,
  validateGrant,
} from "./shared.ts"

const ALLOWED_SOURCE_KINDS = new Set([
  "NSE_CM_BHAVCOPY_LEGACY",
  "NSE_CM_BHAVCOPY_UDIFF",
  "NSE_CORPORATE_ACTIONS",
  "NSE_INDICES_NIFTY500_TRI",
])

const ALLOWED_PRICE_FORMATS = new Set([
  "LEGACY_BHAVCOPY",
  "UDIFF_BHAVCOPY",
])

function dateOk(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(value)
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === "") return null
  const text = clean(value)
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) {
    throw new Error("P8_B3_NON_CANONICAL_DECIMAL:" + text)
  }
  return text
}

async function insertArchive(
  admin: ReturnType<typeof createClient>,
  archive: Json,
) {
  const sourceKind = clean(archive.source_kind)
  const archiveHash = clean(archive.archive_hash)
  const contentHash = clean(archive.content_sha256)
  const compressedHash = archive.compressed_sha256 === null ||
      archive.compressed_sha256 === undefined
    ? null
    : clean(archive.compressed_sha256)
  const periodStart = clean(archive.source_period_start)
  const periodEnd = clean(archive.source_period_end)
  const sourceUrl = clean(archive.source_url)
  const sourceFileName = clean(archive.source_file_name) || null
  const retrievedAt = clean(archive.retrieved_at)
  const contractVersion = clean(archive.source_contract_version)

  if (
    !ALLOWED_SOURCE_KINDS.has(sourceKind) ||
    !isHash(archiveHash) ||
    !isHash(contentHash) ||
    (compressedHash !== null && !isHash(compressedHash)) ||
    !dateOk(periodStart) ||
    !dateOk(periodEnd) ||
    !sourceUrl.startsWith("https://") ||
    !retrievedAt ||
    !contractVersion
  ) {
    throw new Error("P8_B3_ARCHIVE_CONTRACT")
  }

  if (
    sourceKind.startsWith("NSE_CM_") &&
    !sourceUrl.startsWith("https://nsearchives.nseindia.com/")
  ) {
    throw new Error("P8_B3_PRICE_ARCHIVE_NON_OFFICIAL_HOST")
  }
  if (
    sourceKind === "NSE_CORPORATE_ACTIONS" &&
    !sourceUrl.startsWith("https://www.nseindia.com/")
  ) {
    throw new Error("P8_B3_ACTION_ARCHIVE_NON_OFFICIAL_HOST")
  }
  if (
    sourceKind === "NSE_INDICES_NIFTY500_TRI" &&
    !sourceUrl.startsWith("https://www.niftyindices.com/")
  ) {
    throw new Error("P8_B3_BENCHMARK_ARCHIVE_NON_OFFICIAL_HOST")
  }

  const id = await deterministicUuid(
    CAMPAIGN_ID + "|archive|" + sourceKind + "|" + archiveHash,
  )
  const row = {
    id,
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    source_kind: sourceKind,
    source_period_start: periodStart,
    source_period_end: periodEnd,
    source_url: sourceUrl,
    source_file_name: sourceFileName,
    content_sha256: contentHash,
    compressed_sha256: compressedHash,
    source_published_at: archive.source_published_at ?? null,
    retrieved_at: retrievedAt,
    source_contract_version: contractVersion,
    archive_hash: archiveHash,
    raw_metadata: {
      ...(archive.raw_metadata && typeof archive.raw_metadata === "object"
        ? archive.raw_metadata as Json
        : {}),
      campaign_id: CAMPAIGN_ID,
      plan_hash: PLAN_HASH,
    },
    created_by: null,
  }

  const write = await admin.from("p8_b3_source_archives").upsert(row, {
    onConflict: "id",
    ignoreDuplicates: true,
  })
  if (write.error) throw write.error

  const verify = await admin.from("p8_b3_source_archives")
    .select("id,archive_hash,content_sha256,source_kind")
    .eq("id", id)
    .single()
  if (
    verify.error ||
    verify.data.archive_hash !== archiveHash ||
    verify.data.content_sha256 !== contentHash ||
    verify.data.source_kind !== sourceKind
  ) {
    throw new Error("P8_B3_ARCHIVE_VERIFY_FAILED")
  }

  return { archive_id: id, archive_hash: archiveHash, source_kind: sourceKind }
}

async function priceBatch(
  admin: ReturnType<typeof createClient>,
  archiveId: string,
  rows: Json[],
) {
  if (rows.length < 1 || rows.length > 600) {
    throw new Error("P8_B3_PRICE_BATCH_SIZE")
  }

  const isins = [...new Set(rows.map((row) => clean(row.historical_isin))
    .filter((isin) => /^[A-Z0-9]{12}$/u.test(isin)))]
  if (!isins.length) return { submitted: rows.length, resolved: 0, skipped_unknown_isin: rows.length }

  const identities = await admin.from("p8_historical_security_identities")
    .select("id,historical_isin")
    .eq("portfolio_id", PORTFOLIO_ID)
    .eq("experiment_id", EXPERIMENT_ID)
    .in("historical_isin", isins)

  if (identities.error) throw identities.error

  const byIsin = new Map<string, string>()
  for (const identity of identities.data ?? []) {
    const isin = clean(identity.historical_isin)
    if (byIsin.has(isin)) throw new Error("P8_B3_DUPLICATE_HISTORICAL_ISIN:" + isin)
    byIsin.set(isin, clean(identity.id))
  }

  const payload = []
  let skipped = 0

  for (const row of rows) {
    const isin = clean(row.historical_isin)
    const identityId = byIsin.get(isin)
    if (!identityId) {
      skipped += 1
      continue
    }

    const rowHash = clean(row.row_hash)
    const sourceFormat = clean(row.source_format)
    const tradeDate = clean(row.trade_date)
    const symbol = clean(row.trading_symbol)
    const series = clean(row.series) || null

    if (
      !isHash(rowHash) ||
      !ALLOWED_PRICE_FORMATS.has(sourceFormat) ||
      !dateOk(tradeDate) ||
      !symbol
    ) {
      throw new Error("P8_B3_PRICE_ROW_CONTRACT")
    }

    payload.push({
      id: await deterministicUuid(
        CAMPAIGN_ID + "|price|" + archiveId + "|" + identityId + "|" + rowHash,
      ),
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      historical_identity_id: identityId,
      source_archive_id: archiveId,
      trade_date: tradeDate,
      exchange: "NSE",
      trading_symbol: symbol,
      series,
      source_format: sourceFormat,
      previous_close: numberOrNull(row.previous_close),
      open: numberOrNull(row.open),
      high: numberOrNull(row.high),
      low: numberOrNull(row.low),
      close: numberOrNull(row.close),
      last_price: numberOrNull(row.last_price),
      volume: numberOrNull(row.volume),
      traded_value: numberOrNull(row.traded_value),
      trade_count: numberOrNull(row.trade_count),
      row_hash: rowHash,
      raw_metadata: {
        ...(row.raw_metadata && typeof row.raw_metadata === "object"
          ? row.raw_metadata as Json
          : {}),
        campaign_id: CAMPAIGN_ID,
        plan_hash: PLAN_HASH,
        historical_isin: isin,
      },
    })
  }

  if (payload.length) {
    const write = await admin.from("p8_b3_raw_market_price_observations")
      .upsert(payload, {
        onConflict:
          "portfolio_id,experiment_id,source_archive_id,historical_identity_id,row_hash",
        ignoreDuplicates: true,
      })
    if (write.error) throw write.error
  }

  return {
    submitted: rows.length,
    resolved: payload.length,
    skipped_unknown_isin: skipped,
  }
}

async function listingObservations(
  admin: ReturnType<typeof createClient>,
  symbols: string[],
) {
  const rows: Array<{
    historical_identity_id: string
    trading_symbol: string
    series: string | null
    source_date: string
  }> = []
  const PAGE = 1000

  for (let offset = 0;; offset += PAGE) {
    const result = await admin.from("p8_historical_listing_observations_v3")
      .select("historical_identity_id,trading_symbol,series,source_date")
      .eq("portfolio_id", PORTFOLIO_ID)
      .eq("experiment_id", EXPERIMENT_ID)
      .in("trading_symbol", symbols)
      .range(offset, offset + PAGE - 1)

    if (result.error) throw result.error
    rows.push(...(result.data ?? []))
    if ((result.data ?? []).length < PAGE) break
  }

  return rows
}

function resolveActionIdentity(
  row: Json,
  observations: Awaited<ReturnType<typeof listingObservations>>,
) {
  const symbol = clean(row.raw_symbol)
  const series = clean(row.raw_series)
  const exDate = clean(row.ex_date)

  const matching = observations.filter((obs) =>
    clean(obs.trading_symbol) === symbol &&
    (!series || !obs.series || clean(obs.series) === series)
  )

  const ranges = new Map<string, { min: string; max: string }>()
  for (const obs of matching) {
    const id = clean(obs.historical_identity_id)
    const date = clean(obs.source_date)
    const current = ranges.get(id)
    if (!current) ranges.set(id, { min: date, max: date })
    else {
      if (date < current.min) current.min = date
      if (date > current.max) current.max = date
    }
  }

  const all = [...ranges.entries()]
  if (all.length === 1) {
    return {
      state: "RESOLVED",
      historical_identity_id: all[0][0],
      candidates: all.map(([id, range]) => ({ id, ...range })),
    }
  }

  if (all.length > 1 && dateOk(exDate)) {
    const bracketed = all.filter(([, range]) =>
      range.min <= exDate && exDate <= range.max
    )
    if (bracketed.length === 1) {
      return {
        state: "RESOLVED",
        historical_identity_id: bracketed[0][0],
        candidates: all.map(([id, range]) => ({ id, ...range })),
      }
    }
  }

  return {
    state: all.length ? "AMBIGUOUS" : "UNRESOLVED",
    historical_identity_id: null,
    candidates: all.map(([id, range]) => ({ id, ...range })),
  }
}

async function actionBatch(
  admin: ReturnType<typeof createClient>,
  archiveId: string,
  rows: Json[],
) {
  if (rows.length < 1 || rows.length > 300) {
    throw new Error("P8_B3_ACTION_BATCH_SIZE")
  }

  const symbols = [...new Set(rows.map((row) => clean(row.raw_symbol))
    .filter(Boolean))]
  const observations = symbols.length
    ? await listingObservations(admin, symbols)
    : []

  const payload = []
  let resolved = 0
  let ambiguous = 0
  let unresolved = 0

  for (const row of rows) {
    const symbol = clean(row.raw_symbol)
    const purpose = clean(row.raw_purpose)
    const observationHash = clean(row.observation_hash)
    if (!symbol || !purpose || !isHash(observationHash)) {
      throw new Error("P8_B3_ACTION_ROW_CONTRACT")
    }

    const identity = resolveActionIdentity(row, observations)
    if (identity.state === "RESOLVED") resolved += 1
    else if (identity.state === "AMBIGUOUS") ambiguous += 1
    else unresolved += 1

    payload.push({
      id: await deterministicUuid(
        CAMPAIGN_ID + "|action|" + archiveId + "|" + observationHash,
      ),
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      source_archive_id: archiveId,
      historical_identity_id: identity.historical_identity_id,
      identity_resolution_state: identity.state,
      raw_symbol: symbol,
      raw_company_name: clean(row.raw_company_name) || null,
      raw_series: clean(row.raw_series) || null,
      raw_purpose: purpose,
      face_value: numberOrNull(row.face_value),
      ex_date: dateOk(row.ex_date) ? row.ex_date : null,
      record_date: dateOk(row.record_date) ? row.record_date : null,
      book_closure_start: dateOk(row.book_closure_start)
        ? row.book_closure_start
        : null,
      book_closure_end: dateOk(row.book_closure_end)
        ? row.book_closure_end
        : null,
      observation_hash: observationHash,
      raw_metadata: {
        ...(row.raw_metadata && typeof row.raw_metadata === "object"
          ? row.raw_metadata as Json
          : {}),
        campaign_id: CAMPAIGN_ID,
        plan_hash: PLAN_HASH,
        identity_candidates: identity.candidates,
      },
    })
  }

  const write = await admin.from("p8_b3_corporate_action_observations")
    .upsert(payload, {
      onConflict:
        "portfolio_id,experiment_id,source_archive_id,observation_hash",
      ignoreDuplicates: true,
    })
  if (write.error) throw write.error

  return {
    submitted: rows.length,
    resolved,
    ambiguous,
    unresolved,
  }
}

async function benchmarkBatch(
  admin: ReturnType<typeof createClient>,
  archiveId: string,
  rows: Json[],
) {
  if (rows.length < 1 || rows.length > 40) {
    throw new Error("P8_B3_BENCHMARK_BATCH_SIZE")
  }

  const payload = []
  for (const row of rows) {
    const tradeDate = clean(row.trade_date)
    const rowHash = clean(row.row_hash)
    if (
      !dateOk(tradeDate) ||
      !isHash(rowHash) ||
      clean(row.benchmark_version) !== "P8_NIFTY500_TRI_V1" ||
      clean(row.benchmark_code) !== "NIFTY_500"
    ) {
      throw new Error("P8_B3_BENCHMARK_ROW_CONTRACT")
    }

    payload.push({
      id: await deterministicUuid(
        CAMPAIGN_ID + "|benchmark|" + tradeDate + "|" + rowHash,
      ),
      portfolio_id: PORTFOLIO_ID,
      experiment_id: EXPERIMENT_ID,
      source_archive_id: archiveId,
      benchmark_version: "P8_NIFTY500_TRI_V1",
      benchmark_code: "NIFTY_500",
      trade_date: tradeDate,
      total_return_index: numberOrNull(row.total_return_index),
      net_total_return_index: numberOrNull(row.net_total_return_index),
      row_hash: rowHash,
      raw_metadata: {
        ...(row.raw_metadata && typeof row.raw_metadata === "object"
          ? row.raw_metadata as Json
          : {}),
        campaign_id: CAMPAIGN_ID,
        plan_hash: PLAN_HASH,
      },
    })
  }

  const write = await admin.from("p8_b3_benchmark_total_return_history")
    .upsert(payload, {
      onConflict:
        "portfolio_id,experiment_id,benchmark_version,benchmark_code,trade_date,row_hash",
      ignoreDuplicates: true,
    })
  if (write.error) throw write.error

  return { submitted: rows.length }
}

async function derivedCounts(admin: ReturnType<typeof createClient>) {
  const tables = [
    "p8_b3_corporate_action_normalizations",
    "p8_b3_adjustment_factors",
    "p8_b3_adjusted_market_price_series",
  ]
  const out: Record<string, number> = {}
  for (const table of tables) {
    const result = await admin.from(table)
      .select("id", { count: "exact", head: true })
      .eq("portfolio_id", PORTFOLIO_ID)
      .eq("experiment_id", EXPERIMENT_ID)
    if (result.error) throw result.error
    out[table] = result.count ?? 0
  }
  return out
}

async function completeCampaign(
  admin: ReturnType<typeof createClient>,
  grantId: string,
  summary: Json,
) {
  const required = [
    "source_archives",
    "price_archives",
    "benchmark_archives",
    "action_archives",
    "raw_price_rows",
    "corporate_action_rows",
    "benchmark_rows",
    "proven_trading_dates",
  ]

  const expected: Record<string, number> = {}
  for (const key of required) {
    const value = Number(summary[key])
    if (!Number.isInteger(value) || value < 0) {
      throw new Error("P8_B3_COMPLETION_SUMMARY:" + key)
    }
    expected[key] = value
  }

  if (
    expected.benchmark_archives !== 36 ||
    expected.action_archives !== 36 ||
    expected.price_archives !== expected.proven_trading_dates ||
    expected.benchmark_rows !== expected.proven_trading_dates ||
    expected.source_archives !==
      expected.price_archives +
        expected.benchmark_archives +
        expected.action_archives
  ) {
    throw new Error("P8_B3_COMPLETION_CONTROL_MISMATCH")
  }

  const counts = await campaignCounts(admin)
  if (
    counts.p8_b3_source_archives !== expected.source_archives ||
    counts.p8_b3_raw_market_price_observations !== expected.raw_price_rows ||
    counts.p8_b3_corporate_action_observations !== expected.corporate_action_rows ||
    counts.p8_b3_benchmark_total_return_history !== expected.benchmark_rows
  ) {
    throw new Error("P8_B3_COMPLETION_DB_COUNT_MISMATCH")
  }

  const derived = await derivedCounts(admin)
  if (Object.values(derived).some((value) => value !== 0)) {
    throw new Error("P8_B3_DERIVED_ROWS_EXIST_DURING_SOURCE_ACQUISITION")
  }

  const completedAt = new Date().toISOString()
  const completionPayload = {
    action: ACTION,
    campaign_id: CAMPAIGN_ID,
    plan_hash: PLAN_HASH,
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    expected,
    counts,
    derived,
    runner_summary: summary,
    completed_at: completedAt,
  }
  const completionHash = await sha256(completionPayload)

  const completion = await admin.from("data_source_records").upsert({
    source_code: GRANT_SOURCE,
    record_kind: COMPLETION_KIND,
    external_record_id: PLAN_HASH,
    payload_hash: completionHash,
    raw_payload: completionPayload,
    retrieved_at: completedAt,
    terms_snapshot: {
      mode: "P8_B3_FULL_SOURCE_ACQUISITION_COMPLETION",
      paid_provider_calls: 0,
      derived_rows: 0,
      production_change: false,
    },
  }, {
    onConflict: "source_code,record_kind,external_record_id,payload_hash",
    ignoreDuplicates: true,
  })
  if (completion.error) throw completion.error

  const consumedPayload = {
    grant_id: grantId,
    action: ACTION,
    campaign_id: CAMPAIGN_ID,
    plan_hash: PLAN_HASH,
    completed_at: completedAt,
  }
  const consumed = await admin.from("data_source_records").upsert({
    source_code: GRANT_SOURCE,
    record_kind: CONSUMED_KIND,
    external_record_id: grantId,
    payload_hash: await sha256(consumedPayload),
    raw_payload: consumedPayload,
    retrieved_at: completedAt,
    terms_snapshot: {
      mode: "P8_B3_ONE_CAMPAIGN_EXECUTION_GRANT",
      paid_provider_calls: 0,
    },
  }, {
    onConflict: "source_code,record_kind,external_record_id,payload_hash",
    ignoreDuplicates: true,
  })
  if (consumed.error) throw consumed.error

  return { counts, derived, completion_hash: completionHash }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return reply(405, { error: "Method not allowed." })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  const ref = projectRef(supabaseUrl)

  if (ref === PROD_REF) {
    return reply(409, {
      error: "P8-B3 acquisition refuses Production.",
      code: "UNEXPECTED_PRODUCTION_DB_TARGET",
    })
  }
  if (ref !== DEV_REF || !serviceKey) {
    return reply(500, {
      error: "PortfolioAI Dev runtime configuration is incomplete.",
      code: "P8_B3_RUNTIME_CONFIG",
    })
  }

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  try {
    const body = await request.json() as Json
    if (body.action !== ACTION) {
      return reply(400, { error: "Exact B3 action required.", code: "P8_B3_ACTION" })
    }
    if (body.planHash !== PLAN_HASH || body.campaignId !== CAMPAIGN_ID) {
      return reply(409, {
        error: "B3 plan/campaign mismatch.",
        code: "P8_B3_PLAN_HASH",
      })
    }

    const grant = await validateGrant(admin, body.grantId)
    if (!grant.ok) {
      return reply(401, {
        error: "B3 acquisition grant rejected.",
        code: grant.code,
      })
    }

    const operation = clean(body.operation)
    if (grant.consumed && operation !== "status") {
      return reply(409, {
        error: "B3 acquisition grant already consumed.",
        code: "P8_B3_GRANT_ALREADY_USED",
      })
    }

    if (operation === "status") {
      return reply(200, {
        status: "OK",
        consumed: grant.consumed,
        counts: await campaignCounts(admin),
        derived: await derivedCounts(admin),
      })
    }

    if (operation === "archive") {
      return reply(200, {
        status: "OK",
        operation,
        ...await insertArchive(
          admin,
          body.archive && typeof body.archive === "object"
            ? body.archive as Json
            : {},
        ),
      })
    }

    if (operation === "price_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await priceBatch(
          admin,
          clean(body.archiveId),
          Array.isArray(body.rows) ? body.rows as Json[] : [],
        ),
      })
    }

    if (operation === "action_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await actionBatch(
          admin,
          clean(body.archiveId),
          Array.isArray(body.rows) ? body.rows as Json[] : [],
        ),
      })
    }

    if (operation === "benchmark_batch") {
      return reply(200, {
        status: "OK",
        operation,
        ...await benchmarkBatch(
          admin,
          clean(body.archiveId),
          Array.isArray(body.rows) ? body.rows as Json[] : [],
        ),
      })
    }

    if (operation === "complete_campaign") {
      return reply(200, {
        status: "COMPLETE",
        operation,
        ...await completeCampaign(
          admin,
          grant.grantId,
          body.summary && typeof body.summary === "object"
            ? body.summary as Json
            : {},
        ),
      })
    }

    return reply(400, {
      error: "Unknown B3 acquisition operation.",
      code: "P8_B3_OPERATION",
    })
  } catch (error) {
    let detail: Json

    if (error instanceof Error) {
      detail = {
        code: error.message,
        error_type: error.name,
      }
    } else if (error && typeof error === "object") {
      const row = error as Record<string, unknown>
      detail = {
        code: clean(row.code) || "P8_B3_SOURCE_ACQUISITION_FAILED",
        database_message: clean(row.message) || null,
        database_details: clean(row.details) || null,
        database_hint: clean(row.hint) || null,
      }
    } else {
      detail = {
        code: "P8_B3_SOURCE_ACQUISITION_FAILED",
        database_message: clean(error) || null,
      }
    }

    console.error("P8_B3_SOURCE_ACQUISITION_STOP", detail)
    return reply(500, {
      error: "P8-B3 source acquisition stopped safely.",
      ...detail,
    })
  }
})
