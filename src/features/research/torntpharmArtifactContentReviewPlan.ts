import type { PharmaBusinessModelEvidenceAcquisitionPlan } from "./pharmaBusinessModelEvidenceAcquisitionContract"
import type { TorntpharmPublicOfficialSourceDiscoveryPlan } from "./torntpharmPublicOfficialSourceDiscovery"

export type ArtifactReviewRelevance = "LIKELY_RELEVANT" | "POSSIBLY_RELEVANT"

export interface TorntpharmArtifactReviewTarget {
  readonly code: string
  readonly title: string
  readonly period: string
  readonly documentType: "ANNUAL_REPORT" | "RESULTS_RELEASE" | "REGULATORY_ACTION" | "REGULATORY_CLOSEOUT" | "EXCHANGE_FILING"
  readonly locator: string
  readonly reviewState: "NOT_REVIEWED"
}

export interface TorntpharmRequirementArtifactReview {
  readonly artifactCode: string
  readonly relevance: ArtifactReviewRelevance
  readonly rationale: string
}

export interface TorntpharmRequirementContentReviewPlan {
  readonly metricCode: string
  readonly label: string
  readonly scopeLabel: string
  readonly minimumObservations: number
  readonly preferredObservations: number
  readonly historyUnit: string
  readonly artifactReviews: readonly TorntpharmRequirementArtifactReview[]
  readonly likelyArtifactCount: number
  readonly possibleArtifactCount: number
  readonly planningCoverageCount: number
  readonly minimumPlanningGap: number
  readonly preferredPlanningGap: number
  readonly reviewedObservationCount: 0
  readonly minimumReviewedEvidenceGap: number
  readonly evidenceState: "NOT_REVIEWED"
}

export interface TorntpharmArtifactContentReviewPlan {
  readonly contractVersion: "TORNTPHARM_ARTIFACT_CONTENT_REVIEW_PLAN_V1"
  readonly artifacts: readonly TorntpharmArtifactReviewTarget[]
  readonly requirements: readonly TorntpharmRequirementContentReviewPlan[]
  readonly summary: {
    readonly exactArtifactsPlanned: number
    readonly annualReports: number
    readonly quarterlyReleases: number
    readonly regulatorDocuments: number
    readonly exchangeFilings: number
    readonly requirementsPlanned: number
    readonly minimumPlanningCovered: number
    readonly preferredPlanningCovered: number
    readonly evidenceReviewed: 0
  }
  readonly contentFetchAuthorized: false
  readonly evidenceReviewAuthorized: false
  readonly ingestionAuthorized: false
}

export const TORNTPHARM_ARTIFACT_REVIEW_TARGETS = Object.freeze([
  {
    code: "TORRENT_AR_FY23",
    title: "Integrated Annual Report 2022-23",
    period: "FY2022-23",
    documentType: "ANNUAL_REPORT",
    locator: "https://www.torrentpharma.com/pdf/download/AR-2022-23.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_AR_FY24",
    title: "Integrated Annual Report 2023-24",
    period: "FY2023-24",
    documentType: "ANNUAL_REPORT",
    locator: "https://www.torrentpharma.com/pdf/investors/AR-2023-24.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_AR_FY25",
    title: "Integrated Annual Report 2024-25",
    period: "FY2024-25",
    documentType: "ANNUAL_REPORT",
    locator: "https://www.torrentpharma.com/pdf/investors/AR-2024-25.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_AR_FY26",
    title: "Integrated Annual Report 2025-26",
    period: "FY2025-26",
    documentType: "ANNUAL_REPORT",
    locator: "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_Q4_FY25_RELEASE",
    title: "Torrent Pharma Q4 FY25 Results Release",
    period: "Q4 FY2024-25",
    documentType: "RESULTS_RELEASE",
    locator: "https://www.torrentpharma.com/assets/Torrent_Pharma_Press_release_final_Q4_24_25_4201161339.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_Q1_FY26_RELEASE",
    title: "Torrent Pharma Q1 FY26 Results Release",
    period: "Q1 FY2025-26",
    documentType: "RESULTS_RELEASE",
    locator: "https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_Q2_FY26_RELEASE",
    title: "Torrent Pharma Q2 FY26 Results Release",
    period: "Q2 FY2025-26",
    documentType: "RESULTS_RELEASE",
    locator: "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_Q3_FY26_RELEASE",
    title: "Torrent Pharma Q3 FY26 Results Release",
    period: "Q3 FY2025-26",
    documentType: "RESULTS_RELEASE",
    locator: "https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_Q4_FY26_RELEASE",
    title: "Torrent Pharma Q4 FY26 Results Release",
    period: "Q4 FY2025-26",
    documentType: "RESULTS_RELEASE",
    locator: "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "FDA_INDRA_WARNING_2019",
    title: "FDA Warning Letter — Indrad facility",
    period: "2019-10-08",
    documentType: "REGULATORY_ACTION",
    locator: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-10082019",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "FDA_INDRA_CLOSEOUT_2024",
    title: "FDA Closeout Letter — Indrad facility",
    period: "2024-09-04",
    documentType: "REGULATORY_CLOSEOUT",
    locator: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-09042024",
    reviewState: "NOT_REVIEWED",
  },
  {
    code: "TORRENT_JB_ACQUISITION_COMPLETION_2026",
    title: "Regulation 30 — JB Chemicals acquisition completion",
    period: "2026-01-21",
    documentType: "EXCHANGE_FILING",
    locator: "https://www.torrentpharma.com/docs/SE_Intimation_21012026_6c495a098e.pdf",
    reviewState: "NOT_REVIEWED",
  },
] as const satisfies readonly TorntpharmArtifactReviewTarget[])

