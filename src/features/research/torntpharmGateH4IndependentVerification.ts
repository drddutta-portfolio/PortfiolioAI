import { PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL } from "./pharmaOperatingMarginCurveProposal"
import { PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL } from "./pharmaSegmentGrowthCurveProposal"
import { PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY } from "./pharmaDomesticGateGFinal2NumericMethodology"
import { PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE } from "./pharmaDomesticValuationSelfHistoryCurveProposal"
import { PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT } from "./pharmaDomesticPeerPremiumDiscountProposal"
import { PHARMA_DOMESTIC_PEER_COMBINED_SCORE } from "./pharmaDomesticPeerCombinedScoreContract"
import { PHARMA_DOMESTIC_VALUATION_MA_TRANSITION } from "./pharmaDomesticValuationMaTransitionContract"
import { PHARMA_V1_DIMENSION_WEIGHTS } from "./pharmaGateGScoringMethodProposal"
import { PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE } from "./pharmaGateH2ComponentNormalizationCandidate"
import { PHARMA_OVERLAY_MODIFIER_CONTRACT } from "./pharmaOverlayModifierContract"
import { PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT } from "./pharmaG7GovernanceHighRiskConstraint"
import {
  TORNTPHARM_GATE_H2_CASH_FLOW_SERIES,
  TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_SERIES,
  TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES,
} from "./torntpharmGateH2OfficialEvidencePack"
import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE } from "./torntpharmOfficialManifestFixture"
import {
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS,
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION,
} from "./torntpharmGateH2BusinessDurabilityReview"
import {
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS,
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION,
  TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY,
} from "./torntpharmGateH2OwnershipGovernanceReview"
import {
  TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE,
  TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
} from "./torntpharmGateH2LocalMarketEvidence"
import {
  TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT,
  TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION,
} from "./torntpharmGateH2RemainingEvidenceLock"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING,
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
} from "./torntpharmGateGFinal3RuntimeMapping"
import {
  calculateTorntpharmGateH3ReadOnlyScore,
  TORNTPHARM_GATE_H3_READ_ONLY_RESULT,
  TORNTPHARM_GATE_H3_READ_ONLY_SCORE_VERSION,
  TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_VERSION,
  type TorntpharmGateH3DimensionResult,
} from "./torntpharmGateH3ReadOnlyScore"

export const TORNTPHARM_GATE_H4_INDEPENDENT_VERIFICATION_VERSION =
  "TORNTPHARM_GATE_H4_INDEPENDENT_VERIFICATION_V1" as const

type DimensionCode = TorntpharmGateH3DimensionResult["dimensionCode"]

interface NumericBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
}

function median(values: readonly number[]): number {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("H4 median requires finite values")
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]!
    : (sorted[middle - 1]! + sorted[middle]!) / 2
}

function percentileType7(values: readonly number[], p: number): number {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("H4 percentile requires finite values")
  }
  const sorted = [...values].sort((a, b) => a - b)
  const h = (sorted.length - 1) * p
  const lower = Math.floor(h)
  const upper = Math.ceil(h)
  const fraction = h - lower
  return sorted[lower]! + fraction * (sorted[upper]! - sorted[lower]!)
}

function scoreBand(value: number, bands: readonly NumericBand[]): number {
  if (!Number.isFinite(value)) throw new Error("H4 score-band input must be finite")
  const band = bands.find((item) =>
    (item.minimumInclusive === undefined || value >= item.minimumInclusive)
    && (item.maximumExclusive === undefined || value < item.maximumExclusive))
  if (!band) throw new Error("H4 score-band input does not match an approved band")
  return band.score
}

function manifestSeries(metricCode: string) {
  return TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE
    .filter((row) => row.metricCode === metricCode)
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
    .map((row) => ({
      periodEnd: row.periodEnd,
      value: Number(row.value),
      unit: row.unit,
      lineage: row.lineage,
    }))
}

