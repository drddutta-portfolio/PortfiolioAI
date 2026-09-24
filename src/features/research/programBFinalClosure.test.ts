import { describe, expect, it } from "vitest"
import { buildProgramBFinalAudit } from "./programBFinalClosure"

describe("Program B B-FINAL closure audit", () => {
  it("passes the complete cross-pipeline closure contract", () => {
    const audit = buildProgramBFinalAudit()

    expect(audit).toMatchObject({
      r6ToR7TraceabilityPass: true,
      securityRoleAssignmentLineagePass: true,
      portfolioDispositionComplete: true,
      deterministicReplayPass: true,
      isolationContractPass: true,
      stopConditionsPass: true,
      providerFreeComputePass: true,
      aiNumericDecisionPass: true,
      ownerAuthorityPass: true,
      persistenceSafetyPass: true,
      r6TotalHoldings: 238,
      r7TotalHoldings: 238,
      scoredReferenceCount: 2,
      recommendationReadyReferenceCount: 2,
      sizingReadyReferenceCount: 0,
      portfolioRecommendationReadyCount: 2,
      portfolioSizingReadyCount: 0,
      overallPass: true,
    })
  })

  it("records the intentional incomplete numeric coverage instead of overstating closure", () => {
    const audit = buildProgramBFinalAudit()

    expect(audit.intentionalLimitations).toEqual([
      "PORTFOLIO_WIDE_NUMERIC_SCORING_COVERAGE_NOT_COMPLETE",
      "PORTFOLIO_WIDE_NUMERIC_RECOMMENDATION_COVERAGE_NOT_COMPLETE",
      "PROGRAM_B_NUMERIC_SIZING_POLICY_NOT_APPROVED",
      "FROZEN_PORTFOLIO_SNAPSHOT_IS_2026_09_22_NOT_LIVE_PRODUCTION_STATE",
      "PROGRAM_B_BRANCH_IS_LOCAL_CANDIDATE_AND_UNMERGED",
      "PIPELINE_NOT_PRODUCTION_OPERATIONAL",
    ])
  })
})
