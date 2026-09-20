import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE } from "./torntpharmOfficialManifestFixture"

export const TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_VERSION =
  "TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE_V1" as const

function numeric(metricCode: string): readonly number[] {
  return TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE
    .filter((row) => row.metricCode === metricCode)
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd))
    .map((row) => Number(row.value))
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
  state: "READ_ONLY_DERIVATION_CANDIDATE" as const,
  securitySymbol: "TORNTPHARM" as const,
  capitalEfficiency: {
    rawRocePercent: roce,
    medianRocePercent: median(roce),
    latestMinusPriorMedianPercentagePoints:
      latestRoce - median(priorRoce),
    interquartileRangeLatestHistoryPercentagePoints: null,
    iqrState: "CANONICAL_CONVENTION_REQUIRED" as const,
    scoreReady: false,
    reasonCodes: [
      "MEDIAN_AND_TREND_ARE_DETERMINISTIC_FROM_LOCKED_THREE_YEAR_HISTORY",
      "IQR_WITH_THREE_OBSERVATIONS_DEPENDS_ON_PERCENTILE_CONVENTION",
      "NO_CANONICAL_IQR_CONVENTION_FOUND_IN_REPOSITORY",
      "DO_NOT_CHOOSE_PERCENTILE_CONVENTION_SILENTLY",
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
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
