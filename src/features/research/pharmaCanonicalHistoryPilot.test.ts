import { describe, expect, it } from "vitest"
import { buildTorntpharmCanonicalHistoryPilot } from "./pharmaCanonicalHistoryPilot"
import { parseTrendlyneMultiStockMarkdown } from "./pharmaStoredDiscoveryParser"
import { proposedPharmaHistoryMetric } from "./pharmaHistoryMetricDefinitions"

const V2_ID = "e4c0c920-c3b2-47b9-bda4-26638b407237"
const V3_ID = "2ba94f8c-d34e-4658-926c-5694c21cc9e5"

const V2 = `Operating Rev. Ann.\nTORNTPHARM:13979.73\nOTHER:1\n\n---\n\nTotal Rev. Ann. 1Y Ago\nTORNTPHARM:11539.36\nOTHER:2\n\n---\n\nRev. Ann. 2Y ago\nTORNTPHARM:10785.75\n\n---\n\nRev. Ann. 3Y ago\nTORNTPHARM:9665.29`

const V3 = `Cash from Operating Act. Ann. 1Y Ago\nTORNTPHARM:2585.11\n\n---\n\nCash from Operating Act. Ann. 2Y Ago\nTORNTPHARM:3266.08\n\n---\n\nCash from Operating Act. Ann. 3Y Ago\nTORNTPHARM:2368.13\n\n---\n\nOperating Profit Qtr\nTORNTPHARM:1664\n\n---\n\nOperating Rev. Qtr\nTORNTPHARM:4921\n\n---\n\nOperating Profit 1Q Ago\nTORNTPHARM:1356\n\n---\n\nOperating Rev. 1Q ago\nTORNTPHARM:4197`

function build(v2 = V2, v3 = V3) {
  return buildTorntpharmCanonicalHistoryPilot([
    { sourceRecordId: V2_ID, discovery: parseTrendlyneMultiStockMarkdown(v2, "TORNTPHARM") },
    { sourceRecordId: V3_ID, discovery: parseTrendlyneMultiStockMarkdown(v3, "TORNTPHARM") },
  ])
}

describe("R4H TORNTPHARM canonical history preview", () => {
  it("uses explicit operating-revenue history identity and rejects total/generic revenue substitutions", () => {
    const preview = build()
    const revenue = preview.observations.filter((item) => item.metricCode === "REVENUE_ANNUAL")
    expect(revenue).toHaveLength(1)
    expect(revenue[0]).toMatchObject({ periodKey: "Y0", periodEnd: "2026-03-31", numericValue: "13979.73" })
    expect(revenue.some((item) => item.numericValue === "11539.36" || item.numericValue === "10785.75")).toBe(false)
  })

  it("keeps exact stored source-record provenance per normalized point", () => {
    const preview = build()
    expect(preview.observations.find((item) => item.metricCode === "REVENUE_ANNUAL")?.sourceRecordIds).toEqual([V2_ID])
    expect(preview.observations.find((item) => item.metricCode === "CFO_ANNUAL")?.sourceRecordIds).toEqual([V3_ID])
  })

  it("resolves relative annual and quarterly periods only through the reviewed TORNTPHARM calendar contract", () => {
    const preview = build()
    expect(preview.observations.find((item) => item.metricCode === "CFO_ANNUAL" && item.periodKey === "Y1")?.periodEnd).toBe("2025-03-31")
    expect(preview.observations.find((item) => item.metricCode === "OPM_QUARTER_DERIVED" && item.periodKey === "Q0")?.periodEnd).toBe("2026-06-30")
    expect(preview.periodIdentityVersion).toBe("TORNTPHARM_PERIOD_IDENTITY_V1")
    expect(preview.periodIdentityEvidenceUrls.length).toBeGreaterThanOrEqual(3)
  })

  it("derives quarterly OPM deterministically from matched profit and revenue", () => {
    const preview = build()
    const q0 = preview.observations.find((item) => item.metricCode === "OPM_QUARTER_DERIVED" && item.periodKey === "Q0")
    expect(q0?.numericValue).toBe("33.814265")
    expect(q0?.sourceCode).toBe("TRENDLYNE_MCP")
    expect(q0?.calculationOwner).toBe("PORTFOLIOAI_DERIVED")
    expect(q0?.sourceLabels).toEqual(["Operating Profit Qtr", "Operating Rev. Qtr"])
  })

  it("prepares deterministic rows but executes no production write", () => {
    const preview = build()
    expect(preview.proposedWriteCount).toBe(6)
    expect(preview.executedProductionWriteCount).toBe(0)
    expect(preview.observations.every((item) => item.writeState === "READY_AFTER_GATED_SCHEMA_AND_EVIDENCE_CAPTURE")).toBe(true)
  })

  it("fails closed when separate stored captures disagree on the same provider label", () => {
    const conflictingV3 = `${V3}\n\n---\n\nOperating Rev. Ann.\nTORNTPHARM:14000`
    const preview = build(V2, conflictingV3)
    expect(preview.observations).toEqual([])
    expect(preview.providerConflicts).toContain("Operating Rev. Ann.")
    expect(preview.proposedWriteCount).toBe(0)
    expect(preview.executedProductionWriteCount).toBe(0)
  })

  it("produces stable idempotency keys for the same stored evidence", () => {
    expect(build().observations.map((item) => item.idempotencyKey)).toEqual(build().observations.map((item) => item.idempotencyKey))
  })
})

describe("proposed PHARMA historical metric definitions", () => {
  it("defines annual operating revenue separately from the existing TTM concept", () => {
    expect(proposedPharmaHistoryMetric("REVENUE_ANNUAL")).toMatchObject({
      periodType: "YEAR",
      canonicalUnit: "INR_CRORE",
      definitionRequiredInProduction: true,
    })
  })

  it("marks derived quarterly OPM as PortfolioAI-owned", () => {
    expect(proposedPharmaHistoryMetric("OPM_QUARTER_DERIVED")).toMatchObject({
      periodType: "QUARTER",
      canonicalUnit: "PERCENT",
      calculationOwner: "PORTFOLIOAI",
    })
  })
})
