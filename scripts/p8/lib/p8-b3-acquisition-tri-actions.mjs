import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import {
  CACHE,
  USER_AGENT,
  assert,
  canonicalDecimal,
  canonicalPositiveDecimal,
  chunks,
  clean,
  fetchWithRetry,
  firstDefined,
  formatNseDate,
  normalizeDate,
  optionalDate,
  post,
  saveProgress,
  sha256,
  uploadArchive,
} from "./p8-b3-acquisition-common.mjs"

const NSE_ACTION_PAGE =
  "https://www.nseindia.com/companies-listing/corporate-filings-actions"
const NSE_ACTION_API =
  "https://www.nseindia.com/api/corporates-corporateActions"
const TRI_PAGE = "https://www.niftyindices.com/reports/historical-data"
const TRI_ENDPOINT =
  "https://www.niftyindices.com/BackPage/getTotalReturnIndexString"

function parseTriPayload(bytes) {
  let payload
  try {
    payload = JSON.parse(bytes.toString("utf8"))
  } catch {
    throw new Error("NIFTY 500 TRI response is not JSON")
  }

  let rows = payload
  if (!Array.isArray(rows) && typeof payload?.d === "string") {
    rows = JSON.parse(payload.d)
  } else if (!Array.isArray(rows) && Array.isArray(payload?.d)) {
    rows = payload.d
  }
  assert(Array.isArray(rows), "NIFTY 500 TRI response has no row array")
  return rows
}

function triNamedDate(value) {
  const names = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ]
  const parts = value.split("-")
  return parts[2] + "-" + names[Number(parts[1]) - 1] + "-" + parts[0]
}

