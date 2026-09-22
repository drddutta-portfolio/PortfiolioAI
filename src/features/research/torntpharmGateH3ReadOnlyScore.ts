import {
  calculatePharmaG7ReadOnlyPreview,
  PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
  type PharmaG7DimensionAdapterInput,
  type PharmaG7DimensionCode,
} from "./pharmaG7ReadOnlyScoringAdapter"
import {
  evaluatePharmaG7GovernanceConstraint,
  PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
} from "./pharmaG7GovernanceHighRiskConstraint"
import {
  PHARMA_V1_DIMENSION_WEIGHTS,
} from "./pharmaGateGScoringMethodProposal"
import {
  PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
} from "./pharmaOperatingMarginCurveProposal"
import {
  PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
} from "./pharmaSegmentGrowthCurveProposal"
import {
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  combineDomesticValuationMaTransitionScores,
  PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION,
} from "./pharmaDomesticValuationMaTransitionContract"
import {
  getPharmaOverlayEligibleDimensions,
  PHARMA_OVERLAY_MODIFIER_CONTRACT,
} from "./pharmaOverlayModifierContract"
import type {
  PharmaGovernanceRegulatoryGateInput,
} from "./pharmaGovernanceRegulatoryGateContract"
import {
  TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS,
  TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_VERSION,
} from "./torntpharmGateH2InitialScoreInputs"
import {
  TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK,
  TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
} from "./torntpharmGateH2OfficialEvidencePack"
import {
  TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION,
} from "./torntpharmGateH2DerivedStatisticsCandidate"
import {
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW,
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION,
} from "./torntpharmGateH2BusinessDurabilityReview"
import {
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW,
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION,
} from "./torntpharmGateH2OwnershipGovernanceReview"
import {
  TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
} from "./torntpharmGateH2LocalMarketEvidence"
import {
  TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET_VERSION,
} from "./torntpharmGateH2DomesticPeerSet"
import {
  TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT,
  TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK,
  TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION,
} from "./torntpharmGateH2RemainingEvidenceLock"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING,
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT,
} from "./torntpharmGateGFinal3RuntimeMapping"

export const TORNTPHARM_GATE_H3_READ_ONLY_SCORE_VERSION =
  "TORNTPHARM_GATE_H3_READ_ONLY_SCORE_V1" as const

export const TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_VERSION =
  "TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_V1" as const

export const TORNTPHARM_GATE_H3_LOCKED_DIMENSION_SCORES = {
  QUALITY: 92,
  GROWTH: 78.25,
  CAPITAL_EFFICIENCY: 79,
  CASH_FLOW: 93.6,
  BALANCE_SHEET_CREDIT: 65,
  BUSINESS_DURABILITY: 75,
  VALUATION: 30,
  MOMENTUM: 95,
  OWNERSHIP_GOVERNANCE: 70,
  RISK: 80,
} as const satisfies Readonly<Record<PharmaG7DimensionCode, number>>

export const TORNTPHARM_GATE_H3_GLOBAL_GENERICS_OVERLAY_DIMENSIONS =
  getPharmaOverlayEligibleDimensions("GLOBAL_GENERICS")

export type TorntpharmGateH3OverlayTreatment =
  | "NOT_APPLICABLE"
  | "BELOW_SCORING_MATERIALITY"

export interface TorntpharmGateH3DimensionInput {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly weight: number
  readonly primaryScore: number
  readonly primaryScoreContractVersion: string
  readonly readinessCoverage: number
  readonly evidenceLineage: readonly string[]
  readonly derivedStatisticLineage: readonly string[]
  readonly reviewNotes: readonly string[]
}

export interface TorntpharmGateH3ScoreInputPackage {
  readonly version: typeof TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_VERSION
  readonly securitySymbol: "TORNTPHARM"
  readonly profileCode: "PHARMA_V1"
  readonly primarySubprofile: "DOMESTIC_FORMULATIONS"
  readonly benchmarkCode: "NIFTY_PHARMA"
  readonly h2ClosureDocument: "docs/PortfolioAI_GATE_H_H2_CLOSURE.md"
  readonly dimensions: readonly TorntpharmGateH3DimensionInput[]
  readonly globalGenericsOverlay: {
    readonly code: "GLOBAL_GENERICS"
    readonly reviewedBusinessMaterialityState: "MATERIAL"
    readonly evidenceConfidence: "MEDIUM"
    readonly economicMaterialityPercent: number
    readonly minimumNumericMaterialityPercent: number
    readonly eligibilityState: string
  }
  readonly emergingWatch: {
    readonly code: "CDMO_CRAMS"
    readonly state: "EMERGING_WATCH"
    readonly numericParticipation: false
  }
  readonly governanceInput: PharmaGovernanceRegulatoryGateInput
  readonly readOnly: true
  readonly nonPersisting: true
}