function round4(value: number): number {
  return Math.round((value + Number.EPSILON) * 10_000) / 10_000
}

function qualitativeScore(reviewedState: string): number {
  const rubric =
    PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE.qualitativeRubric
  const score = rubric[
    reviewedState as keyof typeof rubric
  ]
  if (score === null || score === undefined) {
    throw new Error(`H4 qualitative component is not numeric: ${reviewedState}`)
  }
  return score
}

const qualityMargins = TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES.map(
  (row) => (row.operatingEbitdaCrore / row.revenueCrore) * 100,
)
const qualityMedian = median(qualityMargins)
const qualityIqr =
  percentileType7(qualityMargins, 0.75) - percentileType7(qualityMargins, 0.25)
const qualityTrend =
  median(qualityMargins.slice(4)) - median(qualityMargins.slice(0, 4))
const qualityComponents = {
  level: scoreBand(
    qualityMedian,
    PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.level.bands,
  ),
  stability: scoreBand(
    qualityIqr,
    PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.stability.bands,
  ),
  trend: scoreBand(
    qualityTrend,
    PHARMA_OPERATING_MARGIN_CURVE_PROPOSAL.components.trend.bands,
  ),
}
const qualityScore =
  qualityComponents.level * 0.5
  + qualityComponents.stability * 0.3
  + qualityComponents.trend * 0.2

const growthValues =
  TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_SERIES.map((row) => row.growthPercent)
const growthMedian = median(growthValues)
const growthPositiveCount = growthValues.filter((value) => value > 0).length
const growthPriorMedian = median(growthValues.slice(0, -1))
const growthTrend = growthValues.at(-1)! - growthPriorMedian
const growthConsistencyScores =
  PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.consistency.scores
const growthComponents = {
  level: scoreBand(
    growthMedian,
    PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.level.bands,
  ),
  consistency:
    growthConsistencyScores[
      String(growthPositiveCount) as keyof typeof growthConsistencyScores
    ],
  trend: scoreBand(
    growthTrend,
    PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.components.trend.bands,
  ),
}
const growthScore =
  growthComponents.level * 0.6
  + growthComponents.consistency * 0.25
  + growthComponents.trend * 0.15

const roceSeries = manifestSeries("ROCE_MANAGEMENT_ANNUAL")
const roceValues = roceSeries.map((row) => row.value)
const capitalMedian = median(roceValues)
const capitalIqr =
  percentileType7(roceValues, 0.75) - percentileType7(roceValues, 0.25)
const capitalTrend =
  roceValues.at(-1)! - median(roceValues.slice(0, -1))
const capitalContract =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.capitalEfficiency
const capitalComponents = {
  level: scoreBand(capitalMedian, capitalContract.levelBands),
  stability: scoreBand(capitalIqr, capitalContract.stabilityBands),
  trend: scoreBand(capitalTrend, capitalContract.trendBands),
}
const capitalScore =
  capitalComponents.level * 0.6
  + capitalComponents.stability * 0.2
  + capitalComponents.trend * 0.2

const cashCfoToPat = TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.map(
  (row) => row.cfoCrore / row.patCrore,
)
const cashFcfToPat = TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.map(
  (row) => row.fcfCrore / row.patCrore,
)
const cashMedianCfoToPat = median(cashCfoToPat)
const cashMedianFcfToPat = median(cashFcfToPat)
const cashPositiveFcfYears =
  TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.filter((row) => row.fcfCrore > 0).length
const cashCfoTrend =
  cashCfoToPat.at(-1)! - median(cashCfoToPat.slice(0, -1))
const cashContract =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.cashFlow
const cashPositiveYearScores = cashContract.positiveFcfYearScores
const cashPositiveYearScore =
  cashPositiveYearScores[
    String(cashPositiveFcfYears) as keyof typeof cashPositiveYearScores
  ]
