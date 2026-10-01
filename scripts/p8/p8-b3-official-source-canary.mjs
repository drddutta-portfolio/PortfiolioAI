#!/usr/bin/env node
import { createHash } from "node:crypto"
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { spawnSync } from "node:child_process"
import Papa from "papaparse"

const OUT = process.env.P8_B3_CANARY_OUT ?? "tmp/p8-b3/canary"
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const LEGACY = {
  id: "NSE_LEGACY_BHAVCOPY_2024-03-14",
  date: "2024-03-14",
  url:
    "https://nsearchives.nseindia.com/content/historical/EQUITIES/2024/MAR/" +
    "cm14MAR2024bhav.csv.zip",
  expectedArchiveName: "cm14MAR2024bhav.csv.zip",
  sourcePage: "https://www.nseindia.com/all-reports",
}

const UDIFF = {
  id: "NSE_UDIFF_BHAVCOPY_2024-08-01",
  date: "2024-08-01",
  url:
    "https://nsearchives.nseindia.com/content/cm/" +
    "BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip",
  expectedArchiveName: "BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip",
  sourcePage: "https://www.nseindia.com/all-reports",
}

const CORPORATE_ACTION = {
  id: "NSE_CORPORATE_ACTION_DELPHIFX",
  symbol: "DELPHIFX",
  pageUrl:
    "https://www.nseindia.com/companies-listing/corporate-filings-actions?symbol=DELPHIFX",
  apiUrl:
    "https://www.nseindia.com/api/corporates-corporateActions?index=equities&symbol=DELPHIFX",
}

const TRI = {
  id: "NSE_INDICES_NIFTY500_TRI_JAN_2024",
  pageUrl: "https://www.niftyindices.com/reports/historical-data",
  endpoint:
    "https://www.niftyindices.com/BackPage/getTotalReturnIndexString",
  indexName: "NIFTY 500",
  startDate: "01-Jan-2024",
  endDate: "31-Jan-2024",
}

mkdirSync(OUT, { recursive: true })

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function normalizeHeader(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/u, "")
    .trim()
    .replace(/[ ._\-/()]+/gu, "")
    .toUpperCase()
}

function firstDefined(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
      return row[key]
    }
  }
  return null
}

function parseNumeric(value) {
  const normalized = String(value ?? "").replaceAll(",", "").trim()
  if (!normalized) return null
  const number = Number(normalized)
  return Number.isFinite(number) ? number : null
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
      const text = await response.text().catch(() => "")
      lastError = new Error(
        `HTTP ${response.status} for ${url}: ${text.slice(0, 300)}`,
      )

      if (response.status < 500 && response.status !== 429) break
    } catch (error) {
      lastError = error
    }

    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
    }
  }
  throw lastError ?? new Error("request failed: " + url)
}

