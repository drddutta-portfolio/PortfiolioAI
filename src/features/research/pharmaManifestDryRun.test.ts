import { describe, expect, it } from "vitest"
import { composePharmaSubprofileContract } from "./pharmaSubprofileContracts"
import { dryRunPharmaManifest } from "./pharmaManifestDryRun"
import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE } from "./torntpharmOfficialManifestFixture"

describe("TORNTPHARM DOMESTIC_FORMULATIONS manifest dry run", () => {
  const contract = composePharmaSubprofileContract("DOMESTIC_FORMULATIONS")
  const report = dryRunPharmaManifest(TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE, contract.metrics)

  it("reconciles the frozen fixture to exactly 42 unique rows", () => {
    expect(TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE).toHaveLength(42)
    expect(new Set(TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE.map((row) => row.id))).toHaveLength(42)
    expect(report.counts.DUPLICATE_OR_CONFLICTING_EVIDENCE).toBe(0)
    expect(report.counts.UNSUPPORTED_FOR_PROMOTION).toBe(0)
  })

  it("maps six parent mandatory requirements and keeps R&D contextual", () => {
    expect(report.supportedRequirementCodes).toEqual([
      "PHARMA_BALANCE_SHEET_LEVERAGE", "PHARMA_CASH_CONVERSION_HISTORY", "PHARMA_OPERATING_MARGIN_HISTORY",
      "PHARMA_PAT_EPS_HISTORY", "PHARMA_REVENUE_GROWTH_HISTORY", "PHARMA_ROCE_HISTORY",
    ])
    expect(report.counts.PARENT_REQUIREMENT_EVIDENCE).toBe(36)
    expect(report.counts.SUBPROFILE_REQUIREMENT_EVIDENCE).toBe(0)
    expect(report.counts.CONDITION_ACTIVATION_EVIDENCE).toBe(0)
    expect(report.counts.CONTEXTUAL_NON_READINESS_EVIDENCE).toBe(6)
    expect(report.expectedMandatoryReadiness).toEqual({ ready: 6, total: 10, ratio: 0.6 })
  })

  it("does not mistake consolidated parent evidence for domestic-formulations evidence", () => {
    expect(report.missingMandatoryRequirementCodes).toEqual(expect.arrayContaining([
      "PHARMA_DOMESTIC_REVENUE_GROWTH", "PHARMA_FIELD_FORCE_PRODUCTIVITY",
      "PHARMA_BRAND_THERAPY_LEADERSHIP", "PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW",
    ]))
  })

  it("fails closed on duplicate and unknown metric-period rows", () => {
    const first = TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE[0]!
    const result = dryRunPharmaManifest([...TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE, first, { ...first, id: "X1", metricCode: "UNKNOWN" }], contract.metrics)
    expect(result.counts.DUPLICATE_OR_CONFLICTING_EVIDENCE).toBe(1)
    expect(result.counts.UNSUPPORTED_FOR_PROMOTION).toBe(1)
  })
})