export interface TorntpharmGateH3DimensionResult {
  readonly dimensionCode: PharmaG7DimensionCode
  readonly primaryScore: number
  readonly weight: number
  readonly weightedContribution: number | null
  readonly readinessCoverage: number
  readonly readinessState: string
  readonly overlayEligibility: boolean
  readonly overlayTreatment: TorntpharmGateH3OverlayTreatment
  readonly overlayModifierPoints: number | null
  readonly finalScore: number | null
  readonly primaryScoreContractVersion: string
  readonly evidenceLineage: readonly string[]
  readonly derivedStatisticLineage: readonly string[]
  readonly reasonCodes: readonly string[]
  readonly reviewNotes: readonly string[]
  readonly methodologyLineage: readonly {
    readonly decisionId: string
    readonly contractVersion: string
  }[]
}

function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000
}

function fixedWeight(dimensionCode: PharmaG7DimensionCode): number {
  const row = PHARMA_V1_DIMENSION_WEIGHTS.find(
    (item) => item.dimensionCode === dimensionCode,
  )
  if (!row) throw new Error("Missing fixed PHARMA_V1 weight for " + dimensionCode)
  return row.weight
}

function assertScore(value: number | null, expected: number, label: string) {
  if (value === null || !Number.isFinite(value) || Math.abs(value - expected) > 1e-9) {
    throw new Error(
      "H3 structural blocker: H2 locked score drift for "
      + label
      + "; expected "
      + expected
      + ", observed "
      + String(value),
    )
  }
}

const valuationTransitionResult = combineDomesticValuationMaTransitionScores({
  symbol: "TORNTPHARM",
  selfHistoryScore: 40,
  peerRelativeScore: 20,
  transitionState: "M_AND_A_SCOPE_MISMATCH",
})

const observedH2Scores: Readonly<Record<PharmaG7DimensionCode, number | null>> = {
  QUALITY: TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.quality.score,
  GROWTH: TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK.domesticGrowth.score,
  CAPITAL_EFFICIENCY:
    TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.capitalEfficiency.score,
  CASH_FLOW: TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.cashFlow.score,
  BALANCE_SHEET_CREDIT:
    TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.balanceSheetCredit.score,
  BUSINESS_DURABILITY:
    TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW.combinedScore,
  VALUATION: valuationTransitionResult.combinedScore,
  MOMENTUM: TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.momentum.score,
  OWNERSHIP_GOVERNANCE:
    TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW.combinedScore,
  RISK: TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS.risk.score,
}

for (const [dimensionCode, expected] of Object.entries(
  TORNTPHARM_GATE_H3_LOCKED_DIMENSION_SCORES,
) as readonly [PharmaG7DimensionCode, number][]) {
  assertScore(observedH2Scores[dimensionCode], expected, dimensionCode)
}

function dimensionInput(
  dimensionCode: PharmaG7DimensionCode,
  primaryScoreContractVersion: string,
  evidenceLineage: readonly string[],
  derivedStatisticLineage: readonly string[],
  reviewNotes: readonly string[],
): TorntpharmGateH3DimensionInput {
  return {
    dimensionCode,
    weight: fixedWeight(dimensionCode),
    primaryScore: TORNTPHARM_GATE_H3_LOCKED_DIMENSION_SCORES[dimensionCode],
    primaryScoreContractVersion,
    readinessCoverage: 1,
    evidenceLineage,
    derivedStatisticLineage,
    reviewNotes,
  }
}

