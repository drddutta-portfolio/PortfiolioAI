#!/usr/bin/env node
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const CAMPAIGN_ID = "P8_B3_ACTION_TRI_CANARY_20261001_V1"
const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
const OUT =
  process.env.P8_B3_ACTION_TRI_CANARY_OUT ??
  "tmp/p8-b3/durable-canary/P8_B3_ACTION_TRI_CANARY_PAYLOAD.json"
const CACHE_DIR =
  process.env.P8_B3_ACTION_TRI_CACHE_DIR ??
  "tmp/p8-b3/durable-canary/artifacts"

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const ACTION = {
  symbol: "BEL",
  expectedHistoricalIsin: "INE263A01024",
  expectedHistoricalIdentityId: "abb92c43-9463-5a06-b5db-8b795d78cf62",
  pageUrl:
    "https://www.nseindia.com/companies-listing/corporate-filings-actions?symbol=BEL",
  apiUrl:
    "https://www.nseindia.com/api/corporates-corporateActions?index=equities&symbol=BEL",
  expectedPurpose: "Interim Dividend - Rs 1.95 Per Share",
  expectedExDate: "06-Mar-2026",
  expectedRecordDate: "06-Mar-2026",
  sourceContractVersion: "P8_B3_NSE_CORPORATE_ACTIONS_V1",
}

const TRI = {
  pageUrl: "https://www.niftyindices.com/reports/historical-data",
  endpoint:
    "https://www.niftyindices.com/BackPage/getTotalReturnIndexString",
  indexName: "NIFTY 500",
  startDate: "01-Jan-2024",
  endDate: "31-Jan-2024",
  selectedDateIso: "2024-01-31",
  benchmarkVersion: "P8_NIFTY500_TRI_V1",
  sourceContractVersion: "P8_B3_NSE_INDICES_TRI_V1",
}

mkdirSync(dirname(OUT), { recursive: true })
mkdirSync(CACHE_DIR, { recursive: true })

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function firstDefined(row, keys) {
  for (const key of keys) {
    const value = row?.[key]
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value
    }
  }
  return null
}

function canonicalText(value) {
  const text = String(value ?? "").trim()
  return text === "" ? null : text
}

function canonicalDecimal(value, label, { nullable = false } = {}) {
  const text = String(value ?? "").replaceAll(",", "").trim()
  if (!text) {
    if (nullable) return null
    throw new Error(label + " is required")
  }
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) {
    throw new Error(label + " is not a canonical decimal: " + text)
  }
  const number = Number(text)
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(label + " must be finite and > 0")
  }
  return text
}

