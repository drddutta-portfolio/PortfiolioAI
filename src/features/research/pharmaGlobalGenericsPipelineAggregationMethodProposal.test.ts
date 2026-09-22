import { describe, expect, it } from "vitest"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL } from "./pharmaGlobalGenericsPipelineAggregationMethodProposal"

describe("PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL", () => {
  it("uses latest reviewed state per product/geography identity to avoid lifecycle double counting", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.method)
      .toBe("LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.pipelineIdentity.fields)
      .toEqual(["PRODUCT_OR_MOLECULE", "GEOGRAPHY"])
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.pipelineIdentity.onlyLatestReviewedStateEntersAggregation)
      .toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.pipelineIdentity.historicalStagesRetainedForAudit)
      .toBe(true)
  })

  it("blocks numeric aggregation whenever a latest material state is adverse", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.adverseTreatment.adverseStages)
      .toEqual(["DELAYED_OR_BLOCKED", "WITHDRAWN_OR_DISCONTINUED"])
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.adverseTreatment.anyLatestAdverseStateBlocksNumericAggregation)
      .toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.adverseTreatment.outcomeWhenPresent)
      .toBe("REVIEW_REQUIRED")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.adverseTreatment.unrelatedPositiveOffsetAllowed)
      .toBe(false)
  })

  it("proposes median only for distinct non-adverse latest states without count or recency bonuses", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.nonAdverseAggregation.statistic).toBe("MEDIAN")
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.nonAdverseAggregation.eventCountBonusAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.nonAdverseAggregation.simpleAverageAllowed).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.recencyTreatment.weightedByAge).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.recencyTreatment.latestStateSelectionOnly).toBe(true)
  })

  it("keeps materiality and economic relevance eligibility-only and requires owner approval before code can combine scores", () => {
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.materialityAndEconomicRelevance.materialityRemainsEligibilityGateOnly).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.materialityAndEconomicRelevance.economicRelevanceRemainsEligibilityGateOnly).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.ownerApprovalRequiredBeforeExecutableCombiner).toBe(true)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.executableCombinedScoreFunctionPresent).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.combinedPipelineScoreReady).toBe(false)
    expect(PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL.scoreExecutionEnabled).toBe(false)
  })
})
