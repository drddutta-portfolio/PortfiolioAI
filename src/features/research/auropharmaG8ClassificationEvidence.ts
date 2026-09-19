import {
  buildPharmaAdaptiveClassificationProposal,
  type PharmaAnnualExposureObservation,
} from "./pharmaAdaptiveClassificationContract"
import type { PharmaSubprofileCode } from "./pharmaSubprofileAssignment"

export const AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION =
  "AUROPHARMA_G8_1_CLASSIFICATION_EVIDENCE_LOCK_V1" as const

export const AUROPHARMA_G8_1_IDENTITY = {
  companyName: "Aurobindo Pharma Limited",
  symbol: "AUROPHARMA",
  isin: "INE406A01037",
  exchange: "NSE",
} as const

export const AUROPHARMA_G8_1_SOURCES = {
  fy26IntegratedReport: {
    label: "Aurobindo Pharma Integrated Report 2025-26",
    periodEnd: "2026-03-31",
    url: "https://www.aurobindo.com/images/sustainablity/report/Aurobindo-Pharma-IR-2026_For-Web.pdf",
  },
  fy25IntegratedReport: {
    label: "Aurobindo Pharma Integrated Annual Report 2024-25",
    periodEnd: "2025-03-31",
    url: "https://www.aurobindo.com/api/uploads/annualreports/AurobindoPharmaIR2025-website.pdf",
  },
  fy26AuditedResultsRelease: {
    label: "Aurobindo Pharma Q4 FY26 and FY26 consolidated results release",
    periodEnd: "2026-03-31",
    url: "https://www.aurobindo.com/api/uploads/resultsannouncement/APL_PressRelease_Q4FY26.pdf",
  },
  fy25AuditedResultsRelease: {
    label: "Aurobindo Pharma Q4 FY25 and FY25 consolidated results release",
    periodEnd: "2025-03-31",
    url: "https://www.aurobindo.com/api/uploads/resultsannouncement/LtrToSEsPressRelease26052025.pdf",
  },
  fy25EarningsCallTranscript: {
    label: "Aurobindo Pharma Q4 FY25 earnings call transcript",
    periodEnd: "2025-03-31",
    url: "https://www.aurobindo.com/api/uploads/conferencecalltranscripts/LtrToSEsEarningCallTranscript020622025.pdf",
  },
  fy26Results: {
    label: "Aurobindo Pharma FY26 audited consolidated financial results",
    periodEnd: "2026-03-31",
    url: "https://www.aurobindo.com/api/uploads/resultsannouncement/LtrToSEsOutcomeofBM21052026.pdf",
  },
} as const

export interface AuropharmaG81AnnualBusinessMix {
  readonly periodEnd: "2025-03-31" | "2026-03-31"
  readonly consolidatedRevenueCr: number
  readonly usFormulationsRevenueCr: number
  readonly europeFormulationsRevenueCr: number
  readonly totalFormulationsRevenueCr: number
  readonly apiRevenueCr: number
  readonly sourceReference: string
}

export const AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX: readonly AuropharmaG81AnnualBusinessMix[] = [
  {
    periodEnd: "2025-03-31",
    consolidatedRevenueCr: 31_724,
    usFormulationsRevenueCr: 14_816,
    europeFormulationsRevenueCr: 8_356,
    totalFormulationsRevenueCr: 27_388,
    apiRevenueCr: 4_323,
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy25AuditedResultsRelease.url,
  },
  {
    periodEnd: "2026-03-31",
    consolidatedRevenueCr: 33_653,
    usFormulationsRevenueCr: 14_408,
    europeFormulationsRevenueCr: 10_315,
    totalFormulationsRevenueCr: 29_606,
    apiRevenueCr: 4_047,
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy26AuditedResultsRelease.url,
  },
] as const

function sharePercent(numerator: number, denominator: number) {
  return Math.round((numerator / denominator) * 10_000) / 100
}

export function auropharmaGlobalGenericsLowerBoundPercent(
  row: AuropharmaG81AnnualBusinessMix,
) {
  return sharePercent(
    row.usFormulationsRevenueCr + row.europeFormulationsRevenueCr,
    row.consolidatedRevenueCr,
  )
}

export function auropharmaApiRevenueSharePercent(
  row: AuropharmaG81AnnualBusinessMix,
) {
  return sharePercent(row.apiRevenueCr, row.consolidatedRevenueCr)
}

export type AuropharmaG81ComparabilityState =
  | "PASS"
  | "PASS_WITH_QUALIFICATION"
  | "UNAVAILABLE_NON_BLOCKING"

export interface AuropharmaG81ComparabilityCheck {
  readonly code: string
  readonly state: AuropharmaG81ComparabilityState
  readonly roleDetermining: boolean
  readonly note: string
  readonly sourceReference: string
}