const cashCfoTrendScore = scoreBand(cashCfoTrend, cashContract.cfoTrendBands)
const cashConsistencyTrend =
  cashPositiveYearScore * 0.6 + cashCfoTrendScore * 0.4
const cashComponents = {
  cfoToPat: scoreBand(cashMedianCfoToPat, cashContract.cfoToPatBands),
  fcfToPat: scoreBand(cashMedianFcfToPat, cashContract.fcfToPatBands),
  consistencyTrend: cashConsistencyTrend,
}
const cashScore =
  cashComponents.cfoToPat * 0.45
  + cashComponents.fcfToPat * 0.35
  + cashComponents.consistencyTrend * 0.2

const leverageSeries = manifestSeries("NET_DEBT_EBITDA_ANNUAL")
const interestCoverageSeries = manifestSeries("INTEREST_COVERAGE_ANNUAL")
const leverageValues = leverageSeries.map((row) => row.value)
const interestCoverageValues = interestCoverageSeries.map((row) => row.value)
const balanceMedianLeverage = median(leverageValues)
const balanceMedianInterestCoverage = median(interestCoverageValues)
const balanceTrend =
  leverageValues.at(-1)! - median(leverageValues.slice(0, -1))
const balanceContract =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.balanceSheetCredit
const balanceComponents = {
  leverage: scoreBand(
    balanceMedianLeverage,
    balanceContract.netDebtEbitdaBands,
  ),
  interestCoverage: scoreBand(
    balanceMedianInterestCoverage,
    balanceContract.interestCoverageBands,
  ),
  trendResilience: scoreBand(
    balanceTrend,
    balanceContract.leverageTrendBands,
  ),
}
const balanceScore =
  balanceComponents.leverage * 0.5
  + balanceComponents.interestCoverage * 0.3
  + balanceComponents.trendResilience * 0.2

const businessByComponent = new Map(
  TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.map(
    (row) => [row.component, row] as const,
  ),
)
const businessScores = {
  brandTherapyLeadership: qualitativeScore(
    businessByComponent.get("BRAND_THERAPY_LEADERSHIP")!.reviewedState,
  ),
  fieldForceProductivity: qualitativeScore(
    businessByComponent.get("FIELD_FORCE_PRODUCTIVITY")!.reviewedState,
  ),
  rndProductivity: qualitativeScore(
    businessByComponent.get("RND_PRODUCTIVITY")!.reviewedState,
  ),
  pipelineCorporateExecution: qualitativeScore(
    businessByComponent.get("PIPELINE_CORPORATE_EXECUTION")!.reviewedState,
  ),
}
const businessWeights =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.businessDurability.weights
const businessScore =
  businessScores.brandTherapyLeadership
    * (businessWeights.brandTherapyLeadership / 100)
  + businessScores.fieldForceProductivity
    * (businessWeights.fieldForceProductivity / 100)
  + businessScores.rndProductivity
    * (businessWeights.rndProductivity / 100)
  + businessScores.pipelineCorporateExecution
    * (businessWeights.pipelineCorporateExecution / 100)

export const TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE = {
  source:
    "docs/PortfolioAI_GATE_H_H2_MA_TRANSITION_VALUATION_V1.md#H2-deterministic-inputs",
  selfHistoryImpliedUpsidePercent: -15.90,
  peers: [
    { symbol: "MANKIND", peTtm: 46.51, evEbitda: 22.33 },
    { symbol: "ERIS", peTtm: 28.21, evEbitda: 17.92 },
    { symbol: "EMCURE", peTtm: 35.82, evEbitda: 16.70 },
  ],
  target: { symbol: "TORNTPHARM", peTtm: 85.02, evEbitda: 37.11 },
} as const

