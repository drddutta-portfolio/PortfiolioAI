import { PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE } from "./pharmaGlobalGenericsValuationMethodGate"

export const PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsValuationCalibrationBlocker =
  | "GLOBAL_GENERICS_VALUATION_CALIBRATION_SET_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "SELF_HISTORY_CALIBRATION_NOT_ESTABLISHED"
  | "PEER_RELATIVE_METRIC_MIX_NOT_ESTABLISHED"
  | "PEER_RELATIVE_BANDS_NOT_ESTABLISHED"
  | "FCF_CORROBORATION_METHOD_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"
  | "FINAL_AGGREGATION_NOT_ESTABLISHED"

export interface PharmaGlobalGenericsValuationCalibrationEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly metricCode: "PHARMA_VALUATION_CONTEXT"
  readonly canonicalDimension: "VALUATION"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsValuationCalibrationBlocker[]
  readonly parentMethodologyShapeValidated: true
  readonly parentDimensionAligned: true
  readonly globalSpecificCalibrationAvailable: false
  readonly domesticCalibrationMayBeUsedAsFallback: false
  readonly missingComponentRenormalizationAllowed: false
  readonly hiddenReweightingAllowed: false
  readonly numericValuationCurveReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE:
  PharmaGlobalGenericsValuationCalibrationEvidenceContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    metricCode: "PHARMA_VALUATION_CONTEXT",
    canonicalDimension: "VALUATION",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_VALUATION_METHOD_GATE.contractVersion,
    blockers: [
      "GLOBAL_GENERICS_VALUATION_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "SELF_HISTORY_CALIBRATION_NOT_ESTABLISHED",
      "PEER_RELATIVE_METRIC_MIX_NOT_ESTABLISHED",
      "PEER_RELATIVE_BANDS_NOT_ESTABLISHED",
      "FCF_CORROBORATION_METHOD_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "FINAL_AGGREGATION_NOT_ESTABLISHED",
    ],
    parentMethodologyShapeValidated: true,
    parentDimensionAligned: true,
    globalSpecificCalibrationAvailable: false,
    domesticCalibrationMayBeUsedAsFallback: false,
    missingComponentRenormalizationAllowed: false,
    hiddenReweightingAllowed: false,
    numericValuationCurveReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsValuationCalibrationBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_VALUATION_CALIBRATION_EVIDENCE.blockers]
}
