import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"
import manifest from "../../../scripts/r4n/torntpharm-prerequisite-materialization-manifest.json"

const sql = readFileSync(
  resolve(process.cwd(), "scripts/r4n/torntpharm-local-prerequisite-mutation.sql"),
  "utf8",
)

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  return value
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

describe("TORNTPHARM local prerequisite mutation SQL contract", () => {
  it("keeps the mutation scope limited to one metric definition and source-record prerequisites", () => {
    expect(sql.match(/INSERT INTO public\.fundamental_metric_definitions/g)).toHaveLength(1)
    expect(sql.match(/INSERT INTO public\.data_source_records/g)).toHaveLength(1)
    expect(sql).not.toMatch(/INSERT INTO public\.fundamental_observations/)
    expect(sql).toContain("Fundamental observations inserted: 0")
  })

  it("preserves fail-closed source, metric and source-record conflict guards", () => {
    expect(sql).toContain("PREREQUISITE_SOURCE_REGISTRY_NOT_APPROVED")
    expect(sql).toContain("METRIC_DEFINITION_CONFLICT")
    expect(sql).toContain("SOURCE_RECORD_CONFLICT")
    expect(sql).toContain("COMPANY_EXCHANGE_FILING")
  })

  it("preserves idempotency and postcondition checks", () => {
    expect(sql).toContain("ON CONFLICT (code) DO NOTHING")
    expect(sql).toContain("WHERE NOT EXISTS")
    expect(sql).toContain("POSTCONDITION_METRIC_DEFINITION_NOT_EXACTLY_ONE")
    expect(sql).toContain("POSTCONDITION_SOURCE_RECORD_COUNT_NOT_FOUR")
  })

  it("uses manifest-derived 64-character SHA-256 hashes and excludes rejected Q4 31%", () => {
    const hashes = manifest.sourceRecords.map((record) =>
      createHash("sha256").update(canonicalJson(record.rawPayload), "utf8").digest("hex"),
    )

    expect(hashes).toHaveLength(4)
    for (const hash of hashes) {
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
      expect(sql).toContain(hash)
    }

    expect(sql).toContain('"reviewedValue":"16"')
    expect(sql).not.toContain('"reviewedValue":"31"')
  })

  it("uses an explicit transaction boundary", () => {
    expect(sql).toMatch(/\bBEGIN;/)
    expect(sql).toMatch(/\bCOMMIT;/)
  })
})
