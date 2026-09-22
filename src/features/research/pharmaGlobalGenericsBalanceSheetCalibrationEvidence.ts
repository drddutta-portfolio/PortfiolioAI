import { PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE } from "./pharmaGlobalGenericsBalanceSheetMethodGate"

export const PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsBalanceSheetCalibrationBlocker =
  | "GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_SET_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "LEVERAGE_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "INTEREST_COVERAGE_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "TREND_RESILIENCE_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"
  | "PARENT_BALANCE_SHEET_DIMENSION_RECONCILIATION_REQUIRED"

export interface PharmaGlobalGenericsBalanceSheetCalibrationEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE"
  readonly canonicalDimension: "BALANCE_SHEET_CREDIT"
  readonly currentParentMetricDimension: "FINANCIAL_STRENGTH"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsBalanceSheetCalibrationBlocker[]
  readonly parentMethodologyShapeValidated: true
  readonly parentDimensionReconciliationRequired: true
  readonly parentDimensionReconciliationPerformed: false
  readonly globalSpecificCalibrationAvailable: false
  readonly otherSubprofileCalibrationMayBeUsedAsFallback: false
  readonly numericBalanceSheetCurveReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE:
  PharmaGlobalGenericsBalanceSheetCalibrationEvidenceContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_BALANCE_SHEET_LEVERAGE",
    canonicalDimension: "BALANCE_SHEET_CREDIT",
    currentParentMetricDimension: "FINANCIAL_STRENGTH",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_METHOD_GATE.contractVersion,
    blockers: [
      "GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "LEVERAGE_BAND_EVIDENCE_NOT_ESTABLISHED",
      "INTEREST_COVERAGE_BAND_EVIDENCE_NOT_ESTABLISHED",
      "TREND_RESILIENCE_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "PARENT_BALANCE_SHEET_DIMENSION_RECONCILIATION_REQUIRED",
    ],
    parentMethodologyShapeValidated: true,
    parentDimensionReconciliationRequired: true,
    parentDimensionReconciliationPerformed: false,
    globalSpecificCalibrationAvailable: false,
    otherSubprofileCalibrationMayBeUsedAsFallback: false,
    numericBalanceSheetCurveReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsBalanceSheetCalibrationBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_BALANCE_SHEET_CALIBRATION_EVIDENCE.blockers]
}
