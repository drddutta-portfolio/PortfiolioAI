import { describe, expect, it } from "vitest"
import manifest from "../../../scripts/r4n/torntpharm-prerequisite-materialization-manifest.json"
import { buildTorntpharmCanonicalPrerequisitePackage } from "./torntpharmCanonicalPrerequisitePackage"

describe("TORNTPHARM prerequisite materialization manifest", () => {
  it("stays exactly aligned with the validated prerequisite package", () => {
    const pkg = buildTorntpharmCanonicalPrerequisitePackage()
    expect(manifest.metricDefinition).toEqual(pkg.metricDefinition)

    const sourceRecordsForManifest = pkg.sourceRecords.map((record) => ({
      sourceCode: record.sourceCode,
      recordKind: record.recordKind,
      externalRecordId: record.externalRecordId,
      sourceUrl: record.sourceUrl,
      rawPayload: record.rawPayload,
    }))

    expect(manifest.sourceRecords).toEqual(sourceRecordsForManifest)
  })

  it("remains explicitly non-writing and excludes the rejected Q4 31% claim", () => {
    expect(manifest.executionPolicy.databaseConnectionAllowed).toBe(false)
    expect(manifest.executionPolicy.writesAllowed).toBe(false)
    expect(manifest.sourceRecords).toHaveLength(4)
    expect(manifest.sourceRecords.some((row) => row.rawPayload.reviewedValue === "31")).toBe(false)
    expect(manifest.sourceRecords.find((row) => row.externalRecordId === "TORRENT_Q4_FY26_RELEASE")?.rawPayload.reviewedValue).toBe("16")
  })
})
