export type ContentReviewCandidateState = "PROPOSED_CANDIDATE" | "REJECTED_CLAIM"

export interface TorntpharmReviewedArtifact {
  readonly code: string
  readonly title: string
  readonly period: string
  readonly locator: string
  readonly reviewState: "READ_ONLY_REVIEWED"
}

export interface TorntpharmProposedEvidenceCandidate {
  readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH" | "PHARMA_REGULATORY_SITE_STATUS"
  readonly artifactCode: string
  readonly observationDate: string
  readonly value: string
  readonly unit: "PERCENT" | "EVENT_STATE"
  readonly basis: string
  readonly provenanceSummary: string
  readonly state: "PROPOSED_CANDIDATE"
}

export interface TorntpharmRejectedClaim {
  readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH"
  readonly artifactCode: string
  readonly claim: string
  readonly reason: string
  readonly state: "REJECTED_CLAIM"
}

export interface TorntpharmReadOnlyContentReviewDryRun {
  readonly contractVersion: "TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1"
  readonly reviewedArtifacts: readonly TorntpharmReviewedArtifact[]
  readonly proposedCandidates: readonly TorntpharmProposedEvidenceCandidate[]
  readonly rejectedClaims: readonly TorntpharmRejectedClaim[]
  readonly requirementResults: readonly {
    readonly metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH" | "PHARMA_REGULATORY_SITE_STATUS"
    readonly proposedObservationCount: number
    readonly minimumRequired: number
    readonly proposedMinimumGap: number
    readonly proposalState: "MINIMUM_CANDIDATE_HISTORY_PRESENT" | "PARTIAL_SCOPE_REVIEW"
    readonly remainingGap: string
  }[]
  readonly summary: {
    readonly reviewedArtifacts: number
    readonly proposedCandidates: number
    readonly rejectedClaims: number
    readonly requirementsPiloted: number
    readonly ingestionWrites: 0
  }
  readonly ingestionAuthorized: false
}

export const TORNTPHARM_READ_ONLY_REVIEWED_ARTIFACTS = Object.freeze([
  {
    code: "TORRENT_Q1_FY26_RELEASE",
    title: "Torrent Pharma Q1 FY26 Results Release",
    period: "Q1 FY2025-26",
    locator: "https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf",
    reviewState: "READ_ONLY_REVIEWED",
  },
  {
    code: "TORRENT_Q2_FY26_RELEASE",
    title: "Torrent Pharma Q2 FY26 Results Release",
    period: "Q2 FY2025-26",
    locator: "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf",
    reviewState: "READ_ONLY_REVIEWED",
  },
  {
    code: "TORRENT_Q3_FY26_RELEASE",
    title: "Torrent Pharma Q3 FY26 Results Release",
    period: "Q3 FY2025-26",
    locator: "https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf",
    reviewState: "READ_ONLY_REVIEWED",
  },
  {
    code: "TORRENT_Q4_FY26_RELEASE",
    title: "Torrent Pharma Q4 FY26 Results Release",
    period: "Q4 FY2025-26",
    locator: "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf",
    reviewState: "READ_ONLY_REVIEWED",
  },
  {
    code: "FDA_INDRA_WARNING_2019",
    title: "FDA Warning Letter — Indrad facility",
    period: "2019-10-08",
    locator: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-10082019",
    reviewState: "READ_ONLY_REVIEWED",
  },
  {
    code: "FDA_INDRA_CLOSEOUT_2024",
    title: "FDA Closeout Letter — Indrad facility",
    period: "2024-09-04",
    locator: "https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/torrent-pharmaceuticals-limited-585255-09042024",
    reviewState: "READ_ONLY_REVIEWED",
  },
] as const satisfies readonly TorntpharmReviewedArtifact[])

