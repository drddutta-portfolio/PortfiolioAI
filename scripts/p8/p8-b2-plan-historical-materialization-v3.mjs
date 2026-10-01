#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import Papa from "papaparse"

const ROOT = process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const MANIFEST_PATH = join(ROOT, "manifest.json")
const RECONCILIATION_PATH = process.env.P8_B2_RECONCILIATION
  ?? join(ROOT, "historical-identity-reconciliation.json")
const CLASSIFICATION_PATH = process.env.P8_B2_CLASSIFICATION
  ?? join(ROOT, "historical-identity-classification.json")
const SNAPSHOT_PATH = process.env.P8_B2_CANONICAL_SNAPSHOT
  ?? "docs/p8/PortfolioAI_P8_B2_CURRENT_SECURITY_IDENTITY_SNAPSHOT_2026-09-30.json"
const OUT = process.env.P8_B2_MATERIALIZATION_PLAN
  ?? join(ROOT, "historical-materialization-v3-plan.json")

const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
const UNIVERSE_VERSION = "P8_NSE_HISTORICAL_UNIVERSE_V1"
const RESOLVER_VERSION = "P8_B2_HISTORICAL_IDENTITY_RESOLVER_V3"
const SELECTOR_VERSION = "P8_B2_HISTORICAL_IDENTITY_SELECTOR_V3"
const SOURCE_CODE = "NSE_CM_MII_SECURITY_MASTER"
const PROOF_BASIS = "NSE_SECURITY_MASTER_BEFORE_TRADING_HOURS"
const PROOF_REFERENCE = "NSE/MSD/60315;NSE/MSD/67344;NSE_MARKET_TIMINGS"

function clean(v) { return String(v ?? "").trim() }
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  return "{" + Object.keys(value).sort().map((k) => JSON.stringify(k) + ":" + canonical(value[k])).join(",") + "}"
}
function sha256(value) {
  return createHash("sha256").update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonical(value)).digest("hex")
}
function parseIsin(isin) {
  const value = clean(isin)
  return {
    value,
    format_ok: /^[A-Z0-9]{12}$/.test(value) && value.startsWith("IN"),
    issuer_type: value.length >= 3 ? value[2] : null,
    security_type_code: value.length >= 9 ? value.slice(7, 9) : null,
  }
}
function isFrozenCompanyEquity(isin) {
  const p = parseIsin(isin)
  return p.format_ok && (p.issuer_type === "E" || p.issuer_type === "9") && p.security_type_code === "01"
}
function decisionAt(date) { return `${date}T15:30:00+05:30` }
function availableAt(date) { return `${date}T09:00:00+05:30` }

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))
const reconciliation = JSON.parse(readFileSync(RECONCILIATION_PATH, "utf8"))
const classification = JSON.parse(readFileSync(CLASSIFICATION_PATH, "utf8"))
const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"))

const failures = []
if (manifest?.summary?.months_acquired !== 32 || manifest?.summary?.months_missing !== 0) failures.push("MANIFEST_NOT_32_OF_32")
if (classification?.summary?.frozen_company_equity_identities !== 4524) failures.push("CLASSIFICATION_IDENTITY_COUNT_DRIFT")
if (classification?.summary?.exact_current_equity_links !== 255) failures.push("CLASSIFICATION_EXACT_LINK_COUNT_DRIFT")
if (classification?.summary?.current_null_isin_company_equity_candidates !== 7) failures.push("CLASSIFICATION_NULL_ISIN_LINK_COUNT_DRIFT")
if (classification?.summary?.p8_local_historical_identity_rows_required !== 4262) failures.push("CLASSIFICATION_LOCAL_IDENTITY_COUNT_DRIFT")
if (!Array.isArray(snapshot?.securities) || snapshot.securities.length !== 284) failures.push("CANONICAL_SNAPSHOT_DRIFT")

