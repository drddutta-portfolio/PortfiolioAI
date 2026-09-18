import { describe, expect, it } from "vitest"
import {
  buildTorntpharmLocalNumericPreflightPlan,
  evaluateTorntpharmLocalNumericPreflight,
  type TorntpharmLocalNumericPreflightSnapshot,
} from "./torntpharmLocalNumericPreflight"
import { buildTorntpharmLocalNumericIngestionPackage } from "./torntpharmLocalNumericIngestionPackage"

const SECURITY_ID = "11111111-1111-4111-8111-111111111111"

function readySnapshot(): TorntpharmLocalNumericPreflightSnapshot {
  const pkg = buildTorntpharmLocalNumericIngestionPackage(SECURITY_ID, 1)
  return {
    securityId: SECURITY_ID,
    assignmentVersion: 1,
    metricDefinition: {
      code: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      valueKind: "NUMERIC",
      canonicalUnit: "PERCENT",
      statementScope: "PHARMA_BUSINESS_MODEL",
      isActive: true,
    },
    sourceRecords: pkg.rows.map((row, index) => ({
      id: `22222222-2222-4222-8222-22222222222${index}`,
      sourceCode: "COMPANY_EXCHANGE_FILING",
      sourceArtifactCode: row.sourceArtifactCode,
      sourceReference: row.sourceReference,
    })),
    existingObservations: [],
  }
}

describe("TORNTPHARM local numeric preflight", () => {
  it("prepares the exact local lookups without executing or authorizing writes", () => {
    const plan = buildTorntpharmLocalNumericPreflightPlan(SECURITY_ID, 1)
    expect(plan.status).toBe("PREPARED_NOT_EXECUTED")
    expect(plan.requiredLookups.map((item) => item.table)).toEqual([
      "fundamental_metric_definitions",
      "data_source_records",
      "fundamental_observations",
      "pharma_subprofile_assignments",
    ])
    expect(plan.expectedRows).toHaveLength(4)
    expect(plan.writeAuthorized).toBe(false)
  })

  it("marks a complete clean snapshot ready only for separate write approval", () => {
    const result = evaluateTorntpharmLocalNumericPreflight(readySnapshot())
    expect(result.summary).toEqual({
      rowsChecked: 4,
      insertCandidates: 4,
      alreadyPresent: 0,
      conflicts: 0,
      blocked: 0,
    })
    expect(result.blockers).toEqual([])
    expect(result.readyForSeparateWriteApproval).toBe(true)
    expect(result.writeAuthorized).toBe(false)
  })

  it("treats exact existing facts as already present rather than duplicate inserts", () => {
    const snapshot = readySnapshot()
    snapshot.existingObservations = [{
      metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      periodEnd: "2025-06-30",
      periodType: "QUARTER",
      numericValue: "19",
      unit: "PERCENT",
    }]
    const result = evaluateTorntpharmLocalNumericPreflight(snapshot)
    expect(result.rows[0]?.disposition).toBe("ALREADY_PRESENT")
    expect(result.summary.alreadyPresent).toBe(1)
    expect(result.summary.insertCandidates).toBe(3)
    expect(result.readyForSeparateWriteApproval).toBe(true)
  })

  it("fails closed on a conflicting existing quarter value", () => {
    const snapshot = readySnapshot()
    snapshot.existingObservations = [{
      metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
      periodEnd: "2025-09-30",
      periodType: "QUARTER",
      numericValue: "31",
      unit: "PERCENT",
    }]
    const result = evaluateTorntpharmLocalNumericPreflight(snapshot)
    expect(result.rows[1]?.disposition).toBe("CONFLICT")
    expect(result.blockers).toContain("EXISTING_FACT_CONFLICT")
    expect(result.readyForSeparateWriteApproval).toBe(false)
  })

  it("fails closed when even one required source record is missing", () => {
    const snapshot = readySnapshot()
    snapshot.sourceRecords = snapshot.sourceRecords.slice(0, 3)
    const result = evaluateTorntpharmLocalNumericPreflight(snapshot)
    expect(result.summary.blocked).toBe(1)
    expect(result.blockers).toContain("SOURCE_RECORDS_INCOMPLETE")
    expect(result.readyForSeparateWriteApproval).toBe(false)
  })

  it("fails closed when the database metric definition is absent or mismatched", () => {
    const snapshot = readySnapshot()
    snapshot.metricDefinition = null
    const result = evaluateTorntpharmLocalNumericPreflight(snapshot)
    expect(result.summary.blocked).toBe(4)
    expect(result.blockers).toContain("METRIC_DEFINITION_MISSING_OR_MISMATCHED")
    expect(result.readyForSeparateWriteApproval).toBe(false)
  })
})
