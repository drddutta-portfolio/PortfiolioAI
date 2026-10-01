import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { spawnSync } from "node:child_process"
import Papa from "papaparse"
import {
  CACHE,
  UDIFF_CUTOVER,
  USER_AGENT,
  assert,
  canonicalDecimal,
  chunks,
  clean,
  fetchWithRetry,
  normalizeDate,
  parseYmd,
  post,
  saveProgress,
  sha256,
  uploadArchive,
} from "./p8-b3-acquisition-common.mjs"

function legacyFile(date) {
  const d = parseYmd(date)
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mon = [
    "JAN","FEB","MAR","APR","MAY","JUN",
    "JUL","AUG","SEP","OCT","NOV","DEC",
  ][d.getUTCMonth()]
  const yyyy = d.getUTCFullYear()
  const file = "cm" + dd + mon + yyyy + "bhav.csv.zip"
  return {
    file,
    url:
      "https://nsearchives.nseindia.com/content/historical/EQUITIES/" +
      yyyy + "/" + mon + "/" + file,
  }
}

function udiffFile(date) {
  const yyyymmdd = date.replaceAll("-", "")
  const file = "BhavCopy_NSE_CM_0_0_0_" + yyyymmdd + "_F_0000.csv.zip"
  return {
    file,
    url: "https://nsearchives.nseindia.com/content/cm/" + file,
  }
}

