import { PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE } from "./pharmaGlobalGenericsCashConversionMethodGate"

export const PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsCashConversionCalibrationBlocker =
  | "GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_SET_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "CFO_TO_PAT_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "FCF_CONVERSION_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "CONSISTENCY_TREND_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"
  | "PARENT_CASH_FLOW_DIMENSION_RECONCILIATION_REQUIRED"

export interface PharmaGlobalGenericsCashConversionCalibrationEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_CASH_CONVERSION_HISTORY"
  readonly canonicalDimension: "CASH_FLOW"
  readonly currentParentMetricDimension: "EARNINGS_CASH_QUALITY"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsCashConversionCalibrationBlocker[]
  readonly parentMethodologyShapeValidated: true
  readonly parentDimensionReconciliationRequired: true
  readonly parentDimensionReconciliationPerformed: false
  readonly globalSpecificCalibrationAvailable: false
  readonly otherSubprofileCalibrationMayBeUsedAsFallback: false
  readonly numericCashConversionCurveReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE:
  PharmaGlobalGenericsCashConversionCalibrationEvidenceContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_CASH_CONVERSION_HISTORY",
    canonicalDimension: "CASH_FLOW",
    currentParentMetricDimension: "EARNINGS_CASH_QUALITY",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_METHOD_GATE.contractVersion,
    blockers: [
      "GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "CFO_TO_PAT_BAND_EVIDENCE_NOT_ESTABLISHED",
      "FCF_CONVERSION_BAND_EVIDENCE_NOT_ESTABLISHED",
      "CONSISTENCY_TREND_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "PARENT_CASH_FLOW_DIMENSION_RECONCILIATION_REQUIRED",
    ],
    parentMethodologyShapeValidated: true,
    parentDimensionReconciliationRequired: true,
    parentDimensionReconciliationPerformed: false,
    globalSpecificCalibrationAvailable: false,
    otherSubprofileCalibrationMayBeUsedAsFallback: false,
    numericCashConversionCurveReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsCashConversionCalibrationBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_CASH_CONVERSION_CALIBRATION_EVIDENCE.blockers]
}
