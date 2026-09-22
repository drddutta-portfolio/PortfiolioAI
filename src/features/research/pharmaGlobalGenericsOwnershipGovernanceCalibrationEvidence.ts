import { PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE } from "./pharmaGlobalGenericsOwnershipGovernanceMethodGate"

export const PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsOwnershipGovernanceCalibrationBlocker =
  | "GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_SET_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_OWNERSHIP_COHORT_NOT_ESTABLISHED"
  | "OWNERSHIP_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "PLEDGE_CONTROL_RISK_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "GOVERNANCE_EVENT_CONTEXT_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"
  | "FINAL_AGGREGATION_NOT_ESTABLISHED"
  | "PARENT_OWNERSHIP_GOVERNANCE_DIMENSION_RECONCILIATION_REQUIRED"

export interface PharmaGlobalGenericsOwnershipGovernanceCalibrationEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_OWNERSHIP_GOVERNANCE"
  readonly canonicalDimension: "OWNERSHIP_GOVERNANCE"
  readonly currentParentMetricDimension: "GOVERNANCE"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsOwnershipGovernanceCalibrationBlocker[]
  readonly parentMethodologyShapeValidated: true
  readonly parentDimensionReconciliationRequired: true
  readonly parentDimensionReconciliationPerformed: false
  readonly g4AntiDoubleCountingLockPreserved: true
  readonly globalSpecificCalibrationAvailable: false
  readonly mechanicalOwnershipShortcutsAllowed: false
  readonly numericOwnershipGovernanceCurveReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE:
  PharmaGlobalGenericsOwnershipGovernanceCalibrationEvidenceContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_OWNERSHIP_GOVERNANCE",
    canonicalDimension: "OWNERSHIP_GOVERNANCE",
    currentParentMetricDimension: "GOVERNANCE",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_METHOD_GATE.contractVersion,
    blockers: [
      "GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_OWNERSHIP_COHORT_NOT_ESTABLISHED",
      "OWNERSHIP_BAND_EVIDENCE_NOT_ESTABLISHED",
      "PLEDGE_CONTROL_RISK_BAND_EVIDENCE_NOT_ESTABLISHED",
      "GOVERNANCE_EVENT_CONTEXT_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "FINAL_AGGREGATION_NOT_ESTABLISHED",
      "PARENT_OWNERSHIP_GOVERNANCE_DIMENSION_RECONCILIATION_REQUIRED",
    ],
    parentMethodologyShapeValidated: true,
    parentDimensionReconciliationRequired: true,
    parentDimensionReconciliationPerformed: false,
    g4AntiDoubleCountingLockPreserved: true,
    globalSpecificCalibrationAvailable: false,
    mechanicalOwnershipShortcutsAllowed: false,
    numericOwnershipGovernanceCurveReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsOwnershipGovernanceCalibrationBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_OWNERSHIP_GOVERNANCE_CALIBRATION_EVIDENCE.blockers]
}