export const TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE: TorntpharmGateH3ScoreInputPackage = {
  version: TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_VERSION,
  securitySymbol: "TORNTPHARM",
  profileCode: "PHARMA_V1",
  primarySubprofile: "DOMESTIC_FORMULATIONS",
  benchmarkCode: "NIFTY_PHARMA",
  h2ClosureDocument: "docs/PortfolioAI_GATE_H_H2_CLOSURE.md",
  dimensions: [
    dimensionInput(
      "QUALITY",
      PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL_VERSION,
      [
        TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
        "docs/PortfolioAI_GATE_H_H2_CLOSURE.md:QUALITY=92",
      ],
      [TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION],
      ["Eight comparable official quarters; Type-7 IQR and four-versus-prior-four trend locked in H2."],
    ),
    dimensionInput(
      "GROWTH",
      PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL_VERSION,
      [
        TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
        "docs/PortfolioAI_GATE_H_H2_CLOSURE.md:GROWTH=78.25",
      ],
      [TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION + ":DOMESTIC_GROWTH_STATISTICS"],
      ["Primary Domestic Formulations growth uses four comparable quarters; Q4 FY26 uses issuer base-business growth excluding the JB acquisition effect."],
    ),
    dimensionInput(
      "CAPITAL_EFFICIENCY",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_VERSION,
        "TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE:ROCE_MANAGEMENT_ANNUAL",
      ],
      [TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION],
      ["Three-year ROCE level, Type-7 stability and trend derivation are H2 locked."],
    ),
    dimensionInput(
      "CASH_FLOW",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
        "docs/PortfolioAI_GATE_H_H2_CLOSURE.md:CASH_FLOW=93.6",
      ],
      [TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION + ":CASH_FLOW_STATISTICS"],
      ["Three matched annual CFO/PAT/FCF periods are locked; no missing-year substitution is used."],
    ),
    dimensionInput(
      "BALANCE_SHEET_CREDIT",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_VERSION,
        "TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE:NET_DEBT_EBITDA_ANNUAL+INTEREST_COVERAGE_ANNUAL",
      ],
      [TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION],
      ["Three-year leverage, coverage and leverage-trend statistics are H2 locked."],
    ),
    dimensionInput(
      "BUSINESS_DURABILITY",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION,
        "docs/PortfolioAI_GATE_H_H2_BUSINESS_DURABILITY_REVIEW.md",
      ],
      [TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION + ":35/25/20/20_COMPONENT_AGGREGATION"],
      ["All four reviewed components are STRONG / 75; Brand / Therapy Leadership uses the owner-approved independent AIOCD-derived cross-check."],
    ),
    dimensionInput(
      "VALUATION",
      PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION,
      [
        "docs/PortfolioAI_GATE_H_H2_MA_TRANSITION_VALUATION_V1.md",
        TORNTPHARM_GATE_H2_DOMESTIC_PEER_SET_VERSION,
      ],
      [PHARMA_DOMESTIC_VALUATION_MA_TRANSITION_VERSION + ":SELF_HISTORY_40+PEER_RELATIVE_20"],
      ["Current M&A transition uses explicit 50% self-history / 50% peer-relative / 0% FCF; the base G6.17 40/40/20 contract is not overwritten."],
    ),
    dimensionInput(
      "MOMENTUM",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
        "LOCAL_SUPABASE:ANGEL_ONE_TORNTPHARM+NIFTY_PHARMA_HISTORY",
      ],
      [TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION + ":12M+6M+NIFTY_PHARMA_RELATIVE_STRENGTH"],
      ["Benchmark is NIFTY Pharma; sector-relative momentum uses only the approved Pharma benchmark contract."],
    ),
    dimensionInput(
      "OWNERSHIP_GOVERNANCE",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION,
        "docs/PortfolioAI_GATE_H_H2_OWNERSHIP_GOVERNANCE_REVIEW.md",
      ],
      [TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION + ":45/35/20_COMPONENT_AGGREGATION"],
      ["Four official ownership quarters are locked; G4-consumed events are not penalized again."],
    ),
    dimensionInput(
      "RISK",
      PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
      [
        TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
        TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
      ],
      [TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION + ":MAX_DRAWDOWN+RELATIVE_VOLATILITY"],
      ["Regulatory context is supplied by the resolved governance runtime; market-risk benchmark is NIFTY Pharma and receives no second regulatory penalty."],
    ),
  ],
  globalGenericsOverlay: {
    code: "GLOBAL_GENERICS",
    reviewedBusinessMaterialityState:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .reviewedAssignmentState,
    evidenceConfidence:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .reviewedConfidence,
    economicMaterialityPercent:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .evidenceBasisEconomicMaterialityPercent,
    minimumNumericMaterialityPercent:
      PHARMA_OVERLAY_MODIFIER_CONTRACT.materialOverlayMinimumPercent,
    eligibilityState:
      TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK.modifierState,
  },
  emergingWatch: {
    code: "CDMO_CRAMS",
    state: "EMERGING_WATCH",
    numericParticipation: false,
  },
  governanceInput: TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.runtimeInput,
  readOnly: true,
  nonPersisting: true,
}

