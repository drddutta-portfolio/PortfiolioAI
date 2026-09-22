import { describe, expect, it } from "vitest"
import { validateEvidenceIngestionCandidates } from "./researchEvidenceIngestionValidator"
import { TORNTPHARM_INGESTION_PREVIEW } from "./torntpharmIngestionPreview"

describe("research evidence ingestion validator", () => {
  it("accepts all 42 planned rows without performing a write", () => {
    const result = validateEvidenceIngestionCandidates(TORNTPHARM_INGESTION_PREVIEW)
    expect(result.accepted).toHaveLength(42)
    expect(result.alreadyPresent).toHaveLength(0)
    expect(result.quarantined).toHaveLength(0)
    expect(new Set(result.idempotencyKeys)).toHaveLength(42)
  })


  it("accepts canonical PostgreSQL UUID values used by local fixtures", () => {
    const row = TORNTPHARM_INGESTION_PREVIEW[0]!
    const localFixtureRow = { ...row, securityId: "a4000000-0000-0000-0000-000000000002" }
    const result = validateEvidenceIngestionCandidates([localFixtureRow])
    expect(result.accepted).toHaveLength(1)
    expect(result.quarantined).toHaveLength(0)
  })

  it("requires explicit formula and direct-input lineage for every derived row", () => {
    const derived = TORNTPHARM_INGESTION_PREVIEW.filter((row) => row.lineage === "PORTFOLIOAI_DERIVED")
    expect(derived).toHaveLength(9)
    expect(derived.every((row) => row.derivedFormulaCode && row.directInputKeys.length >= 2)).toBe(true)
    const invalid = { ...derived[0]!, derivedFormulaCode: null, directInputKeys: [] }
    expect(validateEvidenceIngestionCandidates([invalid]).quarantined[0]?.issueCodes).toContain("INVALID_DERIVED_LINEAGE")
  })

  it("separates idempotent existing facts from conflicts", () => {
    const row = TORNTPHARM_INGESTION_PREVIEW[0]!
    const same = { securityId: row.securityId, metricCode: row.metricCode, periodEnd: row.periodEnd, value: row.value, unit: row.unit }
    expect(validateEvidenceIngestionCandidates([row], [same]).alreadyPresent).toHaveLength(1)
    const conflict = { ...same, value: "999" }
    expect(validateEvidenceIngestionCandidates([row], [conflict]).quarantined[0]?.issueCodes).toContain("CONFLICTING_EXISTING_FACT")
  })

  it("quarantines duplicate identities, invalid units and missing provenance", () => {
    const row = TORNTPHARM_INGESTION_PREVIEW[0]!
    const invalid = { ...row, id: "INVALID", unit: "PERCENT" as const, sourceArtifactCode: "" }
    const result = validateEvidenceIngestionCandidates([row, row, invalid])
    expect(result.quarantined[0]?.issueCodes).toContain("DUPLICATE_CANDIDATE")
    expect(result.quarantined[1]?.issueCodes).toEqual(expect.arrayContaining(["UNIT_MISMATCH", "MISSING_SOURCE_ARTIFACT", "DUPLICATE_CANDIDATE"]))
  })

  it("distinguishes unsupported metrics from genuine unit mismatches", () => {
    const row = TORNTPHARM_INGESTION_PREVIEW[0]!
    const unsupported = { ...row, metricCode: "PHARMA_UNKNOWN_METRIC", unit: "PERCENT" as const }
    expect(validateEvidenceIngestionCandidates([unsupported]).quarantined[0]?.issueCodes).toContain("UNSUPPORTED_METRIC")
    const wrongUnit = { ...row, unit: "PERCENT" as const }
    expect(validateEvidenceIngestionCandidates([wrongUnit]).quarantined[0]?.issueCodes).toContain("UNIT_MISMATCH")
  })

  it("accepts the versioned Pharma US-growth metric with PERCENT semantics", () => {
    const row = TORNTPHARM_INGESTION_PREVIEW[0]!
    const pharmaGrowth = { ...row, metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH", unit: "PERCENT" as const }
    const result = validateEvidenceIngestionCandidates([pharmaGrowth])
    expect(result.accepted).toHaveLength(1)
    expect(result.quarantined).toHaveLength(0)
  })

  it("rejects calendar-invalid periods and non-numeric values", () => {
    const row = TORNTPHARM_INGESTION_PREVIEW[0]!
    const result = validateEvidenceIngestionCandidates([{ ...row, periodEnd: "2026-02-31", value: "unknown" }])
    expect(result.quarantined[0]?.issueCodes).toEqual(expect.arrayContaining(["INVALID_PERIOD", "INVALID_NUMERIC_VALUE"]))
  })
})
