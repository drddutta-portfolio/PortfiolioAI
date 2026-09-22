import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"

const manifestPath = new URL("./torntpharm-prerequisite-materialization-manifest.json", import.meta.url)
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}

function canonicalJson(value) {
  return JSON.stringify(canonicalize(value))
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function sqlLiteral(value) {
  return "'" + String(value).replaceAll("'", "''") + "'"
}

function jsonbLiteral(value) {
  return sqlLiteral(JSON.stringify(value)) + "::jsonb"
}

if (manifest.executionPolicy?.databaseConnectionAllowed !== false || manifest.executionPolicy?.writesAllowed !== false) {
  throw new Error("Dry-run manifest must explicitly prohibit database connections and writes")
}

if (manifest.metricDefinition?.code !== "PHARMA_EXPORT_US_REVENUE_GROWTH") {
  throw new Error("Unexpected metric-definition contract")
}

if (!Array.isArray(manifest.sourceRecords) || manifest.sourceRecords.length !== 4) {
  throw new Error("Expected exactly four source-record proposals")
}

if (manifest.sourceRecords.some((row) => row.rawPayload?.reviewedValue === "31")) {
  throw new Error("Rejected Q4 31% claim must not enter materialization")
}

const rows = manifest.sourceRecords.map((row) => {
  const serializedPayload = canonicalJson(row.rawPayload)
  return {
    ...row,
    serializedPayload,
    payloadHash: sha256(serializedPayload),
  }
})

console.log("=== R4N TORNTPHARM PREREQUISITE MATERIALIZATION DRY RUN ===")
console.log("DATABASE_CONNECTION=NO")
console.log("WRITES_EXECUTED=0")
console.log("SERIALIZATION=RECURSIVE_LEXICOGRAPHIC_KEY_SORT_V1")
console.log("HASH_ALGORITHM=SHA256")
console.log("")

for (const row of rows) {
  console.log(`${row.externalRecordId} | ${row.rawPayload.observationDate} | ${row.rawPayload.reviewedValue}%`)
  console.log(`payload_hash=${row.payloadHash}`)
  console.log(`canonical_payload=${row.serializedPayload}`)
  console.log("")
}

const metric = manifest.metricDefinition
const metricSql = [
  "INSERT INTO public.fundamental_metric_definitions",
  "(code, name, value_kind, canonical_unit, statement_scope, freshness_seconds, definition, is_active)",
  "VALUES (",
  [
    sqlLiteral(metric.code),
    sqlLiteral(metric.name),
    sqlLiteral(metric.valueKind),
    sqlLiteral(metric.canonicalUnit),
    sqlLiteral(metric.statementScope),
    String(metric.freshnessSeconds),
    jsonbLiteral(metric.definition),
    metric.isActive ? "true" : "false",
  ].join(", "),
  ");",
].join(" ")

console.log("--- EXACT PROPOSED METRIC-DEFINITION SQL ---")
console.log(metricSql)
console.log("")

console.log("--- EXACT PROPOSED SOURCE-RECORD SQL ---")
for (const row of rows) {
  const sql = [
    "INSERT INTO public.data_source_records",
    "(source_code, record_kind, external_record_id, source_url, payload_hash, raw_payload)",
    "VALUES (",
    [
      sqlLiteral(row.sourceCode),
      sqlLiteral(row.recordKind),
      sqlLiteral(row.externalRecordId),
      sqlLiteral(row.sourceUrl),
      sqlLiteral(row.payloadHash),
      jsonbLiteral(row.rawPayload),
    ].join(", "),
    ");",
  ].join(" ")
  console.log(sql)
}

console.log("")
console.log("--- DRY-RUN SUMMARY ---")
console.log(`metric_definition_rows=1`)
console.log(`source_record_rows=${rows.length}`)
console.log(`payload_hashes_computed=${rows.length}`)
console.log("database_connections=0")
console.log("writes_executed=0")
console.log("mutation_authorized=NO")
