import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(
  resolve(process.cwd(), "scripts/r4n/torntpharm-local-prerequisite-mutation.sql"),
  "utf8",
)

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

  it("carries the four verified hashes and excludes the rejected Q4 31% materialization", () => {
    expect(sql).toContain("b8a8b87c01a1ea1ade5f1d7bc158804a793caeed8d02f1652e885b94deae8788f")
    expect(sql).toContain("3847fc6cadca356c5d1d0b07da2a584a9f90b2c7c3cbaa83237bd5d05fceec5f2")
    expect(sql).toContain("3df20aaafb6be4e2f9f2f070489feb8937c97f0d47f6997a3c6c5910224caeb7")
    expect(sql).toContain("d08cf8f86694557b5391ff9085e9e98a1667d4d4fab8994e2626e990922998b53")
    expect(sql).toContain('"reviewedValue":"16"')
    expect(sql).not.toContain('"reviewedValue":"31"')
  })

  it("uses an explicit transaction boundary", () => {
    expect(sql).toMatch(/\bBEGIN;/)
    expect(sql).toMatch(/\bCOMMIT;/)
  })
})
