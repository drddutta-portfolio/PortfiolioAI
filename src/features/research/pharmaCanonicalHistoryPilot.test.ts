import { describe, expect, it } from "vitest"
import { buildTorntpharmCanonicalHistoryPilot } from "./pharmaCanonicalHistoryPilot"
import { parseTrendlyneMultiStockMarkdown } from "./pharmaStoredDiscoveryParser"
import { proposedPharmaHistoryMetric } from "./pharmaHistoryMetricDefinitions"

const V2_ID = "e4c0c920-c3b2-47b9-bda4-26638b407237"
const V3_ID = "2ba94f8c-d34e-4658-926c-5694c21cc9e5"

const V2 = `Operating Rev. Ann.\nTORNTPHARM:13979.73\nOTHER:1

---

Total Rev. Ann. 1Y Ago\nTORNTPHARM:11539.36

---

Rev. Ann. 3Y ago\nTORNTPHARM:9665.29

---

Operating Rev. Qtr\nTORNTPHARM:4921

---

Operating Rev. 2Q ago\nTORNTPHARM:3303

---

Operating Rev. 3Q ago\nTORNTPHARM:3302

---

Operating Rev. 4Q ago\nTORNTPHARM:3178

---

Operating Rev. 5Q ago\nTORNTPHARM:2959

---

Operating Rev. 6Q ago\nTORNTPHARM:2809

---

Operating Rev. 7Q ago\nTORNTPHARM:2889

---

Operating Rev. 8Q ago\nTORNTPHARM:2859`

const V3 = `Cash from Operating Act. Ann. 1Y Ago\nTORNTPHARM:2585.11

---

Cash from Operating Act. Ann. 2Y Ago\nTORNTPHARM:3266.08

---

Cash from Operating Act. Ann. 3Y Ago\nTORNTPHARM:2368.13

---

Cash from Operating Act. Ann. 4Y Ago\nTORNTPHARM:1802.99

---

Cash from Operating Act. Ann. 5Y Ago\nTORNTPHARM:2010.69

---

Operating Profit Qtr\nTORNTPHARM:1664

---

Operating Profit 1Q Ago\nTORNTPHARM:1356

---

Operating Profit 2Q Ago\nTORNTPHARM:1088

---

Operating Profit 3Q Ago\nTORNTPHARM:1083

---

Operating Profit 4Q Ago\nTORNTPHARM:1032

---

Operating Profit 6Qtr Ago\nTORNTPHARM:964

---

Operating Profit 6Qtr Ago\nTORNTPHARM:914

---

Operating Profit 7Qtr Ago\nTORNTPHARM:939`

function build(v2 = V2, v3 = V3) {
  return buildTorntpharmCanonicalHistoryPilot([
    { sourceRecordId: V2_ID, discovery: parseTrendlyneMultiStockMarkdown(v2, "TORNTPHARM") },
    { sourceRecordId: V3_ID, discovery: parseTrendlyneMultiStockMarkdown(v3, "TORNTPHARM") },
  ])
}

describe("R4H TORNTPHARM canonical history preview", () => {
  it("uses exact operating-revenue identity and rejects total/generic annual revenue substitutions", () => {
    const preview = build()
    const revenue = preview.observations.filter((item) => item.metricCode === "REVENUE_ANNUAL")
    expect(revenue).toHaveLength(1)
    expect(revenue[0]).toMatchObject({ periodKey: "Y0", periodEnd: "2026-03-31", numericValue: "13979.73" })
    expect(revenue.some((item) => item.numericValue === "11539.36" || item.numericValue === "9665.29")).toBe(false)
  })

  it("maps retained CFO history to exact annual period ends without guessing", () => {
    const preview = build()
    const cfo = preview.observations.filter((item) => item.metricCode === "CFO_ANNUAL")
    expect(cfo).toHaveLength(5)
    expect(cfo.find((item) => item.periodKey === "Y1")).toMatchObject({ periodEnd: "2025-03-31", numericValue: "2585.11" })
    expect(cfo.find((item) => item.periodKey === "Y5")).toMatchObject({ periodEnd: "2021-03-31", numericValue: "2010.69" })
    expect(cfo.every((item) => item.sourceRecordIds.includes(V3_ID))).toBe(true)
  })

  it("keeps quarterly operating-profit and revenue as raw canonical evidence", () => {
    const preview = build()
    expect(preview.observations.filter((item) => item.metricCode === "OPERATING_REVENUE_QUARTER")).toHaveLength(8)
    expect(preview.observations.filter((item) => item.metricCode === "OPERATING_PROFIT_QUARTER")).toHaveLength(6)
    expect(preview.observations.some((item) => item.metricCode === ("OPM_QUARTER_DERIVED" as never))).toBe(false)
    expect(preview.observations.find((item) => item.metricCode === "OPERATING_PROFIT_QUARTER" && item.periodKey === "Q7")).toMatchObject({
      periodEnd: "2024-09-30",
      numericValue: "939",
      sourceLabels: ["Operating Profit 7Qtr Ago"],
    })
  })

  it("blocks only the provider-conflicted period rather than discarding unrelated valid history", () => {
    const preview = build()
    expect(preview.providerConflicts).toContain("Operating Profit 6Qtr Ago")
    expect(preview.blockedPoints).toContainEqual({
      metricCode: "OPERATING_PROFIT_QUARTER",
      periodKey: "Q6",
      reason: "PROVIDER_CONFLICT",
      conflictingLabels: ["Operating Profit 6Qtr Ago"],
    })
    expect(preview.observations.some((item) => item.metricCode === "CFO_ANNUAL")).toBe(true)
  })

  it("records missing provider periods explicitly and never invents values", () => {
    const preview = build()
    expect(preview.blockedPoints).toContainEqual({
      metricCode: "OPERATING_REVENUE_QUARTER",
      periodKey: "Q1",
      reason: "MISSING_PROVIDER_VALUE",
      conflictingLabels: [],
    })
    expect(preview.blockedPoints).toContainEqual({
      metricCode: "OPERATING_PROFIT_QUARTER",
      periodKey: "Q5",
      reason: "MISSING_PROVIDER_VALUE",
      conflictingLabels: [],
    })
  })

  it("prepares the exact candidate row count but executes zero production writes", () => {
    const preview = build()
    expect(preview.proposedWriteCount).toBe(20)
    expect(preview.executedProductionWriteCount).toBe(0)
    expect(preview.periodIdentityVersion).toBe("TORNTPHARM_PERIOD_IDENTITY_V1")
    expect(preview.observations.every((item) => item.writeState === "READY_AFTER_GATED_SCHEMA_AND_EVIDENCE_CAPTURE")).toBe(true)
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

  it("defines raw quarterly operating inputs as provider evidence", () => {
    expect(proposedPharmaHistoryMetric("OPERATING_REVENUE_QUARTER")).toMatchObject({ periodType: "QUARTER", calculationOwner: "TRENDLYNE_MCP" })
    expect(proposedPharmaHistoryMetric("OPERATING_PROFIT_QUARTER")).toMatchObject({ periodType: "QUARTER", calculationOwner: "TRENDLYNE_MCP" })
    expect(proposedPharmaHistoryMetric("OPM_QUARTER_DERIVED")).toBeNull()
  })
})
