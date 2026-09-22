import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(
  resolve(process.cwd(), "scripts/r4n/auropharma-g9-2-local-canonical-activation.sql"),
  "utf8",
)
const runner = readFileSync(
  resolve(process.cwd(), "scripts/r4n/run-auropharma-g9-2-local-canonical-activation.sh"),
  "utf8",
)

describe("AUROPHARMA G9.2 local canonical activation package", () => {
  it("is hard-guarded to the local G8 AUROPHARMA fixture", () => {
    expect(sql).toContain("creation_source = 'LOCAL_G8_FIXTURE'")
    expect(sql).toContain("'AUROPHARMA'")
    expect(sql).toContain("'INE406A01037'")
    expect(sql).toContain("'NSE'")
    expect(runner).toContain("127.0.0.1")
    expect(runner).toContain("localhost")
    expect(runner).toContain("REFUSING: AUROPHARMA G9.2 canonical activation is local-only")
  })

  it("persists only the reviewed Global Generics Primary and API Emerging secondary", () => {
    expect(sql).toContain("'GLOBAL_GENERICS'")
    expect(sql).toContain("'GLOBAL_GENERICS_V1'")
    expect(sql).toContain("'API_BULK_DRUGS'")
    expect(sql).toContain("'API_BULK_DRUGS_V1'")
    expect(sql).toContain("'EMERGING'")
    expect(sql).toContain("'REVIEWED'")
    expect(sql).toContain("'HIGH'")
    expect(sql).toContain("'2026-03-31 00:00:00+00'")
  })

  it("fails closed if Biosimilars appears in active reviewed authority", () => {
    expect(sql).toContain("BIOPHARMA_BIOSIMILARS must not exist as an active reviewed AUROPHARMA Primary assignment")
    expect(sql).toContain("BIOPHARMA_BIOSIMILARS must not exist as an active reviewed AUROPHARMA secondary exposure")
  })

  it("requires the validated TORNTPHARM reference assignment and Material Global Generics overlay", () => {
    expect(sql).toContain("'TORNTPHARM'")
    expect(sql).toContain("'DOMESTIC_FORMULATIONS'")
    expect(sql).toContain("'GLOBAL_GENERICS'")
    expect(sql).toContain("'MATERIAL'")
    expect(sql).toContain("Validated local TORNTPHARM reviewed Primary assignment is required")
  })

  it("asserts persistence isolation between the two Global Generics roles", () => {
    expect(sql).toContain("AUROPHARMA and TORNTPHARM must never share the same assignment id")
    expect(sql).toContain("AUROPHARMA Global Generics Primary must not also exist as its own secondary exposure")
  })

  it("does not write research evidence, score, recommendation or sizing output", () => {
    expect(sql).not.toMatch(/insert\s+into\s+public\.fundamental_observations/iu)
    expect(sql).not.toMatch(/insert\s+into\s+public\.research_documents/iu)
    expect(sql).not.toMatch(/insert\s+into\s+public\.stock_score_runs/iu)
    expect(sql).not.toMatch(/insert\s+into\s+public\.stock_recommendation_runs/iu)
    expect(sql).not.toMatch(/insert\s+into\s+public\.position_sizing_assessments/iu)
  })

  it("uses an explicit transaction and commits only the local canonical assignment package", () => {
    expect(sql).toMatch(/\bBEGIN;/u)
    expect(sql).toMatch(/\bCOMMIT;/u)
    expect(sql).toContain("Production write: 0")
    expect(sql).toContain("Score/recommendation/position-sizing writes: 0")
  })
})