function assertOverlayLock(input: TorntpharmGateH3ScoreInputPackage) {
  const overlay = input.globalGenericsOverlay
  if (
    overlay.eligibilityState !== "BELOW_SCORING_MATERIALITY"
    || overlay.economicMaterialityPercent >= overlay.minimumNumericMaterialityPercent
  ) {
    throw new Error(
      "H3 structural blocker: the locked Global Generics overlay is no longer explicitly below numeric scoring materiality",
    )
  }
}

function assertFixedDimensionWeight(input: TorntpharmGateH3DimensionInput) {
  const expected = fixedWeight(input.dimensionCode)
  if (input.weight !== expected) {
    throw new Error(
      "H3 fixed-weight violation for "
      + input.dimensionCode
      + ": expected "
      + expected
      + ", received "
      + input.weight,
    )
  }
}

function adapterDimension(
  input: TorntpharmGateH3DimensionInput,
): PharmaG7DimensionAdapterInput {
  assertFixedDimensionWeight(input)
  const overlayTouched =
    TORNTPHARM_GATE_H3_GLOBAL_GENERICS_OVERLAY_DIMENSIONS.includes(
      input.dimensionCode,
    )

  return {
    dimensionCode: input.dimensionCode,
    methodologyState: "APPROVED_NUMERIC_CONTRACT",
    readiness: {
      applicable: true,
      profileResolved: true,
      scoreReadyCoverage: input.readinessCoverage,
      mandatoryBlockingConditionsSatisfied: true,
      reviewBlocked: false,
      overlayReadiness: "NONE",
    },
    primaryScore: input.primaryScore,
    primaryScoreContractVersion: input.primaryScoreContractVersion,
    overlayParticipation:
      overlayTouched ? "BELOW_SCORING_MATERIALITY" : "NONE",
    overlayModifierPoints: null,
    overlayModifierContractVersion:
      overlayTouched ? PHARMA_OVERLAY_MODIFIER_CONTRACT.version : null,
    methodologyLineage: [
      {
        decisionId: "H2_LOCKED_DIMENSION_INPUT",
        contractVersion: input.primaryScoreContractVersion,
      },
      {
        decisionId: "H3_SCORE_INPUT_PACKAGE",
        contractVersion: TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_VERSION,
      },
    ],
  }
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)]
}

