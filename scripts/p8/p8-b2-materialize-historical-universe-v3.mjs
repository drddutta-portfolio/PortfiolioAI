#!/usr/bin/env node
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { basename, join } from "node:path"
import Papa from "papaparse"

const ROOT = process.env.P8_B2_OUT ?? "tmp/p8-b2-nse"
const PLAN_PATH = process.env.P8_B2_MATERIALIZATION_PLAN
  ?? join(ROOT, "historical-materialization-v3-plan.json")
const RECONCILIATION_PATH = process.env.P8_B2_RECONCILIATION
  ?? join(ROOT, "historical-identity-reconciliation.json")
const MANIFEST_PATH = join(ROOT, "manifest.json")

const PROJECT_REF = "lrgpjimipfkyoqbpsqzz"
const FUNCTION_URL = process.env.P8_B2_MATERIALIZER_URL
  ?? "https://" + PROJECT_REF + ".supabase.co/functions/v1/p8-b2-materialize-historical-universe"
const ACTION = "P8_B2_MATERIALIZE_HISTORICAL_UNIVERSE_V3"
const EXPECTED_PLAN_HASH = "ea253903259183d3bf287e51412c6fa0938ea8b06260e48e40c682af2dfdf5b3"
const PORTFOLIO_ID = "6193a4aa-3235-4057-bddc-209fcf443fc2"
const EXPERIMENT_ID = "P8_EXP_NSE_MONTHLY_6M_V1"
const RESOLVER_VERSION = "P8_B2_HISTORICAL_IDENTITY_RESOLVER_V3"
const UNIVERSE_VERSION = "P8_NSE_HISTORICAL_UNIVERSE_V1"

const GRANT_ID = String(process.env.P8_B2_MATERIALIZATION_GRANT ?? "").trim()
const PUBLISHABLE_KEY = String(process.env.P8_B2_PUBLISHABLE_KEY ?? "").trim()

const argv = process.argv.slice(2)
const args = new Set(argv)
const canary = args.has("--canary")
const resume = args.has("--resume")
const fromArgIndex = argv.indexOf("--from")
const fromDate = fromArgIndex >= 0 ? clean(argv[fromArgIndex + 1]) : null
if ((canary && resume) || (!canary && !resume)) {
  throw new Error("Use exactly one mode: --canary or --resume")
}
if (fromDate && !/^\d{4}-\d{2}-\d{2}$/u.test(fromDate)) {
  throw new Error("--from requires YYYY-MM-DD")
}
if (!/^[0-9a-f-]{36}$/iu.test(GRANT_ID)) {
  throw new Error("P8_B2_MATERIALIZATION_GRANT is required")
}

function clean(value) { return String(value ?? "").trim() }
function canonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonical).join(",") + "]"
  return "{" + Object.keys(value).sort().map((key) => JSON.stringify(key) + ":" + canonical(value[key])).join(",") + "}"
}
function sha256(value) {
  return createHash("sha256")
    .update(typeof value === "string" || Buffer.isBuffer(value) ? value : canonical(value))
    .digest("hex")
}
function chunks(rows, size) {
  const out = []
  for (let index = 0; index < rows.length; index += size) out.push(rows.slice(index, index + size))
  return out
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
  const parsed = parseIsin(isin)
  return parsed.format_ok
    && (parsed.issuer_type === "E" || parsed.issuer_type === "9")
    && parsed.security_type_code === "01"
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }

async function post(operation, extra = {}) {
  const headers = { "Content-Type": "application/json" }
  if (PUBLISHABLE_KEY) {
    headers.apikey = PUBLISHABLE_KEY
    headers.Authorization = "Bearer " + PUBLISHABLE_KEY
  }
  const body = JSON.stringify({
    action: ACTION,
    planHash: EXPECTED_PLAN_HASH,
    grantId: GRANT_ID,
    operation,
    ...extra,
  })

  let last
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const response = await fetch(FUNCTION_URL, { method: "POST", headers, body })
      const payload = await response.json().catch(() => ({ error: "NON_JSON_RESPONSE" }))
      last = { response, payload }
      if (response.ok) return payload
      if (response.status < 500 && response.status !== 429) {
        throw new Error(operation + " HTTP " + response.status + ": " + JSON.stringify(payload))
      }
    } catch (error) {
      last = { networkError: error }
      if (attempt === 5) {
        throw new Error(
          operation + " network failure after 5 attempts: " +
          (error instanceof Error ? error.message : String(error)),
          { cause: error },
        )
      }
    }
    if (attempt < 5) {
      const delay = Math.min(15000, 1000 * (2 ** (attempt - 1)))
      console.log("  retry " + operation + " attempt " + (attempt + 1) + "/5 after " + delay + "ms")
      await sleep(delay)
    }
  }

  if (last?.response) {
    throw new Error(
      operation + " HTTP " + last.response.status + ": " + JSON.stringify(last.payload),
    )
  }
  throw new Error(operation + " failed without a response")
}

const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"))
const reconciliation = JSON.parse(readFileSync(RECONCILIATION_PATH, "utf8"))
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"))

if (
  plan?.plan_hash !== EXPECTED_PLAN_HASH ||
  plan?.readiness?.status !== "READY_FOR_APPROVED_MATERIALIZATION" ||
  plan?.identity_summary?.total !== 4524 ||
  plan?.decision_summary?.total_decision_dates !== 32 ||
  plan?.decision_summary?.total_frozen_listing_observations !== 562790
) throw new Error("Frozen materialization plan does not match the approved preflight")

const identities = []
for (const row of reconciliation.matched_by_isin ?? []) {
  if (!isFrozenCompanyEquity(row.isin)) continue
  const security = row.canonical_security
  if (!security || security.asset_class !== "EQUITY" || clean(security.isin) !== clean(row.isin)) {
    throw new Error("Exact-ISIN reconciliation drift: " + row.isin)
  }
  const parsed = parseIsin(row.isin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    historical_isin: parsed.value,
    issuer_type: parsed.issuer_type,
    security_type_code: parsed.security_type_code,
    canonical_security_id: security.id,
    canonical_link_basis: "EXACT_ISIN",
    canonical_link_symbol: null,
    link_evidence: {
      reconciliation_basis: "EXACT_ISIN",
      current_symbol: security.symbol,
    },
  }
  identities.push({ ...logical, identity_hash: sha256(logical) })
}

for (const row of reconciliation.current_null_isin_symbol_candidates ?? []) {
  if (!isFrozenCompanyEquity(row.isin)) continue
  const candidates = row.candidate_securities ?? []
  if (candidates.length !== 1) throw new Error("Null-ISIN link not unique: " + row.isin)
  const security = candidates[0]
  if (
    security.asset_class !== "EQUITY" || security.exchange !== "NSE" ||
    security.isin !== null || !(row.latest_symbols ?? []).includes(security.symbol)
  ) throw new Error("Null-ISIN reconciliation drift: " + row.isin)

  const parsed = parseIsin(row.isin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    historical_isin: parsed.value,
    issuer_type: parsed.issuer_type,
    security_type_code: parsed.security_type_code,
    canonical_security_id: security.id,
    canonical_link_basis: "EXACT_NSE_SYMBOL_CURRENT_NULL_ISIN",
    canonical_link_symbol: security.symbol,
    link_evidence: {
      reconciliation_basis: "UNIQUE_CURRENT_NSE_SYMBOL_WITH_NULL_ISIN",
      current_symbol: security.symbol,
    },
  }
  identities.push({ ...logical, identity_hash: sha256(logical) })
}

for (const row of reconciliation.canonical_additions_required ?? []) {
  if (!isFrozenCompanyEquity(row.isin)) continue
  const parsed = parseIsin(row.isin)
  const logical = {
    portfolio_id: PORTFOLIO_ID,
    experiment_id: EXPERIMENT_ID,
    historical_isin: parsed.value,
    issuer_type: parsed.issuer_type,
    security_type_code: parsed.security_type_code,
    canonical_security_id: null,
    canonical_link_basis: "NONE",
    canonical_link_symbol: null,
    link_evidence: { reconciliation_basis: "P8_LOCAL_HISTORICAL_IDENTITY_ONLY" },
  }
  identities.push({ ...logical, identity_hash: sha256(logical) })
}

