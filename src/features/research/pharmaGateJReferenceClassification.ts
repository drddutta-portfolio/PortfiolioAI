import {
  ALIVUS_G10_1_ANNUAL_BUSINESS_MIX,
  ALIVUS_G10_1_CLASSIFICATION_REVIEW,
  ALIVUS_G10_1_DISTORTION_CHECKS,
} from "./alivusG101ClassificationEvidence"
import { AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION } from "./auropharmaG102ClassificationReconfirmation"
import {
  BIOCON_G10_3_ANNUAL_BUSINESS_MIX,
  BIOCON_G10_3_CLASSIFICATION_REVIEW,
  BIOCON_G10_3_DISTORTION_CHECKS,
} from "./bioconG103ClassificationEvidence"
import {
  SYNGENE_G10_4_ANNUAL_BUSINESS_MODEL,
  SYNGENE_G10_4_CLASSIFICATION_REVIEW,
  SYNGENE_G10_4_DISTORTION_CHECKS,
} from "./syngeneG104ClassificationEvidence"
import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export interface PharmaGateJReferenceClassificationView {
  readonly stage: "G10.1" | "G10.2" | "G10.3" | "G10.4"
  readonly checkpoint: "A"
  readonly symbol: string
  readonly companyName: string
  readonly checkpointState: "READY_FOR_OWNER_LOCK" | "READY_FOR_OWNER_RECONFIRMATION"
  readonly primary: PharmaSubprofileCode
  readonly materialOverlays: readonly PharmaSubprofileCode[]
  readonly emergingWatches: readonly PharmaSubprofileCode[]
  readonly unresolvedExposures: readonly PharmaSubprofileCode[]
  readonly evidenceThrough: string
  readonly proposedEffectiveDate: string
  readonly operatingMixLabel: string
  readonly operatingMixRows: readonly {
    readonly periodEnd: string
    readonly summary: string
  }[]
  readonly selectionLabel: string
  readonly selectionReason: string
  readonly distortionChecks: readonly {
    readonly code: string
    readonly state: string
    readonly note: string
  }[]
  readonly lockMode: "NEW_LOCK" | "RECONFIRM_EXISTING_LOCK"
  readonly scoreStateLabel: string
  readonly boundaryNote: string
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
  unresolvedExposures: [],
  evidenceThrough: ALIVUS_G10_1_CLASSIFICATION_REVIEW.evidenceThrough,
  proposedEffectiveDate: ALIVUS_G10_1_CLASSIFICATION_REVIEW.proposedEffectiveDate,
  operatingMixLabel: "Issuer-disclosed Generic API versus CDMO",
  operatingMixRows: ALIVUS_G10_1_ANNUAL_BUSINESS_MIX.map((row) => ({
    periodEnd: row.periodEnd,
    summary: `API ${row.genericApiSharePercent}% · CDMO ${row.cdmoSharePercent}%`,
  })),
  selectionLabel: "Low-ambiguity API portability candidate",
  selectionReason: ALIVUS_G10_1_CLASSIFICATION_REVIEW.selectionReason,
  distortionChecks: ALIVUS_G10_1_DISTORTION_CHECKS.map((check) => ({
    code: check.code,
    state: check.state,
    note: check.note,
  })),
  lockMode: "NEW_LOCK",
  scoreStateLabel: "Score not started",
  boundaryNote:
    "Checkpoint A writes no research evidence, assignment, score or recommendation. Checkpoint B remains blocked until the owner approves this classification lock.",
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
}

const AUROPHARMA_VIEW: PharmaGateJReferenceClassificationView = {
  stage: "G10.2",
  checkpoint: "A",
  symbol: "AUROPHARMA",
  companyName: "Aurobindo Pharma Limited",
  checkpointState: "READY_FOR_OWNER_RECONFIRMATION",
  primary: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.primary,
  materialOverlays: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.materialOverlays,
  emergingWatches: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.emergingWatches,
  unresolvedExposures: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.unresolvedExposures,
  evidenceThrough: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.evidenceThrough,
  proposedEffectiveDate: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.effectiveFrom,
  operatingMixLabel: "Conservative US + Europe Global Generics lower bound versus API share",
  operatingMixRows: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.annualMix.map((row) => ({
    periodEnd: row.periodEnd,
    summary: `Global Generics ≥ ${row.globalGenericsLowerBoundPercent.toFixed(2)}% · API ${row.apiSharePercent.toFixed(2)}%`,
  })),
  selectionLabel: "Existing reviewed Global Generics reference",
  selectionReason:
    "G10.2 reuses the G8.1 reviewed AUROPHARMA classification because two comparable annual periods already establish conservative Global Generics leadership; Checkpoint A re-confirms that authority rather than rebuilding it.",
  distortionChecks: AUROPHARMA_G10_2_CLASSIFICATION_RECONFIRMATION.comparabilityChecks.map((check) => ({
    code: check.code,
    state: check.state,
    note: check.note,
  })),
  lockMode: "RECONFIRM_EXISTING_LOCK",
  scoreStateLabel: "Score not computable · methodology incomplete",
  boundaryNote:
    "Checkpoint A does not make AUROPHARMA computable. Biosimilars remains unresolved, API remains Emerging Watch, and Checkpoint B must complete Global Generics methodology without reconstructing partial scores.",
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
}