export async function acquireTriMonth(month, progress, tradingDates) {
  const cachePath = join(CACHE.tri, month.key + ".json")
  let bytes
  let retrievalMode

  if (existsSync(cachePath)) {
    bytes = readFileSync(cachePath)
    retrievalMode = "CACHE"
  } else {
    const page = await fetchWithRetry(TRI_PAGE, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    })
    assert(
      new URL(page.url).hostname === "www.niftyindices.com",
      "NIFTY TRI page left official host",
    )

    const cinfo =
      "{'name':'NIFTY 500','startDate':'" + triNamedDate(month.start) +
      "','endDate':'" + triNamedDate(month.end) +
      "','indexName':'NIFTY 500'}"

    const response = await fetchWithRetry(TRI_ENDPOINT, {
      method: "POST",
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json,text/javascript,*/*;q=0.01",
        "Content-Type": "application/json; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Origin: "https://www.niftyindices.com",
        Referer: TRI_PAGE,
        "Accept-Language": "en-US,en;q=0.9",
      },
      body: JSON.stringify({ cinfo }),
    })

    assert(
      new URL(response.url).hostname === "www.niftyindices.com",
      "NIFTY TRI endpoint left official host",
    )
    bytes = Buffer.from(await response.arrayBuffer())
    writeFileSync(cachePath, bytes)
    retrievalMode = "NETWORK"
  }

  const rows = parseTriPayload(bytes).map((row) => {
    const indexName = clean(firstDefined(
      row,
      ["Index Name", "INDEX_NAME", "IndexName"],
    ))
    const tradeDate = normalizeDate(firstDefined(
      row,
      ["Date", "DATE", "HistoricalDate"],
    ))
    const tri = canonicalPositiveDecimal(
      firstDefined(row, ["TotalReturnsIndex", "Total Returns Index", "TRI"]),
      "NIFTY 500 TRI",
    )
    const ntriRaw = firstDefined(
      row,
      ["NTR_Value", "Net Total Return Index", "NTRI"],
    )
    const ntri = ntriRaw === null
      ? null
      : canonicalPositiveDecimal(ntriRaw, "NIFTY 500 NTRI")

    assert(indexName.toUpperCase() === "NIFTY 500", "Unexpected TRI index")
    assert(
      tradeDate >= month.start && tradeDate <= month.end,
      "TRI row outside requested month",
    )

    const logical = {
      benchmark_version: "P8_NIFTY500_TRI_V1",
      benchmark_code: "NIFTY_500",
      trade_date: tradeDate,
      total_return_index: tri,
      net_total_return_index: ntri,
    }
    return {
      ...logical,
      row_hash: sha256(logical),
      raw_metadata: { request_month: month.key },
    }
  })

  rows.sort((a, b) => a.trade_date.localeCompare(b.trade_date))
  assert(rows.length > 0, "No NIFTY 500 TRI rows for " + month.key)
  assert(
    new Set(rows.map((row) => row.trade_date)).size === rows.length,
    "Duplicate NIFTY 500 TRI date in " + month.key,
  )

  const archive = await uploadArchive({
    source_kind: "NSE_INDICES_NIFTY500_TRI",
    source_period_start: month.start,
    source_period_end: month.end,
    source_url: TRI_ENDPOINT,
    source_file_name: "NIFTY500_TRI_" + month.key + ".json",
    content_sha256: sha256(bytes),
    compressed_sha256: null,
    source_published_at: null,
    retrieved_at: new Date().toISOString(),
    source_contract_version: "P8_B3_NSE_INDICES_TRI_V1",
    raw_metadata: {
      source_page_url: TRI_PAGE,
      retrieval_mode: retrievalMode,
      raw_bytes: bytes.length,
      request_month: month.key,
    },
  })

  for (const batch of chunks(rows, 30)) {
    await post("benchmark_batch", {
      archiveId: archive.archive_id,
      rows: batch,
    })
  }

  for (const row of rows) tradingDates.add(row.trade_date)
  if (!progress.completed_tri_months.includes(month.key)) {
    progress.completed_tri_months.push(month.key)
  }
  saveProgress(progress)

  console.log(
    "  TRI " + month.key + ": " + rows.length +
      " trading dates (" + retrievalMode + ")",
  )
}

function cookieHeaderFrom(response) {
  const getter = response.headers.getSetCookie
  if (typeof getter === "function") {
    return getter.call(response.headers)
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

export async function newNseCookie() {
  const page = await fetchWithRetry(NSE_ACTION_PAGE, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  })
  assert(
    new URL(page.url).hostname === "www.nseindia.com",
    "NSE corporate-action page left official host",
  )
  return cookieHeaderFrom(page)
}

function normalizeCorporateActions(bytes, month) {
  let payload
  try {
    payload = JSON.parse(bytes.toString("utf8"))
  } catch {
    throw new Error("Corporate-action response is not JSON for " + month.key)
  }

  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : null
  assert(Array.isArray(rows), "Corporate-action response has no row array")

  const normalized = []
  for (const row of rows) {
    const rawSymbol = clean(firstDefined(row, ["symbol", "SYMBOL"]))
    const rawPurpose = clean(firstDefined(row, ["subject", "purpose", "PURPOSE"]))
    if (!rawSymbol || !rawPurpose) {
      throw new Error("Corporate-action row missing symbol/purpose")
    }

    const exRaw = firstDefined(row, ["exDate", "ex_date", "EX-DATE"])
    const exDate = exRaw ? optionalDate(exRaw) : null
    if (exDate && (exDate < month.start || exDate > month.end)) continue

    const faceRaw = firstDefined(
      row,
      ["faceVal", "faceValue", "face_value", "FACE VALUE"],
    )

    const logical = {
      raw_symbol: rawSymbol,
      raw_company_name: clean(firstDefined(
        row,
        ["comp", "companyName", "company_name", "COMPANY NAME"],
      )) || null,
      raw_series: clean(firstDefined(row, ["series", "SERIES"])) || null,
      raw_purpose: rawPurpose,
      face_value: faceRaw === null
        ? null
        : canonicalDecimal(faceRaw, "corporate-action face value"),
      ex_date: exDate,
      record_date: optionalDate(firstDefined(
        row,
        ["recDate", "recordDate", "record_date", "RECORD DATE"],
      )),
      book_closure_start: optionalDate(firstDefined(
        row,
        ["bcStartDate", "bookClosureStartDate", "BOOK CLOSURE START DATE"],
      )),
      book_closure_end: optionalDate(firstDefined(
        row,
        ["bcEndDate", "bookClosureEndDate", "BOOK CLOSURE END DATE"],
      )),
    }

    normalized.push({
      ...logical,
      observation_hash: sha256(logical),
      raw_metadata: { request_month: month.key },
    })
  }

  normalized.sort((a, b) =>
    (a.ex_date || "").localeCompare(b.ex_date || "") ||
    a.raw_symbol.localeCompare(b.raw_symbol) ||
    a.observation_hash.localeCompare(b.observation_hash)
  )
  return normalized
}

export async function acquireActionMonth(month, progress, cookie) {
  const cachePath = join(CACHE.actions, month.key + ".json")
  const sourceUrl =
    NSE_ACTION_API + "?index=equities&from_date=" +
    encodeURIComponent(formatNseDate(month.start)) +
    "&to_date=" + encodeURIComponent(formatNseDate(month.end))

  let bytes
  let retrievalMode
  if (existsSync(cachePath)) {
    bytes = readFileSync(cachePath)
    retrievalMode = "CACHE"
  } else {
    const response = await fetchWithRetry(sourceUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json,text/plain,*/*",
        Referer: NSE_ACTION_PAGE,
        ...(cookie ? { Cookie: cookie } : {}),
      },
    })
    assert(
      new URL(response.url).hostname === "www.nseindia.com",
      "Corporate-action API left official host",
    )
    bytes = Buffer.from(await response.arrayBuffer())
    writeFileSync(cachePath, bytes)
    retrievalMode = "NETWORK"
  }

  const rows = normalizeCorporateActions(bytes, month)
  const archive = await uploadArchive({
    source_kind: "NSE_CORPORATE_ACTIONS",
    source_period_start: month.start,
    source_period_end: month.end,
    source_url: sourceUrl,
    source_file_name: "NSE_CORPORATE_ACTIONS_" + month.key + ".json",
    content_sha256: sha256(bytes),
    compressed_sha256: null,
    source_published_at: null,
    retrieved_at: new Date().toISOString(),
    source_contract_version: "P8_B3_NSE_CORPORATE_ACTIONS_V1",
    raw_metadata: {
      source_page_url: NSE_ACTION_PAGE,
      retrieval_mode: retrievalMode,
      raw_bytes: bytes.length,
      request_month: month.key,
    },
  })

  for (const batch of chunks(rows, 200)) {
    const result = await post("action_batch", {
      archiveId: archive.archive_id,
      rows: batch,
    })
    progress.metrics.action_rows_submitted += Number(result.submitted || 0)
    progress.metrics.action_resolved += Number(result.resolved || 0)
    progress.metrics.action_ambiguous += Number(result.ambiguous || 0)
    progress.metrics.action_unresolved += Number(result.unresolved || 0)
  }

  if (!progress.completed_action_months.includes(month.key)) {
    progress.completed_action_months.push(month.key)
  }
  saveProgress(progress)

  console.log(
    "  actions " + month.key + ": " + rows.length +
      " rows (" + retrievalMode + ")",
  )
}
