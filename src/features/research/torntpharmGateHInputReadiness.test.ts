import { describe, expect, it } from "vitest"
import { TORNTPHARM_GATE_H_INPUT_READINESS } from "./torntpharmGateHInputReadiness"

describe("TORNTPHARM Gate H H1 input readiness audit", () => {
  const byDimension = new Map(
    TORNTPHARM_GATE_H_INPUT_READINESS.rows.map((row) => [
      row.dimension,
      row,
    ]),
  )

  it("audits exactly the ten weighted dimensions", () => {
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.rows.map((row) => row.dimension))
      .toEqual([
        "QUALITY",
        "GROWTH",
        "CAPITAL_EFFICIENCY",
        "CASH_FLOW",
        "BALANCE_SHEET_CREDIT",
        "BUSINESS_DURABILITY",
        "VALUATION",
        "MOMENTUM",
        "OWNERSHIP_GOVERNANCE",
        "RISK",
      ])
    expect(
      TORNTPHARM_GATE_H_INPUT_READINESS.rows.reduce(
        (sum, row) => sum + row.weightPercent,
        0,
      ),
    ).toBe(100)
  })

  it("recognizes raw-input sufficiency for ROCE and Balance Sheet without prematurely calling them score-ready", () => {
    expect(byDimension.get("CAPITAL_EFFICIENCY")?.readinessState).toBe(
      "RAW_INPUT_MINIMUM_PRESENT_DERIVATION_LOCK_REQUIRED",
    )
    expect(byDimension.get("BALANCE_SHEET_CREDIT")?.readinessState).toBe(
      "RAW_INPUT_MINIMUM_PRESENT_DERIVATION_LOCK_REQUIRED",
    )
    expect(byDimension.get("CAPITAL_EFFICIENCY")?.scoreReady).toBe(false)
    expect(byDimension.get("BALANCE_SHEET_CREDIT")?.scoreReady).toBe(false)
  })

  it("fails Quality closed because the exact fixture has no matched operating-margin quarters", () => {
    const quality = byDimension.get("QUALITY")
    expect(quality?.readinessState).toBe("INSUFFICIENT_EVIDENCE")
    expect(quality?.existingEvidence).toContain("MATCHED_OPERATING_MARGIN_QUARTERS_0")
  })

  it("fails Cash Flow closed because only one CFO annual observation is locked", () => {
    const cashFlow = byDimension.get("CASH_FLOW")
    expect(cashFlow?.readinessState).toBe("INSUFFICIENT_EVIDENCE")
    expect(cashFlow?.existingEvidence).toContain("CFO_ANNUAL_COUNT_1")
  })

  it("keeps the four proposed US-growth observations separate from canonical score input", () => {
    const growth = byDimension.get("GROWTH")
    expect(growth?.existingEvidence).toContain(
      "GLOBAL_GENERICS_EXPORT_GROWTH_PROPOSED_CANDIDATES_4",
    )
    expect(
      TORNTPHARM_GATE_H_INPUT_READINESS.crossCutting.globalGenericsOverlay
        .canonicalScoreInputReady,
    ).toBe(false)
  })

  it("does not treat approved valuation methodology as proof that company component inputs exist", () => {
    const valuation = byDimension.get("VALUATION")
    expect(valuation?.readinessState).toBe("INSUFFICIENT_EVIDENCE")
    expect(valuation?.missingInputs).toContain(
      "SELF_HISTORY_RELATIVE_VALUATION_SCORE",
    )
    expect(valuation?.missingInputs).toContain(
      "CASH_FLOW_CORROBORATION_SCORE",
    )
  })

  it("keeps governance/risk fail-closed at REVIEW_REQUIRED", () => {
    expect(byDimension.get("RISK")?.readinessState).toBe(
      "RUNTIME_REVIEW_REQUIRED",
    )
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.crossCutting.governanceRuntimeState)
      .toBe("REVIEW_REQUIRED")
  })

  it("emits no score and authorizes no persistence or downstream decision logic", () => {
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.scoreReadyDimensionCount).toBe(0)
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.allTenDimensionsScoreReady).toBe(
      false,
    )
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.h1Complete).toBe(true)
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.h2Eligible).toBe(true)
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.scoreExecutionEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.persistedScoreRunEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.recommendationEnabled).toBe(false)
    expect(TORNTPHARM_GATE_H_INPUT_READINESS.positionSizingEnabled).toBe(false)
  })
})