const REVIEWS_BY_METRIC: Readonly<Record<string, readonly TorntpharmRequirementArtifactReview[]>> = {
  PHARMA_DOMESTIC_REVENUE_GROWTH: [
    { artifactCode: "TORRENT_AR_FY23", relevance: "LIKELY_RELEVANT", rationale: "Annual India/domestic business disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY24", relevance: "LIKELY_RELEVANT", rationale: "Annual India/domestic business disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY25", relevance: "LIKELY_RELEVANT", rationale: "Annual India/domestic business disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "LIKELY_RELEVANT", rationale: "Annual India/domestic business disclosure candidate." },
  ],
  PHARMA_FIELD_FORCE_PRODUCTIVITY: [
    { artifactCode: "TORRENT_AR_FY23", relevance: "POSSIBLY_RELEVANT", rationale: "Historical field-force/MR disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY24", relevance: "LIKELY_RELEVANT", rationale: "Historical field-force/MR disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY25", relevance: "POSSIBLY_RELEVANT", rationale: "Field-force/MR disclosure candidate; exact compatible headcount still unreviewed." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "POSSIBLY_RELEVANT", rationale: "Current field-force/MR disclosure candidate; exact compatible headcount still unreviewed." },
  ],
  PHARMA_DOMESTIC_EXPOSURE_MATERIALITY_REVIEW: [
    { artifactCode: "TORRENT_AR_FY26", relevance: "LIKELY_RELEVANT", rationale: "Current issuer geography/site/materiality context candidate." },
    { artifactCode: "FDA_INDRA_WARNING_2019", relevance: "LIKELY_RELEVANT", rationale: "Historical regulator action candidate." },
    { artifactCode: "FDA_INDRA_CLOSEOUT_2024", relevance: "LIKELY_RELEVANT", rationale: "Later regulator state candidate needed for current-state review." },
  ],
  PHARMA_NEW_LAUNCH_CONTRIBUTION: [
    { artifactCode: "TORRENT_AR_FY24", relevance: "POSSIBLY_RELEVANT", rationale: "Annual launch-contribution disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY25", relevance: "POSSIBLY_RELEVANT", rationale: "Annual launch-contribution disclosure candidate." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "POSSIBLY_RELEVANT", rationale: "Current annual launch-contribution disclosure candidate." },
    { artifactCode: "TORRENT_Q4_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "Current launch commentary candidate; numeric contribution must be explicit." },
  ],
  PHARMA_DOMESTIC_PIPELINE_EVIDENCE: [
    { artifactCode: "TORRENT_AR_FY24", relevance: "LIKELY_RELEVANT", rationale: "Historical domestic pipeline/launch event candidate." },
    { artifactCode: "TORRENT_AR_FY25", relevance: "LIKELY_RELEVANT", rationale: "Domestic pipeline/launch event candidate." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "LIKELY_RELEVANT", rationale: "Current domestic pipeline/launch event candidate." },
    { artifactCode: "TORRENT_Q4_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "Current quarter launch/pipeline event candidate." },
  ],
  PHARMA_INLICENSING_MA_EXECUTION: [
    { artifactCode: "TORRENT_AR_FY23", relevance: "POSSIBLY_RELEVANT", rationale: "Historical inorganic/in-licensing execution context candidate." },
    { artifactCode: "TORRENT_AR_FY24", relevance: "POSSIBLY_RELEVANT", rationale: "Historical inorganic/in-licensing execution context candidate." },
    { artifactCode: "TORRENT_AR_FY25", relevance: "LIKELY_RELEVANT", rationale: "Current inorganic transaction context candidate." },
    { artifactCode: "TORRENT_JB_ACQUISITION_COMPLETION_2026", relevance: "LIKELY_RELEVANT", rationale: "Dated material acquisition execution filing candidate." },
  ],
  PHARMA_REGULATORY_SITE_STATUS: [
    { artifactCode: "FDA_INDRA_WARNING_2019", relevance: "LIKELY_RELEVANT", rationale: "Material regulator action in the site history." },
    { artifactCode: "FDA_INDRA_CLOSEOUT_2024", relevance: "LIKELY_RELEVANT", rationale: "Later closeout state required to avoid treating historical warning as current." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "POSSIBLY_RELEVANT", rationale: "Issuer current-site/regulatory context candidate." },
  ],
  PHARMA_EXPORT_US_REVENUE_GROWTH: [
    { artifactCode: "TORRENT_Q4_FY25_RELEASE", relevance: "LIKELY_RELEVANT", rationale: "Quarterly geography/US business performance candidate." },
    { artifactCode: "TORRENT_Q1_FY26_RELEASE", relevance: "LIKELY_RELEVANT", rationale: "Quarterly geography/US business performance candidate." },
    { artifactCode: "TORRENT_Q2_FY26_RELEASE", relevance: "LIKELY_RELEVANT", rationale: "Quarterly geography/US business performance candidate." },
    { artifactCode: "TORRENT_Q3_FY26_RELEASE", relevance: "LIKELY_RELEVANT", rationale: "Quarterly geography/US business performance candidate." },
    { artifactCode: "TORRENT_Q4_FY26_RELEASE", relevance: "LIKELY_RELEVANT", rationale: "Quarterly geography/US business performance candidate." },
  ],
  PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE: [
    { artifactCode: "TORRENT_AR_FY25", relevance: "LIKELY_RELEVANT", rationale: "Material pipeline/launch/approval event candidate." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "LIKELY_RELEVANT", rationale: "Current pipeline/launch/approval event candidate." },
    { artifactCode: "TORRENT_Q3_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "Quarterly product/approval event candidate." },
    { artifactCode: "TORRENT_Q4_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "Quarterly product/approval event candidate." },
  ],
  PHARMA_US_GENERIC_PRICE_EROSION: [
    { artifactCode: "TORRENT_Q4_FY25_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US pricing/ASP commentary candidate." },
    { artifactCode: "TORRENT_Q1_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US pricing/ASP commentary candidate." },
    { artifactCode: "TORRENT_Q2_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US pricing/ASP commentary candidate." },
    { artifactCode: "TORRENT_Q3_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US pricing/ASP commentary candidate." },
    { artifactCode: "TORRENT_Q4_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US pricing/ASP commentary candidate." },
  ],
  PHARMA_GENERICS_VOLUME_MIX: [
    { artifactCode: "TORRENT_Q4_FY25_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US/generics volume/mix commentary candidate." },
    { artifactCode: "TORRENT_Q1_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US/generics volume/mix commentary candidate." },
    { artifactCode: "TORRENT_Q2_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US/generics volume/mix commentary candidate." },
    { artifactCode: "TORRENT_Q3_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US/generics volume/mix commentary candidate." },
    { artifactCode: "TORRENT_Q4_FY26_RELEASE", relevance: "POSSIBLY_RELEVANT", rationale: "US/generics volume/mix commentary candidate." },
  ],
  PHARMA_COMPLEX_SPECIALTY_GENERICS_MIX: [
    { artifactCode: "TORRENT_AR_FY23", relevance: "POSSIBLY_RELEVANT", rationale: "Historical product-mix classification candidate." },
    { artifactCode: "TORRENT_AR_FY24", relevance: "POSSIBLY_RELEVANT", rationale: "Historical product-mix classification candidate." },
    { artifactCode: "TORRENT_AR_FY25", relevance: "POSSIBLY_RELEVANT", rationale: "Product-mix classification candidate." },
    { artifactCode: "TORRENT_AR_FY26", relevance: "POSSIBLY_RELEVANT", rationale: "Current product-mix classification candidate." },
  ],
}

export function buildTorntpharmArtifactContentReviewPlan(
  acquisitionPlan: PharmaBusinessModelEvidenceAcquisitionPlan,
  discoveryPlan: TorntpharmPublicOfficialSourceDiscoveryPlan,
): TorntpharmArtifactContentReviewPlan {
  const scopedCodes = new Set(discoveryPlan.requirements.map((item) => item.metricCode))
  const itemsByCode = new Map(acquisitionPlan.items.map((item) => [item.metricCode, item]))
  const requirements = [...scopedCodes].map((metricCode): TorntpharmRequirementContentReviewPlan => {
    const acquisition = itemsByCode.get(metricCode)
    const artifactReviews = REVIEWS_BY_METRIC[metricCode]
    if (!acquisition) throw new Error(`Missing acquisition item for ${metricCode}`)
    if (!artifactReviews?.length) throw new Error(`Missing artifact review plan for ${metricCode}`)
    const uniqueArtifactCount = new Set(artifactReviews.map((item) => item.artifactCode)).size
    const minimumPlanningGap = Math.max(0, acquisition.minimumObservations - uniqueArtifactCount)
    const preferredPlanningGap = Math.max(0, acquisition.preferredObservations - uniqueArtifactCount)
    return {
      metricCode,
      label: acquisition.label,
      scopeLabel: acquisition.scopeLabel,
      minimumObservations: acquisition.minimumObservations,
      preferredObservations: acquisition.preferredObservations,
      historyUnit: acquisition.historyUnit,
      artifactReviews,
      likelyArtifactCount: artifactReviews.filter((item) => item.relevance === "LIKELY_RELEVANT").length,
      possibleArtifactCount: artifactReviews.filter((item) => item.relevance === "POSSIBLY_RELEVANT").length,
      planningCoverageCount: uniqueArtifactCount,
      minimumPlanningGap,
      preferredPlanningGap,
      reviewedObservationCount: 0,
      minimumReviewedEvidenceGap: acquisition.minimumObservations,
      evidenceState: "NOT_REVIEWED",
    }
  })
  return {
    contractVersion: "TORNTPHARM_ARTIFACT_CONTENT_REVIEW_PLAN_V1",
    artifacts: TORNTPHARM_ARTIFACT_REVIEW_TARGETS,
    requirements,
    summary: {
      exactArtifactsPlanned: TORNTPHARM_ARTIFACT_REVIEW_TARGETS.length,
      annualReports: TORNTPHARM_ARTIFACT_REVIEW_TARGETS.filter((item) => item.documentType === "ANNUAL_REPORT").length,
      quarterlyReleases: TORNTPHARM_ARTIFACT_REVIEW_TARGETS.filter((item) => item.documentType === "RESULTS_RELEASE").length,
      regulatorDocuments: TORNTPHARM_ARTIFACT_REVIEW_TARGETS.filter((item) => item.documentType === "REGULATORY_ACTION" || item.documentType === "REGULATORY_CLOSEOUT").length,
      exchangeFilings: TORNTPHARM_ARTIFACT_REVIEW_TARGETS.filter((item) => item.documentType === "EXCHANGE_FILING").length,
      requirementsPlanned: requirements.length,
      minimumPlanningCovered: requirements.filter((item) => item.minimumPlanningGap === 0).length,
      preferredPlanningCovered: requirements.filter((item) => item.preferredPlanningGap === 0).length,
      evidenceReviewed: 0,
    },
    contentFetchAuthorized: false,
    evidenceReviewAuthorized: false,
    ingestionAuthorized: false,
  }
}
