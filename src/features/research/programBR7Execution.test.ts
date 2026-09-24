import { describe, expect, it } from "vitest"
import { buildProgramB2ReferenceResults } from "./programBR6Execution"
import {
  PROGRAM_B_B4_SAFETY_BOUNDARY,
  buildProgramB4FrozenPortfolioDisposition,
  buildProgramB4OwnerAuthorityRegression,
  buildProgramB4ReferenceDecisions,
  buildProgramB4SizingEdgeCases,
  canonicalProgramB4ReferencePayload,
  projectProgramB4DecisionSurface,
} from "./programBR7Execution"

describe("Program B B4 R7 execution and validation", () => {
  it("executes approved Pharma recommendations from the exact R6 reference scores", () => {
    const rows = buildProgramB4ReferenceDecisions()
    const torn = rows.find((row) => row.symbol === "TORNTPHARM")
    const alivus = rows.find((row) => row.symbol === "ALIVUS")

    expect(torn?.recommendation).toMatchObject({
      state: "RECOMMENDATION_READY",
      sourceScore: 75.1575,
      researchProfileCode: "PHARMA_V1",
      methodologyRole: "DOMESTIC_FORMULATIONS",
      assignmentVersion: 1,
      suggestedRole: "SATELLITE_CANDIDATE",
      policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    })
    expect(alivus?.recommendation).toMatchObject({
      state: "RECOMMENDATION_READY",
      researchProfileCode: "PHARMA_V1",
      methodologyRole: "API_BULK_DRUGS",
      assignmentVersion: 1,
      suggestedRole: "SATELLITE_CANDIDATE",
      policyVersion: "PHARMA_V1_RECOMMENDATION_POLICY_V1_OWNER_APPROVED",
    })
    expect(alivus?.recommendation.sourceScore).toBeCloseTo(76.7225, 10)
  })

  it("preserves fail-closed recommendation states for incomplete references", () => {
    const rows = buildProgramB4ReferenceDecisions()
    expect(rows.find((row) => row.symbol === "AUROPHARMA")?.recommendation.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(rows.find((row) => row.symbol === "BIOCON")?.recommendation.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(rows.find((row) => row.symbol === "SYNGENE")?.recommendation.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(rows.find((row) => row.symbol === "HDFCBANK")?.recommendation.state).toBe("BLOCKED_PREREQUISITE")
  })

  it("does not fabricate sizing while the Program B sizing-policy registry has no approved authority", () => {
    for (const row of buildProgramB4ReferenceDecisions()) {
      expect(row.sizing.canSize).toBe(false)
      expect(row.sizing.suggestedTargetWeight).toBeNull()
      expect(row.sizing.suggestedMinimumWeight).toBeNull()
      expect(row.sizing.suggestedMaximumWeight).toBeNull()
      expect(row.sizing.recommendedAction).toBeNull()
    }

    const torn = buildProgramB4ReferenceDecisions().find((row) => row.symbol === "TORNTPHARM")
    expect(torn?.sizing.state).toBe("METHODOLOGY_NOT_AVAILABLE")
    expect(torn?.finalDisposition).toBe("RECOMMENDATION_READY")
  })

  it("replays the canonical R7 reference payload identically", () => {
    const first = buildProgramB4ReferenceDecisions().map(canonicalProgramB4ReferencePayload)
    const second = buildProgramB4ReferenceDecisions().map(canonicalProgramB4ReferencePayload)
    expect(second).toEqual(first)
  })

  it("keeps contract-only Research, Portfolio and Action projections on one canonical decision", () => {
    const torn = buildProgramB4ReferenceDecisions().find((row) => row.symbol === "TORNTPHARM")
    expect(torn).toBeDefined()
    if (!torn) return

    const research = projectProgramB4DecisionSurface(torn, "RESEARCH")
    const portfolio = projectProgramB4DecisionSurface(torn, "PORTFOLIO")
    const action = projectProgramB4DecisionSurface(torn, "ACTION")

    expect(portfolio).toEqual({ ...research, surface: "PORTFOLIO" })
    expect(action).toEqual({ ...research, surface: "ACTION" })
    expect(research.sourceScore).toBe(torn.recommendation.sourceScore)
    expect(research.sourceScoreRunId).toBe(torn.recommendation.sourceScoreRunId)
    expect(research.recommendationRunId).toBe(torn.recommendation.recommendationRunId)
  })

  it("does not mutate owner target price, stop loss, target weight or role", () => {
    const regression = buildProgramB4OwnerAuthorityRegression()
    expect(regression.ownerSettingsAfter).toEqual(regression.ownerSettingsBefore)
    expect(regression.ownerFieldMutationCount).toBe(0)
    expect(regression.persistenceMutationCount).toBe(0)
    expect(regression.machineAssessmentWriteCount).toBe(1)
    expect(regression.machineAssessment.canSize).toBe(false)
    expect(regression.machineAssessment.state).toBe("METHODOLOGY_NOT_AVAILABLE")
  })

  it("fails closed across the required sizing edge cases", () => {
    const rows = buildProgramB4SizingEdgeCases()
    expect(rows.find((row) => row.code === "STRONG_SCORE_HIGH_CONCENTRATION")?.result.state).toBe("METHODOLOGY_NOT_AVAILABLE")
    expect(rows.find((row) => row.code === "STRONG_SCORE_HIGH_VOLATILITY")?.result.state).toBe("METHODOLOGY_NOT_AVAILABLE")
    expect(rows.find((row) => row.code === "LOW_EVIDENCE_CONFIDENCE")?.result.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(rows.find((row) => row.code === "INCOMPLETE_HOLDING")?.result.state).toBe("BLOCKED_PREREQUISITE")
    expect(rows.find((row) => row.code === "ETF_NON_APPLICABLE")?.result.state).toBe("NOT_APPLICABLE")
    expect(rows.every((row) => row.result.suggestedTargetWeight === null)).toBe(true)
  })

  it("assigns every frozen K5 equity an explicit R7 disposition with no silent holes", () => {
    const portfolio = buildProgramB4FrozenPortfolioDisposition()
    expect(portfolio.totalHoldings).toBe(238)
    expect(portfolio.rows).toHaveLength(238)
    expect(portfolio.dispositionComplete).toBe(true)
    expect(portfolio.recommendationReady).toBe(2)
    expect(portfolio.sizingReady).toBe(0)
    expect(portfolio.numericRecommendationCoverageComplete).toBe(false)
    expect(portfolio.numericSizingCoverageComplete).toBe(false)
    expect(portfolio.providerCalls).toBe(0)
    expect(portfolio.persistedWrites).toBe(0)

    const allowed = new Set([
      "RECOMMENDATION_READY",
      "SIZING_READY",
      "INSUFFICIENT_EVIDENCE",
      "METHODOLOGY_NOT_AVAILABLE",
      "REVIEW_REQUIRED",
      "NOT_APPLICABLE",
      "BLOCKED_PREREQUISITE",
    ])
    for (const row of portfolio.rows) {
      expect(allowed.has(row.finalDisposition), row.symbol).toBe(true)
    }
  })

  it("preserves exact R6 -> R7 lineage for every recommendation-ready reference", () => {
    for (const row of buildProgramB4ReferenceDecisions().filter(
      (item) => item.recommendation.state === "RECOMMENDATION_READY",
    )) {
      expect(row.recommendation.sourceScoreRunId).toBeTruthy()
      const r6 = buildProgramB2ReferenceResults().find((source) => source.symbol === row.symbol)
      expect(row.recommendation.sourceScoreRunId).toBe(r6?.scoreLineage?.runId)
      expect(row.recommendation.recommendationRunId).toContain(
        row.recommendation.sourceScoreRunId!,
      )
      expect(row.sizing.sourceScoreRunId).toBe(row.recommendation.sourceScoreRunId)
      expect(row.sizing.sourceRecommendationRunId).toBe(
        row.recommendation.recommendationRunId,
      )
    }
  })

  it("keeps B4 execution non-persisting and provider-free", () => {
    expect(PROGRAM_B_B4_SAFETY_BOUNDARY).toEqual({
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      recommendationPersistence: false,
      sizingPersistence: false,
      ownerSettingsMutation: false,
      productionMutation: false,
      migration: false,
      deployment: false,
      merge: false,
      schedulerMutation: false,
      trading: false,
    })
  })
})
