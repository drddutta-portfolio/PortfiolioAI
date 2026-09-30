import { describe, expect, it } from "vitest"
import {
  P8_EXCLUSION_REASONS,
  P8_EXPERIMENT_CONTRACT,
  calculateP8SplitBoundaries,
  evaluateP8StrictAvailability,
  fingerprintP8ExperimentContract,
  partitionP8DecisionIndex,
  serializeP8ExperimentContract,
} from "./p8ExperimentContract"

describe("P8-B1 frozen experiment and bias-control contract", () => {
  it("freezes the owner-approved bounded experiment without result-affecting TBDs", () => {
    expect(P8_EXPERIMENT_CONTRACT.period).toEqual({
      startDate: "2023-10-01",
      endDate: "2026-09-30",
      targetMonthlyDecisionDates: 36,
      minimumProvenDecisionDates: 24,
      stopIfMinimumNotMet: true,
    })
    expect(P8_EXPERIMENT_CONTRACT.outcomes.primaryHorizonMonths).toBe(6)
    expect(P8_EXPERIMENT_CONTRACT.outcomes.secondaryHorizonMonths).toEqual([1, 3, 12])
    expect(P8_EXPERIMENT_CONTRACT.benchmarks.primary).toBe("NIFTY_500_TOTAL_RETURN_INDEX")
    expect(P8_EXPERIMENT_CONTRACT.split).toMatchObject({
      developmentPercent: 60,
      validationPercent: 20,
      holdoutPercent: 20,
      holdoutMayBeInspectedDuringDevelopment: false,
    })
    expect(serializeP8ExperimentContract()).not.toContain("TBD")
  })

  it("requires strict publication and availability before the decision instant", () => {
    const decisionAt = "2025-04-30T15:30:00+05:30"

    expect(evaluateP8StrictAvailability({
      decisionAt,
      publishedAt: "2025-04-30T15:29:59+05:30",
      availableAt: "2025-04-30T15:29:59+05:30",
    })).toEqual({ eligible: true, reasons: [] })

    expect(evaluateP8StrictAvailability({
      decisionAt,
      publishedAt: decisionAt,
      availableAt: "2025-04-30T15:29:59+05:30",
    })).toEqual({
      eligible: false,
      reasons: ["PUBLISHED_NOT_STRICTLY_BEFORE_DECISION"],
    })

    expect(evaluateP8StrictAvailability({
      decisionAt,
      publishedAt: "2025-04-30T15:30:01+05:30",
      availableAt: "2025-04-30T15:29:59+05:30",
    })).toEqual({
      eligible: false,
      reasons: ["PUBLISHED_NOT_STRICTLY_BEFORE_DECISION"],
    })
  })

  it("fails closed when publication or availability time is unknown", () => {
    expect(evaluateP8StrictAvailability({
      decisionAt: "2025-04-30T15:30:00+05:30",
      publishedAt: null,
      availableAt: null,
    })).toEqual({
      eligible: false,
      reasons: ["PUBLICATION_TIME_UNKNOWN", "AVAILABILITY_TIME_UNKNOWN"],
    })
  })

  it("freezes a deterministic chronological 60/20/20 split rule", () => {
    expect(calculateP8SplitBoundaries(30)).toEqual({
      total: 30,
      developmentCount: 18,
      validationCount: 6,
      holdoutCount: 6,
    })
    expect(calculateP8SplitBoundaries(24)).toEqual({
      total: 24,
      developmentCount: 14,
      validationCount: 4,
      holdoutCount: 6,
    })
    expect(partitionP8DecisionIndex(0, 30)).toBe("DEVELOPMENT")
    expect(partitionP8DecisionIndex(18, 30)).toBe("VALIDATION")
    expect(partitionP8DecisionIndex(24, 30)).toBe("HOLDOUT")
  })

  it("produces identical fingerprints for identical contract inputs", async () => {
    const first = await fingerprintP8ExperimentContract()
    const second = await fingerprintP8ExperimentContract()
    expect(first).toBe(second)
    expect(first).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it("changes the fingerprint when a result-affecting input changes", async () => {
    const changed = {
      ...P8_EXPERIMENT_CONTRACT,
      costs: {
        ...P8_EXPERIMENT_CONTRACT.costs,
        baseSlippageBpsPerExecutedSide: 11,
      },
    } as typeof P8_EXPERIMENT_CONTRACT

    expect(await fingerprintP8ExperimentContract(changed))
      .not.toBe(await fingerprintP8ExperimentContract())
  })

  it("keeps exclusions explicit and live-policy promotion prohibited", () => {
    expect(P8_EXCLUSION_REASONS).toContain("UNIVERSE_MEMBERSHIP_NOT_PROVEN")
    expect(P8_EXCLUSION_REASONS).toContain("OUTCOME_WINDOW_INCOMPLETE")
    expect(P8_EXPERIMENT_CONTRACT.missingData.unknownConvertedToZero).toBe(false)
    expect(P8_EXPERIMENT_CONTRACT.governance.automaticPromotionToLivePolicyAllowed).toBe(false)
    expect(P8_EXPERIMENT_CONTRACT.governance.performanceClaimsAllowedBeforeP8BFinal).toBe(false)
    expect(P8_EXPERIMENT_CONTRACT.governance.p8CAllowedBeforeP8BFinalOwnerApproval).toBe(false)
  })
})
