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
import { basename, dirname, join } from "node:path"
import { spawnSync } from "node:child_process"
import Papa from "papaparse"

const CAMPAIGN_ID = "P8_B3_RAW_PRICE_CANARY_20261001_V1"
const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
const TARGET_ISIN = "INE002A01018"
const OUT =
  process.env.P8_B3_RAW_CANARY_OUT ??
  "tmp/p8-b3/durable-canary/P8_B3_RAW_PRICE_CANARY_PAYLOAD.json"
const CACHE_DIR =
  process.env.P8_B3_CANARY_CACHE_DIR ??
  "tmp/p8-b3/durable-canary/artifacts"

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"

const SOURCES = [
  {
    key: "legacy",
    sourceKind: "NSE_CM_BHAVCOPY_LEGACY",
    sourceFormat: "LEGACY_BHAVCOPY",
    tradeDate: "2024-03-14",
    sourceUrl:
      "https://nsearchives.nseindia.com/content/historical/EQUITIES/2024/MAR/" +
      "cm14MAR2024bhav.csv.zip",
    archiveName: "cm14MAR2024bhav.csv.zip",
    sourcePage: "https://www.nseindia.com/all-reports",
    sourceContractVersion: "P8_B3_NSE_BHAVCOPY_LEGACY_V1",
  },
  {
    key: "udiff",
    sourceKind: "NSE_CM_BHAVCOPY_UDIFF",
    sourceFormat: "UDIFF_BHAVCOPY",
    tradeDate: "2024-08-01",
    sourceUrl:
      "https://nsearchives.nseindia.com/content/cm/" +
      "BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip",
    archiveName: "BhavCopy_NSE_CM_0_0_0_20240801_F_0000.csv.zip",
    sourcePage: "https://www.nseindia.com/all-reports",
    sourceContractVersion: "P8_B3_NSE_BHAVCOPY_UDIFF_V1",
  },
]

mkdirSync(dirname(OUT), { recursive: true })
mkdirSync(CACHE_DIR, { recursive: true })

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

function canonicalString(value) {
  const text = String(value ?? "").trim()
  return text === "" ? null : text
}

function canonicalNumberString(value, fieldName, { nullable = true } = {}) {
  const text = String(value ?? "").replaceAll(",", "").trim()
  if (!text) {
    if (nullable) return null
    throw new Error(fieldName + " is required")
  }
  if (!/^-?\d+(?:\.\d+)?$/u.test(text)) {
    throw new Error(fieldName + " is not a canonical decimal: " + text)
  }
  if (text.startsWith("-")) {
    throw new Error(fieldName + " must be non-negative")
  }
  return text
}

function canonicalIntegerString(value, fieldName) {
  const text = String(value ?? "").replaceAll(",", "").trim()
  if (!text) return null
  if (!/^\d+$/u.test(text)) {
    throw new Error(fieldName + " is not a non-negative integer: " + text)
  }
  return text
}

function fieldMap(fields) {
  return new Map(fields.map((field) => [normalizeHeader(field), field]))
}

function pickField(map, aliases, label, required = true) {
  for (const alias of aliases) {
    const field = map.get(alias)
    if (field) return field
  }
  if (required) {
    throw new Error(label + " field missing; expected " + aliases.join("/"))
  }
  return null
}

function parseCsv(csvBytes, label) {
  const parsed = Papa.parse(csvBytes.toString("utf8"), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.replace(/^\uFEFF/u, "").trim(),
  })
  assert(
    (parsed.errors ?? []).length === 0,
    label + " CSV parse errors: " + JSON.stringify(parsed.errors?.slice(0, 3)),
  )
  assert(parsed.data.length > 0, label + " contains zero rows")
  return parsed
}