const identities = []
for (const row of reconciliation.matched_by_isin ?? []) {
  if (!isFrozenCompanyEquity(row.isin)) continue
  const s = row.canonical_security
  if (!s || s.asset_class !== "EQUITY" || clean(s.isin) !== clean(row.isin)) {
    failures.push(`EXACT_ISIN_LINK_INVALID:${row.isin}`)
    continue
  }
  const p = parseIsin(row.isin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    historical_isin: p.value,
    issuer_type: p.issuer_type,
    security_type_code: p.security_type_code,
    canonical_security_id: s.id,
    canonical_link_basis: "EXACT_ISIN",
    canonical_link_symbol: null,
    link_evidence: { reconciliation_basis: "EXACT_ISIN", current_symbol: s.symbol },
  }
  identities.push({ ...logical, identity_hash: sha256(logical) })
}
for (const row of reconciliation.current_null_isin_symbol_candidates ?? []) {
  if (!isFrozenCompanyEquity(row.isin)) continue
  const candidates = row.candidate_securities ?? []
  if (candidates.length !== 1) {
    failures.push(`NULL_ISIN_LINK_NOT_UNIQUE:${row.isin}`)
    continue
  }
  const s = candidates[0]
  if (!s || s.asset_class !== "EQUITY" || s.exchange !== "NSE" || s.isin !== null || !(row.latest_symbols ?? []).includes(s.symbol)) {
    failures.push(`NULL_ISIN_LINK_INVALID:${row.isin}`)
    continue
  }
  const p = parseIsin(row.isin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    historical_isin: p.value,
    issuer_type: p.issuer_type,
    security_type_code: p.security_type_code,
    canonical_security_id: s.id,
    canonical_link_basis: "EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN",
    canonical_link_symbol: s.symbol,
    link_evidence: { reconciliation_basis: "UNIQUE_CURRENT_NSE_SYMBOL_WITH_NULL_ISIN", current_symbol: s.symbol },
  }
  identities.push({ ...logical, identity_hash: sha256(logical) })
}
for (const row of reconciliation.canonical_additions_required ?? []) {
  if (!isFrozenCompanyEquity(row.isin)) continue
  const p = parseIsin(row.isin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    historical_isin: p.value,
    issuer_type: p.issuer_type,
    security_type_code: p.security_type_code,
    canonical_security_id: null,
    canonical_link_basis: "NONE",
    canonical_link_symbol: null,
    link_evidence: { reconciliation_basis: "P8_LOCAL_HISTORICAL_IDENTITY_ONLY" },
  }
  identities.push({ ...logical, identity_hash: sha256(logical) })
}

identities.sort((a,b) => a.historical_isin.localeCompare(b.historical_isin))
const identityMap = new Map(identities.map((x) => [x.historical_isin, x]))
if (identityMap.size !== identities.length) failures.push("DUPLICATE_MATERIALIZATION_IDENTITIES")
if (identities.length !== 4524) failures.push(`IDENTITY_COUNT_${identities.length}_NOT_4524`)

const linkCounts = identities.reduce((acc, x) => {
  acc[x.canonical_link_basis] = (acc[x.canonical_link_basis] ?? 0) + 1
  return acc
}, {})

const retrievedAt = manifest?.summary?.generated_at
if (!retrievedAt || !Number.isFinite(Date.parse(retrievedAt))) failures.push("MANIFEST_COMPLETION_TIMESTAMP_MISSING")

const months = []
let totalObservationRows = 0
let totalCsvRows = 0
const globalPresent = new Set()

for (const entry of manifest.months ?? []) {
  if (entry.state !== "ACQUIRED" || !entry.decision_date || !entry.csv_path || !entry.url) {
    failures.push(`MONTH_NOT_ACQUIRED:${entry.month}`)
    continue
  }
  const csvBuffer = readFileSync(entry.csv_path)
  const gzBuffer = readFileSync(`${entry.csv_path}.gz`)
  if (sha256(csvBuffer) !== entry.csv_sha256) failures.push(`CSV_HASH_MISMATCH:${entry.month}`)
  if (sha256(gzBuffer) !== entry.gzip_sha256) failures.push(`GZIP_HASH_MISMATCH:${entry.month}`)

  const parsed = Papa.parse(csvBuffer.toString("utf8"), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  if ((parsed.errors ?? []).length) failures.push(`CSV_PARSE_ERRORS:${entry.month}:${parsed.errors.length}`)
  totalCsvRows += parsed.data.length

  const rows = []
  for (let index = 0; index < parsed.data.length; index++) {
    const row = parsed.data[index]
    if (clean(row.SctyTpFlg) !== "0") continue
    const isin = clean(row.ISIN)
    if (!isFrozenCompanyEquity(isin)) continue
    if (!identityMap.has(isin)) {
      failures.push(`FROZEN_ROW_WITHOUT_IDENTITY:${entry.month}:${isin}`)
      continue
    }
    const symbol = clean(row.TckrSymb)
    const instrumentId = clean(row.FinInstrmId)
    const instrumentName = clean(row.FinInstrmNm)
    if (!symbol || !instrumentId || !instrumentName) {
      failures.push(`REQUIRED_LISTING_FIELD_MISSING:${entry.month}:${isin}:${index+2}`)
      continue
    }
    const logical = {
      source_date: entry.decision_date,
      source_row_number: index + 2,
      historical_isin: isin,
      exchange: "NSE",
      trading_symbol: symbol,
      series: clean(row.SctySrs) || null,
      instrument_id: instrumentId,
      instrument_name: instrumentName,
      source_presence_state: "PRESENT_IN_SECURITY_MASTER",
      source_csv_sha256: entry.csv_sha256,
    }
    rows.push({ ...logical, row_hash: sha256(logical) })
    globalPresent.add(isin)
  }

  const rowHashSet = new Set(rows.map((x) => x.row_hash))
  if (rowHashSet.size !== rows.length) failures.push(`ROW_HASH_COLLISION_OR_DUPLICATE:${entry.month}`)

  const presentIsins = new Set(rows.map((x) => x.historical_isin))
  const archiveLogical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    source_code: SOURCE_CODE,
    source_date: entry.decision_date,
    source_url: entry.url,
    source_file_name: basename(entry.csv_path),
    csv_sha256: entry.csv_sha256,
    gzip_sha256: entry.gzip_sha256,
    source_published_at: null,
    available_no_later_than_at: availableAt(entry.decision_date),
    availability_proof_basis: PROOF_BASIS,
    availability_proof_reference: PROOF_REFERENCE,
    retrieved_at: retrievedAt,
    raw_metadata: {
      acquisition_month: entry.month,
      retrieval_timestamp_basis: "ACQUISITION_MANIFEST_COMPLETION_TIME",
      source_manifest_version: manifest.version,
    },
  }
  const archiveHash = sha256(archiveLogical)
  if (Date.parse(archiveLogical.available_no_later_than_at) >= Date.parse(decisionAt(entry.decision_date))) {
    failures.push(`AVAILABILITY_NOT_BEFORE_DECISION:${entry.month}`)
  }
  if (Date.parse(archiveLogical.available_no_later_than_at) > Date.parse(retrievedAt)) {
    failures.push(`AVAILABILITY_AFTER_RETRIEVAL:${entry.month}`)
  }

  months.push({
    month: entry.month,
    decision_date: entry.decision_date,
    decision_at: decisionAt(entry.decision_date),
    source_cutoff_at: decisionAt(entry.decision_date),
    archive: { ...archiveLogical, archive_hash: archiveHash },
    source_file_row_count: parsed.data.length,
    frozen_observation_rows: rows.length,
    eligible_identity_count: presentIsins.size,
    ineligible_identity_count: identities.length - presentIsins.size,
    evidence_link_count: rows.length,
    row_hash_fingerprint: sha256(rows.map((x) => x.row_hash)),
  })
  totalObservationRows += rows.length
}

