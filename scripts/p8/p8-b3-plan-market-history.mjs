#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { mkdirSync } from "node:fs"

const START = new Date("2023-10-01T00:00:00Z")
const END = new Date("2026-09-30T00:00:00Z")
const UDIFF_CUTOVER = new Date("2024-07-08T00:00:00Z")
const OUT = process.env.P8_B3_MANIFEST_OUT
  ?? "tmp/p8-b3/P8_B3_DRY_RUN_ACQUISITION_MANIFEST.json"

const B2_AUDIT_PATH =
  "docs/p8/PortfolioAI_P8_B2_HISTORICAL_MATERIALIZATION_COMPLETION_AUDIT_2026-10-01.json"

const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
const BENCHMARK_VERSION = "P8_NIFTY500_TRI_V1"

function ymd(date) {
  return date.toISOString().slice(0, 10)
}

function yyyymmdd(date) {
  return ymd(date).replaceAll("-", "")
}

function legacyDisplayName(date) {
  const dd = String(date.getUTCDate()).padStart(2, "0")
  const mon = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"][date.getUTCMonth()]
  return `cm${dd}${mon}${date.getUTCFullYear()}bhav.csv.zip`
}

function sha256(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex")
}

function candidateWeekdays(start, end) {
  const rows = []
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.getUTCDay()
    if (day === 0 || day === 6) continue
    rows.push(new Date(d))
  }
  return rows
}

const b2 = JSON.parse(readFileSync(B2_AUDIT_PATH, "utf8"))
if (
  b2?.result !== "COMPLETE_PASS_CLOSED" ||
  b2?.counts?.historical_security_identities !== 4524 ||
  b2?.selected_date_range?.count !== 32
) {
  throw new Error("P8-B2 completion audit does not match the closed upstream gate")
}

const marketDateCandidates = candidateWeekdays(START, END).map((date) => {
  const isUdiff = date >= UDIFF_CUTOVER
  return {
    date: ymd(date),
    state: "CANDIDATE_WEEKDAY_NOT_YET_PROVEN_TRADING_DATE",
    official_source_page: "https://www.nseindia.com/all-reports",
    report_display_name: isUdiff
      ? "CM-UDiFF Common Bhavcopy Final (zip)"
      : "CM - Bhavcopy(csv)",
    source_kind: isUdiff
      ? "NSE_CM_BHAVCOPY_UDIFF"
      : "NSE_CM_BHAVCOPY_LEGACY",
    expected_file_name: isUdiff
      ? `BhavCopy_NSE_CM_0_0_0_${yyyymmdd(date)}_F_0000.csv.zip`
      : legacyDisplayName(date),
    exact_download_url: null,
    resolution_state: "REQUIRES_OFFICIAL_NSE_REPORT_PROBE",
    acceptance_rule:
      "Accept only an official NSE report response for this exact trade date and report family. " +
      "Weekend/holiday/unavailable dates remain explicit non-trading or missing blockers; never substitute another date.",
  }
})

const manifestCore = {
  version: "P8_B3_DRY_RUN_ACQUISITION_MANIFEST_V1",
  generated_for: "PortfolioAI Development only",
  experiment_id: EXPERIMENT_ID,
  frozen_window: ["2023-10-01", "2026-09-30"],
  upstream_b2: {
    selected_dates: b2.selected_date_range,
    historical_security_identities: b2.counts.historical_security_identities,
    completion_hash: b2.completion_hash,
  },
  controls: {
    network_requests_performed: 0,
    provider_calls_performed: 0,
    database_writes_performed: 0,
    guessed_download_urls: 0,
    rule:
      "This is a dry-run manifest. Exact downloadable URLs are intentionally null until resolved from the official source surface.",
  },
  authorities: {
    raw_equity_ohlcv: {
      authority: "National Stock Exchange of India",
      source_page: "https://www.nseindia.com/all-reports",
      legacy_report: "CM - Bhavcopy(csv)",
      udiff_report: "CM-UDiFF Common Bhavcopy Final (zip)",
      udiff_cutover_date: "2024-07-08",
      cutover_basis:
        "Official NSE All Reports states CM Bhavcopy/Common Bhavcopy discontinued w.e.f. 08-Jul-2024 and replaced by CM-UDiFF Common Bhavcopy Final.",
      raw_ohlcv_immutable: true,
    },
    corporate_actions: {
      authority: "National Stock Exchange of India",
      source_page: "https://www.nseindia.com/companies-listing/corporate-filings-actions",
      report: "Corporate Actions downloadable CSV",
      requested_range: ["2023-10-01", "2026-09-30"],
      exact_download_url: null,
      resolution_state: "REQUIRES_OFFICIAL_CSV_EXPORT_CANARY",
      required_raw_fields: [
        "SYMBOL",
        "COMPANY NAME",
        "SERIES",
        "PURPOSE",
        "FACE VALUE",
        "EX-DATE",
        "RECORD DATE",
        "BOOK CLOSURE START DATE",
        "BOOK CLOSURE END DATE",
      ],
    },
    primary_benchmark: {
      authority: "NSE Indices Limited",
      source_page: "https://www.niftyindices.com/reports/historical-data",
      report: "Total returns Index Values",
      index: "NIFTY 500",
      benchmark_version: BENCHMARK_VERSION,
      requested_range: ["2023-10-01", "2026-09-30"],
      exact_download_url: null,
      resolution_state: "REQUIRES_OFFICIAL_TRI_EXPORT_CANARY",
      required_fields: ["IndexName", "Date", "Total Returns Index"],
    },
  },
  market_date_candidates: marketDateCandidates,
}

const manifest = {
  ...manifestCore,
  manifest_hash: sha256(manifestCore),
  summary: {
    candidate_weekdays: marketDateCandidates.length,
    legacy_format_candidates: marketDateCandidates.filter(
      (row) => row.source_kind === "NSE_CM_BHAVCOPY_LEGACY",
    ).length,
    udiff_format_candidates: marketDateCandidates.filter(
      (row) => row.source_kind === "NSE_CM_BHAVCOPY_UDIFF",
    ).length,
    proven_trading_dates: 0,
    resolved_download_urls: 0,
    acquisition_ready: false,
    blockers: [
      "Exact official NSE report URLs/files must be resolved and HTTP/content-validated before acquisition.",
      "Official corporate-action CSV export must be canary-validated before bulk retrieval.",
      "Official NIFTY 500 TRI export must be canary-validated before benchmark acquisition.",
      "No calendar weekday is treated as a trading date until official source evidence exists.",
    ],
  },
}

mkdirSync(dirname(OUT), { recursive: true })
writeFileSync(OUT, JSON.stringify(manifest, null, 2) + "\n")

console.log(JSON.stringify({
  version: manifest.version,
  manifest_hash: manifest.manifest_hash,
  summary: manifest.summary,
  output: OUT,
}, null, 2))

if (manifest.summary.acquisition_ready) {
  throw new Error("Dry-run manifest unexpectedly marked acquisition-ready")
}
