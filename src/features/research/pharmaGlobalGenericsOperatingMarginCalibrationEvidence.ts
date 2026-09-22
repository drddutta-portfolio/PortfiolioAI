import { PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE } from "./pharmaGlobalGenericsOperatingMarginMethodGate"

export const PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsOperatingMarginCalibrationBlocker =
  | "GLOBAL_GENERICS_CALIBRATION_SET_NOT_ESTABLISHED"
  | "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED"
  | "LEVEL_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "STABILITY_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "TREND_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"

export interface PharmaGlobalGenericsOperatingMarginCalibrationEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "QUALITY"
  readonly metricCode: "PHARMA_OPERATING_MARGIN_HISTORY"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsOperatingMarginCalibrationBlocker[]
  readonly parentMethodologyShapeValidated: true
  readonly globalSpecificCalibrationAvailable: false
  readonly domesticCalibrationMayBeUsedAsFallback: false
  readonly numericOperatingMarginCurveReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE:
  PharmaGlobalGenericsOperatingMarginCalibrationEvidenceContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "QUALITY",
    metricCode: "PHARMA_OPERATING_MARGIN_HISTORY",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_METHOD_GATE.contractVersion,
    blockers: [
      "GLOBAL_GENERICS_CALIBRATION_SET_NOT_ESTABLISHED",
      "REVIEWED_GLOBAL_GENERICS_PEER_COHORT_NOT_ESTABLISHED",
      "LEVEL_BAND_EVIDENCE_NOT_ESTABLISHED",
      "STABILITY_BAND_EVIDENCE_NOT_ESTABLISHED",
      "TREND_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
    ],
    parentMethodologyShapeValidated: true,
    globalSpecificCalibrationAvailable: false,
    domesticCalibrationMayBeUsedAsFallback: false,
    numericOperatingMarginCurveReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsOperatingMarginCalibrationBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_OPERATING_MARGIN_CALIBRATION_EVIDENCE.blockers]
}
