#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import Papa from "papaparse"

const ROOT = process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const SNAPSHOT = process.env.P8_B2_CANONICAL_SNAPSHOT
  ?? "docs/p8/PortfolioAI_P8_B2_CURRENT_SECURITY_IDENTITY_SNAPSHOT_2026-09-30.json"
const OUT = process.env.P8_B2_RECONCILIATION_OUT
  ?? join(ROOT, "historical-identity-reconciliation.json")

function sha256(value) {
  return createHash("sha256").update(value).digest("hex")
}
function clean(value) {
  return String(value ?? "").trim()
}
function stableUnique(values) {
  return [...new Set(values.filter(Boolean))].sort()
}
function gzipMtime(buffer) {
  if (buffer.length < 8 || buffer[0] !== 0x1f || buffer[1] !== 0x8b) return null
  const seconds = buffer.readUInt32LE(4)
  if (!seconds) return null
  return new Date(seconds * 1000).toISOString()
}
function isoLocalDecision(decisionDate) {
  return `${decisionDate}T15:30:00+05:30`
}

const manifest = JSON.parse(readFileSync(join(ROOT, "manifest.json"), "utf8"))
const inspection = JSON.parse(readFileSync(join(ROOT, "schema-inspection.json"), "utf8"))
const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"))

if (manifest?.summary?.months_acquired !== 32 || manifest?.summary?.months_missing !== 0) {
  throw new Error("P8-B2 requires the proven 32/32 acquired NSE month manifest before reconciliation")
}
if (!Array.isArray(inspection?.files) || inspection.files.length !== 32) {
  throw new Error("P8-B2 requires the 32-file schema inspection before reconciliation")
}
if (!Array.isArray(snapshot?.securities)) {
  throw new Error("P8-B2 canonical security identity snapshot is missing securities[]")
}

const currentByIsin = new Map()
const currentByNseSymbol = new Map()
const currentWithoutIsinByNseSymbol = new Map()
for (const security of snapshot.securities) {
  const isin = clean(security.isin)
  const exchange = clean(security.exchange)
  const symbol = clean(security.symbol)
  if (isin) {
    if (currentByIsin.has(isin)) throw new Error(`Duplicate canonical ISIN in snapshot: ${isin}`)
    currentByIsin.set(isin, security)
  }
  if (exchange === "NSE" && symbol) {
    const arr = currentByNseSymbol.get(symbol) ?? []
    arr.push(security)
    currentByNseSymbol.set(symbol, arr)
    if (!isin && security.asset_class === "EQUITY") {
      const nullIsin = currentWithoutIsinByNseSymbol.get(symbol) ?? []
      nullIsin.push(security)
      currentWithoutIsinByNseSymbol.set(symbol, nullIsin)
    }
  }
}

const manifestByMonth = new Map(manifest.months.map((entry) => [entry.month, entry]))
const historical = new Map()
const monthSummaries = []
let totalEquityRows = 0
let rowsMissingIsin = 0
let parseErrorCount = 0
let hashMismatchCount = 0
let gzipMtimePresent = 0
let gzipMtimeMissing = 0
let gzipMtimeSameCalendarDate = 0

