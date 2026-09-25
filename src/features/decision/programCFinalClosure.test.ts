import { describe, expect, it } from "vitest"
import {
  buildProgramCFinalAudit,
  PROGRAM_C_FINAL_INTENTIONAL_LIMITATIONS,
} from "./programCFinalClosure"
import { programCR8CanonicalJson } from "./r8Determinism"

describe("Program C C-FINAL cross-engine closure audit", () => {
  it("passes the complete R8 -> R9 -> R10 closure contract", () => {
    const audit = buildProgramCFinalAudit()

    expect(audit).toMatchObject({
      validationUniverseVersion: "PROGRAM_C_VALIDATION_UNIVERSE_V1",
      sourceSnapshotVersion: "K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22",
      programBRegressionPass: true,
      r8ClosureRegressionPass: true,
      r9ClosureRegressionPass: true,
      r10ClosureRegressionPass: true,
      deterministicReplayPass: true,
      exactReferenceLineagePass: true,
      frozenCrossEngineLineagePass: true,
      portfolioDispositionComplete: true,
      crossSurfaceAuthorityPass: true,
      ownerAuthorityPass: true,
      providerAiPersistenceTradingSafetyPass: true,
      numericSizingBoundaryPass: true,
      frozenHoldingCount: 238,
      r8FrozenHoldingCount: 238,
      r9FrozenHoldingCount: 238,
      r10FrozenHoldingCount: 238,
      providerCalls: 0,
      persistedWrites: 0,
      productionOperational: false,
      branchMergeAuthorized: false,
      programDAuthorized: false,
      overallPass: true,
    })
  })

  it("replays the complete final audit deterministically", () => {
    expect(programCR8CanonicalJson(buildProgramCFinalAudit()))
      .toBe(programCR8CanonicalJson(buildProgramCFinalAudit()))
  })

  it("records closure limitations rather than overstating Program C", () => {
    const audit = buildProgramCFinalAudit()
    expect(audit.intentionalLimitations).toEqual(
      PROGRAM_C_FINAL_INTENTIONAL_LIMITATIONS,
    )
    expect(audit.intentionalLimitations).toContain(
      "NUMERIC_SIZING_POLICY_NOT_APPROVED",
    )
    expect(audit.intentionalLimitations).toContain(
      "R8_R9_R10_PERSISTENCE_NOT_ENABLED",
    )
    expect(audit.intentionalLimitations).toContain(
      "PROGRAM_C_IS_VALIDATED_LOCAL_CANDIDATE_NOT_PRODUCTION_OPERATIONAL",
    )
  })

  it("keeps formal closure separate from release, Program D and production authority", () => {
    const audit = buildProgramCFinalAudit()
    expect(audit.productionOperational).toBe(false)
    expect(audit.branchMergeAuthorized).toBe(false)
    expect(audit.programDAuthorized).toBe(false)
  })
})