export function calculateTorntpharmGateH3ReadOnlyScore(
  input: TorntpharmGateH3ScoreInputPackage = TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE,
) {
  assertOverlayLock(input)

  const governance = evaluatePharmaG7GovernanceConstraint(input.governanceInput)
  const adapterResult = calculatePharmaG7ReadOnlyPreview({
    profileResolved: true,
    commonCoreState: "READY",
    primaryState: "READY",
    overallScoreReadyCoverage: Math.min(1, input.dimensions.length / 10),
    governanceInput: input.governanceInput,
    dimensions: input.dimensions.map(adapterDimension),
  })
  const adapterByDimension = new Map(
    adapterResult.dimensions.map((dimension) => [
      dimension.dimensionCode,
      dimension,
    ] as const),
  )

  const dimensions: readonly TorntpharmGateH3DimensionResult[] =
    input.dimensions.map((dimension) => {
      const adapterDimensionResult = adapterByDimension.get(
        dimension.dimensionCode,
      )
      if (!adapterDimensionResult) {
        throw new Error(
          "H3 adapter result missing dimension " + dimension.dimensionCode,
        )
      }
      const overlayEligibility =
        TORNTPHARM_GATE_H3_GLOBAL_GENERICS_OVERLAY_DIMENSIONS.includes(
          dimension.dimensionCode,
        )
      const finalScore = adapterDimensionResult.finalScore
      return {
        dimensionCode: dimension.dimensionCode,
        primaryScore: dimension.primaryScore,
        weight: fixedWeight(dimension.dimensionCode),
        weightedContribution:
          finalScore === null
            ? null
            : round4(finalScore * (fixedWeight(dimension.dimensionCode) / 100)),
        readinessCoverage: dimension.readinessCoverage,
        readinessState: adapterDimensionResult.readinessState,
        overlayEligibility,
        overlayTreatment:
          overlayEligibility
            ? "BELOW_SCORING_MATERIALITY"
            : "NOT_APPLICABLE",
        overlayModifierPoints:
          adapterDimensionResult.overlayModifierPoints,
        finalScore,
        primaryScoreContractVersion:
          dimension.primaryScoreContractVersion,
        evidenceLineage: dimension.evidenceLineage,
        derivedStatisticLineage: dimension.derivedStatisticLineage,
        reasonCodes: [
          ...adapterDimensionResult.reasonCodes,
          "H2_LOCKED_DIMENSION_INPUT_CONSUMED",
        ],
        reviewNotes: dimension.reviewNotes,
        methodologyLineage: adapterDimensionResult.methodologyLineage,
      }
    })

  return {
    contractVersion: TORNTPHARM_GATE_H3_READ_ONLY_SCORE_VERSION,
    state:
      adapterResult.overallScore === null
        ? "FAIL_CLOSED"
        : "READY_READ_ONLY_PREVIEW",
    securitySymbol: input.securitySymbol,
    profileCode: input.profileCode,
    primarySubprofile: input.primarySubprofile,
    benchmarkCode: input.benchmarkCode,
    inputPackageVersion: input.version,
    adapterVersion: PHARMA_G7_READ_ONLY_SCORING_ADAPTER_VERSION,
    dimensions,
    overallScore: adapterResult.overallScore,
    globalGenericsOverlay: {
      code: input.globalGenericsOverlay.code,
      reviewedBusinessMaterialityState:
        input.globalGenericsOverlay.reviewedBusinessMaterialityState,
      economicMaterialityPercent:
        input.globalGenericsOverlay.economicMaterialityPercent,
      minimumNumericMaterialityPercent:
        input.globalGenericsOverlay.minimumNumericMaterialityPercent,
      numericTreatment: "BELOW_SCORING_MATERIALITY" as const,
      numericModifierApplied: false,
      secondIndependentStockScore: null,
      reasonCodes: [
        "MATERIAL_BUSINESS_EXPOSURE_RETAINED",
        "ECONOMIC_MATERIALITY_BELOW_15_PERCENT_NUMERIC_OVERLAY_THRESHOLD",
        "NO_GLOBAL_GENERICS_SECOND_STOCK_SCORE",
      ] as const,
      sourceContractVersion: PHARMA_OVERLAY_MODIFIER_CONTRACT.version,
      h2LockVersion: TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION,
    },
    emergingWatch: {
      code: input.emergingWatch.code,
      state: input.emergingWatch.state,
      numericParticipation: false,
      independentScore: null,
      reasonCodes: [
        "CDMO_CRAMS_EMERGING_WATCH_NUMERICALLY_EXCLUDED",
        "NO_EMERGING_WATCH_DENOMINATOR_EFFECT",
      ] as const,
    },
    governance: {
      contractVersion: PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT_VERSION,
      runtimeMappingVersion:
        TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
      constraintState: governance.constraintState,
      blocksOverallPreview: governance.blocksOverallPreview,
      numericPenalty: governance.numericPenalty,
      overallScoreCap: governance.overallScoreCap,
      historicalEventRetained:
        TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.historicalEventRetained,
      reasonCodes: governance.reasonCodes,
    },
    reasonCodes: adapterResult.reasonCodes,
    methodologyLineage: [
      ...adapterResult.methodologyLineage,
      {
        decisionId: "H3",
        contractVersion: TORNTPHARM_GATE_H3_READ_ONLY_SCORE_VERSION,
      },
    ],
    evidenceLineage: unique([
      input.h2ClosureDocument,
      ...dimensions.flatMap((dimension) => dimension.evidenceLineage),
      TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION,
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
    ]),
    readOnly: true as const,
    nonPersisting: true as const,
    scoreExecutionEnabled: false as const,
    persistedScoreRunEnabled: false as const,
    recommendationEnabled: false as const,
    positionSizingEnabled: false as const,
  }
}

export const TORNTPHARM_GATE_H3_READ_ONLY_RESULT =
  calculateTorntpharmGateH3ReadOnlyScore()
