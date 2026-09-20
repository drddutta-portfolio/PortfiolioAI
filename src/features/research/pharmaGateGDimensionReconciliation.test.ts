import { describe, expect, it } from "vitest"
import {
  canonicalGateGDimensionForMetric,
  PHARMA_GATE_G_DIMENSION_RECONCILIATION,
} from "./pharmaGateGDimensionReconciliation"

describe("Gate G dimension reconciliation candidate", () => {
  it("maps the four legacy parent dimensions to canonical Gate G dimensions", () => {
    expect(canonicalGateGDimensionForMetric("PHARMA_ROCE_HISTORY")).toBe("CAPITAL_EFFICIENCY")
    expect(canonicalGateGDimensionForMetric("PHARMA_CASH_CONVERSION_HISTORY")).toBe("CASH_FLOW")
    expect(canonicalGateGDimensionForMetric("PHARMA_BALANCE_SHEET_LEVERAGE")).toBe("BALANCE_SHEET_CREDIT")
    expect(canonicalGateGDimensionForMetric("PHARMA_OWNERSHIP_GOVERNANCE")).toBe("OWNERSHIP_GOVERNANCE")
  })

  it("preserves evidence identity and provenance while remaining non-active", () => {
    for (const entry of PHARMA_GATE_G_DIMENSION_RECONCILIATION.entries) {
      expect(entry.evidenceIdentityChanges).toBe(false)
      expect(entry.evidenceProvenanceChanges).toBe(false)
      expect(entry.numericMethodologyActivated).toBe(false)
    }

    expect(PHARMA_GATE_G_DIMENSION_RECONCILIATION.state).toBe("CANDIDATE_NOT_ACTIVE")
    expect(PHARMA_GATE_G_DIMENSION_RECONCILIATION.directInPlaceParentContractMutationAllowed).toBe(false)
    expect(PHARMA_GATE_G_DIMENSION_RECONCILIATION.requiresVersionedParentContractPromotion).toBe(true)
    expect(PHARMA_GATE_G_DIMENSION_RECONCILIATION.scoreExecutionEnabled).toBe(false)
    expect(PHARMA_GATE_G_DIMENSION_RECONCILIATION.persistedScoreRunEnabled).toBe(false)
  })

  it("does not invent mappings for unrelated metrics", () => {
    expect(canonicalGateGDimensionForMetric("PHARMA_OPERATING_MARGIN_HISTORY")).toBeNull()
  })
})
