import { describe, expect, it } from "vitest"
import { buildTorntpharmCanonicalHistoryPilot } from "./pharmaCanonicalHistoryPilot"
import { parseTrendlyneMultiStockMarkdown } from "./pharmaStoredDiscoveryParser"

const V3_ID = "2ba94f8c-d34e-4658-926c-5694c21cc9e5"
const V3_CAPTURED_AT = "2026-09-14T09:08:57.330Z"

const V3 = `Operating Rev. Ann.\nTORNTPHARM:13979.73

---

Operating Rev. Qtr\nTORNTPHARM:4921.00

---

Operating Rev. 2Q ago\nTORNTPHARM:3303.00

---

Operating Rev. 3Q ago\nTORNTPHARM:3302.00

---

Operating Rev. 4Q ago\nTORNTPHARM:3178.00

---

Operating Rev. 5Q ago\nTORNTPHARM:2959.00

---

Operating Rev. 6Q ago\nTORNTPHARM:2809.00

---

Operating Rev. 7Q ago\nTORNTPHARM:2889.00

---

Operating Rev. 8Q ago\nTORNTPHARM:2859.00

---

Cash from Operating Act. Ann. 1Y Ago\nTORNTPHARM:2585.11

---

Cash from Operating Act. Ann. 2Y Ago\nTORNTPHARM:3266.08

---

Cash from Operating Act. Ann. 3Y Ago\nTORNTPHARM:2368.13

---

Cash from Operating Act. Ann. 4Y Ago\nTORNTPHARM:1802.99

---

Cash from Operating Act. Ann. 5Y Ago\nTORNTPHARM:2010.69

---

Operating Profit Qtr\nTORNTPHARM:1664.00

---

Operating Profit 1Q Ago\nTORNTPHARM:1356.00

---

Operating Profit 2Q Ago\nTORNTPHARM:1088.00

---

Operating Profit 3Q Ago\nTORNTPHARM:1083.00

---

Operating Profit 4Q Ago\nTORNTPHARM:1032.00

---

Operating Profit 6Qtr Ago\nTORNTPHARM:964.00

---

Operating Profit 6Qtr Ago\nTORNTPHARM:914.00

---

Operating Profit 7Qtr Ago\nTORNTPHARM:939.00`

const EXPECTED = [
  ["CFO_ANNUAL", "2021-03-31", "2010.69"],
  ["CFO_ANNUAL", "2022-03-31", "1802.99"],
  ["CFO_ANNUAL", "2023-03-31", "2368.13"],
  ["CFO_ANNUAL", "2024-03-31", "3266.08"],
  ["CFO_ANNUAL", "2025-03-31", "2585.11"],
  ["OPERATING_PROFIT_QUARTER", "2024-09-30", "939"],
  ["OPERATING_PROFIT_QUARTER", "2025-06-30", "1032"],
  ["OPERATING_PROFIT_QUARTER", "2025-09-30", "1083"],
  ["OPERATING_PROFIT_QUARTER", "2025-12-31", "1088"],
  ["OPERATING_PROFIT_QUARTER", "2026-03-31", "1356"],
  ["OPERATING_PROFIT_QUARTER", "2026-06-30", "1664"],
  ["OPERATING_REVENUE_QUARTER", "2024-06-30", "2859"],
  ["OPERATING_REVENUE_QUARTER", "2024-09-30", "2889"],
  ["OPERATING_REVENUE_QUARTER", "2024-12-31", "2809"],
  ["OPERATING_REVENUE_QUARTER", "2025-03-31", "2959"],
  ["OPERATING_REVENUE_QUARTER", "2025-06-30", "3178"],
  ["OPERATING_REVENUE_QUARTER", "2025-09-30", "3302"],
  ["OPERATING_REVENUE_QUARTER", "2025-12-31", "3303"],
  ["OPERATING_REVENUE_QUARTER", "2026-06-30", "4921"],
  ["REVENUE_ANNUAL", "2026-03-31", "13979.73"],
] as const

describe("R4H exact TORNTPHARM write manifest", () => {
  it("locks the 20 conflict-free V3 candidate rows exactly", () => {
    const preview = buildTorntpharmCanonicalHistoryPilot([
      { sourceRecordId: V3_ID, capturedAt: V3_CAPTURED_AT, discovery: parseTrendlyneMultiStockMarkdown(V3, "TORNTPHARM") },
    ])
    expect(preview.observations.map((row) => [row.metricCode, row.periodEnd, row.numericValue])).toEqual(EXPECTED)
    expect(preview.observations.every((row) => row.sourceRecordId === V3_ID)).toBe(true)
    expect(preview.proposedWriteCount).toBe(20)
  })

  it("keeps unresolved points outside the candidate manifest", () => {
    const preview = buildTorntpharmCanonicalHistoryPilot([
      { sourceRecordId: V3_ID, capturedAt: V3_CAPTURED_AT, discovery: parseTrendlyneMultiStockMarkdown(V3, "TORNTPHARM") },
    ])
    expect(preview.blockedPoints).toEqual(expect.arrayContaining([
      expect.objectContaining({ metricCode: "REVENUE_ANNUAL", periodKey: "Y1", reason: "MISSING_PROVIDER_VALUE" }),
      expect.objectContaining({ metricCode: "CFO_ANNUAL", periodKey: "Y0", reason: "MISSING_PROVIDER_VALUE" }),
      expect.objectContaining({ metricCode: "OPERATING_REVENUE_QUARTER", periodKey: "Q1", reason: "MISSING_PROVIDER_VALUE" }),
      expect.objectContaining({ metricCode: "OPERATING_PROFIT_QUARTER", periodKey: "Q5", reason: "MISSING_PROVIDER_VALUE" }),
      expect.objectContaining({ metricCode: "OPERATING_PROFIT_QUARTER", periodKey: "Q6", reason: "PROVIDER_CONFLICT" }),
      expect.objectContaining({ metricCode: "OPERATING_PROFIT_QUARTER", periodKey: "Q8", reason: "MISSING_PROVIDER_VALUE" }),
    ]))
  })
})