const valuationSelfHistoryScore = scoreBand(
  TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.selfHistoryImpliedUpsidePercent,
  PHARMA_DOMESTIC_VALUATION_SELF_HISTORY_CURVE.bands,
)
const peerPeMedian = median(
  TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.peers.map((row) => row.peTtm),
)
const peerEvMedian = median(
  TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.peers.map((row) => row.evEbitda),
)
const peerPeRelative =
  (peerPeMedian / TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.target.peTtm - 1)
  * 100
const peerEvRelative =
  (peerEvMedian
    / TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.target.evEbitda - 1)
  * 100
const peerPeScore = scoreBand(
  peerPeRelative,
  PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.bands,
)
const peerEvScore = scoreBand(
  peerEvRelative,
  PHARMA_DOMESTIC_PEER_PREMIUM_DISCOUNT.bands,
)
const valuationPeerScore =
  peerPeScore * PHARMA_DOMESTIC_PEER_COMBINED_SCORE.weights.pe
  + peerEvScore * PHARMA_DOMESTIC_PEER_COMBINED_SCORE.weights.evEbitda
const valuationScore =
  valuationSelfHistoryScore
    * PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.weights.selfHistory
  + valuationPeerScore
    * PHARMA_DOMESTIC_VALUATION_MA_TRANSITION.weights.peerRelative

const momentumContract =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.momentum
const momentumComponents = {
  absolute12m: scoreBand(
    TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.absolute12mPercent,
    momentumContract.absolute12mBands,
  ),
  absolute6m: scoreBand(
    TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.absolute6mPercent,
    momentumContract.absolute6mBands,
  ),
  relativeStrength12m: scoreBand(
    TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.relativeStrength12mPercent,
    momentumContract.relativeStrength12mBands,
  ),
}
const momentumScore =
  momentumComponents.absolute12m * 0.4
  + momentumComponents.absolute6m * 0.25
  + momentumComponents.relativeStrength12m * 0.35

const ownershipByComponent = new Map(
  TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_COMPONENTS.map(
    (row) => [row.component, row] as const,
  ),
)
const ownershipScores = {
  ownershipStability: qualitativeScore(
    ownershipByComponent.get("OWNERSHIP_STABILITY")!.reviewedState,
  ),
  pledgeControlRisk: qualitativeScore(
    ownershipByComponent.get("PLEDGE_CONTROL_RISK")!.reviewedState,
  ),
  nonG4GovernanceContext: qualitativeScore(
    ownershipByComponent.get("NON_G4_GOVERNANCE_CONTEXT")!.reviewedState,
  ),
}
const ownershipWeights =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.ownershipGovernance.weights
const ownershipScore =
  ownershipScores.ownershipStability
    * (ownershipWeights.ownershipStability / 100)
  + ownershipScores.pledgeControlRisk
    * (ownershipWeights.pledgeControlRisk / 100)
  + ownershipScores.nonG4GovernanceContext
    * (ownershipWeights.nonG4GovernanceContext / 100)

const governanceInput = TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING.runtimeInput
const governanceClearByIndependentRules =
  governanceInput.eventClass === "REGULATORY"
  && governanceInput.severity === "MODERATE"
  && governanceInput.governanceBlockedReview === false
  && governanceInput.affectedFacilityProductGeographyEstablished === true
  && governanceInput.regulatoryMateriality === "KNOWN_MATERIAL"
  && governanceInput.remediationState === "CLOSED_OUT"
  && governanceInput.subsequentOutcomeEstablished === true

const regulatoryContextScore = governanceClearByIndependentRules
  ? PHARMA_GATE_H2_COMPONENT_NORMALIZATION_CANDIDATE
      .regulatoryRuntimeNormalization.CLEAR
  : null
if (regulatoryContextScore === null) {
  throw new Error("H4 governance runtime did not independently resolve CLEAR")
}

