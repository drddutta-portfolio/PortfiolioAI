import {
  buildPharmaAdaptiveClassificationProposal,
  type PharmaAnnualExposureObservation,
} from "./pharmaAdaptiveClassificationContract"

export const BIOCON_G10_3_CLASSIFICATION_REVIEW_VERSION =
  "BIOCON_G10_3_BIOPHARMA_BIOSIMILARS_CLASSIFICATION_LOCK_V1" as const

export const BIOCON_G10_3_IDENTITY = {
  companyName: "Biocon Limited",
  symbol: "BIOCON",
  isin: "INE376G01013",
  exchange: "NSE",
} as const

export const BIOCON_G10_3_SOURCES = {
  fy26InvestorPresentation: {
    label: "Biocon Investor Presentation June 2026",
    periodEnd: "2026-03-31",
    url: "https://www.biocon.com/docs/IR-Presentation-June2026.pdf",
  },
  fy25IntegratedAnnualReport: {
    label: "Biocon Integrated Annual Report 2024-25",
    periodEnd: "2025-03-31",
    url: "https://www.biocon.com/docs/Biocon_Integrated_Annual_Report_2025.pdf",
  },
  annualReportsIndex: {
    label: "Biocon annual reports index",
    periodEnd: "2026-03-31",
    url: "https://www.biocon.com/investor-relations/financial-information/annual-reports/",
  },
  fy26Results: {
    label: "Biocon Q4 FY26 and full-year FY26 results",
    periodEnd: "2026-03-31",
    url: "https://www.biocon.com/biocon-q4fy26-revenue/",
  },
} as const

export interface BioconG103AnnualBusinessMix {
  readonly periodEnd: "2025-03-31" | "2026-03-31"
  readonly biosimilarsSharePercent: number
  readonly genericsSharePercent: number
  readonly crdmoSharePercent: number
  readonly sourceReference: string
}

export const BIOCON_G10_3_ANNUAL_BUSINESS_MIX: readonly BioconG103AnnualBusinessMix[] = [
  {
    periodEnd: "2025-03-31",
    biosimilarsSharePercent: 58,
    genericsSharePercent: 19,
    crdmoSharePercent: 23,
    sourceReference: BIOCON_G10_3_SOURCES.fy25IntegratedAnnualReport.url,
  },
  {
    periodEnd: "2026-03-31",
    biosimilarsSharePercent: 60,
    genericsSharePercent: 18,
    crdmoSharePercent: 22,
    sourceReference: BIOCON_G10_3_SOURCES.fy26InvestorPresentation.url,
  },
] as const

export type BioconG103DistortionState = "PASS" | "PASS_WITH_CONTEXT"

export interface BioconG103DistortionCheck {
  readonly code: string
  readonly state: BioconG103DistortionState
  readonly roleDetermining: boolean
  readonly note: string
  readonly sourceReference: string
}

export const BIOCON_G10_3_DISTORTION_CHECKS: readonly BioconG103DistortionCheck[] = [
  {
    code: "TWO_PERIOD_BUSINESS_MIX_COMPARABILITY",
    state: "PASS",
    roleDetermining: true,
    note: "FY25 and FY26 both disclose the group business-revenue contribution across Biosimilars, Generics and Research Services/CRDMO, preserving a comparable role-determining denominator.",
    sourceReference: BIOCON_G10_3_SOURCES.fy26InvestorPresentation.url,
  },
  {
    code: "BIOSIMILARS_DOMINANCE_PERSISTS",
    state: "PASS",
    roleDetermining: true,
    note: "Biosimilars remains the largest business in both reviewed annual periods at 58% and 60%, while both other disclosed businesses remain materially smaller.",
    sourceReference: BIOCON_G10_3_SOURCES.fy26InvestorPresentation.url,
  },
  {
    code: "FY25_ONE_OFFS_EXCLUDED_FROM_ROLE_DENOMINATOR",
    state: "PASS_WITH_CONTEXT",
    roleDetermining: true,
    note: "FY25 contained disclosed one-off items including generic lenalidomide sales and Biocon Biologics divestment-related income, but the classification uses the issuer's business-revenue contribution mix rather than total income or exceptional gains.",
    sourceReference: BIOCON_G10_3_SOURCES.fy25IntegratedAnnualReport.url,
  },
  {
    code: "MATERIAL_SECONDARY_BUSINESSES_RETAINED",
    state: "PASS",
    roleDetermining: true,
    note: "Generics and Research Services/CRDMO each remain at or above 15% in both reviewed periods, so they are retained as Material Overlays instead of being hidden inside the Biosimilars primary.",
    sourceReference: BIOCON_G10_3_SOURCES.fy26InvestorPresentation.url,
  },
] as const

function classificationObservations(): readonly PharmaAnnualExposureObservation[] {
  return BIOCON_G10_3_ANNUAL_BUSINESS_MIX.flatMap(
    (row): readonly PharmaAnnualExposureObservation[] => [
      {
        exposureCode: "BIOPHARMA_BIOSIMILARS",
        periodEnd: row.periodEnd,
        revenueSharePercent: row.biosimilarsSharePercent,
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
      {
        exposureCode: "GLOBAL_GENERICS",
        periodEnd: row.periodEnd,
        revenueSharePercent: row.genericsSharePercent,
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
      {
        exposureCode: "CDMO_CRAMS",
        periodEnd: row.periodEnd,
        revenueSharePercent: row.crdmoSharePercent,
        profitSharePercent: null,
        growingTowardMaterialityReviewed: false,
        evidenceTier: "ANNUAL_REPORT_BUSINESS_MIX",
        sourceReference: row.sourceReference,
        reviewState: "REVIEWED",
      },
    ],
  )
}

export const BIOCON_G10_3_CLASSIFICATION_OBSERVATIONS = classificationObservations()

const proposal = buildPharmaAdaptiveClassificationProposal(
  BIOCON_G10_3_CLASSIFICATION_OBSERVATIONS,
)

if (
  proposal.classificationState !== "READY_FOR_REVIEW"
  || proposal.primaryCandidate !== "BIOPHARMA_BIOSIMILARS"
) {
  throw new Error("BIOCON G10.3 classification fixture must resolve BIOPHARMA_BIOSIMILARS READY_FOR_REVIEW")
}

const materialOverlays = proposal.exposures
  .filter((exposure) => exposure.role === "MATERIAL_OVERLAY")
  .map((exposure) => exposure.exposureCode)

const emergingWatches = proposal.exposures
  .filter((exposure) => exposure.role === "EMERGING_WATCH")
  .map((exposure) => exposure.exposureCode)

export const BIOCON_G10_3_CLASSIFICATION_REVIEW = {
  reviewVersion: BIOCON_G10_3_CLASSIFICATION_REVIEW_VERSION,
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
    "BIOCON is the existing sole provisional BIOPHARMA_BIOSIMILARS candidate and provides two consecutive issuer-disclosed group business-mix periods with Biosimilars dominant and both Generics and CRDMO separately measurable.",
  reclassificationRule:
    "After owner lock, classification may reopen only for new material business evidence through a separately documented, versioned reclassification decision; a score or recommendation outcome is never a valid trigger.",
} as const