identities.sort((a, b) => a.historical_isin.localeCompare(b.historical_isin))
if (identities.length !== 4524 || new Set(identities.map((row) => row.historical_isin)).size !== 4524) {
  throw new Error("Historical identity population drift")
}

const manifestByDate = new Map(
  (manifest.months ?? [])
    .filter((row) => row.state === "ACQUIRED")
    .map((row) => [row.decision_date, row]),
)

function buildMonthRows(month) {
  const entry = manifestByDate.get(month.decision_date)
  if (!entry) throw new Error("Missing manifest entry for " + month.decision_date)

  const csvBuffer = readFileSync(entry.csv_path)
  if (sha256(csvBuffer) !== entry.csv_sha256) {
    throw new Error("CSV hash drift for " + month.decision_date)
  }

  const parsed = Papa.parse(csvBuffer.toString("utf8"), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  if ((parsed.errors ?? []).length) {
    throw new Error("CSV parse errors for " + month.decision_date)
  }

  const rows = []
  for (let index = 0; index < parsed.data.length; index++) {
    const row = parsed.data[index]
    if (clean(row.SctyTpFlg) !== "0") continue
    const isin = clean(row.ISIN)
    if (!isFrozenCompanyEquity(isin)) continue

    const logical = {
      source_date: month.decision_date,
      source_row_number: index + 2,
      historical_isin: isin,
      exchange: "NSE",
      trading_symbol: clean(row.TckrSymb),
      series: clean(row.SctySrs) || null,
      instrument_id: clean(row.FinInstrmId),
      instrument_name: clean(row.FinInstrmNm),
      source_presence_state: "PRESENT_IN_SECURITY_MASTER",
      source_csv_sha256: entry.csv_sha256,
    }
    if (!logical.trading_symbol || !logical.instrument_id || !logical.instrument_name) {
      throw new Error("Required listing field missing for " + isin)
    }
    rows.push({ ...logical, row_hash: sha256(logical) })
  }

  if (
    rows.length !== month.frozen_observation_rows ||
    sha256(rows.map((row) => row.row_hash)) !== month.row_hash_fingerprint
  ) throw new Error("Month observation preflight drift for " + month.decision_date)

  return rows
}

async function sendIdentities() {
  console.log("Materializing identity registry: " + identities.length)
  let done = 0
  for (const batch of chunks(identities, 400)) {
    await post("identity_batch", { rows: batch })
    done += batch.length
    console.log("  identities " + done + "/" + identities.length)
  }
}

async function materializeMonth(month) {
  console.log("\nMonth " + month.decision_date)
  const rows = buildMonthRows(month)
  const present = new Set(rows.map((row) => row.historical_isin))

  await post("begin_month", { archive: month.archive })

  let observationDone = 0
  for (const batch of chunks(rows, 1500)) {
    await post("observation_batch", {
      sourceDate: month.decision_date,
      archiveHash: month.archive.archive_hash,
      rows: batch.map((row) => ({
        historical_isin: row.historical_isin,
        source_row_number: row.source_row_number,
        trading_symbol: row.trading_symbol,
        series: row.series,
        instrument_id: row.instrument_id,
        instrument_name: row.instrument_name,
        row_hash: row.row_hash,
      })),
    })
    observationDone += batch.length
    if (observationDone % 7500 === 0 || observationDone === rows.length) {
      console.log("  observations " + observationDone + "/" + rows.length)
    }
  }

  const runHash = sha256({
    plan_hash: EXPECTED_PLAN_HASH,
    decision_date: month.decision_date,
    archive_hash: month.archive.archive_hash,
    row_hash_fingerprint: month.row_hash_fingerprint,
    eligible_identity_count: month.eligible_identity_count,
    ineligible_identity_count: month.ineligible_identity_count,
    resolver_version: RESOLVER_VERSION,
    universe_version: UNIVERSE_VERSION,
  })

  const monthControl = {
    source_date: month.decision_date,
    decision_at: month.decision_at,
    archive_hash: month.archive.archive_hash,
    expected_observation_rows: month.frozen_observation_rows,
    expected_eligible_identities: month.eligible_identity_count,
    expected_ineligible_identities: month.ineligible_identity_count,
    row_hash_fingerprint: month.row_hash_fingerprint,
    run_hash: runHash,
  }

  const run = await post("begin_run", { month: monthControl })

  const members = identities.map((identity) => {
    const eligible = present.has(identity.historical_isin)
    return {
      historical_isin: identity.historical_isin,
      membership_state: eligible ? "ELIGIBLE" : "INELIGIBLE",
      reason_code: eligible
        ? "PRESENT_IN_SELECTED_NSE_SECURITY_MASTER"
        : "ABSENT_FROM_SELECTED_NSE_SECURITY_MASTER",
    }
  })
  for (const batch of chunks(members, 800)) {
    await post("member_batch", {
      runId: run.run_id,
      decisionAt: month.decision_at,
      rows: batch,
    })
  }
  console.log("  members " + members.length + "/" + members.length)

  const byIsin = new Map()
  for (const row of rows) {
    const group = byIsin.get(row.historical_isin) ?? []
    group.push(row)
    byIsin.set(row.historical_isin, group)
  }

  const evidence = []
  for (const [isin, group] of byIsin) {
    group.sort((a, b) => a.source_row_number - b.source_row_number)
    for (let index = 0; index < group.length; index++) {
      evidence.push({
        historical_isin: isin,
        row_hash: group[index].row_hash,
        evidence_role: index === 0 ? "ELIGIBILITY_SUPPORT" : "SYMBOL_SERIES_VARIANT",
      })
    }
  }

  let evidenceDone = 0
  // Keep evidence writes deliberately smaller as the append-only evidence table grows.
  // This avoids large PostgREST upserts approaching the hosted statement timeout.
  for (const batch of chunks(evidence, 500)) {
    await post("evidence_batch", {
      runId: run.run_id,
      decisionAt: month.decision_at,
      sourceDate: month.decision_date,
      archiveHash: month.archive.archive_hash,
      rows: batch,
    })
    evidenceDone += batch.length
    if (evidenceDone % 7500 === 0 || evidenceDone === evidence.length) {
      console.log("  evidence " + evidenceDone + "/" + evidence.length)
    }
  }

  const selected = await post("select_month", { month: monthControl })
  console.log(
    "  selected eligible=" + selected.eligible +
    " ineligible=" + selected.ineligible +
    " observations=" + selected.observations,
  )
}

console.log(JSON.stringify({
  mode: canary ? "CANARY" : "RESUME_FULL",
  plan_hash: EXPECTED_PLAN_HASH,
  function_url: FUNCTION_URL,
}, null, 2))

console.log("Initial hosted status:")
const initialStatus = await post("status")
console.log(JSON.stringify(initialStatus, null, 2))

if (Number(initialStatus?.counts?.p8_historical_security_identities ?? 0) === 4524) {
  console.log("Identity registry already complete; skipping identity replay.")
} else {
  await sendIdentities()
}

const months = [...plan.months].sort((a, b) => a.decision_date.localeCompare(b.decision_date))
let selectedMonths = canary ? [months[0]] : months

if (resume && fromDate) {
  const matchIndex = selectedMonths.findIndex((month) => month.decision_date === fromDate)
  if (matchIndex < 0) throw new Error("--from date is not one of the frozen decision dates: " + fromDate)
  selectedMonths = selectedMonths.slice(matchIndex)
  console.log("Resuming materialization from " + fromDate + "; earlier frozen months are not replayed.")
}

for (const month of selectedMonths) await materializeMonth(month)

if (resume) {
  const completed = await post("complete_campaign")
  console.log("\nCampaign completion:")
  console.log(JSON.stringify(completed, null, 2))
} else {
  console.log("\nCanary complete. Campaign grant remains resumable and unconsumed.")
  console.log(JSON.stringify(await post("status"), null, 2))
}
