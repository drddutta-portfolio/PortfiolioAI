import { PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE } from "./pharmaGlobalGenericsMomentumMethodGate"

export const PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY_VERSION =
  "PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY_V1_PROPOSAL" as const

export type PharmaGlobalGenericsMomentumBlocker =
  | "DEDICATED_PHARMA_PARENT_MOMENTUM_CONTRACT_NOT_ESTABLISHED"
  | "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED"
  | "GLOBAL_GENERICS_MOMENTUM_CALIBRATION_SET_NOT_ESTABLISHED"
  | "ABSOLUTE_MOMENTUM_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "RELATIVE_STRENGTH_BAND_EVIDENCE_NOT_ESTABLISHED"
  | "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED"
  | "FINAL_AGGREGATION_NOT_ESTABLISHED"

export interface PharmaGlobalGenericsMomentumEvidenceSufficiencyContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "MOMENTUM"
  readonly upstreamMethodGateVersion: typeof PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.contractVersion
  readonly blockers: readonly PharmaGlobalGenericsMomentumBlocker[]
  readonly evidenceIdentityValidated: true
  readonly dedicatedPharmaParentMomentumContractAvailable: false
  readonly approvedPharmaBenchmarkAvailable: false
  readonly bankPilotMayBeUsedAsFallback: false
  readonly globalSpecificCalibrationAvailable: false
  readonly relativeStrengthScoreReady: false
  readonly numericMomentumCurveReady: false
  readonly wholeMomentumDimensionReady: false
  readonly deferralRequired: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY:
  PharmaGlobalGenericsMomentumEvidenceSufficiencyContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY_VERSION,
    state: "PROPOSAL_ONLY",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "MOMENTUM",
    upstreamMethodGateVersion: PHARMA_GLOBAL_GENERICS_MOMENTUM_METHOD_GATE.contractVersion,
    blockers: [
      "DEDICATED_PHARMA_PARENT_MOMENTUM_CONTRACT_NOT_ESTABLISHED",
      "APPROVED_PHARMA_BENCHMARK_NOT_ESTABLISHED",
      "GLOBAL_GENERICS_MOMENTUM_CALIBRATION_SET_NOT_ESTABLISHED",
      "ABSOLUTE_MOMENTUM_BAND_EVIDENCE_NOT_ESTABLISHED",
      "RELATIVE_STRENGTH_BAND_EVIDENCE_NOT_ESTABLISHED",
      "COMPONENT_WEIGHT_EVIDENCE_NOT_ESTABLISHED",
      "FINAL_AGGREGATION_NOT_ESTABLISHED",
    ],
    evidenceIdentityValidated: true,
    dedicatedPharmaParentMomentumContractAvailable: false,
    approvedPharmaBenchmarkAvailable: false,
    bankPilotMayBeUsedAsFallback: false,
    globalSpecificCalibrationAvailable: false,
    relativeStrengthScoreReady: false,
    numericMomentumCurveReady: false,
    wholeMomentumDimensionReady: false,
    deferralRequired: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export function globalGenericsMomentumEvidenceBlockers() {
  return [...PHARMA_GLOBAL_GENERICS_MOMENTUM_EVIDENCE_SUFFICIENCY.blockers]
}
