import { describe, expect, it } from "vitest"
import {
  buildTorntpharmCanonicalPrerequisitePackage,
  TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_VERSION,
} from "./torntpharmCanonicalPrerequisitePackage"

describe("TORNTPHARM canonical prerequisite package", () => {
  it("prepares one metric definition and four source records without authorizing mutation", () => {
    const result = buildTorntpharmCanonicalPrerequisitePackage()
    expect(result.packageVersion).toBe(TORNTPHARM_CANONICAL_PREREQUISITE_PACKAGE_VERSION)
    expect(result.summary).toEqual({
      metricDefinitionsPrepared: 1,
      sourceRecordsPrepared: 4,
      payloadHashesMaterialized: 0,
      proposedWrites: 0,
    })
    expect(result.mutationAuthorized).toBe(false)
  })

  it("matches the reviewed Pharma US-growth metric contract", () => {
    const result = buildTorntpharmCanonicalPrerequisitePackage()
    expect(result.metricDefinition).toMatchObject({
      code: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      valueKind: "NUMERIC",
      canonicalUnit: "PERCENT",
      statementScope: "PHARMA_BUSINESS_MODEL",
      freshnessSeconds: 10368000,
      isActive: true,
    })
    expect(result.metricDefinition.definition).toMatchObject({
      provider: "COMPANY_EXCHANGE_FILING",
      selection: "REVIEWED",
      periodType: "QUARTER",
      mappingVersion: "PHARMA_V1_GLOBAL_GENERICS_V1",
    })
  })

  it("prepares the four reviewed Q1-Q4 FY26 issuer source records", () => {
    const result = buildTorntpharmCanonicalPrerequisitePackage()
    expect(result.sourceRecords.map((row) => [
      row.externalRecordId,
      row.rawPayload.observationDate,
      row.rawPayload.reviewedValue,
    ])).toEqual([
      ["TORRENT_Q1_FY26_RELEASE", "2025-06-30", "19"],
      ["TORRENT_Q2_FY26_RELEASE", "2025-09-30", "26"],
      ["TORRENT_Q3_FY26_RELEASE", "2025-12-31", "19"],
      ["TORRENT_Q4_FY26_RELEASE", "2026-03-31", "16"],
    ])
    expect(result.sourceRecords.every((row) => row.sourceCode === "COMPANY_EXCHANGE_FILING")).toBe(true)
    expect(result.sourceRecords.every((row) => row.recordKind === "ISSUER_RESULTS_RELEASE")).toBe(true)
  })

  it("does not materialize hashes or source records during preparation", () => {
    const result = buildTorntpharmCanonicalPrerequisitePackage()
    expect(result.sourceRecords.every((row) => row.payloadHash === null)).toBe(true)
    expect(result.sourceRecords.every((row) => row.payloadHashAlgorithm === "SHA256")).toBe(true)
    expect(result.sourceRecords.every((row) => row.materializationAuthorized === false)).toBe(true)
  })

  it("never carries the rejected Q4 31% claim into canonical source payloads", () => {
    const result = buildTorntpharmCanonicalPrerequisitePackage()
    expect(result.sourceRecords.some((row) => row.rawPayload.reviewedValue === "31")).toBe(false)
    expect(result.sourceRecords.find((row) => row.externalRecordId === "TORRENT_Q4_FY26_RELEASE")?.rawPayload.reviewedValue).toBe("16")
  })

  it("requires the already-approved company/exchange filing source registry state", () => {
    const result = buildTorntpharmCanonicalPrerequisitePackage()
    expect(result.sourceRegistryPrecondition).toEqual({
      sourceCode: "COMPANY_EXCHANGE_FILING",
      expectedActive: true,
      expectedEntitlementVerified: true,
      expectedRetentionRightsVerified: true,
    })
  })
})
