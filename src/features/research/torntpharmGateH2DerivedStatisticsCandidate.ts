import {
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES,
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS,
} from "./torntpharmGateH2OfficialEvidencePack"
import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE } from "./torntpharmOfficialManifestFixture"

export const TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION =
  "TORNTPHARM_GATE_H2_DERIVED_STATISTICS_V1_OWNER_APPROVED" as const

function numeric(metricCode: string): readonly number[] {
  return TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE
    .filter((row) => row.metricCode === metricCode)
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
    .map((row) => Number(row.value))
}

function percentileType7(values: readonly number[], p: number): number {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Percentile requires finite values")
  }
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error("Percentile p must be between 0 and 1")
  }
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]!
  const h = (sorted.length - 1) * p
  const lower = Math.floor(h)
  const upper = Math.ceil(h)
  const fraction = h - lower
  return sorted[lower]! + fraction * (sorted[upper]! - sorted[lower]!)
}

function median(values: readonly number[]): number {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Median requires at least one finite value")
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle]!
  return (sorted[middle - 1]! + sorted[middle]!) / 2
}

const roce = numeric("ROCE_MANAGEMENT_ANNUAL")
const leverage = numeric("NET_DEBT_EBITDA_ANNUAL")
const interestCoverage = numeric("INTEREST_COVERAGE_ANNUAL")

if (roce.length !== 3) throw new Error("Expected exactly three locked ROCE annual observations")
if (leverage.length !== 3) throw new Error("Expected exactly three locked leverage observations")
if (interestCoverage.length !== 3) throw new Error("Expected exactly three locked interest-coverage observations")

const latestRoce = roce.at(-1)!
const priorRoce = roce.slice(0, -1)
const latestLeverage = leverage.at(-1)!
const priorLeverage = leverage.slice(0, -1)

export const TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE = {
  version: TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION,
  state: "OWNER_APPROVED_DERIVATION_LOCK" as const,
  securitySymbol: "TORNTPHARM" as const,
  capitalEfficiency: {
    rawRocePercent: roce,
    medianRocePercent: median(roce),
    latestMinusPriorMedianPercentagePoints:
      latestRoce - median(priorRoce),
    interquartileRangeLatestHistoryPercentagePoints:
      percentileType7(roce, 0.75) - percentileType7(roce, 0.25),
    iqrState: "TYPE_7_LINEAR_INTERPOLATION_OWNER_APPROVED" as const,
    scoreReady: true,
    reasonCodes: [
      "MEDIAN_AND_TREND_DETERMINISTIC_FROM_LOCKED_THREE_YEAR_HISTORY",
      "TYPE_7_LINEAR_INTERPOLATION_OWNER_APPROVED",
      "Q1_P25_AND_Q3_P75_VERSIONED",
    ] as const,
  },
  balanceSheetCredit: {
    rawNetDebtEbitda: leverage,
    rawInterestCoverage: interestCoverage,
    medianNetDebtEbitda: median(leverage),
    medianInterestCoverage: median(interestCoverage),
    latestMinusPriorMedianNetDebtEbitda:
      latestLeverage - median(priorLeverage),
    scoreReadyForApprovedEvaluator: true,
    reasonCodes: [
      "ALL_REQUIRED_DERIVED_STATISTICS_ARE_UNAMBIGUOUS",
      "THREE_YEAR_RAW_HISTORY_LOCKED",
    ] as const,
  },
  qualityOperatingMargin: {
    rawOperatingMarginPercent: TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES,
    percentileConvention:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS.percentileConvention,
    medianLatest8OperatingMarginPercent:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS
        .medianLatest8OperatingMarginPercent,
    interquartileRangeLatest8PercentagePoints:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS
        .interquartileRangeLatest8PercentagePoints,
    medianLatest4MinusPrior4PercentagePoints:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS
        .medianLatest4MinusPrior4PercentagePoints,
    scoreReadyForApprovedEvaluator: true,
    reasonCodes: [
      "EIGHT_QUARTER_OFFICIAL_OPERATING_MARGIN_HISTORY_LOCKED",
      "TYPE_7_LINEAR_INTERPOLATION_REUSED_FROM_OWNER_APPROVED_H2_CONVENTION",
      "LATEST_FOUR_VS_PRIOR_FOUR_TREND_DETERMINISTIC",
    ] as const,
  },
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
