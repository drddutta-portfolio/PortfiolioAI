import { describe, expect, it } from "vitest"
import {
  P8_B_RECOVERY_CONTRACT_VERSION,
  P8_B_RECOVERY_COVERAGE,
  P8_REPLAY_METHODOLOGY_VERSION,
  applyFrozenReplayRouter,
  assertHistoricalIdentityKey,
  assertHistoricalFactsPointInTime,
  assertRecoveryCoverage,
  isStrictlyAvailableBeforeDecision,
  recoveryExclusionCeilingIsFrozen,
} from "./p8BRecoveryContractV1"
import {
  DECISION_AT,
  FACT_AFTER_DECISION,
  FACT_AT_DECISION,
  FACT_STRICTLY_BEFORE_DECISION,
  HISTORICAL_ONLY_IDENTITY_FIXTURE,
  HISTORICAL_ONLY_REPLAY_INPUT,
} from "./fixtures/p8BRecoveryContractV1.fixtures"

describe("P8-B recovery contract V1", () => {
  it("is separately versioned and freezes the retrospective methodology version", () => {
    expect(P8_B_RECOVERY_CONTRACT_VERSION).toBe("P8_B_RECOVERY_CONTRACT_V1")
    expect(P8_REPLAY_METHODOLOGY_VERSION).toBe("P8_R6_R10_REPLAY_V1")
  })

  it("requires historical_identity_id while allowing canonical_security_id to be null", () => {
    expect(assertHistoricalIdentityKey(HISTORICAL_ONLY_IDENTITY_FIXTURE)).toEqual(
      HISTORICAL_ONLY_IDENTITY_FIXTURE,
    )
    expect(() =>
      assertHistoricalIdentityKey({
        historicalIdentityId: "",
        historicalIsin: HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIsin,
        canonicalSecurityId: null,
      }),
    ).toThrow("historical_identity_id is mandatory")
  })

  it("requires historical company facts to be available strictly before the decision", () => {
    expect(isStrictlyAvailableBeforeDecision(FACT_STRICTLY_BEFORE_DECISION, DECISION_AT)).toBe(true)
    expect(isStrictlyAvailableBeforeDecision(FACT_AT_DECISION, DECISION_AT)).toBe(false)
    expect(isStrictlyAvailableBeforeDecision(FACT_AFTER_DECISION, DECISION_AT)).toBe(false)
    expect(() =>
      assertHistoricalFactsPointInTime(
        HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIdentityId,
        [FACT_AFTER_DECISION],
        DECISION_AT,
      ),
    ).toThrow("strictly before decision")
  })

  it("applies the frozen 2026 replay methodology retrospectively from historical facts", () => {
    let routerInput: unknown
    const result = applyFrozenReplayRouter(HISTORICAL_ONLY_REPLAY_INPUT, (input) => {
      routerInput = input
      return "INDUSTRIAL_MANUFACTURING_PROFILE"
    })

    expect(result).toEqual({
      methodologyVersion: "P8_R6_R10_REPLAY_V1",
      historicalIdentityId: HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIdentityId,
      routeKey: "INDUSTRIAL_MANUFACTURING_PROFILE",
    })
    expect(routerInput).not.toHaveProperty("presentDayManualAssignment")
  })

  it("does not allow a present-day manual company assignment to become a replay-router input", () => {
    const result = applyFrozenReplayRouter(HISTORICAL_ONLY_REPLAY_INPUT, (input) => {
      expect(input).not.toHaveProperty("presentDayManualAssignment")
      expect(input.historicalClassification).toBe("Industrial Manufacturing")
      return "ROUTED_FROM_HISTORICAL_FACTS"
    })
    expect(result.routeKey).toBe("ROUTED_FROM_HISTORICAL_FACTS")
  })

  it("distinguishes the full audit surface from the B2-eligible experiment denominator", () => {
    expect(P8_B_RECOVERY_COVERAGE.fullAuditSurfacePairs).toBe(144_768)
    expect(P8_B_RECOVERY_COVERAGE.b2EligibleCandidatePairs).toBe(121_956)
    expect(
      assertRecoveryCoverage({
        fullAuditSurfacePairs: 144_768,
        b2EligibleCandidatePairs: 121_956,
        replayReadyEligiblePairs: 100_000,
      }),
    ).toEqual({
      fullAuditSurfacePairs: 144_768,
      b2EligibleCandidatePairs: 121_956,
      replayReadyEligiblePairs: 100_000,
    })
  })

  it("keeps the recovery exclusion ceiling pending explicit owner freeze", () => {
    expect(P8_B_RECOVERY_COVERAGE.exclusionCeiling).toBeNull()
    expect(P8_B_RECOVERY_COVERAGE.exclusionCeilingState).toBe("PENDING_OWNER_FREEZE")
    expect(recoveryExclusionCeilingIsFrozen()).toBe(false)
  })
})