for (const file of inspection.files) {
  const entry = manifestByMonth.get(file.month)
  if (!entry || entry.state !== "ACQUIRED") {
    throw new Error(`Missing acquired manifest entry for ${file.month}`)
  }

  const csvBuffer = readFileSync(file.csv_path)
  const gzPath = `${entry.csv_path}.gz`
  const gzBuffer = readFileSync(gzPath)
  const csvHash = sha256(csvBuffer)
  const gzHash = sha256(gzBuffer)
  const csvHashOk = csvHash === entry.csv_sha256
  const gzHashOk = gzHash === entry.gzip_sha256
  if (!csvHashOk || !gzHashOk) hashMismatchCount++

  const mtime = gzipMtime(gzBuffer)
  if (mtime) {
    gzipMtimePresent++
    if (mtime.slice(0, 10) === entry.decision_date) gzipMtimeSameCalendarDate++
  } else {
    gzipMtimeMissing++
  }

  const parsed = Papa.parse(csvBuffer.toString("utf8"), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  if ((parsed.errors ?? []).length) parseErrorCount += parsed.errors.length
  const equity = (parsed.data ?? []).filter((row) => clean(row.SctyTpFlg) === "0")
  totalEquityRows += equity.length

  const monthIsins = new Set()
  for (const row of equity) {
    const isin = clean(row.ISIN)
    if (!isin) {
      rowsMissingIsin++
      continue
    }

    const record = {
      isin,
      symbol: clean(row.TckrSymb),
      series: clean(row.SctySrs),
      name: clean(row.FinInstrmNm),
      instrument_id: clean(row.FinInstrmId),
    }
    monthIsins.add(isin)

    const identity = historical.get(isin) ?? {
      isin,
      symbols: new Set(),
      series: new Set(),
      names: new Set(),
      instrument_ids: new Set(),
      months: new Set(),
      first_decision_date: entry.decision_date,
      last_decision_date: entry.decision_date,
      latest_rows: [],
    }

    if (record.symbol) identity.symbols.add(record.symbol)
    if (record.series) identity.series.add(record.series)
    if (record.name) identity.names.add(record.name)
    if (record.instrument_id) identity.instrument_ids.add(record.instrument_id)
    identity.months.add(file.month)

    if (entry.decision_date < identity.first_decision_date) identity.first_decision_date = entry.decision_date
    if (entry.decision_date > identity.last_decision_date) {
      identity.last_decision_date = entry.decision_date
      identity.latest_rows = [record]
    } else if (entry.decision_date === identity.last_decision_date) {
      identity.latest_rows.push(record)
    }

    historical.set(isin, identity)
  }

  monthSummaries.push({
    month: file.month,
    decision_date: entry.decision_date,
    decision_at: isoLocalDecision(entry.decision_date),
    source_url: entry.url,
    source_file: basename(entry.csv_path),
    csv_sha256: entry.csv_sha256,
    gzip_sha256: entry.gzip_sha256,
    hashes_match: csvHashOk && gzHashOk,
    gzip_mtime: mtime,
    equity_rows: equity.length,
    unique_isins: monthIsins.size,
  })
}

const matchedByIsin = []
const currentNullIsinSymbolCandidates = []
const additionsRequired = []
const currentSymbolCollisions = []
const latestMultiSymbol = []
const latestMultiName = []

for (const identity of [...historical.values()].sort((a, b) => a.isin.localeCompare(b.isin))) {
  const latestRows = [...new Map(identity.latest_rows.map((row) => [JSON.stringify(row), row])).values()]
  const latestSymbols = stableUnique(latestRows.map((row) => row.symbol))
  const latestNames = stableUnique(latestRows.map((row) => row.name))
  const latestSeries = stableUnique(latestRows.map((row) => row.series))
  const latestInstrumentIds = stableUnique(latestRows.map((row) => row.instrument_id))
  const base = {
    isin: identity.isin,
    first_decision_date: identity.first_decision_date,
    last_decision_date: identity.last_decision_date,
    month_count: identity.months.size,
    all_symbols: stableUnique([...identity.symbols]),
    all_series: stableUnique([...identity.series]),
    all_names: stableUnique([...identity.names]),
    all_instrument_ids: stableUnique([...identity.instrument_ids]),
    latest_symbols: latestSymbols,
    latest_names: latestNames,
    latest_series: latestSeries,
    latest_instrument_ids: latestInstrumentIds,
  }

  if (latestSymbols.length > 1) latestMultiSymbol.push(base)
  if (latestNames.length > 1) latestMultiName.push(base)

  const canonical = currentByIsin.get(identity.isin)
  if (canonical) {
    matchedByIsin.push({ ...base, canonical_security: canonical })
    continue
  }

  const nullIsinMatches = stableUnique(
    latestSymbols.flatMap((symbol) =>
      (currentWithoutIsinByNseSymbol.get(symbol) ?? []).map((security) => security.id),
    ),
  )
  if (nullIsinMatches.length) {
    currentNullIsinSymbolCandidates.push({
      ...base,
      candidate_security_ids: nullIsinMatches,
      candidate_securities: nullIsinMatches.map((id) =>
        snapshot.securities.find((security) => security.id === id),
      ),
    })
    continue
  }

  const collisions = latestSymbols.flatMap((symbol) =>
    (currentByNseSymbol.get(symbol) ?? [])
      .filter((security) => clean(security.isin) !== identity.isin)
      .map((security) => ({ symbol, security })),
  )
  if (collisions.length) currentSymbolCollisions.push({ ...base, collisions })

  additionsRequired.push({
    ...base,
    symbol_collision_count: collisions.length,
    canonical_addition_required: true,
  })
}

const historicalIsins = new Set(historical.keys())
const currentEquityIsinsAbsentFromArchive = snapshot.securities
  .filter((security) => security.asset_class === "EQUITY" && clean(security.isin))
  .filter((security) => !historicalIsins.has(clean(security.isin)))
  .map((security) => ({
    id: security.id,
    isin: security.isin,
    symbol: security.symbol,
    name: security.name,
  }))
  .sort((a, b) => a.isin.localeCompare(b.isin))

const blockers = []
if (hashMismatchCount) blockers.push("SOURCE_HASH_MISMATCH")
if (parseErrorCount) blockers.push("CSV_PARSE_ERRORS")
if (rowsMissingIsin) blockers.push("EQUITY_ROWS_MISSING_ISIN")
if (gzipMtimeMissing) blockers.push("SOURCE_PUBLICATION_TIMESTAMP_NOT_PROVEN_FROM_GZIP_METADATA")
if (currentNullIsinSymbolCandidates.length) blockers.push("CANONICAL_CURRENT_SECURITIES_REQUIRE_ISIN_RECONCILIATION")
if (additionsRequired.length) blockers.push("CANONICAL_HISTORICAL_SECURITY_ADDITIONS_REQUIRED")

const output = {
  version: "P8_B2_HISTORICAL_IDENTITY_RECONCILIATION_V1",
  generated_at: new Date().toISOString(),
  authorization_boundary: {
    database_writes: false,
    provider_calls: false,
    historical_materialization_performed: false,
    p8_b3_started: false,
    p8_c_started: false,
  },
  inputs: {
    manifest: join(ROOT, "manifest.json"),
    inspection: join(ROOT, "schema-inspection.json"),
    canonical_security_snapshot: SNAPSHOT,
    canonical_snapshot_sha256: `sha256:${sha256(readFileSync(SNAPSHOT))}`,
  },
  summary: {
    files_checked: inspection.files.length,
    total_equity_rows: totalEquityRows,
    historical_unique_isins: historical.size,
    canonical_securities: snapshot.securities.length,
    canonical_distinct_isins: currentByIsin.size,
    matched_by_isin: matchedByIsin.length,
    current_null_isin_symbol_candidates: currentNullIsinSymbolCandidates.length,
    canonical_additions_required: additionsRequired.length,
    current_symbol_collision_groups: currentSymbolCollisions.length,
    latest_multi_symbol_isins: latestMultiSymbol.length,
    latest_multi_name_isins: latestMultiName.length,
    current_equity_isins_absent_from_archive: currentEquityIsinsAbsentFromArchive.length,
    rows_missing_isin: rowsMissingIsin,
    parse_error_count: parseErrorCount,
    hash_mismatch_count: hashMismatchCount,
    gzip_mtime_present_files: gzipMtimePresent,
    gzip_mtime_missing_files: gzipMtimeMissing,
    gzip_mtime_same_calendar_date_files: gzipMtimeSameCalendarDate,
    ready_for_materialization: blockers.length === 0,
    blockers,
  },
  month_summaries: monthSummaries,
  matched_by_isin: matchedByIsin,
  current_null_isin_symbol_candidates: currentNullIsinSymbolCandidates,
  canonical_additions_required: additionsRequired,
  current_symbol_collisions: currentSymbolCollisions,
  latest_multi_symbol_isins: latestMultiSymbol,
  latest_multi_name_isins: latestMultiName,
  current_equity_isins_absent_from_archive: currentEquityIsinsAbsentFromArchive,
}

writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n")
console.log(JSON.stringify({ ...output.summary, output: OUT }, null, 2))
if (blockers.length) process.exitCode = 2
