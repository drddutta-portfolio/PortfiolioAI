import {
  PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL,
  PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
} from "./pharmaOperatingMarginCurveProposal"
import {
  PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL,
  PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
} from "./pharmaSegmentGrowthCurveProposal"
import {
  PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE,
  PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION,
} from "./pharmaDomesticValuationCombinedScoreContract"
import {
  PHARMA_READINESS_MAPPING_CONTRACT,
  PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
} from "./pharmaReadinessMappingContract"
import {
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT,
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
} from "./pharmaG7GovernanceHighRiskConstraint"

export const PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE_VERSION =
  "PHARMA_GATE_G_FINAL_1_OWNER_APPROVED_V1" as const

export const PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE = {
  version: PHARMA_GATE_G_FINAL_1_CLOSURE_CANDIDATE_VERSION,
  state: "OWNER_APPROVED_COMPLETE" as const,
  targetSecurity: "TORNTPHARM" as const,
  profileCode: "PHARMA_V1" as const,
  primarySubprofile: "DOMESTIC_FORMULATIONS" as const,
  contracts: {
    quality: {
      dimension: "QUALITY" as const,
      contractVersion: PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
      currentState: PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.state,
      deterministicEvaluatorAvailable: true,
      ownerApprovalRequired: false,
      activationApproved: PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.activationApproved,
    },
    growth: {
      dimension: "GROWTH" as const,
      contractVersion: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
      currentState: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.state,
      deterministicEvaluatorAvailable: true,
      ownerApprovalRequired: false,
      activationApproved: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.activationApproved,
    },
    valuation: {
      dimension: "VALUATION" as const,
      contractVersion: PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE_VERSION,
      currentState: PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.state,
      deterministicEvaluatorAvailable: true,
      ownerApprovalRequired: false,
      activationApproved: PHARMA_DOMESTIC_VALUATION_COMBINED_SCORE.activationApproved,
    },
    readiness: {
      contractVersion: PHARMA_READINESS_MAPPING_CONTRACT_VERSION,
      currentState: PHARMA_READINESS_MAPPING_CONTRACT.state,
      dimensionMinimumScoreReadyCoverage:
        PHARMA_READINESS_MAPPING_CONTRACT.dimensionMinimumScoreReadyCoverage,
      overallMinimumScoreReadyCoverage:
        PHARMA_READINESS_MAPPING_CONTRACT.overallMinimumScoreReadyCoverage,
      requiresEveryWeightedDimensionReady:
        PHARMA_READINESS_MAPPING_CONTRACT.requiresEveryWeightedDimensionReady,
      ownerApprovalRequired: false,
    },
    governanceHighRisk: {
      contractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
      currentState: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.state,
      highRiskBehavior: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskBehavior,
      criticalBlocksOverallPreview:
        PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.criticalBlocksOverallPreview,
      hiddenDoubleCountingAllowed:
        PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.hiddenDoubleCountingAllowed,
      ownerApprovalRequired: false,
    },
  },
  ownerApprovalRequiredFor: [] as const,
  gFinal1Complete: true,
  remainingGateHBlockers: [
    "G_FINAL_2_MISSING_NUMERIC_DIMENSIONS",
    "G_FINAL_3_MATERIAL_OVERLAY_TREATMENT",
    "G_FINAL_4_GOVERNANCE_RUNTIME_INPUT",
    "G_FINAL_5_FULL_SCORE_DRY_RUN",
  ] as const,
  gateHEligible: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const