const riskContract =
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.risk
const riskComponents = {
  regulatoryContext: regulatoryContextScore,
  maxDrawdown1Y: scoreBand(
    TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.maxDrawdown1YSignedPercent,
    riskContract.maxDrawdownBands,
  ),
  relativeVolatility: scoreBand(
    TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.relativeVolatilityRatio,
    riskContract.relativeVolatilityRatioBands,
  ),
}
const riskScore =
  riskComponents.regulatoryContext * 0.4
  + riskComponents.maxDrawdown1Y * 0.35
  + riskComponents.relativeVolatility * 0.25

const handScores: Readonly<Record<DimensionCode, number>> = {
  QUALITY: qualityScore,
  GROWTH: growthScore,
  CAPITAL_EFFICIENCY: capitalScore,
  CASH_FLOW: cashScore,
  BALANCE_SHEET_CREDIT: balanceScore,
  BUSINESS_DURABILITY: businessScore,
  VALUATION: valuationScore,
  MOMENTUM: momentumScore,
  OWNERSHIP_GOVERNANCE: ownershipScore,
  RISK: riskScore,
}

const weightByDimension = new Map(
  PHARMA_V1_DIMENSION_WEIGHTS.map(
    (row) => [row.dimensionCode as DimensionCode, row.weight] as const,
  ),
)

const contributions = Object.fromEntries(
  (Object.entries(handScores) as readonly [DimensionCode, number][]).map(
    ([dimensionCode, dimensionScore]) => {
      const weight = weightByDimension.get(dimensionCode)
      if (weight === undefined) {
        throw new Error(`H4 fixed weight missing for ${dimensionCode}`)
      }
      return [
        dimensionCode,
        round4(dimensionScore * (weight / 100)),
      ] as const
    },
  ),
) as Readonly<Record<DimensionCode, number>>

const handOverallScore = round4(
  Object.values(contributions).reduce((sum, contribution) => sum + contribution, 0),
)

const h3First = calculateTorntpharmGateH3ReadOnlyScore()
const h3Second = calculateTorntpharmGateH3ReadOnlyScore()
const h3Serialized = JSON.stringify(TORNTPHARM_GATE_H3_READ_ONLY_RESULT)