function extractZipCsv(zipBytes, archiveName) {
  const work = mkdtempSync(join(tmpdir(), "p8-b3-canary-"))
  const zipPath = join(work, archiveName)

  try {
    writeFileSync(zipPath, zipBytes)

    const list = spawnSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
    assert(
      list.status === 0,
      "unzip listing failed for " + archiveName + ": " + (list.stderr || ""),
    )

    const entries = list.stdout
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter(Boolean)

    const csvEntries = entries.filter((entry) => entry.toLowerCase().endsWith(".csv"))
    assert(csvEntries.length >= 1, archiveName + " contains no CSV member")

    const csvEntry =
      csvEntries.find((entry) => basename(entry).toLowerCase().includes("bhav")) ??
      csvEntries[0]

    const extract = spawnSync("unzip", ["-p", zipPath, csvEntry], {
      encoding: null,
      maxBuffer: 64 * 1024 * 1024,
    })
    assert(
      extract.status === 0,
      "unzip extraction failed for " + archiveName + ": " +
        String(extract.stderr ?? ""),
    )

    return {
      csvEntry,
      csvBytes: Buffer.from(extract.stdout),
      entries,
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

function parseCsv(csvBytes, label) {
  const text = csvBytes.toString("utf8")
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.replace(/^\uFEFF/u, "").trim(),
  })

  assert(
    (parsed.errors ?? []).length === 0,
    label + " CSV parse errors: " + JSON.stringify(parsed.errors?.slice(0, 3)),
  )
  assert(parsed.data.length > 0, label + " CSV contains zero data rows")
  return parsed
}

function validateLegacyBhavcopy(csvBytes) {
  const parsed = parseCsv(csvBytes, "legacy bhavcopy")
  const headers = (parsed.meta.fields ?? []).map(normalizeHeader)

  const required = [
    "SYMBOL",
    "SERIES",
    "OPEN",
    "HIGH",
    "LOW",
    "CLOSE",
    "LAST",
    "PREVCLOSE",
    "TOTTRDQTY",
    "TOTTRDVAL",
    "TIMESTAMP",
    "TOTALTRADES",
    "ISIN",
  ]

  for (const requiredHeader of required) {
    assert(
      headers.includes(requiredHeader),
      "legacy bhavcopy missing header: " + requiredHeader,
    )
  }

  const timestampKeys = (parsed.meta.fields ?? []).filter(
    (field) => normalizeHeader(field) === "TIMESTAMP",
  )
  assert(timestampKeys.length === 1, "legacy bhavcopy TIMESTAMP header is ambiguous")

  const timestamps = new Set(
    parsed.data.map((row) => String(row[timestampKeys[0]] ?? "").trim().toUpperCase()),
  )
  assert(
    timestamps.has("14-MAR-2024"),
    "legacy bhavcopy does not prove trade date 14-MAR-2024",
  )

  return {
    rows: parsed.data.length,
    headers: parsed.meta.fields,
    timestamp_values: [...timestamps].slice(0, 10),
  }
}

function validateUdiffBhavcopy(csvBytes) {
  const parsed = parseCsv(csvBytes, "UDiFF bhavcopy")
  const fields = parsed.meta.fields ?? []
  const normalized = new Map(fields.map((field) => [normalizeHeader(field), field]))

  const requiredAliases = [
    ["TRADDT", "TRADDATE"],
    ["ISIN"],
    ["TCKRSYMB", "TCKRSYMBL", "TCKRSYMBOL"],
    ["SCTYSRS"],
    ["OPNPRIC"],
    ["HGHPRIC"],
    ["LWPRIC"],
    ["CLSPRIC"],
    ["PRVSCLSGPRIC"],
    ["TTLTRADGVOL"],
  ]

  for (const aliases of requiredAliases) {
    assert(
      aliases.some((alias) => normalized.has(alias)),
      "UDiFF bhavcopy missing required field family: " + aliases.join("/"),
    )
  }

  const dateField =
    normalized.get("TRADDT") ??
    normalized.get("TRADDATE")

  assert(dateField, "UDiFF trade-date field not resolved")

  const dateValues = new Set(
    parsed.data.map((row) => String(row[dateField] ?? "").trim()),
  )

  const provesDate = [...dateValues].some((value) =>
    ["2024-08-01", "01-Aug-2024", "01-AUG-2024", "01/08/2024"].includes(value)
  )
  assert(provesDate, "UDiFF bhavcopy does not prove trade date 2024-08-01")

  return {
    rows: parsed.data.length,
    headers: fields,
    trade_date_values: [...dateValues].slice(0, 10),
  }
}

async function retrieveArchiveCanary(spec, validator) {
  const response = await fetchWithRetry(spec.url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/zip,application/octet-stream,*/*",
      Referer: spec.sourcePage,
    },
  })

  const finalUrl = response.url
  assert(
    new URL(finalUrl).hostname === "nsearchives.nseindia.com",
    spec.id + " redirected away from official NSE archive host",
  )

  const bytes = Buffer.from(await response.arrayBuffer())
  assert(bytes.length > 1000, spec.id + " response is unexpectedly small")
  assert(
    bytes[0] === 0x50 && bytes[1] === 0x4b,
    spec.id + " response is not a ZIP file",
  )

  const archivePath = join(OUT, spec.expectedArchiveName)
  writeFileSync(archivePath, bytes)

  const extracted = extractZipCsv(bytes, spec.expectedArchiveName)
  const csvName = basename(extracted.csvEntry)
  const csvPath = join(OUT, csvName)
  writeFileSync(csvPath, extracted.csvBytes)

  const validation = validator(extracted.csvBytes)

  return {
    state: "PROVEN",
    official_host: "nsearchives.nseindia.com",
    requested_url: spec.url,
    final_url: finalUrl,
    http_status: response.status,
    content_type: response.headers.get("content-type"),
    archive_file: archivePath,
    archive_bytes: bytes.length,
    archive_sha256: sha256(bytes),
    csv_member: extracted.csvEntry,
    csv_file: csvPath,
    csv_bytes: extracted.csvBytes.length,
    csv_sha256: sha256(extracted.csvBytes),
    validation,
  }
}

function cookieHeaderFrom(response) {
  const getter = response.headers.getSetCookie
  if (typeof getter === "function") {
    const cookies = getter.call(response.headers)
    return cookies.map((value) => value.split(";", 1)[0]).join("; ")
  }

  const combined = response.headers.get("set-cookie")
  if (!combined) return ""
  return combined
    .split(/,(?=[^;,]+=)/u)
    .map((value) => value.split(";", 1)[0].trim())
    .join("; ")
}

async function retrieveCorporateActionCanary() {
  const page = await fetchWithRetry(CORPORATE_ACTION.pageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  })
  const pageText = await page.text()
  assert(
    new URL(page.url).hostname === "www.nseindia.com",
    "corporate-action page redirected away from official NSE host",
  )
  assert(
    pageText.includes("Corporate Actions") || pageText.includes("corporate"),
    "official NSE corporate-action page marker not found",
  )

  const cookie = cookieHeaderFrom(page)
  const api = await fetchWithRetry(CORPORATE_ACTION.apiUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json,text/plain,*/*",
      Referer: CORPORATE_ACTION.pageUrl,
      ...(cookie ? { Cookie: cookie } : {}),
    },
  })

  assert(
    new URL(api.url).hostname === "www.nseindia.com",
    "corporate-action API redirected away from official NSE host",
  )

  const rawBytes = Buffer.from(await api.arrayBuffer())
  assert(rawBytes.length > 2, "corporate-action API returned an empty body")

  const rawPath = join(OUT, "NSE_CORPORATE_ACTION_DELPHIFX.json")
  writeFileSync(rawPath, rawBytes)

  let body
  try {
    body = JSON.parse(rawBytes.toString("utf8"))
  } catch {
    throw new Error("corporate-action API body is not valid JSON")
  }

  const rows = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : null
  assert(Array.isArray(rows), "corporate-action API response does not contain a row array")
  assert(rows.length > 0, "corporate-action API returned zero DELPHIFX rows")

  const matching = rows.filter((row) =>
    String(firstDefined(row, ["symbol", "SYMBOL"]) ?? "").trim().toUpperCase() === "DELPHIFX"
  )
  assert(matching.length > 0, "corporate-action API returned no DELPHIFX row")

  const normalizedRows = matching.map((row) => ({
    symbol: String(firstDefined(row, ["symbol", "SYMBOL"]) ?? "").trim(),
    purpose: String(
      firstDefined(row, ["subject", "purpose", "PURPOSE"]) ?? "",
    ).trim(),
    face_value: firstDefined(row, [
      "faceVal",
      "faceValue",
      "face_value",
      "FACE VALUE",
    ]),
    ex_date: String(
      firstDefined(row, ["exDate", "ex_date", "EX-DATE"]) ?? "",
    ).trim(),
    record_date: String(
      firstDefined(row, ["recDate", "recordDate", "record_date", "RECORD DATE"]) ?? "",
    ).trim(),
  }))

  for (const row of normalizedRows) {
    assert(row.symbol === "DELPHIFX", "corporate action symbol drift")
    assert(row.purpose, "corporate action purpose missing")
    assert(row.ex_date, "corporate action ex-date missing")
  }

  const purposes = normalizedRows.map((row) => row.purpose.toUpperCase())
  assert(
    purposes.some((value) => value.includes("SPLIT") || value.includes("SUB-DIVISION")),
    "DELPHIFX canary did not expose a split action",
  )
  assert(
    purposes.some((value) => value.includes("BONUS")),
    "DELPHIFX canary did not expose a bonus action",
  )
  assert(
    purposes.some((value) => value.includes("RIGHTS")),
    "DELPHIFX canary did not expose a rights action",
  )

  return {
    state: "PROVEN",
    official_host: "www.nseindia.com",
    page_url: CORPORATE_ACTION.pageUrl,
    api_url: api.url,
    http_status: api.status,
    raw_file: rawPath,
    raw_bytes: rawBytes.length,
    raw_sha256: sha256(rawBytes),
    rows: rows.length,
    matching_rows: normalizedRows.length,
    canary_action_types_proven: ["SPLIT", "BONUS", "RIGHTS"],
    sample: normalizedRows.slice(0, 5),
  }
}

