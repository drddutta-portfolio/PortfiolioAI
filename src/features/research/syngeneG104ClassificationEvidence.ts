import {
  buildPharmaAdaptiveClassificationProposal,
  type PharmaAnnualExposureObservation,
} from "./pharmaAdaptiveClassificationContract"

export const SYNGENE_G10_4_CLASSIFICATION_REVIEW_VERSION =
  "SYNGENE_G10_4_CDMO_CRAMS_CLASSIFICATION_LOCK_V1" as const

export const SYNGENE_G10_4_IDENTITY = {
  companyName: "Syngene International Limited",
  symbol: "SYNGENE",
  isin: "INE398R01022",
  exchange: "NSE",
} as const

export const SYNGENE_G10_4_SOURCES = {
  fy26AnnualReport: {
    label: "Syngene Annual Report 2025-26",
    periodEnd: "2026-03-31",
    url: "https://annualreport.syngeneintl.com/",
  },
  fy26Services: {
    label: "Syngene Annual Report 2025-26 — Our Services",
    periodEnd: "2026-03-31",
    url: "https://annualreport.syngeneintl.com/our-services.html",
  },
  fy25AnnualReport: {
    label: "Syngene Annual Report 2024-25",
    periodEnd: "2025-03-31",
    url: "https://annualreport.syngeneintl.com/pdf/Syngene-Annual-Report-2024-25.pdf",
  },
  fy25CfoMessage: {
    label: "Syngene Annual Report 2024-25 — CFO message",
    periodEnd: "2025-03-31",
    url: "https://annualreport.syngeneintl.com/message-from-our-chief-financial-officer.html",
  },
} as const

export interface SyngeneG104AnnualBusinessModel {
  readonly periodEnd: "2025-03-31" | "2026-03-31"
  readonly cdmoCramsTaxonomySharePercent: 100
  readonly sourceReference: string
  readonly basis: string
}

export const SYNGENE_G10_4_ANNUAL_BUSINESS_MODEL: readonly SyngeneG104AnnualBusinessModel[] = [
  {
    periodEnd: "2025-03-31",
    cdmoCramsTaxonomySharePercent: 100,
    sourceReference: SYNGENE_G10_4_SOURCES.fy25AnnualReport.url,
    basis:
      "Issuer describes the operating model as diversified across CRO and CDMO services. PortfolioAI CDMO_CRAMS intentionally consolidates contract research, development and manufacturing services into one operating-model taxonomy.",
  },
  {
    periodEnd: "2026-03-31",
    cdmoCramsTaxonomySharePercent: 100,
    sourceReference: SYNGENE_G10_4_SOURCES.fy26AnnualReport.url,
    basis:
      "Issuer describes Syngene as an integrated CRDMO platform spanning discovery, development and manufacturing. All reviewed operating-service families remain inside the PortfolioAI CDMO_CRAMS taxonomy.",
  },
] as const

export type SyngeneG104DistortionState = "PASS" | "PASS_WITH_CONTEXT"

export const SYNGENE_G10_4_DISTORTION_CHECKS = [
  {
    code: "TWO_PERIOD_OPERATING_MODEL_COMPARABILITY",
    state: "PASS",
    roleDetermining: true,
    note:
      "FY25 and FY26 both describe the listed company as an outsourced research/development/manufacturing services platform, preserving the same PortfolioAI CDMO_CRAMS taxonomy across both annual periods.",
    sourceReference: SYNGENE_G10_4_SOURCES.fy26AnnualReport.url,
  },
  {
    code: "CRO_AND_CDMO_TAXONOMY_CONSOLIDATION",
    state: "PASS_WITH_CONTEXT",
    roleDetermining: true,
    note:
      "The 100% share is a PortfolioAI taxonomy classification, not an issuer-reported single-segment revenue percentage: issuer CRO/Research Services and CDMO/Development/Manufacturing service lines are all contract research/development/manufacturing activities captured by CDMO_CRAMS.",
    sourceReference: SYNGENE_G10_4_SOURCES.fy25CfoMessage.url,
  },
  {
    code: "NO_PRODUCT_LED_PHARMA_SECONDARY_EXPOSURE",
    state: "PASS",
    roleDetermining: true,
    note:
      "No reviewed issuer operating business is classified as a product-led API, Domestic Formulations, Global Generics or Biosimilars business; client programs do not become Syngene product exposures.",
    sourceReference: SYNGENE_G10_4_SOURCES.fy26Services.url,
  },
  {
    code: "INTERNAL_SERVICE_MIX_NOT_SECONDARY_SUBPROFILE",
    state: "PASS",
    roleDetermining: true,
    note:
      "Research Services, development services and commercial manufacturing are internal service families inside one CRDMO operating model and are not treated as independent Pharma subprofiles or Material Overlays.",
    sourceReference: SYNGENE_G10_4_SOURCES.fy26Services.url,
  },
] as const

function classificationObservations(): readonly PharmaAnnualExposureObservation[] {
  return SYNGENE_G10_4_ANNUAL_BUSINESS_MODEL.map((row) => ({
    exposureCode: "CDMO_CRAMS",
    periodEnd: row.periodEnd,
    revenueSharePercent: row.cdmoCramsTaxonomySharePercent,
    profitSharePercent: null,
    growingTowardMaterialityReviewed: false,
    evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
    sourceReference: row.sourceReference,
    reviewState: "REVIEWED",
  }))
}

export const SYNGENE_G10_4_CLASSIFICATION_OBSERVATIONS = classificationObservations()

const proposal = buildPharmaAdaptiveClassificationProposal(
  SYNGENE_G10_4_CLASSIFICATION_OBSERVATIONS,
)

if (
  proposal.classificationState !== "READY_FOR_REVIEW"
  || proposal.primaryCandidate !== "CDMO_CRAMS"
) {
  throw new Error("SYNGENE G10.4 classification fixture must resolve CDMO_CRAMS READY_FOR_REVIEW")
}

export const SYNGENE_G10_4_CLASSIFICATION_REVIEW = {
  reviewVersion: SYNGENE_G10_4_CLASSIFICATION_REVIEW_VERSION,
  checkpointState: "READY_FOR_OWNER_LOCK",
  evidenceThrough: "2026-03-31",
  proposedEffectiveDate: "2026-03-31",
  primary: proposal.primaryCandidate,
  materialOverlays: [] as const,
  emergingWatches: [] as const,
  classificationState: proposal.classificationState,
  scoreExecutionEnabled: false,
  recommendationExecutionEnabled: false,
  persistenceEnabled: false,
  selectionReason:
    "SYNGENE is an existing provisional CDMO_CRAMS candidate and is the lowest-ambiguity reference because the reviewed issuer operating model is an integrated contract research, development and manufacturing platform rather than a product-led Pharma business.",
  reclassificationRule:
    "After owner lock, classification may reopen only for new material business evidence through a separately documented, versioned reclassification decision; a score or recommendation outcome is never a valid trigger.",
} as const