months.sort((a,b) => a.decision_date.localeCompare(b.decision_date))
const latest = months.at(-1)
if (months.length !== 32) failures.push(`DECISION_DATE_COUNT_${months.length}_NOT_32`)
if (months.length < 24) failures.push("MINIMUM_24_DECISION_DATES_NOT_MET")
if (globalPresent.size !== 4524) failures.push(`GLOBAL_PRESENT_IDENTITY_COUNT_${globalPresent.size}_NOT_4524`)
if (latest?.eligible_identity_count !== 4385) failures.push(`LATEST_ELIGIBLE_COUNT_${latest?.eligible_identity_count}_NOT_4385`)
if (identities.length - (latest?.eligible_identity_count ?? 0) !== 139) failures.push("LATEST_HISTORICAL_ONLY_COUNT_NOT_139")

const planCore = {
  version: "P8_B2_HISTORICAL_MATERIALIZATION_V3_PLAN_V1",
  portfolio_id: PORTFOLIO_ID,
  experiment_id: EXPERIMENT_ID,
  universe_version: UNIVERSE_VERSION,
  resolver_version: RESOLVER_VERSION,
  selector_version: SELECTOR_VERSION,
  source_code: SOURCE_CODE,
  source_manifest_sha256: sha256(readFileSync(MANIFEST_PATH)),
  reconciliation_sha256: sha256(readFileSync(RECONCILIATION_PATH)),
  classification_sha256: sha256(readFileSync(CLASSIFICATION_PATH)),
  canonical_snapshot_sha256: sha256(readFileSync(SNAPSHOT_PATH)),
  identity_summary: {
    total: identities.length,
    by_link_basis: linkCounts,
  },
  decision_summary: {
    total_decision_dates: months.length,
    first_decision_date: months[0]?.decision_date ?? null,
    last_decision_date: latest?.decision_date ?? null,
    total_source_csv_rows: totalCsvRows,
    total_frozen_listing_observations: totalObservationRows,
    latest_eligible_identities: latest?.eligible_identity_count ?? null,
    latest_ineligible_identities: latest?.ineligible_identity_count ?? null,
    global_frozen_identities_observed: globalPresent.size,
  },
  months,
}
const planHash = sha256(planCore)
const output = {
  ...planCore,
  plan_hash: planHash,
  authorization_boundary: {
    remote_database_writes: 0,
    provider_calls: 0,
    p8_b3_started: false,
    p8_c_started: false,
    production_changed: false,
    main_changed: false,
  },
  readiness: {
    status: failures.length ? "BLOCKED" : "READY_FOR_APPROVED_MATERIALIZATION",
    failures,
  },
}

writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n")
console.log(JSON.stringify({
  status: output.readiness.status,
  failures,
  plan_hash: planHash,
  identities: output.identity_summary,
  decisions: output.decision_summary,
  output: OUT,
}, null, 2))
if (failures.length) process.exitCode = 2