export const TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES = Object.freeze([
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    artifactCode: "TORRENT_Q1_FY26_RELEASE",
    observationDate: "2025-06-30",
    value: "19",
    unit: "PERCENT",
    basis: "US business revenue YoY growth — reported Torrent business",
    provenanceSummary: "Issuer Q1 FY26 release states US business revenues of Rs 308 crore, up 19% YoY.",
    state: "PROPOSED_CANDIDATE",
  },
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    artifactCode: "TORRENT_Q2_FY26_RELEASE",
    observationDate: "2025-09-30",
    value: "26",
    unit: "PERCENT",
    basis: "US business revenue YoY growth — reported Torrent business",
    provenanceSummary: "Issuer Q2 FY26 release states US business revenues of Rs 337 crore, up 26% YoY.",
    state: "PROPOSED_CANDIDATE",
  },
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    artifactCode: "TORRENT_Q3_FY26_RELEASE",
    observationDate: "2025-12-31",
    value: "19",
    unit: "PERCENT",
    basis: "US business revenue YoY growth — reported Torrent business",
    provenanceSummary: "Issuer Q3 FY26 release states US business revenues of Rs 321 crore, up 19% YoY.",
    state: "PROPOSED_CANDIDATE",
  },
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    artifactCode: "TORRENT_Q4_FY26_RELEASE",
    observationDate: "2026-03-31",
    value: "16",
    unit: "PERCENT",
    basis: "US base-business revenue YoY growth — excludes JB acquisition effect",
    provenanceSummary: "Issuer Q4 FY26 release separately states US base-business revenue grew 16% YoY; this is used instead of the 31% reported figure to preserve pre-acquisition scope compatibility.",
    state: "PROPOSED_CANDIDATE",
  },
  {
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    artifactCode: "FDA_INDRA_WARNING_2019",
    observationDate: "2019-10-08",
    value: "WARNING_LETTER_ACTIVE",
    unit: "EVENT_STATE",
    basis: "FDA Indrad warning-letter event",
    provenanceSummary: "FDA warning letter records significant CGMP violations at the Indrad finished-dosage facility following the April 2019 inspection.",
    state: "PROPOSED_CANDIDATE",
  },
  {
    metricCode: "PHARMA_REGULATORY_SITE_STATUS",
    artifactCode: "FDA_INDRA_CLOSEOUT_2024",
    observationDate: "2024-09-04",
    value: "WARNING_LETTER_CLOSED_OUT",
    unit: "EVENT_STATE",
    basis: "FDA closeout of 2019 Indrad warning-letter chain",
    provenanceSummary: "FDA closeout letter states that, based on its evaluation, the firm appears to have addressed the violations in Warning Letter 320-20-03; future inspections will assess sustainability.",
    state: "PROPOSED_CANDIDATE",
  },
] as const satisfies readonly TorntpharmProposedEvidenceCandidate[])

export const TORNTPHARM_REJECTED_CONTENT_CLAIMS = Object.freeze([
  {
    metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
    artifactCode: "TORRENT_Q4_FY26_RELEASE",
    claim: "Q4 FY26 reported US business revenue growth = 31%",
    reason: "Rejected for the four-quarter comparable series because Q4 FY26 consolidated results include JB Pharma from 21 January 2026. The same release provides a 16% US base-business growth figure, which better preserves scope compatibility with Q1-Q3 FY26.",
    state: "REJECTED_CLAIM",
  },
] as const satisfies readonly TorntpharmRejectedClaim[])

export function buildTorntpharmReadOnlyContentReviewDryRun(): TorntpharmReadOnlyContentReviewDryRun {
  const usGrowth = TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.filter((item) => item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH")
  const regulatory = TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.filter((item) => item.metricCode === "PHARMA_REGULATORY_SITE_STATUS")
  return {
    contractVersion: "TORNTPHARM_READ_ONLY_CONTENT_REVIEW_V1",
    reviewedArtifacts: TORNTPHARM_READ_ONLY_REVIEWED_ARTIFACTS,
    proposedCandidates: TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES,
    rejectedClaims: TORNTPHARM_REJECTED_CONTENT_CLAIMS,
    requirementResults: [
      {
        metricCode: "PHARMA_EXPORT_US_REVENUE_GROWTH",
        proposedObservationCount: usGrowth.length,
        minimumRequired: 4,
        proposedMinimumGap: Math.max(0, 4 - usGrowth.length),
        proposalState: "MINIMUM_CANDIDATE_HISTORY_PRESENT",
        remainingGap: "Candidate minimum history is present, but observations remain proposals only; no ingestion or canonical evidence promotion has occurred.",
      },
      {
        metricCode: "PHARMA_REGULATORY_SITE_STATUS",
        proposedObservationCount: regulatory.length,
        minimumRequired: 1,
        proposedMinimumGap: 0,
        proposalState: "PARTIAL_SCOPE_REVIEW",
        remainingGap: "The Indrad warning-to-closeout chain is reviewed, but other material US-facing manufacturing sites and any later regulator actions remain outside this pilot; no company-wide current regulatory status is asserted.",
      },
    ],
    summary: {
      reviewedArtifacts: TORNTPHARM_READ_ONLY_REVIEWED_ARTIFACTS.length,
      proposedCandidates: TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.length,
      rejectedClaims: TORNTPHARM_REJECTED_CONTENT_CLAIMS.length,
      requirementsPiloted: 2,
      ingestionWrites: 0,
    },
    ingestionAuthorized: false,
  }
}
