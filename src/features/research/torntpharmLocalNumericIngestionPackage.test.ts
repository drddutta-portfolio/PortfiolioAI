import { describe, expect, it } from "vitest"
import {
  buildTorntpharmLocalNumericIngestionPackage,
  TORNTPHARM_LOCAL_NUMERIC_INGESTION_PACKAGE_VERSION,
} from "./torntpharmLocalNumericIngestionPackage"

const SECURITY_ID = "11111111-1111-4111-8111-111111111111"

describe("TORNTPHARM local numeric ingestion package", () => {
  it("prepares exactly four validator-accepted US-growth rows without authorizing a write", () => {
    const result = buildTorntpharmLocalNumericIngestionPackage(SECURITY_ID, 1)
    expect(result.packageVersion).toBe(TORNTPHARM_LOCAL_NUMERIC_INGESTION_PACKAGE_VERSION)
    expect(result.rows.map((row) => [row.periodEnd, row.numericValue])).toEqual([
      ["2025-06-30", "19"],
      ["2025-09-30", "26"],
      ["2025-12-31", "19"],
      ["2026-03-31", "16"],
    ])
    expect(result.summary).toEqual({
      validatorAcceptedRows: 4,
      observationRowsPrepared: 4,
      sourceRecordsRequired: 4,
      metricDefinitionRegistrationRequired: 1,
      proposedWrites: 0,
    })
    expect(result.dryRunOnly).toBe(true)
    expect(result.writeAuthorized).toBe(false)
  })

  it("targets the existing canonical numeric evidence table and official issuer source", () => {
    const result = buildTorntpharmLocalNumericIngestionPackage(SECURITY_ID, 1)
    expect(result.rows.every((row) => row.canonicalTarget === "fundamental_observations")).toBe(true)
    expect(result.rows.every((row) => row.sourceCode === "COMPANY_EXCHANGE_FILING")).toBe(true)
    expect(result.rows.every((row) => row.periodType === "QUARTER" && row.unit === "PERCENT")).toBe(true)
    expect(result.rows.some((row) => row.numericValue === "31")).toBe(false)
  })

  it("keeps database prerequisites explicit and unresolved", () => {
    const result = buildTorntpharmLocalNumericIngestionPackage(SECURITY_ID, 1)
    const byCode = new Map(result.prerequisites.map((item) => [item.code, item]))
    expect(byCode.get("METRIC_DEFINITION_REGISTERED")?.satisfiedByPackage).toBe(false)
    expect(byCode.get("SOURCE_RECORDS_MATERIALIZED")?.satisfiedByPackage).toBe(false)
    expect(byCode.get("EXISTING_FACT_CONFLICT_CHECK")?.satisfiedByPackage).toBe(false)
    expect(byCode.get("SEPARATE_WRITE_APPROVAL")?.satisfiedByPackage).toBe(false)
  })

  it("proposes a canonical database metric definition without applying it", () => {
    const result = buildTorntpharmLocalNumericIngestionPackage(SECURITY_ID, 1)
    expect(result.metricDefinitionProposal).toMatchObject({
      code: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      valueKind: "NUMERIC",
      canonicalUnit: "PERCENT",
      statementScope: "PHARMA_BUSINESS_MODEL",
      freshnessSeconds: 10368000,
    })
  })
})