export const AUROPHARMA_G8_1_COMPARABILITY_CHECKS: readonly AuropharmaG81ComparabilityCheck[] = [
  {
    code: "CONSOLIDATED_DENOMINATOR_ALIGNMENT",
    state: "PASS",
    roleDetermining: true,
    note: "FY25 and FY26 role shares use consolidated revenue from operations and the same consolidated business-mix basis.",
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy26AuditedResultsRelease.url,
  },
  {
    code: "GLOBAL_GENERICS_CONSERVATIVE_LOWER_BOUND",
    state: "PASS_WITH_QUALIFICATION",
    roleDetermining: true,
    note: "Primary leadership uses only US plus Europe formulations as a conservative Global Generics lower bound. Growth Markets, ARV and other formulation revenue are excluded rather than assumed to be Global Generics.",
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy26AuditedResultsRelease.url,
  },
  {
    code: "API_TRANSFER_CONSOLIDATED_SCOPE",
    state: "PASS_WITH_QUALIFICATION",
    roleDetermining: true,
    note: "The earlier API business transfer to wholly owned Apitoria changes legal-entity ownership but not the consolidated scope used for FY25/FY26 API and company revenue shares.",
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy25IntegratedReport.url,
  },
  {
    code: "BUSINESS_PROFIT_SHARE_NOT_SEPARATELY_DISCLOSED",
    state: "UNAVAILABLE_NON_BLOCKING",
    roleDetermining: true,
    note: "The bounded official set does not disclose comparable Global Generics-versus-API profit shares. G1 therefore uses reviewed revenue-share evidence only and records no revenue/profit leadership conflict.",
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy26IntegratedReport.url,
  },
  {
    code: "ACQUISITION_AND_STRUCTURAL_CHANGE_EFFECTIVE_DATE",
    state: "PASS_WITH_QUALIFICATION",
    roleDetermining: true,
    note: "The Khandelwal domestic-formulations acquisition does not enter the US+Europe or API numerators used here. The proposed Lannett acquisition had no FY26 financial impact and closed after the evidence date, so it is a future-period review trigger rather than a FY25/FY26 comparability break.",
    sourceReference: AUROPHARMA_G8_1_SOURCES.fy26Results.url,
  },
] as const

function classificationObservations(): readonly PharmaAnnualExposureObservation[] {
  return AUROPHARMA_G8_1_ANNUAL_BUSINESS_MIX.flatMap(
    (row): readonly PharmaAnnualExposureObservation[] => [
      {
        exposureCode: "GLOBAL_GENERICS",
        periodEnd: row.periodEnd,
        revenueSharePercent: auropharmaGlobalGenericsLowerBoundPercent(row),
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
      {
        exposureCode: "API_BULK_DRUGS",
        periodEnd: row.periodEnd,
        revenueSharePercent: auropharmaApiRevenueSharePercent(row),
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
      {
        exposureCode: "BIOPHARMA_BIOSIMILARS",
        periodEnd: row.periodEnd,
        revenueSharePercent: null,
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: row.periodEnd === "2025-03-31"
          ? "ANNUAL_REPORT_BUSINESS_MIX"
          : "ISSUER_RESULTS_PRESENTATION",
        sourceReference: row.periodEnd === "2025-03-31"
          ? AUROPHARMA_G8_1_SOURCES.fy25EarningsCallTranscript.url
          : AUROPHARMA_G8_1_SOURCES.fy26IntegratedReport.url,
        reviewState: "REVIEWED",
      },
    ],
  )
}

export const AUROPHARMA_G8_1_CLASSIFICATION_OBSERVATIONS =
  classificationObservations()

export interface AuropharmaG81ClassificationReview {
  readonly reviewVersion: typeof AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION
  readonly reviewState: "REVIEWED_WITH_UNRESOLVED_EXPOSURE"
  readonly evidenceThrough: "2026-03-31"
  readonly proposedEffectiveFrom: "2026-03-31"
  readonly primary: "GLOBAL_GENERICS"
  readonly materialOverlays: readonly PharmaSubprofileCode[]
  readonly emergingWatches: readonly PharmaSubprofileCode[]
  readonly unresolvedExposures: readonly PharmaSubprofileCode[]
  readonly g1Proposal: ReturnType<typeof buildPharmaAdaptiveClassificationProposal>
  readonly canonicalAssignmentPersisted: false
  readonly rawEvidencePersistenceCreated: false
  readonly scoreExecutionEnabled: false
}

export function buildAuropharmaG81ClassificationReview(): AuropharmaG81ClassificationReview {
  const g1Proposal = buildPharmaAdaptiveClassificationProposal(
    AUROPHARMA_G8_1_CLASSIFICATION_OBSERVATIONS,
  )

  const materialOverlays = g1Proposal.exposures
    .filter((item) => item.role === "MATERIAL_OVERLAY")
    .map((item) => item.exposureCode)
  const emergingWatches = g1Proposal.exposures
    .filter((item) => item.role === "EMERGING_WATCH")
    .map((item) => item.exposureCode)
  const unresolvedExposures = g1Proposal.exposures
    .filter((item) => item.role === "REVIEW_REQUIRED")
    .map((item) => item.exposureCode)

  if (
    g1Proposal.classificationState !== "READY_FOR_REVIEW"
    || g1Proposal.primaryCandidate !== "GLOBAL_GENERICS"
  ) {
    throw new Error("AUROPHARMA G8.1 evidence no longer supports the reviewed Primary candidate")
  }

  return {
    reviewVersion: AUROPHARMA_G8_1_CLASSIFICATION_REVIEW_VERSION,
    reviewState: "REVIEWED_WITH_UNRESOLVED_EXPOSURE",
    evidenceThrough: "2026-03-31",
    proposedEffectiveFrom: "2026-03-31",
    primary: "GLOBAL_GENERICS",
    materialOverlays,
    emergingWatches,
    unresolvedExposures,
    g1Proposal,
    canonicalAssignmentPersisted: false,
    rawEvidencePersistenceCreated: false,
    scoreExecutionEnabled: false,
  }
}

export const AUROPHARMA_G8_1_CLASSIFICATION_REVIEW =
  buildAuropharmaG81ClassificationReview()
