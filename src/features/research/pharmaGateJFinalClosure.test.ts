import { describe, expect, it } from "vitest"
import { PHARMA_GATE_J_FINAL_CLOSURE } from "./pharmaGateJFinalClosure"
import { PHARMA_GATE_J_METHOD_AUTHORITIES } from "./pharmaGateJFinalPortability"

describe("Gate J G10-FINAL closure candidate", () => {
  it("covers all controlled-expansion stages and all five Pharma method authorities", () => {
    expect(PHARMA_GATE_J_FINAL_CLOSURE.controlledExpansionStages.map(
      (item) => item.stage,
    )).toEqual(["G10.1", "G10.2", "G10.3", "G10.4"])
    expect(Object.keys(PHARMA_GATE_J_METHOD_AUTHORITIES)).toHaveLength(5)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.runtimePortability.allFiveSubprofilesHaveMethodAuthority).toBe(true)
  })

  it("proves new Pharma stocks do not require a new Gate J methodology build", () => {
    expect(PHARMA_GATE_J_FINAL_CLOSURE.runtimePortability.symbolSpecificMethodologyRoutingRequired).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.runtimePortability.newStockRequiresNewGateJMethodologyBuild).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.runtimePortability.reviewedSubprofileAssignmentRequired).toBe(true)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.referenceStockIdentityIsValidationOnly).toBe(true)
  })

  it("preserves overlay, emerging-watch and fail-closed isolation", () => {
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.materialOverlaySecondIndependentScoreAllowed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.emergingWatchNumericParticipationAllowed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.unresolvedExposureAutoResolutionAllowed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.crossSubprofileBandBorrowingAllowed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.hiddenRenormalizationAllowed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.isolation.missingMandatoryEvidenceFailsClosed).toBe(true)
  })

  it("keeps Gate I unchanged and all persistence/production actions off", () => {
    expect(PHARMA_GATE_J_FINAL_CLOSURE.gateI.policyUnchanged).toBe(true)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.gateI.recommendationRequiresCompleteScoreAuthority).toBe(true)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.safety.scorePersistenceEnabled).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.safety.recommendationPersistenceEnabled).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.safety.productionMutationPerformed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.safety.deploymentPerformed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.safety.prMergePerformed).toBe(false)
    expect(PHARMA_GATE_J_FINAL_CLOSURE.safety.automaticTradingEnabled).toBe(false)
  })

  it("retains the validated mixed outcomes instead of forcing every reference to score", () => {
    expect(PHARMA_GATE_J_FINAL_CLOSURE.controlledExpansionStages[0]?.resultState).toBe(
      "SCORE_COMPUTABLE_READ_ONLY",
    )
    expect(PHARMA_GATE_J_FINAL_CLOSURE.controlledExpansionStages.slice(1).every(
      (item) => item.resultState === "COMPLETE_FAIL_CLOSED",
    )).toBe(true)
  })
})
