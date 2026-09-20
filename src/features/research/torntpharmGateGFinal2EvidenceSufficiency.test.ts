import { describe, expect, it } from "vitest"
import { TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY } from "./torntpharmGateGFinal2EvidenceSufficiency"

describe("TORNTPHARM G-FINAL-2 evidence sufficiency lock", () => {
  const byDimension = new Map(
    TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.rows.map((row) => [
      row.dimension,
      row,
    ]),
  )

  it("recognizes minimum history where the exact fixture supports it", () => {
    expect(byDimension.get("CAPITAL_EFFICIENCY")?.state).toBe(
      "MINIMUM_HISTORY_PRESENT",
    )
    expect(byDimension.get("BALANCE_SHEET_CREDIT")?.state).toBe(
      "MINIMUM_HISTORY_PRESENT",
    )
  })

  it("fails Cash Flow closed because matched CFO history is incomplete", () => {
    const row = byDimension.get("CASH_FLOW")
    expect(row?.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(row?.reasonCodes).toContain("CFO_HISTORY_BELOW_THREE_ANNUAL_PERIODS")
    expect(row?.scoreReady).toBe(false)
  })

  it("keeps durability partial rather than scoring R&D history as the whole dimension", () => {
    const row = byDimension.get("BUSINESS_DURABILITY")
    expect(row?.state).toBe("PARTIAL_EVIDENCE")
    expect(row?.reasonCodes).toContain("WHOLE_DIMENSION_AGGREGATION_NOT_APPROVED")
  })

  it("fails Momentum and Ownership/Governance closed until company evidence is locked", () => {
    expect(byDimension.get("MOMENTUM")?.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(byDimension.get("OWNERSHIP_GOVERNANCE")?.state).toBe(
      "INSUFFICIENT_EVIDENCE",
    )
  })

  it("keeps Risk scope-incomplete rather than inferring company-wide clearance", () => {
    expect(byDimension.get("RISK")?.state).toBe("SCOPE_INCOMPLETE")
    expect(byDimension.get("RISK")?.reasonCodes).toContain(
      "COMPANY_WIDE_CURRENT_REGULATORY_SCOPE_NOT_ESTABLISHED",
    )
  })

  it("does not make any G-FINAL-2 dimension score-ready or activate downstream logic", () => {
    expect(
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.rows.every(
        (row) => row.scoreReady === false,
      ),
    ).toBe(true)
    expect(
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.allSevenDimensionsScoreReady,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.scoreExecutionEnabled,
    ).toBe(false)
    expect(
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.persistedScoreRunEnabled,
    ).toBe(false)
  })
})
