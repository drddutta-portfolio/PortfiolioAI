import { PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE } from "./pharmaGlobalGenericsRoceMethodGate"

export const PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsRoceCalibrationBlocker =
  | "GLOBAL_GENERICS_ROCE_CALIBRATION_SET_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "LEVEL_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "STABILITY_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "TREND_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"
  | "PARENT_ROCE_DIMENSION_RECONCILIATION_REQUIRED"

export interface PharmaGlobalGenericsRoceCalibrationEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_ROCE_HISTORY"
  readonly canonicalDimension: "CAPITAL_EFFICIENCY"
  readonly currentParentMetricDimension: "QUALITY"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsRoceCalibrationBlocker[]
  readonly parentMethodologyShapeValidated: true
  readonly parentDimensionReconciliationRequired: true
  readonly parentDimensionReconciliationPerformed: false
  readonly globalSpecificCalibrationAvailable: false
  readonly otherSubprofileCalibrationMayBeUsedAsFallback: false
  readonly numericRoceCurveReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE:
  PharmaGlobalGenericsRoceCalibrationEvidenceContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_ROCE_HISTORY",
    canonicalDimension: "CAPITAL_EFFICIENCY",
    currentParentMetricDimension: "QUALITY",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_ROCE_METHOD_GATE.contractVersion,
    blockers: [
      "GLOBAL_GENERICS_ROCE_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "LEVEL_BAND_EVIDENCE_NOT_ESTABLISHED",
      "STABILITY_BAND_EVIDENCE_NOT_ESTABLISHED",
      "TREND_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "PARENT_ROCE_DIMENSION_RECONCILIATION_REQUIRED",
    ],
    parentMethodologyShapeValidated: true,
    parentDimensionReconciliationRequired: true,
    parentDimensionReconciliationPerformed: false,
    globalSpecificCalibrationAvailable: false,
    otherSubprofileCalibrationMayBeUsedAsFallback: false,
    numericRoceCurveReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsRoceCalibrationBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_ROCE_CALIBRATION_EVIDENCE.blockers]
}
