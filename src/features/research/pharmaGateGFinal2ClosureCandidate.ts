import {
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY,
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  PHARMA_GATE_G_DIMENSION_RECONCILIATION,
} from "./pharmaGateGDimensionReconciliation"
import {
  TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY,
} from "./torntpharmGateGFinal2EvidenceSufficiency"

export const PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE_VERSION =
  "PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE_V1" as const

export const PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE = {
  version: PHARMA_GATE_G_FINAL_2_CLOSURE_CANDIDATE_VERSION,
  state: "IMPLEMENTATION_COMPLETE_OWNER_FREEZE_PENDING" as const,
  targetSecurity: "TORNTPHARM" as const,
  primarySubprofile: "DOMESTIC_FORMULATIONS" as const,
  parentDimensionReconciliation: {
    state: PHARMA_GATE_G_DIMENSION_RECONCILIATION.state,
    promotedParentProfileVersion:
      PHARMA_GATE_G_DIMENSION_RECONCILIATION.promotedParentProfileVersion,
    complete: true,
  },
  evidenceSufficiency: {
    contractVersion:
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.version,
    locked: true,
    allSevenDimensionsScoreReady:
      TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY.allSevenDimensionsScoreReady,
  },
  numericMethodology: {
    contractVersion:
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
    state: PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.state,
    deterministicEvaluatorsImplemented: [
      "CAPITAL_EFFICIENCY",
      "CASH_FLOW",
      "BALANCE_SHEET_CREDIT",
      "BUSINESS_DURABILITY",
      "MOMENTUM",
      "OWNERSHIP_GOVERNANCE",
      "RISK",
    ] as const,
    benchmark:
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.benchmark.code,
    ownerApprovalRequired:
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.ownerApprovalRequired,
  },
  remainingEvidenceBlockersForTorntpharm: [
    "CASH_FLOW_MATCHED_THREE_YEAR_CFO_HISTORY",
    "BUSINESS_DURABILITY_REVIEWED_COMPONENT_INPUTS",
    "MOMENTUM_TORNTPHARM_MARKET_FIXTURE",
    "OWNERSHIP_GOVERNANCE_FOUR_QUARTER_HISTORY",
    "RISK_COMPANY_WIDE_REGULATORY_SCOPE_AND_MARKET_FIXTURE",
  ] as const,
  gFinal2MethodologyImplementationComplete: true,
  gFinal2OwnerFreezeComplete: false,
  gFinal2Complete: false,
  gateHEligible: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const