export const TORNTPHARM_GATE_H4_INDEPENDENT_VERIFICATION = {
  version: TORNTPHARM_GATE_H4_INDEPENDENT_VERIFICATION_VERSION,
  state: "INDEPENDENT_VERIFICATION_CANDIDATE" as const,
  securitySymbol: "TORNTPHARM" as const,
  profileCode: "PHARMA_V1" as const,
  lockedInputPackageVersion: TORNTPHARM_GATE_H3_SCORE_INPUT_PACKAGE_VERSION,
  h3ResultVersion: TORNTPHARM_GATE_H3_READ_ONLY_SCORE_VERSION,
  handCalculation: {
    dimensions: {
      QUALITY: {
        rawObservationCount: TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES.length,
        rawPeriods: TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES.map(
          (row) => row.period,
        ),
        units: "INR_CR_TO_PERCENT",
        sourceVersion: TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
        derivedStatistics: {
          medianLatest8OperatingMarginPercent: qualityMedian,
          interquartileRangeLatest8PercentagePoints: qualityIqr,
          medianLatest4MinusPrior4PercentagePoints: qualityTrend,
        },
        componentScores: qualityComponents,
        finalScore: qualityScore,
      },
      GROWTH: {
        rawObservationCount: TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_SERIES.length,
        rawPeriods: TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_SERIES.map(
          (row) => row.periodEnd,
        ),
        units: "PERCENT",
        sourceVersion: TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
        derivedStatistics: {
          medianLatest4ComparableQuartersPercent: growthMedian,
          positiveQuartersOutOfLatest4: growthPositiveCount,
          latestMinusMedianPrior3PercentagePoints: growthTrend,
        },
        componentScores: growthComponents,
        finalScore: growthScore,
      },
      CAPITAL_EFFICIENCY: {
        rawObservations: roceSeries,
        derivedStatistics: {
          medianRocePercent: capitalMedian,
          roceIqrPercentagePoints: capitalIqr,
          latestMinusPriorMedianPercentagePoints: capitalTrend,
        },
        componentScores: capitalComponents,
        finalScore: capitalScore,
      },
      CASH_FLOW: {
        rawObservationCount: TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.length,
        rawPeriods: TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.map(
          (row) => row.periodEnd,
        ),
        units: "INR_CR_AND_RATIOS",
        sourceVersion: TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
        derivedStatistics: {
          medianCfoToPat: cashMedianCfoToPat,
          medianFcfToPat: cashMedianFcfToPat,
          positiveFcfYearsOutOf3: cashPositiveFcfYears,
          latestCfoToPatMinusPriorMedian: cashCfoTrend,
        },
        componentScores: cashComponents,
        finalScore: cashScore,
      },
      BALANCE_SHEET_CREDIT: {
        leverageObservations: leverageSeries,
        interestCoverageObservations: interestCoverageSeries,
        derivedStatistics: {
          medianNetDebtEbitda: balanceMedianLeverage,
          medianInterestCoverage: balanceMedianInterestCoverage,
          latestMinusPriorMedianNetDebtEbitda: balanceTrend,
        },
        componentScores: balanceComponents,
        finalScore: balanceScore,
      },
      BUSINESS_DURABILITY: {
        sourceVersion: TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_REVIEW_VERSION,
        reviewedStates: Object.fromEntries(
          TORNTPHARM_GATE_H2_BUSINESS_DURABILITY_COMPONENTS.map(
            (row) => [row.component, row.reviewedState],
          ),
        ),
        componentScores: businessScores,
        finalScore: businessScore,
      },
      VALUATION: {
        source: TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.source,
        selfHistoryImpliedUpsidePercent:
          TORNTPHARM_GATE_H4_VALUATION_HAND_FIXTURE.selfHistoryImpliedUpsidePercent,
        peerPeMedian,
        peerEvEbitdaMedian: peerEvMedian,
        peerPeRelativePercent: peerPeRelative,
        peerEvEbitdaRelativePercent: peerEvRelative,
        componentScores: {
          selfHistory: valuationSelfHistoryScore,
          peerPe: peerPeScore,
          peerEvEbitda: peerEvScore,
          peerRelative: valuationPeerScore,
          fcfCorroborationWeight: 0,
        },
        finalScore: valuationScore,
      },
      MOMENTUM: {
        sourceVersion: TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
        sourceProvider: TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.sourceProvider,
        asOfDate: TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.asOfDate,
        benchmark: PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.benchmark.code,
        rawStatistics: {
          absolute12mPercent:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.absolute12mPercent,
          absolute6mPercent:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.absolute6mPercent,
          relativeStrength12mPercent:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.relativeStrength12mPercent,
        },
        componentScores: momentumComponents,
        finalScore: momentumScore,
      },
      OWNERSHIP_GOVERNANCE: {
        sourceVersion: TORNTPHARM_GATE_H2_OWNERSHIP_GOVERNANCE_REVIEW_VERSION,
        rawHistory: TORNTPHARM_GATE_H2_OWNERSHIP_HISTORY,
        componentScores: ownershipScores,
        finalScore: ownershipScore,
      },
      RISK: {
        sourceVersion: TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE_VERSION,
        governanceRuntimeVersion: TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
        benchmark: PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.benchmark.code,
        rawStatistics: {
          regulatoryContextScore,
          maxDrawdown1YPercent:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.maxDrawdown1YSignedPercent,
          stockVolatility1YPercent:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.stockVolatility1YPercent,
          benchmarkVolatility1YPercent:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.benchmarkVolatility1YPercent,
          relativeVolatilityRatio:
            TORNTPHARM_GATE_H2_LOCAL_MARKET_EVIDENCE.relativeVolatilityRatio,
        },
        componentScores: riskComponents,
        finalScore: riskScore,
      },
    },
    fixedWeights: Object.fromEntries(
      PHARMA_V1_DIMENSION_WEIGHTS.map((row) => [
        row.dimensionCode,
        row.weight,
      ]),
    ),
    weightedContributions: contributions,
    overallScore: handOverallScore,
  },
  overlayVerification: {
    reviewedBusinessMaterialityState:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .reviewedAssignmentState,
    economicMaterialityPercent:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .evidenceBasisEconomicMaterialityPercent,
    numericThresholdPercent:
      PHARMA_OVERLAY_MODIFIER_CONTRACT.materialOverlayMinimumPercent,
    belowNumericThreshold:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .evidenceBasisEconomicMaterialityPercent
      < PHARMA_OVERLAY_MODIFIER_CONTRACT.materialOverlayMinimumPercent,
    numericModifierApplied: false,
    numericModifier: null,
    secondIndependentStockScore: null,
    emergingWatchNumericParticipation: false,
    sourceLockVersion: TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION,
  },
  governanceVerification: {
    runtimeMappingVersion: TORNTPHARM_GATE_G_FINAL_3_RUNTIME_MAPPING_VERSION,
    independentlyResolvedState:
      governanceClearByIndependentRules ? "CLEAR" : "NOT_CLEAR",
    historicalEventRetained:
      governanceInput.eventClass === "REGULATORY"
      && governanceInput.remediationState === "CLOSED_OUT",
    numericPenalty: null,
    overallScoreCap:
      PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskOverallCapEnabled
        ? PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.highRiskNumericCapValue
        : null,
    hiddenDoubleCountingAllowed:
      PHARMA_G7_GOVERNANCE_HIGH_RISK_CONSTRAINT.hiddenDoubleCountingAllowed,
  },
  adapterCrossCheck: {
    adapterOverallScore: TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore,
    handOverallScore,
    exactMatch:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore === handOverallScore,
    roundingConvention: "ROUND_TO_4_DECIMAL_PLACES_AFTER_FIXED_WEIGHT_SUM" as const,
  },
  determinism: {
    repeatedCalculationIdentical:
      JSON.stringify(h3First) === JSON.stringify(h3Second),
    firstOverallScore: h3First.overallScore,
    secondOverallScore: h3Second.overallScore,
  },
  antiLeakage: {
    bankNbfcTokenAbsent: !h3Serialized.includes("BANK_NBFC"),
    niftyBankTokenAbsent: !h3Serialized.includes("NIFTY_BANK"),
    niftyPharmaBenchmarkRetained:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.benchmarkCode === "NIFTY_PHARMA",
    globalGenericsSecondScoreAbsent:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.globalGenericsOverlay
        .secondIndependentStockScore === null,
    cdmoEmergingNumericParticipationAbsent:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.emergingWatch.numericParticipation
        === false,
    governanceSecondPenaltyAbsent:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.numericPenalty === null
      && TORNTPHARM_GATE_H3_READ_ONLY_RESULT.governance.overallScoreCap === null,
    missingEvidenceNeutralizationAbsent:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.dimensions.every(
        (row) => row.readinessCoverage === 1 && row.finalScore !== null,
      ),
    hiddenRenormalizationAbsent:
      PHARMA_V1_DIMENSION_WEIGHTS.reduce(
        (sum, row) => sum + row.weight,
        0,
      ) === 100,
  },
  safety: {
    readOnly: TORNTPHARM_GATE_H3_READ_ONLY_RESULT.readOnly,
    nonPersisting: TORNTPHARM_GATE_H3_READ_ONLY_RESULT.nonPersisting,
    persistedScoreRunEnabled:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.persistedScoreRunEnabled,
    recommendationEnabled:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.recommendationEnabled,
    positionSizingEnabled:
      TORNTPHARM_GATE_H3_READ_ONLY_RESULT.positionSizingEnabled,
  },
} as const
