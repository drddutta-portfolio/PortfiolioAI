import type { PharmaGlobalGenericsPipelineEvidenceItem } from "./pharmaGlobalGenericsPipelineEvidenceContract"
import { normalizeGlobalGenericsPipelineEvent } from "./pharmaGlobalGenericsPipelineStageNormalization"

export const PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsPipelineAggregationDecision =
  | "AGGREGATION_METHOD"
  | "RECENCY_TREATMENT"
  | "ADVERSE_EVENT_TREATMENT"
  | "EVENT_OFFSET_POLICY"
  | "ECONOMIC_RELEVANCE_NUMERIC_ROLE"

export interface PharmaGlobalGenericsPipelineAggregationGateContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "BUSINESS_DURABILITY"
  readonly upstreamContracts: readonly [
    "PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_V1_PROPOSAL",
    "PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_V1_PROPOSAL",
  ]
  readonly requiredDecisions: readonly PharmaGlobalGenericsPipelineAggregationDecision[]
  readonly approvedAggregationMethod: null
  readonly candidateMethodsAreNotApprovedDefaults: true
  readonly candidateMethods: readonly [
    "MEDIAN",
    "WEIGHTED_MEAN",
    "ADVERSE_FLOOR_OR_CAP",
    "OTHER_EXPLICIT_VERSIONED_METHOD",
  ]
  readonly safeguards: {
    readonly allIncludedEventsMustBeIndividuallyEligible: true
    readonly allIncludedEventsMustBeIndividuallyNormalized: true
    readonly adverseEventsRemainVisible: true
    readonly eventCountBonusAllowed: false
    readonly simpleAverageApproved: false
    readonly medianApproved: false
    readonly recencyWeightingApproved: false
    readonly materialityWeightingApproved: false
    readonly unrelatedPositiveEventMaySilentlyOffsetAdverseEvent: false
    readonly economicRelevanceNumericMultiplierApproved: false
  }
  readonly combinedPipelineScoreReady: false
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE:
  PharmaGlobalGenericsPipelineAggregationGateContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_PIPELINE_AGGREGATION_GATE_VERSION,
    state: "PROPOSAL_ONLY",
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "BUSINESS_DURABILITY",
    upstreamContracts: [
      "PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_V1_PROPOSAL",
      "PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_V1_PROPOSAL",
    ],
    requiredDecisions: [
      "AGGREGATION_METHOD",
      "RECENCY_TREATMENT",
      "ADVERSE_EVENT_TREATMENT",
      "EVENT_OFFSET_POLICY",
      "ECONOMIC_RELEVANCE_NUMERIC_ROLE",
    ],
    approvedAggregationMethod: null,
    candidateMethodsAreNotApprovedDefaults: true,
    candidateMethods: [
      "MEDIAN",
      "WEIGHTED_MEAN",
      "ADVERSE_FLOOR_OR_CAP",
      "OTHER_EXPLICIT_VERSIONED_METHOD",
    ],
    safeguards: {
      allIncludedEventsMustBeIndividuallyEligible: true,
      allIncludedEventsMustBeIndividuallyNormalized: true,
      adverseEventsRemainVisible: true,
      eventCountBonusAllowed: false,
      simpleAverageApproved: false,
      medianApproved: false,
      recencyWeightingApproved: false,
      materialityWeightingApproved: false,
      unrelatedPositiveEventMaySilentlyOffsetAdverseEvent: false,
      economicRelevanceNumericMultiplierApproved: false,
    },
    combinedPipelineScoreReady: false,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export interface PharmaGlobalGenericsPipelineAggregationReadiness {
  readonly state: "INSUFFICIENT_EVIDENCE" | "REVIEW_REQUIRED" | "AWAITING_METHODOLOGY_APPROVAL"
  readonly eligibleEventCount: number
  readonly adverseEventCount: number
  readonly normalizedScores: readonly number[]
  readonly combinedScore: null
}

export function assessGlobalGenericsPipelineAggregationReadiness(
  items: readonly PharmaGlobalGenericsPipelineEvidenceItem[],
): PharmaGlobalGenericsPipelineAggregationReadiness {
  if (!items.length) {
    return {
      state: "INSUFFICIENT_EVIDENCE",
      eligibleEventCount: 0,
      adverseEventCount: 0,
      normalizedScores: [],
      combinedScore: null,
    }
  }

  const normalized = items.map(normalizeGlobalGenericsPipelineEvent)
  const valid = normalized.filter((item): item is NonNullable<typeof item> => item !== null)

  if (valid.length !== items.length) {
    return {
      state: "REVIEW_REQUIRED",
      eligibleEventCount: valid.length,
      adverseEventCount: valid.filter((item) => item.stage === "DELAYED_OR_BLOCKED" || item.stage === "WITHDRAWN_OR_DISCONTINUED").length,
      normalizedScores: valid.map((item) => item.score),
      combinedScore: null,
    }
  }

  return {
    state: "AWAITING_METHODOLOGY_APPROVAL",
    eligibleEventCount: valid.length,
    adverseEventCount: valid.filter((item) => item.stage === "DELAYED_OR_BLOCKED" || item.stage === "WITHDRAWN_OR_DISCONTINUED").length,
    normalizedScores: valid.map((item) => item.score),
    combinedScore: null,
  }
}
