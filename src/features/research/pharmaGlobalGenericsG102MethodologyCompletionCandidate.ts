import { PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION } from "./pharmaSegmentGrowthCurveProposal"
import { PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_VERSION } from "./pharmaGlobalGenericsPipelineCombinedScoreContract"
import { PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE_VERSION } from "./pharmaGateH2ComponentNormalizationCandidate"
import { PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW_VERSION } from "./pharmaGlobalGenericsG6CoverageReview"

export const PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE_VERSION =
  "PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_V1_CANDIDATE" as const

export type GlobalGenericsMethodDecisionState =
  | "OWNER_APPROVED_BUILDING_BLOCK"
  | "OWNER_APPROVAL_REQUIRED"

export interface GlobalGenericsDimensionMethodDecision {
  readonly dimension:
    | "QUALITY"
    | "GROWTH"
    | "CAPITAL_EFFICIENCY"
    | "CASH_FLOW"
    | "BALANCE_SHEET_CREDIT"
    | "BUSINESS_DURABILITY"
    | "VALUATION"
    | "MOMENTUM"
    | "OWNERSHIP_GOVERNANCE"
    | "RISK"
  readonly decisionState: GlobalGenericsMethodDecisionState
  readonly proposedMethod: string
  readonly evidenceBoundary: string
}

export const PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE = {
  version: PHARMA_GLOBAL_GENERICS_G10_2_METHOD_COMPLETION_CANDIDATE_VERSION,
  stage: "G10.2" as const,
  checkpoint: "B" as const,
  state: "OWNER_APPROVAL_REQUIRED" as const,
  referenceSymbol: "AUROPHARMA" as const,
  supportedPrimarySubprofile: "GLOBAL_GENERICS" as const,
  upstreamCoverageVersion: PHARMA_GLOBAL_GENERICS_G6_COVERAGE_REVIEW_VERSION,
  scoreState: "SCORE_NOT_COMPUTABLE" as const,
  scoreBlocker: "GLOBAL_GENERICS_METHOD_COMPLETION_NOT_OWNER_APPROVED" as const,
  commonTenDimensionSpinePreserved: true,
  gateIRecommendationPolicyUnchanged: true,
  noPartialScoreReconstruction: true,
  noHiddenRenormalization: true,
  noDomesticBandsReuse: true,
  noApiBandsReuse: true,
  noBankNbfcBandsReuse: true,
  emergingApiNumericParticipation: false,
  unresolvedBiosimilarsNumericParticipation: false,
  approvedBuildingBlocks: [
    {
      code: "SEGMENT_GROWTH",
      version: PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
      note: "Owner-approved Export / US growth curve remains reusable for the Global Generics primary.",
    },
    {
      code: "PIPELINE_COMBINED_SCORE",
      version: PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_VERSION,
      note: "Owner-approved latest-state-per-pipeline-identity median combiner remains available for Business Durability.",
    },
    {
      code: "QUALITATIVE_COMPONENT_NORMALIZATION",
      version: PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE_VERSION,
      note: "Owner-approved VERY_STRONG / STRONG / NEUTRAL / WEAK / VERY_WEAK normalization may be used only for reviewed qualitative components with source lineage.",
    },
  ] as const,
  proposedResolutionPolicy: {
    name: "REVIEWED_REFERENCE_RELATIVE_MEDIAN_V1" as const,
    rationale: [
      "Resolve deferred Global Generics families without fabricating absolute numeric bands.",
      "Use reviewed same-primary peer-relative percentiles when an economic metric needs cross-company calibration.",
      "Use self-history only as explicit corroboration where the parent contract already requires it.",
      "Aggregate required component scores by median to avoid hidden component weights.",
      "Any missing mandatory component blocks the dimension rather than triggering renormalization.",
      "Regulatory G4 state remains a gate/context and receives no second hidden numeric penalty.",
      "NIFTY Pharma remains the Pharma benchmark for market-relative evidence; no BANK/NBFC benchmark is inherited.",
    ] as const,
    samePrimaryPeerCohortRequired: true,
    sufficientComparableHistoryRequired: true,
    componentAggregation: "MEDIAN_NO_HIDDEN_WEIGHTS" as const,
    missingMandatoryComponentTreatment: "FAIL_CLOSED" as const,
    benchmarkCandidate: "NIFTY_PHARMA" as const,
    benchmarkRequiresOwnerConfirmationForG10_2: true,
    methodologyExecutableBeforeOwnerApproval: false,
  },
  dimensionDecisions: [
    {
      dimension: "QUALITY",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Operating-margin level, inverse-stability and trend scored by reviewed Global-Generics peer percentiles; median component aggregation.",
      evidenceBoundary: "Eight comparable quarters minimum; no Domestic operating-margin bands.",
    },
    {
      dimension: "GROWTH",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Owner-approved Export/US segment-growth score plus reviewed price-erosion evidence; median of required Growth components.",
      evidenceBoundary: "Price erosion must use disclosed price/ASP evidence only; no residual revenue-volume derivation.",
    },
    {
      dimension: "CAPITAL_EFFICIENCY",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "ROCE level, inverse-stability and trend scored by reviewed same-primary peer percentiles; median component aggregation.",
      evidenceBoundary: "Three comparable annual periods minimum with consistent calculation semantics.",
    },
    {
      dimension: "CASH_FLOW",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "CFO/PAT, FCF/PAT and consistency/trend scored by reviewed same-primary peer percentiles; median component aggregation.",
      evidenceBoundary: "Three matched annual CFO, PAT and capex/FCF periods; CFO alone is insufficient.",
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Inverse net-debt leverage, interest coverage and trend/resilience scored by reviewed same-primary peer percentiles; median component aggregation.",
      evidenceBoundary: "Three matched annual debt, cash and operating-earnings periods with reviewed cash semantics.",
    },
    {
      dimension: "BUSINESS_DURABILITY",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Owner-approved pipeline combined score plus reviewed R&D productivity and complex/specialty-generics execution components; median component aggregation.",
      evidenceBoundary: "Qualitative components require official/approved evidence, rationale, source lineage and no unresolved material contradiction.",
    },
    {
      dimension: "VALUATION",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Median of same-primary peer-relative valuation, company self-history context and FCF-yield corroboration.",
      evidenceBoundary: "Current authoritative market price plus reviewed earnings/cash inputs; all three components required, no missing-component renormalization.",
    },
    {
      dimension: "MOMENTUM",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Median of 12M absolute, 6M absolute and NIFTY-Pharma-relative momentum percentile scores.",
      evidenceBoundary: "Current market history plus approved Pharma benchmark evidence; no NIFTY Bank or BANK/NBFC weights.",
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "Median of reviewed ownership stability, pledge/control risk and non-G4 governance-context component scores.",
      evidenceBoundary: "Four comparable shareholding quarters minimum; G4-consumed events cannot be penalized again.",
    },
    {
      dimension: "RISK",
      decisionState: "OWNER_APPROVAL_REQUIRED",
      proposedMethod: "G4 regulatory state remains non-duplicative gate/context; numeric market risk uses inverse same-primary percentile drawdown and volatility with NIFTY Pharma corroboration.",
      evidenceBoundary: "Official current regulatory evidence plus trailing-1Y drawdown/volatility; no second regulatory penalty.",
    },
  ] as const satisfies readonly GlobalGenericsDimensionMethodDecision[],
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationExecutionEnabled: false,
  recommendationPersistenceEnabled: false,
  positionSizingEnabled: false,
  aiInterpretationEnabled: false,
} as const