async function retrieveTriCanary() {
  const page = await fetchWithRetry(TRI.pageUrl, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml",
    },
  })
  const pageText = await page.text()
  assert(
    new URL(page.url).hostname === "www.niftyindices.com",
    "TRI page redirected away from official NSE Indices host",
  )
  assert(
    /Total returns Index Values/i.test(pageText),
    "official NSE Indices TRI page marker not found",
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
    "TRI endpoint redirected away from official NSE Indices host",
  )

  const rawBytes = Buffer.from(await response.arrayBuffer())
  const rawPath = join(OUT, "NSE_INDICES_NIFTY500_TRI_JAN_2024.json")
  writeFileSync(rawPath, rawBytes)

  const contentType = response.headers.get("content-type") ?? ""
  const rawText = rawBytes.toString("utf8")
  assert(
    /json/i.test(contentType) || /^[\s\[{]/u.test(rawText),
    "NIFTY 500 TRI endpoint returned non-JSON content: " +
      contentType + " " + rawText.slice(0, 120),
  )

  let payload
  try {
    payload = JSON.parse(rawText)
  } catch {
    throw new Error(
      "NIFTY 500 TRI endpoint returned invalid JSON: " + rawText.slice(0, 160),
    )
  }

  // Current NSE Indices route returns the row array directly. Preserve strict
  // compatibility with the older documented ASP.NET envelope only when the
  // HTTP body itself is valid JSON; never reinterpret HTML/challenge content.
  let rows = payload
  if (!Array.isArray(rows) && typeof payload?.d === "string") {
    try {
      rows = JSON.parse(payload.d)
    } catch {
      throw new Error("NIFTY 500 TRI envelope.d is not valid JSON")
    }
  } else if (!Array.isArray(rows) && Array.isArray(payload?.d)) {
    rows = payload.d
  }

  assert(Array.isArray(rows), "NIFTY 500 TRI response is not a row array")
  assert(rows.length > 0, "NIFTY 500 TRI canary returned zero rows")

  const normalizedRows = rows.map((row) => ({
    index_name: String(
      firstDefined(row, ["Index Name", "INDEX_NAME", "IndexName"]) ?? "",
    ).trim(),
    date: String(firstDefined(row, ["Date", "DATE", "HistoricalDate"]) ?? "").trim(),
    tri: parseNumeric(
      firstDefined(row, ["TotalReturnsIndex", "Total Returns Index", "TRI"]),
    ),
    ntri: parseNumeric(
      firstDefined(row, ["NTR_Value", "Net Total Return Index", "NTRI"]),
    ),
  }))

  for (const row of normalizedRows) {
    assert(
      row.index_name.toUpperCase() === "NIFTY 500",
      "TRI response contains an unexpected index: " + row.index_name,
    )
    assert(row.date, "TRI row date missing")
    assert(row.tri !== null && row.tri > 0, "TRI row value invalid")
  }

  const dates = normalizedRows.map((row) => row.date)
  assert(
    dates.some((date) => /JAN.?2024/i.test(date)),
    "TRI canary does not contain January 2024 data",
  )

  return {
    state: "PROVEN",
    official_host: "www.niftyindices.com",
    page_url: TRI.pageUrl,
    endpoint: response.url,
    http_status: response.status,
    content_type: contentType,
    raw_file: rawPath,
    raw_bytes: rawBytes.length,
    raw_sha256: sha256(rawBytes),
    index: TRI.indexName,
    requested_window: [TRI.startDate, TRI.endDate],
    rows: normalizedRows.length,
    first_sample: normalizedRows[0],
    last_sample: normalizedRows.at(-1),
    ntri_rows: normalizedRows.filter((row) => row.ntri !== null).length,
  }
}

const result = {
  version: "P8_B3_OFFICIAL_SOURCE_CANARY_V1",
  generated_at: new Date().toISOString(),
  environment: "LOCAL_ONLY",
  controls: {
    database_writes: 0,
    provider_calls: 0,
    paid_api_calls: 0,
    hosted_migration_application: false,
    bulk_acquisition: false,
    acceptance_rule:
      "A source is PROVEN only after an official host returns a content-valid artifact matching the requested instrument/date/schema.",
  },
  probes: {},
  state: "RUNNING",
  blockers: [],
}

const probes = [
  ["legacy_bhavcopy", () => retrieveArchiveCanary(LEGACY, validateLegacyBhavcopy)],
  ["udiff_bhavcopy", () => retrieveArchiveCanary(UDIFF, validateUdiffBhavcopy)],
  ["corporate_actions", retrieveCorporateActionCanary],
  ["nifty500_tri", retrieveTriCanary],
]

for (const [name, runner] of probes) {
  try {
    result.probes[name] = await runner()
    console.log(name, "PROVEN")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    result.probes[name] = { state: "BLOCKED", error: message }
    result.blockers.push(name + ": " + message)
    console.error(name, "BLOCKED", message)
  }
}

result.state = result.blockers.length === 0 ? "CANARY_PASS" : "CANARY_BLOCKED"
result.canary_hash = sha256(JSON.stringify({
  version: result.version,
  controls: result.controls,
  probes: result.probes,
  state: result.state,
  blockers: result.blockers,
}))

const outputPath = join(OUT, "P8_B3_OFFICIAL_SOURCE_CANARY_RESULT.json")
writeFileSync(outputPath, JSON.stringify(result, null, 2) + "\n")

console.log(JSON.stringify({
  state: result.state,
  canary_hash: result.canary_hash,
  probes: Object.fromEntries(
    Object.entries(result.probes).map(([key, value]) => [key, value.state]),
  ),
  blockers: result.blockers,
  output: outputPath,
}, null, 2))

if (result.state !== "CANARY_PASS") process.exitCode = 2
