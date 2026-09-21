import { ALIVUS_G10_1_ANNUAL_BUSINESS_MIX, ALIVUS_G10_1_CLASSIFICATION_REVIEW, ALIVUS_G10_1_DISTORTION_CHECKS } from "./alivusG101ClassificationEvidence"
import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export interface PharmaGateJReferenceClassificationView {
  readonly stage: "G10.1"
  readonly checkpoint: "A"
  readonly symbol: string
  readonly companyName: string
  readonly checkpointState: "READY_FOR_OWNER_LOCK"
  readonly primary: PharmaSubprofileCode
  readonly materialOverlays: readonly PharmaSubprofileCode[]
  readonly emergingWatches: readonly PharmaSubprofileCode[]
  readonly evidenceThrough: string
  readonly proposedEffectiveDate: string
  readonly annualMix: readonly {
    readonly periodEnd: string
    readonly primarySharePercent: number
    readonly cdmoSharePercent: number
  }[]
  readonly selectionReason: string
  readonly distortionChecks: readonly {
    readonly code: string
    readonly state: "PASS" | "PASS_WITH_FUTURE_REVIEW_TRIGGER"
    readonly note: string
  }[]
  readonly scoreExecutionEnabled: false
  readonly recommendationExecutionEnabled: false
  readonly persistenceEnabled: false
}

const ALIVUS_VIEW: PharmaGateJReferenceClassificationView = {
  stage: "G10.1",
  checkpoint: "A",
  symbol: "ALIVUS",
  companyName: "Alivus Life Sciences Limited",
  checkpointState: ALIVUS_G10_1_CLASSIFICATION_REVIEW.checkpointState,
  primary: ALIVUS_G10_1_CLASSIFICATION_REVIEW.primary,
  materialOverlays: ALIVUS_G10_1_CLASSIFICATION_REVIEW.materialOverlays,
  emergingWatches: ALIVUS_G10_1_CLASSIFICATION_REVIEW.emergingWatches,
  evidenceThrough: ALIVUS_G10_1_CLASSIFICATION_REVIEW.evidenceThrough,
  proposedEffectiveDate: ALIVUS_G10_1_CLASSIFICATION_REVIEW.proposedEffectiveDate,
  annualMix: ALIVUS_G10_1_ANNUAL_BUSINESS_MIX.map((row) => ({
    periodEnd: row.periodEnd,
    primarySharePercent: row.genericApiSharePercent,
    cdmoSharePercent: row.cdmoSharePercent,
  })),
  selectionReason: ALIVUS_G10_1_CLASSIFICATION_REVIEW.selectionReason,
  distortionChecks: ALIVUS_G10_1_DISTORTION_CHECKS.map((check) => ({
    code: check.code,
    state: check.state,
    note: check.note,
  })),
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
}

export function pharmaGateJReferenceClassification(
  symbol: string,
): PharmaGateJReferenceClassificationView | null {
  return symbol.toLocaleUpperCase() === "ALIVUS" ? ALIVUS_VIEW : null
}
