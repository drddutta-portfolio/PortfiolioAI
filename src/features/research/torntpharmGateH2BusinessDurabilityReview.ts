import {
  normalizeReviewedQualitativeComponent,
  type ReviewedQualitativeComponentState,
} from "./pharmaGateH2ComponentNormalizationCandidate"

export const TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION =
  "TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_V1_CANDIDATE" as const

export interface TorntpharmBusinessDurabilityComponentReview {
  readonly component:
    | "BRAND_THERAPY_LEADERSHIP"
    | "FIELD_FORCE_PRODUCTIVITY"
    | "RND_PRODUCTIVITY"
    | "PIPELINE_CORPORATE_EXECUTION"
  readonly reviewedState: ReviewedQualitativeComponentState
  readonly normalizedScore: number | null
  readonly rationale: readonly string[]
  readonly sourceLineage: readonly string[]
  readonly contradictionState: "NONE_IDENTIFIED" | "UNRESOLVED"
}

function review(
  component: TorntpharmBusinessDurabilityComponentReview["component"],
  reviewedState: ReviewedQualitativeComponentState,
  rationale: readonly string[],
  sourceLineage: readonly string[],
  contradictionState: TorntpharmBusinessDurabilityComponentReview["contradictionState"],
): TorntpharmBusinessDurabilityComponentReview {
  return {
    component,
    reviewedState,
    normalizedScore: normalizeReviewedQualitativeComponent(reviewedState),
    rationale,
    sourceLineage,
    contradictionState,
  }
}

export const TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS = [
  review(
    "BRAND_THERAPY_LEADERSHIP",
    "REVIEW_REQUIRED",
    [
      "Issuer evidence describes strong therapy positions and brand scale, but the approved acquisition contract requires licensed-market-source cross-checking.",
      "Issuer self-description alone is explicitly insufficient for this component.",
      "No licensed provider call has been authorized.",
    ],
    [
      "https://www.torrentpharma.com/business-area/india-business/",
      "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
    ],
    "UNRESOLVED",
  ),
  review(
    "FIELD_FORCE_PRODUCTIVITY",
    "STRONG",
    [
      "Issuer disclosures provide three directly stated India field-force observations with compatible annual India revenue: FY23 5,500 MRs / Rs 4,984 crore, FY24 about 5,700 / Rs 5,666 crore, and FY25 about 6,400 / Rs 6,393 crore.",
      "Derived monthly revenue productivity rises from approximately Rs 7.55 lakh per MR in FY23 to Rs 8.28 lakh in FY24 and Rs 8.32 lakh in FY25 despite field-force expansion.",
      "The assessment uses directly disclosed field-force counts only; total employee counts and inferred MR headcount remain prohibited.",
      "The candidate remains STRONG rather than VERY_STRONG because no approved external cross-company field-force-productivity benchmark is used.",
    ],
    [
      "https://www.torrentpharma.com/pdf/investors/Press_Release_Q4_FY23_results.pdf",
      "https://www.torrentpharma.com/pdf/investors/AR-2023-24.pdf",
      "https://www.torrentpharma.com/pdf/investors/Torrent_Pharma_Press_Release-Q4-FY24.pdf",
      "https://www.torrentpharma.com/pdf/investors/AR-2024-25.pdf",
      "https://www.torrentpharma.com/assets/Torrent_Pharma_Press_release_final_Q4_24_25_4201161339.pdf",
    ],
    "NONE_IDENTIFIED",
  ),
  review(
    "RND_PRODUCTIVITY",
    "STRONG",
    [
      "Three annual periods of R&D expense/intensity are already locked in the official manifest.",
      "FY2025-26 issuer evidence records material regulatory filings/approvals and differentiated-product development, including first Indian market authorisations for Brexpiprazole tablets and oral Semaglutide.",
      "The evidence supports productive output from sustained R&D investment, while the candidate stops below VERY_STRONG because no approved cross-company productivity benchmark is used.",
    ],
    [
      "TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE:RND_EXPENSE_ANNUAL",
      "TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE:RND_INTENSITY_PERCENT",
      "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
      "https://www.torrentpharma.com/r-and-d/centre/",
    ],
    "NONE_IDENTIFIED",
  ),
  review(
    "PIPELINE_CORPORATE_EXECUTION",
    "STRONG",
    [
      "FY2025-26 issuer evidence records multiple complex-product launches across the US, EU, Brazil and India plus continuing pipeline expansion.",
      "The annual report records the controlling-stake acquisition of JB Pharma and a broadened combined domestic franchise.",
      "The candidate remains STRONG rather than VERY_STRONG because long-term post-acquisition integration outcomes are not yet fully observable.",
    ],
    [
      "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
      "https://www.torrentpharma.com/investors/corp-governance/amalgamation/",
      "https://www.torrentpharma.com/investors/financial-info/quarterly-results/",
    ],
    "NONE_IDENTIFIED",
  ),
] as const satisfies readonly TorntpharmBusinessDurabilityComponentReview[]

const normalizedScores =
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.map(
    (component) => component.normalizedScore,
  )

export const TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW = {
  version: TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION,
  state: "OWNER_REVIEW_CANDIDATE" as const,
  components: TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS,
  readyComponentCount: normalizedScores.filter((score) => score !== null).length,
  requiredComponentCount: 4,
  allComponentsScoreReady: normalizedScores.every((score) => score !== null),
  combinedScore: null,
  blockerCodes: [
    "BRAND_THERAPY_LEADERSHIP_LICENSED_MARKET_CROSS_CHECK_REQUIRED",
  ] as const,
  providerCallAuthorized: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
