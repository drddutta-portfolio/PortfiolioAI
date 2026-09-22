import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(
  resolve(process.cwd(), "scripts/r4n/torntpharm-local-observation-mutation.sql"),
  "utf8",
)

describe("TORNTPHARM local observation mutation SQL contract", () => {
  it("limits scope to PHARMA_EXPORT_US_REVENUE_GROWTH observations", () => {
    expect(sql.match(/INSERT INTO public\.fundamental_observations/g)).toHaveLength(1)
    expect(sql).toContain("PHARMA_EXPORT_US_REVENUE_GROWTH")
    expect(sql).toContain("Persistent local fundamental-observation rows: up to 4")
  })

  it("preserves the four reviewed values and excludes the rejected Q4 31% fact", () => {
    expect(sql).toContain("DATE '2025-06-30', 19::numeric")
    expect(sql).toContain("DATE '2025-09-30', 26::numeric")
    expect(sql).toContain("DATE '2025-12-31', 19::numeric")
    expect(sql).toContain("DATE '2026-03-31', 16::numeric")
    expect(sql).not.toContain("DATE '2026-03-31', 31::numeric")
  })

  it("requires all fail-closed prerequisite and conflict guards", () => {
    expect(sql).toContain("TORNTPHARM_SECURITY_IDENTITY_NOT_UNIQUE")
    expect(sql).toContain("REVIEWED_DOMESTIC_FORMULATIONS_ASSIGNMENT_NOT_UNIQUE")
    expect(sql).toContain("PHARMA_EXPORT_US_REVENUE_GROWTH_CONTRACT_MISSING_OR_MISMATCHED")
    expect(sql).toContain("IMMUTABLE_SOURCE_RECORDS_INCOMPLETE")
    expect(sql).toContain("CONFLICTING_EXISTING_US_GROWTH_FACT")
  })

  it("uses idempotent exact-fact skipping and verifies four exact observations with zero conflicts", () => {
    expect(sql).toContain("WHERE NOT EXISTS")
    expect(sql).toContain("POSTCONDITION_EXACT_OBSERVATION_COUNT_NOT_FOUR")
    expect(sql).toContain("POSTCONDITION_CONFLICT_COUNT_NOT_ZERO")
    expect(sql).toContain("Exact reviewed observation count: 4")
    expect(sql).toContain("Conflicting observation count: 0")
  })

  it("uses the canonical observation semantics", () => {
    expect(sql).toContain("'PERCENT'")
    expect(sql).toContain("'QUARTER'")
    expect(sql).toContain("'UNKNOWN'")
    expect(sql).toContain("'AVAILABLE'")
    expect(sql).toContain("make_interval(secs => r.freshness_seconds)")
  })

  it("uses an explicit transaction boundary", () => {
    expect(sql).toMatch(/\bBEGIN;/)
    expect(sql).toMatch(/\bCOMMIT;/)
  })
})
