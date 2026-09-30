#!/usr/bin/env node
import fs from "node:fs"

const input = process.env.P8_B2_RECONCILIATION
  ?? "tmp/p8-b2-nse/historical-identity-reconciliation.json"
const out = process.env.P8_B2_IDENTITY_CLASSIFICATION_OUT
  ?? "tmp/p8-b2-nse/historical-identity-classification.json"

const source = JSON.parse(fs.readFileSync(input, "utf8"))

function parseIsin(isin) {
  const value = String(isin ?? "").trim()
  if (value.length !== 12 || !value.startsWith("IN")) {
    return { value, format_ok: false, issuer_type: null, security_type_code: null }
  }
  return {
    value,
    format_ok: /^[A-Z0-9]{12}$/.test(value),
    issuer_type: value[2],
    security_type_code: value.slice(7, 9),
  }
}

function isFrozenCompanyEquity(isin) {
  const p = parseIsin(isin)
  return p.format_ok
    && (p.issuer_type === "E" || p.issuer_type === "9")
    && p.security_type_code === "01"
}

function exclusionReason(isin) {
  const p = parseIsin(isin)
  if (!p.format_ok) return "NONSTANDARD_OR_PLACEHOLDER_IDENTITY"
  if (p.issuer_type === "F") return "ISSUER_TYPE_F_NOT_COMPANY_EQUITY"
  if (p.issuer_type !== "E" && p.issuer_type !== "9") return "UNSUPPORTED_ISSUER_TYPE"
  if (p.security_type_code !== "01") return `NON_EQUITY_SECURITY_TYPE_${p.security_type_code}`
  return null
}

const groups = {
  matched: source.matched_by_isin ?? [],
  null_isin_candidates: source.current_null_isin_symbol_candidates ?? [],
  additions: source.canonical_additions_required ?? [],
}
const all = [...groups.matched, ...groups.null_isin_candidates, ...groups.additions]
const unique = new Set(all.map((row) => row.isin))
if (unique.size !== all.length) throw new Error("Reconciliation groups contain duplicate historical identity")
if (all.length !== source.summary.historical_unique_isins) {
  throw new Error("Historical identity count does not match reconciliation summary")
}

const frozenEquity = all.filter((row) => isFrozenCompanyEquity(row.isin))
const excluded = all.filter((row) => !isFrozenCompanyEquity(row.isin))
const excludedByReason = {}
for (const row of excluded) {
  const reason = exclusionReason(row.isin)
  excludedByReason[reason] = (excludedByReason[reason] ?? 0) + 1
}

const exactCurrentEquityLinks = groups.matched.filter(
  (row) => isFrozenCompanyEquity(row.isin)
    && row.canonical_security?.asset_class === "EQUITY",
)
const matchedNonEquity = groups.matched.filter(
  (row) => !isFrozenCompanyEquity(row.isin)
    || row.canonical_security?.asset_class !== "EQUITY",
)
const nullIsinCompanyEquityCandidates = groups.null_isin_candidates.filter(
  (row) => isFrozenCompanyEquity(row.isin),
)
const p8LocalIdentityRequired = groups.additions.filter(
  (row) => isFrozenCompanyEquity(row.isin),
)

const collisionRows = source.current_symbol_collisions ?? []
const frozenEquityCollisionGroups = collisionRows.filter(
  (row) => isFrozenCompanyEquity(row.isin),
)

const output = {
  version: "P8_B2_HISTORICAL_IDENTITY_CLASSIFICATION_V1",
  input,
  authorization_boundary: {
    database_writes: false,
    provider_calls: false,
    migration_created: false,
    historical_materialization_performed: false,
    p8_b3_started: false,
    p8_c_started: false,
  },
  frozen_identity_rule: {
    country_prefix: "IN",
    allowed_issuer_types: ["E", "9"],
    required_security_type_code: "01",
    interpretation: "Company equity identity for the bounded P8 NSE-equity experiment. Symbol and series remain evidence, not identity.",
  },
  summary: {
    historical_unique_identities: all.length,
    frozen_company_equity_identities: frozenEquity.length,
    excluded_non_frozen_identities: excluded.length,
    exact_current_equity_links: exactCurrentEquityLinks.length,
    matched_non_equity_current_rows: matchedNonEquity.length,
    current_null_isin_company_equity_candidates: nullIsinCompanyEquityCandidates.length,
    p8_local_historical_identity_rows_required: p8LocalIdentityRequired.length,
    frozen_equity_symbol_collision_groups: frozenEquityCollisionGroups.length,
    frozen_equity_present_on_latest_decision_date:
      frozenEquity.filter((row) => row.last_decision_date === "2026-09-29").length,
    frozen_equity_historical_only_before_latest_date:
      frozenEquity.filter((row) => row.last_decision_date !== "2026-09-29").length,
    excluded_by_reason: excludedByReason,
  },
  current_null_isin_company_equity_candidates: nullIsinCompanyEquityCandidates.map((row) => ({
    isin: row.isin,
    latest_symbols: row.latest_symbols,
    latest_names: row.latest_names,
    candidate_security_ids: row.candidate_security_ids,
  })),
  frozen_equity_symbol_collisions: frozenEquityCollisionGroups.map((row) => ({
    isin: row.isin,
    latest_symbols: row.latest_symbols,
    latest_names: row.latest_names,
    collisions: row.collisions,
  })),
}

fs.writeFileSync(out, JSON.stringify(output, null, 2) + "\n")
console.log(JSON.stringify({ ...output.summary, output: out }, null, 2))