async function fetchWithRetry(url, sourcePage, attempts = 4) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 30_000)
      const response = await fetch(url, {
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/zip,application/octet-stream,*/*",
          Referer: sourcePage,
        },
      })
      clearTimeout(timer)

      if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new Error(
          `HTTP ${response.status}: ${body.slice(0, 160)}`,
        )
      }
      return response
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500))
      }
    }
  }
  throw lastError ?? new Error("download failed")
}

function extractCsv(zipBytes, archiveName) {
  const work = mkdtempSync(join(tmpdir(), "p8-b3-raw-canary-"))
  const zipPath = join(work, archiveName)
  try {
    writeFileSync(zipPath, zipBytes)
    const list = spawnSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
    assert(list.status === 0, "unzip listing failed: " + (list.stderr || ""))
    const csvMembers = list.stdout
      .split(/\r?\n/u)
      .map((value) => value.trim())
      .filter((value) => value.toLowerCase().endsWith(".csv"))
    assert(csvMembers.length >= 1, archiveName + " contains no CSV member")

    const member =
      csvMembers.find((value) => basename(value).toLowerCase().includes("bhav")) ??
      csvMembers[0]

    const extracted = spawnSync("unzip", ["-p", zipPath, member], {
      encoding: null,
      maxBuffer: 64 * 1024 * 1024,
    })
    assert(extracted.status === 0, "unzip extraction failed for " + archiveName)

    return { member, bytes: Buffer.from(extracted.stdout) }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

async function loadArchive(spec) {
  const cachePath = join(CACHE_DIR, spec.archiveName)
  let zipBytes
  let retrievalMode

  if (existsSync(cachePath)) {
    zipBytes = readFileSync(cachePath)
    retrievalMode = "CACHE"
  } else {
    const response = await fetchWithRetry(spec.sourceUrl, spec.sourcePage)
    assert(
      new URL(response.url).hostname === "nsearchives.nseindia.com",
      spec.key + " redirected away from official NSE archive host",
    )
    zipBytes = Buffer.from(await response.arrayBuffer())
    assert(
      zipBytes[0] === 0x50 && zipBytes[1] === 0x4b,
      spec.key + " response is not ZIP",
    )
    writeFileSync(cachePath, zipBytes)
    retrievalMode = "NETWORK"
  }

  const extracted = extractCsv(zipBytes, spec.archiveName)
  return {
    zipBytes,
    csvBytes: extracted.bytes,
    csvMember: extracted.member,
    cachePath,
    retrievalMode,
  }
}

function legacyRow(csvBytes, spec) {
  const parsed = parseCsv(csvBytes, "legacy bhavcopy")
  const map = fieldMap(parsed.meta.fields ?? [])

  const f = {
    isin: pickField(map, ["ISIN"], "ISIN"),
    symbol: pickField(map, ["SYMBOL"], "SYMBOL"),
    series: pickField(map, ["SERIES"], "SERIES"),
    previousClose: pickField(map, ["PREVCLOSE"], "PREVCLOSE"),
    open: pickField(map, ["OPEN"], "OPEN"),
    high: pickField(map, ["HIGH"], "HIGH"),
    low: pickField(map, ["LOW"], "LOW"),
    close: pickField(map, ["CLOSE"], "CLOSE"),
    lastPrice: pickField(map, ["LAST"], "LAST"),
    volume: pickField(map, ["TOTTRDQTY"], "TOTTRDQTY"),
    tradedValue: pickField(map, ["TOTTRDVAL"], "TOTTRDVAL"),
    tradeCount: pickField(map, ["TOTALTRADES"], "TOTALTRADES"),
    timestamp: pickField(map, ["TIMESTAMP"], "TIMESTAMP"),
  }

  const matches = parsed.data.filter(
    (row) => String(row[f.isin] ?? "").trim() === TARGET_ISIN,
  )
  assert(matches.length === 1, `legacy target ISIN matches: ${matches.length}`)
  const row = matches[0]

  assert(
    String(row[f.timestamp] ?? "").trim().toUpperCase() === "14-MAR-2024",
    "legacy embedded trade date mismatch",
  )

  return normalizedRow(row, f, spec)
}

function udiffRow(csvBytes, spec) {
  const parsed = parseCsv(csvBytes, "UDiFF bhavcopy")
  const map = fieldMap(parsed.meta.fields ?? [])

  const f = {
    isin: pickField(map, ["ISIN"], "ISIN"),
    symbol: pickField(map, ["TCKRSYMB", "TCKRSYMBL", "TCKRSYMBOL"], "ticker symbol"),
    series: pickField(map, ["SCTYSRS"], "security series"),
    previousClose: pickField(map, ["PRVSCLSGPRIC"], "previous close"),
    open: pickField(map, ["OPNPRIC"], "open"),
    high: pickField(map, ["HGHPRIC"], "high"),
    low: pickField(map, ["LWPRIC"], "low"),
    close: pickField(map, ["CLSPRIC"], "close"),
    lastPrice: pickField(map, ["LSTTRDDPRIC", "LASTPRIC"], "last price", false),
    volume: pickField(map, ["TTLTRADGVOL"], "total traded volume"),
    tradedValue: pickField(map, ["TTLTRADVAL", "TTLTRADGVAL"], "total traded value", false),
    tradeCount: pickField(map, ["TTLNMBRTRADES", "TTLTRADES"], "total trades", false),
    timestamp: pickField(map, ["TRADDT", "TRADDATE"], "trade date"),
  }

  const matches = parsed.data.filter(
    (row) => String(row[f.isin] ?? "").trim() === TARGET_ISIN,
  )
  assert(matches.length === 1, `UDiFF target ISIN matches: ${matches.length}`)
  const row = matches[0]

  const rawDate = String(row[f.timestamp] ?? "").trim().toUpperCase()
  assert(
    ["2024-08-01", "01-AUG-2024", "01/08/2024"].includes(rawDate),
    "UDiFF embedded trade date mismatch: " + rawDate,
  )

  return normalizedRow(row, f, spec)
}

function normalizedRow(row, f, spec) {
  const normalized = {
    trade_date: spec.tradeDate,
    exchange: "NSE",
    historical_isin: canonicalString(row[f.isin]),
    trading_symbol: canonicalString(row[f.symbol]),
    series: canonicalString(row[f.series]),
    source_format: spec.sourceFormat,
    previous_close: canonicalNumberString(row[f.previousClose], "previous_close"),
    open: canonicalNumberString(row[f.open], "open"),
    high: canonicalNumberString(row[f.high], "high"),
    low: canonicalNumberString(row[f.low], "low"),
    close: canonicalNumberString(row[f.close], "close", { nullable: false }),
    last_price: f.lastPrice
      ? canonicalNumberString(row[f.lastPrice], "last_price")
      : null,
    volume: canonicalNumberString(row[f.volume], "volume"),
    traded_value: f.tradedValue
      ? canonicalNumberString(row[f.tradedValue], "traded_value")
      : null,
    trade_count: f.tradeCount
      ? canonicalIntegerString(row[f.tradeCount], "trade_count")
      : null,
  }

  assert(normalized.historical_isin === TARGET_ISIN, "target ISIN drift")
  assert(normalized.trading_symbol, "trading symbol missing")
  assert(normalized.series, "series missing")

  const high = Number(normalized.high)
  const low = Number(normalized.low)
  assert(
    Number.isFinite(high) && Number.isFinite(low) && high >= low,
    "high/low invariant failed",
  )

  return {
    ...normalized,
    row_hash: sha256(JSON.stringify(normalized)),
  }
}

const retrievedAt = new Date().toISOString()
const artifacts = []
const rows = []

for (const spec of SOURCES) {
  const loaded = await loadArchive(spec)
  const row =
    spec.key === "legacy"
      ? legacyRow(loaded.csvBytes, spec)
      : udiffRow(loaded.csvBytes, spec)

  const archiveMetadata = {
    campaign_id: CAMPAIGN_ID,
    source_kind: spec.sourceKind,
    trade_date: spec.tradeDate,
    source_url: spec.sourceUrl,
    source_file_name: spec.archiveName,
    csv_member: loaded.csvMember,
    archive_sha256: sha256(loaded.zipBytes),
    csv_sha256: sha256(loaded.csvBytes),
    archive_bytes: loaded.zipBytes.length,
    csv_bytes: loaded.csvBytes.length,
    retrieval_mode: loaded.retrievalMode,
    retrieved_at: retrievedAt,
    source_contract_version: spec.sourceContractVersion,
  }

  artifacts.push({
    ...archiveMetadata,
    archive_hash: sha256(JSON.stringify({
      source_kind: spec.sourceKind,
      trade_date: spec.tradeDate,
      source_url: spec.sourceUrl,
      archive_sha256: archiveMetadata.archive_sha256,
      csv_sha256: archiveMetadata.csv_sha256,
      source_contract_version: spec.sourceContractVersion,
    })),
  })

  rows.push({
    source_kind: spec.sourceKind,
    source_contract_version: spec.sourceContractVersion,
    ...row,
  })
}

assert(rows.length === 2, "expected exactly two canary rows")
assert(
  new Set(rows.map((row) => row.historical_isin)).size === 1,
  "canary rows are not the same historical identity",
)
assert(
  new Set(rows.map((row) => row.source_format)).size === 2,
  "canary did not exercise both source formats",
)

const core = {
  version: "P8_B3_DURABLE_RAW_PRICE_CANARY_PAYLOAD_V1",
  campaign_id: CAMPAIGN_ID,
  experiment_id: EXPERIMENT_ID,
  target_isin: TARGET_ISIN,
  generated_at: retrievedAt,
  controls: {
    database_writes_performed: 0,
    paid_provider_calls: 0,
    official_network_retrievals: artifacts.filter(
      (artifact) => artifact.retrieval_mode === "NETWORK",
    ).length,
    exact_rows_expected_for_durable_insert: 2,
    exact_archives_expected_for_durable_insert: 2,
    scope: "RAW_NSE_PRICE_EVIDENCE_ONLY",
    derived_arithmetic_rows: 0,
  },
  artifacts,
  rows,
}

const payload = {
  ...core,
  payload_hash: sha256(JSON.stringify(core)),
  ready_for_durable_insert: true,
}

writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n")

console.log(JSON.stringify({
  version: payload.version,
  campaign_id: payload.campaign_id,
  target_isin: payload.target_isin,
  payload_hash: payload.payload_hash,
  ready_for_durable_insert: payload.ready_for_durable_insert,
  artifacts: payload.artifacts.map((artifact) => ({
    source_kind: artifact.source_kind,
    trade_date: artifact.trade_date,
    archive_sha256: artifact.archive_sha256,
    csv_sha256: artifact.csv_sha256,
    retrieval_mode: artifact.retrieval_mode,
  })),
  rows: payload.rows.map((row) => ({
    source_kind: row.source_kind,
    trade_date: row.trade_date,
    historical_isin: row.historical_isin,
    trading_symbol: row.trading_symbol,
    series: row.series,
    close: row.close,
    row_hash: row.row_hash,
  })),
  output: OUT,
}, null, 2))