function normalizeDate(value) {
  const raw = String(value ?? "").trim()
  if (!raw) return null

  if (/^\d{4}-\d{2}-\d{2}$/u.test(raw)) return raw

  const mon = {
    JAN:"01", FEB:"02", MAR:"03", APR:"04", MAY:"05", JUN:"06",
    JUL:"07", AUG:"08", SEP:"09", OCT:"10", NOV:"11", DEC:"12",
  }

  const match = raw.toUpperCase().match(/^(\d{1,2})[-\/ ]([A-Z]{3})[-\/ ](\d{4})$/u)
  if (match) {
    const [, dd, mmm, yyyy] = match
    assert(mon[mmm], "unknown month in date: " + raw)
    return `${yyyy}-${mon[mmm]}-${dd.padStart(2, "0")}`
  }

  const numeric = raw.match(/^(\d{1,2})[\/](\d{1,2})[\/](\d{4})$/u)
  if (numeric) {
    const [, dd, mm, yyyy] = numeric
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`
  }

  throw new Error("unsupported date format: " + raw)
}

async function fetchWithRetry(url, options = {}, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)
      const response = await fetch(url, {
        redirect: "follow",
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timer)

      if (response.ok) return response

      const body = await response.text().catch(() => "")
      lastError = new Error(
        `HTTP ${response.status} for ${url}: ${body.slice(0, 240)}`,
      )
    } catch (error) {
      lastError = error
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
    }
  }

  throw lastError ?? new Error("request failed: " + url)
}

function cookieHeaderFrom(response) {
  const getter = response.headers.getSetCookie
  if (typeof getter === "function") {
    return getter
      .call(response.headers)
      .map((value) => value.split(";", 1)[0])
      .join("; ")
  }

  const combined = response.headers.get("set-cookie")
  if (!combined) return ""

  return combined
    .split(/,(?=[^;,]+=)/u)
    .map((value) => value.split(";", 1)[0].trim())
    .join("; ")
}

async function loadOrFetch(name, fetcher) {
  const path = join(CACHE_DIR, name)
  if (existsSync(path)) {
    return {
      bytes: readFileSync(path),
      retrievalMode: "CACHE",
      path,
    }
  }

  const bytes = await fetcher()
  writeFileSync(path, bytes)
  return {
    bytes,
    retrievalMode: "NETWORK",
    path,
  }
}

async function buildCorporateAction() {
  const loaded = await loadOrFetch(
    "NSE_CORPORATE_ACTION_BEL_20260306.json",
    async () => {
      const page = await fetchWithRetry(ACTION.pageUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      })
      assert(
        new URL(page.url).hostname === "www.nseindia.com",
        "BEL corporate-action page left official NSE host",
      )
      const pageText = await page.text()
      assert(
        /Corporate Actions/i.test(pageText),
        "BEL corporate-action page marker missing",
      )

      const cookie = cookieHeaderFrom(page)
      const api = await fetchWithRetry(ACTION.apiUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json,text/plain,*/*",
          Referer: ACTION.pageUrl,
          ...(cookie ? { Cookie: cookie } : {}),
        },
      })
      assert(
        new URL(api.url).hostname === "www.nseindia.com",
        "BEL corporate-action API left official NSE host",
      )

      return Buffer.from(await api.arrayBuffer())
    },
  )

  let payload
  try {
    payload = JSON.parse(loaded.bytes.toString("utf8"))
  } catch {
    throw new Error("BEL corporate-action response is not valid JSON")
  }

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : null
  assert(Array.isArray(rows), "BEL corporate-action response has no row array")
  assert(rows.length > 0, "BEL corporate-action response has zero rows")

  const normalized = rows.map((row) => ({
    symbol: canonicalText(firstDefined(row, ["symbol", "SYMBOL"])),
    company_name: canonicalText(
      firstDefined(row, ["comp", "companyName", "company_name", "COMPANY NAME"]),
    ),
    series: canonicalText(firstDefined(row, ["series", "SERIES"])),
    purpose: canonicalText(firstDefined(row, ["subject", "purpose", "PURPOSE"])),
    face_value: canonicalText(
      firstDefined(row, ["faceVal", "faceValue", "face_value", "FACE VALUE"]),
    ),
    ex_date: normalizeDate(
      firstDefined(row, ["exDate", "ex_date", "EX-DATE"]),
    ),
    record_date: firstDefined(row, [
      "recDate",
      "recordDate",
      "record_date",
      "RECORD DATE",
    ])
      ? normalizeDate(
          firstDefined(row, [
            "recDate",
            "recordDate",
            "record_date",
            "RECORD DATE",
          ]),
        )
      : null,
    book_closure_start: firstDefined(row, [
      "bcStartDate",
      "bookClosureStartDate",
      "BOOK CLOSURE START DATE",
    ])
      ? normalizeDate(
          firstDefined(row, [
            "bcStartDate",
            "bookClosureStartDate",
            "BOOK CLOSURE START DATE",
          ]),
        )
      : null,
    book_closure_end: firstDefined(row, [
      "bcEndDate",
      "bookClosureEndDate",
      "BOOK CLOSURE END DATE",
    ])
      ? normalizeDate(
          firstDefined(row, [
            "bcEndDate",
            "bookClosureEndDate",
            "BOOK CLOSURE END DATE",
          ]),
        )
      : null,
  }))

  const selected = normalized.filter(
    (row) =>
      row.symbol === ACTION.symbol &&
      row.ex_date === normalizeDate(ACTION.expectedExDate) &&
      row.record_date === normalizeDate(ACTION.expectedRecordDate) &&
      row.purpose === ACTION.expectedPurpose,
  )

  assert(
    selected.length === 1,
    "BEL expected corporate action matches: " + selected.length,
  )

  const row = selected[0]
  assert(row.series === "EQ", "BEL corporate action series is not EQ")
  assert(row.company_name, "BEL company name missing")
  assert(row.face_value !== null, "BEL face value missing")

  const normalizedRow = {
    historical_identity_id: ACTION.expectedHistoricalIdentityId,
    historical_isin: ACTION.expectedHistoricalIsin,
    identity_resolution_state: "RESOLVED",
    raw_symbol: row.symbol,
    raw_company_name: row.company_name,
    raw_series: row.series,
    raw_purpose: row.purpose,
    face_value: canonicalDecimal(row.face_value, "BEL face_value"),
    ex_date: row.ex_date,
    record_date: row.record_date,
    book_closure_start: row.book_closure_start,
    book_closure_end: row.book_closure_end,
  }

  const rawSha = sha256(loaded.bytes)
  const observationHash = sha256(JSON.stringify(normalizedRow))

  return {
    source_archive: {
      source_kind: "NSE_CORPORATE_ACTIONS",
      source_period_start: normalizedRow.ex_date,
      source_period_end: normalizedRow.ex_date,
      source_url: ACTION.apiUrl,
      source_page_url: ACTION.pageUrl,
      source_file_name: "NSE_CORPORATE_ACTION_BEL_20260306.json",
      content_sha256: rawSha,
      compressed_sha256: null,
      retrieved_at: new Date().toISOString(),
      source_contract_version: ACTION.sourceContractVersion,
      raw_bytes: loaded.bytes.length,
      retrieval_mode: loaded.retrievalMode,
      archive_hash: sha256(JSON.stringify({
        source_kind: "NSE_CORPORATE_ACTIONS",
        symbol: ACTION.symbol,
        selected_ex_date: normalizedRow.ex_date,
        content_sha256: rawSha,
        source_contract_version: ACTION.sourceContractVersion,
      })),
    },
    observation: {
      ...normalizedRow,
      observation_hash: observationHash,
    },
  }
}

async function buildTri() {
  const loaded = await loadOrFetch(
    "NSE_INDICES_NIFTY500_TRI_JAN_2024.json",
    async () => {
      const page = await fetchWithRetry(TRI.pageUrl, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
        },
      })
      assert(
        new URL(page.url).hostname === "www.niftyindices.com",
        "NIFTY TRI page left official NSE Indices host",
      )
      const pageText = await page.text()
      assert(
        /Total returns Index Values/i.test(pageText),
        "NIFTY TRI page marker missing",
      )

      const cinfo =
        "{'name':'" + TRI.indexName +
        "','startDate':'" + TRI.startDate +
        "','endDate':'" + TRI.endDate +
        "','indexName':'" + TRI.indexName + "'}"

      const response = await fetchWithRetry(TRI.endpoint, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json,text/javascript,*/*;q=0.01",
          "Content-Type": "application/json; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          Origin: "https://www.niftyindices.com",
          Referer: TRI.pageUrl,
          "Accept-Language": "en-US,en;q=0.9",
        },
        body: JSON.stringify({ cinfo }),
      })

      assert(
        new URL(response.url).hostname === "www.niftyindices.com",
        "NIFTY TRI endpoint left official NSE Indices host",
      )

      return Buffer.from(await response.arrayBuffer())
    },
  )

  let payload
  try {
    payload = JSON.parse(loaded.bytes.toString("utf8"))
  } catch {
    throw new Error("NIFTY 500 TRI response is not valid JSON")
  }

  let rows = payload
  if (!Array.isArray(rows) && typeof payload?.d === "string") {
    rows = JSON.parse(payload.d)
  } else if (!Array.isArray(rows) && Array.isArray(payload?.d)) {
    rows = payload.d
  }

  assert(Array.isArray(rows), "NIFTY 500 TRI response has no row array")
  assert(rows.length > 0, "NIFTY 500 TRI response has zero rows")

  const normalizedRows = rows.map((row) => ({
    index_name: canonicalText(
      firstDefined(row, ["Index Name", "INDEX_NAME", "IndexName"]),
    ),
    trade_date: normalizeDate(
      firstDefined(row, ["Date", "DATE", "HistoricalDate"]),
    ),
    total_return_index: canonicalDecimal(
      firstDefined(row, ["TotalReturnsIndex", "Total Returns Index", "TRI"]),
      "NIFTY 500 TRI",
    ),
    net_total_return_index: firstDefined(row, [
      "NTR_Value",
      "Net Total Return Index",
      "NTRI",
    ])
      ? canonicalDecimal(
          firstDefined(row, [
            "NTR_Value",
            "Net Total Return Index",
            "NTRI",
          ]),
          "NIFTY 500 NTRI",
        )
      : null,
  }))

  for (const row of normalizedRows) {
    assert(
      row.index_name?.toUpperCase() === "NIFTY 500",
      "unexpected TRI index: " + row.index_name,
    )
  }

  const selected = normalizedRows.filter(
    (row) => row.trade_date === TRI.selectedDateIso,
  )
  assert(
    selected.length === 1,
    "NIFTY 500 selected TRI date matches: " + selected.length,
  )

  const row = selected[0]
  const rawSha = sha256(loaded.bytes)
  const normalizedRow = {
    benchmark_version: TRI.benchmarkVersion,
    benchmark_code: "NIFTY_500",
    trade_date: row.trade_date,
    total_return_index: row.total_return_index,
    net_total_return_index: row.net_total_return_index,
  }

  return {
    source_archive: {
      source_kind: "NSE_INDICES_NIFTY500_TRI",
      source_period_start: row.trade_date,
      source_period_end: row.trade_date,
      source_url: TRI.endpoint,
      source_page_url: TRI.pageUrl,
      source_file_name: "NSE_INDICES_NIFTY500_TRI_JAN_2024.json",
      content_sha256: rawSha,
      compressed_sha256: null,
      retrieved_at: new Date().toISOString(),
      source_contract_version: TRI.sourceContractVersion,
      raw_bytes: loaded.bytes.length,
      retrieval_mode: loaded.retrievalMode,
      request: {
        index_name: TRI.indexName,
        start_date: TRI.startDate,
        end_date: TRI.endDate,
      },
      archive_hash: sha256(JSON.stringify({
        source_kind: "NSE_INDICES_NIFTY500_TRI",
        selected_trade_date: row.trade_date,
        content_sha256: rawSha,
        source_contract_version: TRI.sourceContractVersion,
      })),
    },
    benchmark_row: {
      ...normalizedRow,
      row_hash: sha256(JSON.stringify(normalizedRow)),
    },
  }
}

const [corporateAction, tri] = await Promise.all([
  buildCorporateAction(),
  buildTri(),
])

const generatedAt = new Date().toISOString()
const core = {
  version: "P8_B3_DURABLE_ACTION_TRI_CANARY_PAYLOAD_V1",
  campaign_id: CAMPAIGN_ID,
  experiment_id: EXPERIMENT_ID,
  generated_at: generatedAt,
  controls: {
    database_writes_performed: 0,
    paid_provider_calls: 0,
    durable_source_archives_expected: 2,
    durable_corporate_action_observations_expected: 1,
    durable_benchmark_rows_expected: 1,
    durable_normalizations_expected: 0,
    durable_adjustment_factors_expected: 0,
    durable_adjusted_series_expected: 0,
    scope: "RAW_CORPORATE_ACTION_AND_OFFICIAL_NIFTY500_TRI_ONLY",
  },
  corporate_action: corporateAction,
  nifty500_tri: tri,
}

const output = {
  ...core,
  payload_hash: sha256(JSON.stringify(core)),
  ready_for_durable_insert: true,
}

writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n")

console.log(JSON.stringify({
  version: output.version,
  campaign_id: output.campaign_id,
  payload_hash: output.payload_hash,
  ready_for_durable_insert: output.ready_for_durable_insert,
  corporate_action: {
    historical_isin: output.corporate_action.observation.historical_isin,
    symbol: output.corporate_action.observation.raw_symbol,
    purpose: output.corporate_action.observation.raw_purpose,
    ex_date: output.corporate_action.observation.ex_date,
    record_date: output.corporate_action.observation.record_date,
    observation_hash: output.corporate_action.observation.observation_hash,
    raw_sha256: output.corporate_action.source_archive.content_sha256,
    retrieval_mode: output.corporate_action.source_archive.retrieval_mode,
  },
  nifty500_tri: {
    trade_date: output.nifty500_tri.benchmark_row.trade_date,
    total_return_index: output.nifty500_tri.benchmark_row.total_return_index,
    net_total_return_index:
      output.nifty500_tri.benchmark_row.net_total_return_index,
    row_hash: output.nifty500_tri.benchmark_row.row_hash,
    raw_sha256: output.nifty500_tri.source_archive.content_sha256,
    retrieval_mode: output.nifty500_tri.source_archive.retrieval_mode,
  },
  output: OUT,
}, null, 2))