function extractCsv(zipBytes, fileName) {
  const work = mkdtempSync(join(tmpdir(), "p8-b3-full-price-"))
  const zipPath = join(work, fileName)
  try {
    writeFileSync(zipPath, zipBytes)
    const list = spawnSync("unzip", ["-Z1", zipPath], { encoding: "utf8" })
    assert(list.status === 0, "Unable to list ZIP " + fileName)

    const members = list.stdout.split(/\r?\n/u)
      .map((value) => value.trim())
      .filter((value) => value.toLowerCase().endsWith(".csv"))
    assert(members.length >= 1, fileName + " contains no CSV")

    const member =
      members.find((value) => basename(value).toLowerCase().includes("bhav")) ||
      members[0]

    const extracted = spawnSync("unzip", ["-p", zipPath, member], {
      encoding: null,
      maxBuffer: 128 * 1024 * 1024,
    })
    assert(extracted.status === 0, "Unable to extract " + fileName)
    return { member, bytes: Buffer.from(extracted.stdout) }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

function headerMap(fields) {
  const normalize = (value) => clean(value)
    .replace(/^\uFEFF/u, "")
    .replace(/[ ._\-/()]+/gu, "")
    .toUpperCase()
  return new Map(fields.map((field) => [normalize(field), field]))
}

function field(map, aliases, label, required = true) {
  for (const alias of aliases) {
    const value = map.get(alias)
    if (value) return value
  }
  if (required) throw new Error("Missing " + label + " field")
  return null
}

function parsePriceCsv(csvBytes, date, sourceFormat) {
  const parsed = Papa.parse(csvBytes.toString("utf8"), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.replace(/^\uFEFF/u, "").trim(),
  })

  if ((parsed.errors || []).length) {
    throw new Error(
      "CSV parse errors " + date + ": " +
      JSON.stringify(parsed.errors.slice(0, 3)),
    )
  }

  const map = headerMap(parsed.meta.fields || [])
  const isLegacy = sourceFormat === "LEGACY_BHAVCOPY"
  const f = isLegacy
    ? {
        isin: field(map, ["ISIN"], "ISIN"),
        symbol: field(map, ["SYMBOL"], "SYMBOL"),
        series: field(map, ["SERIES"], "SERIES"),
        previousClose: field(map, ["PREVCLOSE"], "PREVCLOSE"),
        open: field(map, ["OPEN"], "OPEN"),
        high: field(map, ["HIGH"], "HIGH"),
        low: field(map, ["LOW"], "LOW"),
        close: field(map, ["CLOSE"], "CLOSE"),
        lastPrice: field(map, ["LAST"], "LAST", false),
        volume: field(map, ["TOTTRDQTY"], "TOTTRDQTY", false),
        tradedValue: field(map, ["TOTTRDVAL"], "TOTTRDVAL", false),
        tradeCount: field(map, ["TOTALTRADES"], "TOTALTRADES", false),
        date: field(map, ["TIMESTAMP"], "TIMESTAMP"),
      }
    : {
        isin: field(map, ["ISIN"], "ISIN"),
        symbol: field(map, ["TCKRSYMB", "TCKRSYMBL", "TCKRSYMBOL"], "ticker"),
        series: field(map, ["SCTYSRS"], "series"),
        previousClose: field(map, ["PRVSCLSGPRIC"], "previous close"),
        open: field(map, ["OPNPRIC"], "open"),
        high: field(map, ["HGHPRIC"], "high"),
        low: field(map, ["LWPRIC"], "low"),
        close: field(map, ["CLSPRIC"], "close"),
        lastPrice: field(map, ["LSTTRDDPRIC", "LASTPRIC"], "last price", false),
        volume: field(map, ["TTLTRADGVOL"], "volume", false),
        tradedValue: field(map, ["TTLTRADVAL", "TTLTRADGVAL"], "value", false),
        tradeCount: field(map, ["TTLNMBRTRADES", "TTLTRADES"], "trades", false),
        date: field(map, ["TRADDT", "TRADDATE"], "trade date"),
      }

  const companyIsin = /^IN[E9][A-Z0-9]{4}01[A-Z0-9]{3}$/u
  const rows = []

  for (const row of parsed.data) {
    const isin = clean(row[f.isin])
    if (!companyIsin.test(isin)) continue

    const embedded = normalizeDate(row[f.date])
    if (embedded !== date) {
      throw new Error(
        "Embedded trade date mismatch " + embedded + " != " + date,
      )
    }

    const logical = {
      historical_isin: isin,
      trade_date: date,
      exchange: "NSE",
      trading_symbol: clean(row[f.symbol]),
      series: clean(row[f.series]) || null,
      source_format: sourceFormat,
      previous_close: canonicalDecimal(row[f.previousClose], "previous_close"),
      open: canonicalDecimal(row[f.open], "open"),
      high: canonicalDecimal(row[f.high], "high"),
      low: canonicalDecimal(row[f.low], "low"),
      close: canonicalDecimal(row[f.close], "close", { nullable: false }),
      last_price: f.lastPrice
        ? canonicalDecimal(row[f.lastPrice], "last_price")
        : null,
      volume: f.volume
        ? canonicalDecimal(row[f.volume], "volume")
        : null,
      traded_value: f.tradedValue
        ? canonicalDecimal(row[f.tradedValue], "traded_value")
        : null,
      trade_count: f.tradeCount
        ? canonicalDecimal(row[f.tradeCount], "trade_count")
        : null,
    }

    if (!logical.trading_symbol) {
      throw new Error(
        "Trading symbol missing for " + isin + " on " + date,
      )
    }
    if (
      logical.high !== null &&
      logical.low !== null &&
      Number(logical.high) < Number(logical.low)
    ) {
      throw new Error(
        "High/low invariant failed for " + isin + " on " + date,
      )
    }

    rows.push({
      ...logical,
      row_hash: sha256(logical),
      raw_metadata: {},
    })
  }

  assert(rows.length > 0, "No company-equity ISIN rows in " + date)
  return rows
}

export async function acquirePriceDate(date, progress) {
  const spec = date < UDIFF_CUTOVER ? legacyFile(date) : udiffFile(date)
  const sourceKind = date < UDIFF_CUTOVER
    ? "NSE_CM_BHAVCOPY_LEGACY"
    : "NSE_CM_BHAVCOPY_UDIFF"
  const sourceFormat = date < UDIFF_CUTOVER
    ? "LEGACY_BHAVCOPY"
    : "UDIFF_BHAVCOPY"

  const zipPath = join(CACHE.prices, spec.file)
  let zipBytes
  let retrievalMode

  if (existsSync(zipPath)) {
    zipBytes = readFileSync(zipPath)
    retrievalMode = "CACHE"
  } else {
    const response = await fetchWithRetry(spec.url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/zip,application/octet-stream,*/*",
        Referer: "https://www.nseindia.com/all-reports",
      },
    })

    assert(
      new URL(response.url).hostname === "nsearchives.nseindia.com",
      "Bhavcopy left official archive host",
    )

    zipBytes = Buffer.from(await response.arrayBuffer())
    assert(
      zipBytes.length > 2 &&
      zipBytes[0] === 0x50 &&
      zipBytes[1] === 0x4b,
      "Bhavcopy is not ZIP for proven trading date " + date,
    )
    writeFileSync(zipPath, zipBytes)
    retrievalMode = "NETWORK"
  }

  const extracted = extractCsv(zipBytes, spec.file)
  const rows = parsePriceCsv(extracted.bytes, date, sourceFormat)

  const archive = await uploadArchive({
    source_kind: sourceKind,
    source_period_start: date,
    source_period_end: date,
    source_url: spec.url,
    source_file_name: spec.file,
    content_sha256: sha256(extracted.bytes),
    compressed_sha256: sha256(zipBytes),
    source_published_at: null,
    retrieved_at: new Date().toISOString(),
    source_contract_version: sourceFormat === "LEGACY_BHAVCOPY"
      ? "P8_B3_NSE_BHAVCOPY_LEGACY_V1"
      : "P8_B3_NSE_BHAVCOPY_UDIFF_V1",
    raw_metadata: {
      official_source_page: "https://www.nseindia.com/all-reports",
      csv_member: extracted.member,
      archive_bytes: zipBytes.length,
      csv_bytes: extracted.bytes.length,
      retrieval_mode: retrievalMode,
    },
  })

  let resolved = 0
  let unknown = 0
  for (const batch of chunks(rows, 500)) {
    const result = await post("price_batch", {
      archiveId: archive.archive_id,
      rows: batch,
    })
    resolved += Number(result.resolved || 0)
    unknown += Number(result.skipped_unknown_isin || 0)
  }

  progress.metrics.price_rows_resolved += resolved
  progress.metrics.price_rows_unknown_isin += unknown
  if (!progress.completed_price_dates.includes(date)) {
    progress.completed_price_dates.push(date)
  }
  saveProgress(progress)

  console.log(
    "  price " + date +
      ": source=" + rows.length +
      " resolved=" + resolved +
      " unknown=" + unknown +
      " (" + retrievalMode + ")",
  )
}
