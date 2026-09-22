export const PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL_VERSION =
  "PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsPipelineAggregationMethodProposal {
  readonly proposalVersion: typeof PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL_VERSION
  readonly state: "PROPOSAL_ONLY_OWNER_APPROVAL_PENDING"
  readonly metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "BUSINESS_DURABILITY"
  readonly method: "LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE"
  readonly pipelineIdentity: {
    readonly fields: readonly ["PRODUCT_OR_MOLECULE", "GEOGRAPHY"]
    readonly sameProductDifferentGeographyIsDistinctIdentity: true
    readonly historicalStagesRetainedForAudit: true
    readonly onlyLatestReviewedStateEntersAggregation: true
    readonly sameDateContradictoryLatestStagesRequireReview: true
  }
  readonly adverseTreatment: {
    readonly adverseStages: readonly ["DELAYED_OR_BLOCKED", "WITHDRAWN_OR_DISCONTINUED"]
    readonly anyLatestAdverseStateBlocksNumericAggregation: true
    readonly outcomeWhenPresent: "REVIEW_REQUIRED"
    readonly numericAdverseFloorOrCapApproved: false
    readonly unrelatedPositiveOffsetAllowed: false
  }
  readonly nonAdverseAggregation: {
    readonly statistic: "MEDIAN"
    readonly inputs: "LATEST_NORMALIZED_STATE_SCORE_PER_DISTINCT_PIPELINE_IDENTITY"
    readonly minimumDistinctPipelineIdentities: 1
    readonly preferredDistinctPipelineIdentities: 4
    readonly eventCountBonusAllowed: false
    readonly simpleAverageAllowed: false
  }
  readonly recencyTreatment: {
    readonly weightedByAge: false
    readonly latestStateSelectionOnly: true
    readonly olderLifecycleStatesRemainVisibleForAudit: true
  }
  readonly materialityAndEconomicRelevance: {
    readonly materialityRemainsEligibilityGateOnly: true
    readonly economicRelevanceRemainsEligibilityGateOnly: true
    readonly numericMaterialityMultiplierApproved: false
    readonly numericEconomicRelevanceMultiplierApproved: false
  }
  readonly rationale: {
    readonly avoidsLifecycleDoubleCounting: true
    readonly preservesAdverseVisibility: true
    readonly medianReducesSinglePositiveOutlierInfluence: true
    readonly avoidsUnapprovedMagnitudeWeights: true
  }
  readonly ownerApprovalRequiredBeforeExecutableCombiner: true
  readonly executableCombinedScoreFunctionPresent: false
  readonly combinedPipelineScoreReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL:
  PharmaGlobalGenericsPipelineAggregationMethodProposal = {
    proposalVersion: PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_METHOD_PROPOSAL_VERSION,
    state: "PROPOSAL_ONLY_OWNER_APPROVAL_PENDING",
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "BUSINESS_DURABILITY",
    method: "LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE",
    pipelineIdentity: {
      fields: ["PRODUCT_OR_MOLECULE", "GEOGRAPHY"],
      sameProductDifferentGeographyIsDistinctIdentity: true,
      historicalStagesRetainedForAudit: true,
      onlyLatestReviewedStateEntersAggregation: true,
      sameDateContradictoryLatestStagesRequireReview: true,
    },
    adverseTreatment: {
      adverseStages: ["DELAYED_OR_BLOCKED", "WITHDRAWN_OR_DISCONTINUED"],
      anyLatestAdverseStateBlocksNumericAggregation: true,
      outcomeWhenPresent: "REVIEW_REQUIRED",
      numericAdverseFloorOrCapApproved: false,
      unrelatedPositiveOffsetAllowed: false,
    },
    nonAdverseAggregation: {
      statistic: "MEDIAN",
      inputs: "LATEST_NORMALIZED_STATE_SCORE_PER_DISTINCT_PIPELINE_IDENTITY",
      minimumDistinctPipelineIdentities: 1,
      preferredDistinctPipelineIdentities: 4,
      eventCountBonusAllowed: false,
      simpleAverageAllowed: false,
    },
    recencyTreatment: {
      weightedByAge: false,
      latestStateSelectionOnly: true,
      olderLifecycleStatesRemainVisibleForAudit: true,
    },
    materialityAndEconomicRelevance: {
      materialityRemainsEligibilityGateOnly: true,
      economicRelevanceRemainsEligibilityGateOnly: true,
      numericMaterialityMultiplierApproved: false,
      numericEconomicRelevanceMultiplierApproved: false,
    },
    rationale: {
      avoidsLifecycleDoubleCounting: true,
      preservesAdverseVisibility: true,
      medianReducesSinglePositiveOutlierInfluence: true,
      avoidsUnapprovedMagnitudeWeights: true,
    },
    ownerApprovalRequiredBeforeExecutableCombiner: true,
    executableCombinedScoreFunctionPresent: false,
    combinedPipelineScoreReady: false,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }
