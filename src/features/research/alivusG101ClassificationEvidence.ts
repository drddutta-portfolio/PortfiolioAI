import {
  buildPharmaAdaptiveClassificationProposal,
  type PharmaAnnualExposureObservation,
} from "./pharmaAdaptiveClassificationContract"

export const ALIVUS_G10_1_CLASSIFICATION_REVIEW_VERSION =
  "ALIVUS_G10_1_API_CLASSIFICATION_LOCK_V1" as const

export const ALIVUS_G10_1_IDENTITY = {
  companyName: "Alivus Life Sciences Limited",
  symbol: "ALIVUS",
  isin: "INE03Q201024",
  exchange: "NSE",
} as const

export const ALIVUS_G10_1_SOURCES = {
  fy26IntegratedReport: {
    label: "Alivus Life Sciences Integrated Annual Report 2025-26",
    periodEnd: "2026-03-31",
    url: "https://alivus.b-cdn.net/alivus_pdfs/investors/financials/reports_presentation/Alivus%20Life%20Sciences%20Limited_AR_2026.pdf",
  },
  fy25IntegratedReport: {
    label: "Alivus Life Sciences Integrated Annual Report 2024-25",
    periodEnd: "2025-03-31",
    url: "https://alivus.b-cdn.net/alivus_pdfs/investors/financials/reports_presentation/Integrated_Annual_Report_2024-25.pdf",
  },
  officialReportsIndex: {
    label: "Alivus Life Sciences reports and presentations",
    periodEnd: "2026-03-31",
    url: "https://www.alivus.com/investors/reports-and-presentations/",
  },
  officialPressReleaseIndex: {
    label: "Alivus Life Sciences official press releases",
    periodEnd: "2026-08-18",
    url: "https://www.alivus.com/media/press-releases/",
  },
} as const

export interface AlivusG101AnnualBusinessMix {
  readonly periodEnd: "2025-03-31" | "2026-03-31"
  readonly genericApiSharePercent: number
  readonly cdmoSharePercent: number
  readonly sourceReference: string
}

export const ALIVUS_G10_1_ANNUAL_BUSINESS_MIX: readonly AlivusG101AnnualBusinessMix[] = [
  {
    periodEnd: "2025-03-31",
    genericApiSharePercent: 94,
    cdmoSharePercent: 6,
    sourceReference: ALIVUS_G10_1_SOURCES.fy25IntegratedReport.url,
  },
  {
    periodEnd: "2026-03-31",
    genericApiSharePercent: 93,
    cdmoSharePercent: 7,
    sourceReference: ALIVUS_G10_1_SOURCES.fy26IntegratedReport.url,
  },
] as const

export type AlivusG101DistortionState =
  | "PASS"
  | "PASS_WITH_FUTURE_REVIEW_TRIGGER"

export interface AlivusG101DistortionCheck {
  readonly code: string
  readonly state: AlivusG101DistortionState
  readonly roleDetermining: boolean
  readonly note: string
  readonly sourceReference: string
}

export const ALIVUS_G10_1_DISTORTION_CHECKS: readonly AlivusG101DistortionCheck[] = [
  {
    code: "TWO_PERIOD_BUSINESS_MIX_COMPARABILITY",
    state: "PASS",
    roleDetermining: true,
    note: "FY25 and FY26 use the issuer's directly disclosed Generic API versus CDMO business mix on the same company scope, preserving a comparable role-determining denominator.",
    sourceReference: ALIVUS_G10_1_SOURCES.fy26IntegratedReport.url,
  },
  {
    code: "OWNERSHIP_AND_RENAME_NON_OPERATING_CHANGE",
    state: "PASS",
    roleDetermining: true,
    note: "Nirma's majority acquisition and the Glenmark Life Sciences to Alivus rename changed ownership/name, not the FY25/FY26 operating-model denominator used for classification.",
    sourceReference: ALIVUS_G10_1_SOURCES.fy25IntegratedReport.url,
  },
  {
    code: "CDMO_RECOVERY_DOES_NOT_CHANGE_PRIMARY",
    state: "PASS",
    roleDetermining: true,
    note: "CDMO recovered in FY26 but remained 7% of business mix versus 93% Generic API, so the recovery is retained as Emerging Watch context rather than allowed to distort primary classification.",
    sourceReference: ALIVUS_G10_1_SOURCES.fy26IntegratedReport.url,
  },
  {
    code: "IQGENX_POST_EVIDENCE_DATE",
    state: "PASS_WITH_FUTURE_REVIEW_TRIGGER",
    roleDetermining: true,
    note: "The announced majority acquisition of IQGenX occurred after the 31 March 2026 evidence date. It is a future-period classification/materiality review trigger and is not back-projected into FY25/FY26.",
    sourceReference: ALIVUS_G10_1_SOURCES.officialPressReleaseIndex.url,
  },
] as const

function classificationObservations(): readonly PharmaAnnualExposureObservation[] {
  return ALIVUS_G10_1_ANNUAL_BUSINESS_MIX.flatMap(
    (row): readonly PharmaAnnualExposureObservation[] => [
      {
        exposureCode: "API_BULK_DRUGS",
        periodEnd: row.periodEnd,
        revenueSharePercent: row.genericApiSharePercent,
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
      {
        exposureCode: "CDMO_CRAMS",
        periodEnd: row.periodEnd,
        revenueSharePercent: row.cdmoSharePercent,
        profitSharePercent: null,
        growingTowardMaterialityReviewed: true,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
    ],
  )
}

export const ALIVUS_G10_1_CLASSIFICATION_OBSERVATIONS = classificationObservations()

const proposal = buildPharmaAdaptiveClassificationProposal(
  ALIVUS_G10_1_CLASSIFICATION_OBSERVATIONS,
)

if (
  proposal.classificationState !== "READY_FOR_REVIEW"
  || proposal.primaryCandidate !== "API_BULK_DRUGS"
) {
  throw new Error("ALIVUS G10.1 classification fixture must resolve API_BULK_DRUGS READY_FOR_REVIEW")
}

const materialOverlays = proposal.exposures
  .filter((exposure) => exposure.role === "MATERIAL_OVERLAY")
  .map((exposure) => exposure.exposureCode)

const emergingWatches = proposal.exposures
  .filter((exposure) => exposure.role === "EMERGING_WATCH")
  .map((exposure) => exposure.exposureCode)

export const ALIVUS_G10_1_CLASSIFICATION_REVIEW = {
  reviewVersion: ALIVUS_G10_1_CLASSIFICATION_REVIEW_VERSION,
  checkpointState: "READY_FOR_OWNER_LOCK",
  evidenceThrough: "2026-03-31",
  proposedEffectiveDate: "2026-03-31",
  primary: proposal.primaryCandidate,
  materialOverlays,
  emergingWatches,
  classificationState: proposal.classificationState,
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
  selectionReason:
    "ALIVUS provides direct issuer-disclosed Generic API versus CDMO business mix for two consecutive annual periods, minimizing primary-business ambiguity for the first API portability reference.",
  reclassificationRule:
    "After owner lock, classification may reopen only for new material business evidence through a separately documented, versioned reclassification decision; a score or recommendation outcome is never a valid trigger.",
} as const