const BIOCON_VIEW: PharmaGateJReferenceClassificationView = {
  stage: "G10.3",
  checkpoint: "A",
  symbol: "BIOCON",
  companyName: "Biocon Limited",
  checkpointState: BIOCON_G10_3_CLASSIFICATION_REVIEW.checkpointState,
  primary: BIOCON_G10_3_CLASSIFICATION_REVIEW.primary,
  materialOverlays: BIOCON_G10_3_CLASSIFICATION_REVIEW.materialOverlays,
  emergingWatches: BIOCON_G10_3_CLASSIFICATION_REVIEW.emergingWatches,
  unresolvedExposures: [],
  evidenceThrough: BIOCON_G10_3_CLASSIFICATION_REVIEW.evidenceThrough,
  proposedEffectiveDate: BIOCON_G10_3_CLASSIFICATION_REVIEW.proposedEffectiveDate,
  operatingMixLabel: "Issuer-disclosed Biosimilars versus Generics versus CRDMO business-revenue contribution",
  operatingMixRows: BIOCON_G10_3_ANNUAL_BUSINESS_MIX.map((row) => ({
    periodEnd: row.periodEnd,
    summary: `Biosimilars ${row.biosimilarsSharePercent}% · Generics ${row.genericsSharePercent}% · CRDMO ${row.crdmoSharePercent}%`,
  })),
  selectionLabel: "Existing sole Biosimilars portability candidate",
  selectionReason: BIOCON_G10_3_CLASSIFICATION_REVIEW.selectionReason,
  distortionChecks: BIOCON_G10_3_DISTORTION_CHECKS.map((check) => ({
    code: check.code,
    state: check.state,
    note: check.note,
  })),
  lockMode: "NEW_LOCK",
  scoreStateLabel: "Checkpoint A approved · Checkpoint B fail-closed candidate",
  boundaryNote:
    "Checkpoint A classification is owner-approved. Global Generics and CDMO/CRAMS remain Material Overlays. Checkpoint B may evaluate Biosimilars methodology and evidence, but missing mandatory evidence must fail closed and no overlay may create a second stock score.",
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
}


const SYNGENE_VIEW: PharmaGateJReferenceClassificationView = {
  stage: "G10.4",
  checkpoint: "A",
  symbol: "SYNGENE",
  companyName: "Syngene International Limited",
  checkpointState: SYNGENE_G10_4_CLASSIFICATION_REVIEW.checkpointState,
  primary: SYNGENE_G10_4_CLASSIFICATION_REVIEW.primary,
  materialOverlays: SYNGENE_G10_4_CLASSIFICATION_REVIEW.materialOverlays,
  emergingWatches: SYNGENE_G10_4_CLASSIFICATION_REVIEW.emergingWatches,
  unresolvedExposures: [],
  evidenceThrough: SYNGENE_G10_4_CLASSIFICATION_REVIEW.evidenceThrough,
  proposedEffectiveDate: SYNGENE_G10_4_CLASSIFICATION_REVIEW.proposedEffectiveDate,
  operatingMixLabel: "PortfolioAI taxonomy view of issuer contract research, development and manufacturing services",
  operatingMixRows: SYNGENE_G10_4_ANNUAL_BUSINESS_MODEL.map((row) => ({
    periodEnd: row.periodEnd,
    summary: `CDMO / CRAMS taxonomy coverage ${row.cdmoCramsTaxonomySharePercent}%`,
  })),
  selectionLabel: "Low-ambiguity integrated CRDMO portability candidate",
  selectionReason: SYNGENE_G10_4_CLASSIFICATION_REVIEW.selectionReason,
  distortionChecks: SYNGENE_G10_4_DISTORTION_CHECKS.map((check) => ({
    code: check.code,
    state: check.state,
    note: check.note,
  })),
  lockMode: "NEW_LOCK",
  scoreStateLabel: "Score not started",
  boundaryNote:
    "Checkpoint A locks only the operating-model classification. The 100% figure is a PortfolioAI taxonomy consolidation of issuer contract research/development/manufacturing services, not an issuer-reported single-segment share. Checkpoint B remains blocked until owner approval.",
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
}

const VIEW_BY_SYMBOL: Readonly<Record<string, PharmaGateJReferenceClassificationView>> = {
  ALIVUS: ALIVUS_VIEW,
  AUROPHARMA: AUROPHARMA_VIEW,
  BIOCON: BIOCON_VIEW,
  SYNGENE: SYNGENE_VIEW,
}

export function pharmaGateJReferenceClassification(
  symbol: string,
): PharmaGateJReferenceClassificationView | null {
  return VIEW_BY_SYMBOL[symbol.toLocaleUpperCase()] ?? null
}
