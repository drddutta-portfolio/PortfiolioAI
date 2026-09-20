import {
  normalizeReviewedQualitativeComponent,
  type ReviewedQualitativeComponentState,
} from "./pharmaGateH2ComponentNormalizationCandidate"
import {
  evaluateDomesticOwnershipGovernance,
} from "./pharmaDomesticGateGFinal2NumericMethodology"

export const TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION =
  "TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_V1_CANDIDATE" as const

export const TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY = [
  {
    periodEnd: "2025-03-31",
    promoterHoldingPercent: 68.31,
    promoterPledgedOrEncumberedPercent: 0,
    source:
      "https://www.torrentpharma.com/assets/Shareholding_Pattern_Q4_c10a02d8fb.pdf",
  },
  {
    periodEnd: "2025-06-30",
    promoterHoldingPercent: 68.31,
    promoterPledgedOrEncumberedPercent: 0,
    source:
      "https://www.torrentpharma.com/assets/SHP_30_06_2025_12712cceaf.pdf",
  },
  {
    periodEnd: "2025-09-30",
    promoterHoldingPercent: 68.31,
    promoterPledgedOrEncumberedPercent: 0,
    source:
      "https://www.torrentpharma.com/docs/shp_30_09_2025_5d2437a988.pdf",
  },
  {
    periodEnd: "2026-03-31",
    promoterHoldingPercent: 68.31,
    promoterPledgedOrEncumberedPercent: 0,
    source:
      "https://www.torrentpharma.com/docs/shareholding_pattern_Q4_380cc57f61.pdf",
  },
] as const

export interface TorntpharmOwnershipGovernanceComponentReview {
  readonly component:
    | "OWNERSHIP_STABILITY"
    | "PLEDGE_CONTROL_RISK"
    | "NON_G4_GOVERNANCE_CONTEXT"
  readonly reviewedState: ReviewedQualitativeComponentState
  readonly normalizedScore: number | null
  readonly rationale: readonly string[]
  readonly sourceLineage: readonly string[]
  readonly contradictionState: "NONE_IDENTIFIED" | "UNRESOLVED"
}

function review(
  component: TorntpharmOwnershipGovernanceComponentReview["component"],
  reviewedState: ReviewedQualitativeComponentState,
  rationale: readonly string[],
  sourceLineage: readonly string[],
  contradictionState: TorntpharmOwnershipGovernanceComponentReview["contradictionState"],
): TorntpharmOwnershipGovernanceComponentReview {
  return {
    component,
    reviewedState,
    normalizedScore: normalizeReviewedQualitativeComponent(reviewedState),
    rationale,
    sourceLineage,
    contradictionState,
  }
}

export const TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS = [
  review(
    "OWNERSHIP_STABILITY",
    "STRONG",
    [
      "Four official comparable shareholding observations span March 2025 through March 2026.",
      "Promoter and promoter-group holding is unchanged at 68.31% across every reviewed official observation.",
      "The assessment is based on stability, not on treating a high promoter percentage as mechanically positive.",
    ],
    TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.map((row) => row.source),
    "NONE_IDENTIFIED",
  ),
  review(
    "PLEDGE_CONTROL_RISK",
    "STRONG",
    [
      "Every reviewed official shareholding observation reports zero promoter shares pledged or otherwise encumbered.",
      "The control structure is stable across the reviewed period.",
      "Zero pledge alone is not treated as VERY_STRONG; the candidate remains STRONG under the approved anti-mechanical-scoring rule.",
    ],
    TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.map((row) => row.source),
    "NONE_IDENTIFIED",
  ),
  review(
    "NON_G4_GOVERNANCE_CONTEXT",
    "NEUTRAL",
    [
      "Current issuer disclosures provide standard board, committee, whistle-blower, related-party and material-subsidiary governance frameworks.",
      "No separate non-G4 adverse event is introduced into this component from the reviewed package.",
      "G4-consumed governance or regulatory events are explicitly excluded from a second numeric penalty.",
      "The candidate remains NEUTRAL rather than positive because ordinary compliance architecture is not treated as exceptional governance strength.",
    ],
    [
      "https://www.torrentpharma.com/investors/share-holder/disclosures/",
      "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
    ],
    "NONE_IDENTIFIED",
  ),
] as const satisfies readonly TorntpharmOwnershipGovernanceComponentReview[]

const ownership =
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS.find(
    (row) => row.component === "OWNERSHIP_STABILITY",
  )!
const pledge =
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS.find(
    (row) => row.component === "PLEDGE_CONTROL_RISK",
  )!
const governance =
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS.find(
    (row) => row.component === "NON_G4_GOVERNANCE_CONTEXT",
  )!

if (
  ownership.normalizedScore === null
  || pledge.normalizedScore === null
  || governance.normalizedScore === null
) {
  throw new Error("Ownership / Governance candidate requires all three reviewed components")
}

export const TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_READ_ONLY_RESULT =
  evaluateDomesticOwnershipGovernance({
    ownershipStabilityScore: ownership.normalizedScore,
    pledgeControlRiskScore: pledge.normalizedScore,
    nonG4GovernanceContextScore: governance.normalizedScore,
  })

export const TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW = {
  version: TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION,
  state: "OWNER_REVIEW_CANDIDATE" as const,
  minimumComparableQuartersPresent:
    TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.length >= 4,
  preferredEightQuartersPresent:
    TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.length >= 8,
  latestCompletedQuarterPresent:
    TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY.at(-1)?.periodEnd === "2026-03-31",
  components: TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS,
  combinedScore:
    TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_READ_ONLY_RESULT.combinedScore,
  g4ConsumedEventsPenalizedAgain: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
