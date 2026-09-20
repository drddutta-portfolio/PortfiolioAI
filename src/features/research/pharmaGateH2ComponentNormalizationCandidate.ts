import type {
  PharmaGovernanceRegulatoryGateState,
} from "./pharmaGovernanceRegulatoryGateContract"

export const PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE_VERSION =
  "PHARMA_GATE_H2_COMPONENT_NORMALIZATION_V1_OWNER_APPROVED" as const

export type ReviewedQualitativeComponentState =
  | "VERY_STRONG"
  | "STRONG"
  | "NEUTRAL"
  | "WEAK"
  | "VERY_WEAK"
  | "REVIEW_REQUIRED"

export const PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE = {
  version: PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE" as const,
  qualitativeRubric: {
    VERY_STRONG: 90,
    STRONG: 75,
    NEUTRAL: 50,
    WEAK: 25,
    VERY_WEAK: 10,
    REVIEW_REQUIRED: null,
  },
  qualitativeReviewRequirements: {
    officialOrApprovedEvidenceRequired: true,
    rationaleRequired: true,
    sourceLineageRequired: true,
    contradictionStateRequired: true,
    unresolvedMaterialContradictionReturnsReviewRequired: true,
    missingEvidenceReturnsReviewRequired: true,
    analystFreeformNumericScoreAllowed: false,
  },
  appliesToReviewedQualitativeComponents: [
    "BRAND_THERAPY_LEADERSHIP",
    "FIELD_FORCE_PRODUCTIVITY",
    "RND_PRODUCTIVITY",
    "PIPELINE_CORPORATE_EXECUTION",
    "OWNERSHIP_STABILITY",
    "PLEDGE_CONTROL_RISK",
    "NON_G4_GOVERNANCE_CONTEXT",
  ] as const,
  regulatoryRuntimeNormalization: {
    CLEAR: 100,
    HIGH_RISK: 100,
    REVIEW_REQUIRED: null,
    BLOCKED_REVIEW: null,
    rationale: [
      "HIGH_RISK_IS_INTERPRETATION_ONLY_UNDER_OWNER_APPROVED_G7_P2",
      "NO_SECOND_NUMERIC_PENALTY_FOR_G4_CONSUMED_EVENT",
      "REVIEW_REQUIRED_MAY_NOT_BECOME_NEUTRAL",
      "BLOCKED_REVIEW_REMAINS_NON_NUMERIC_AND_BLOCKING",
    ] as const,
  },
  methodologyApproved: true,
  activationApproved: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const

export function normalizeReviewedQualitativeComponent(
  state: ReviewedQualitativeComponentState,
): number | null {
  return PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE
    .qualitativeRubric[state]
}

export function normalizeRegulatoryRuntimeContext(
  state: PharmaGovernanceRegulatoryGateState,
): number | null {
  return PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE
    .regulatoryRuntimeNormalization[state]
}
