import {
  evaluateDomesticBalanceSheetCredit,
  evaluateDomesticCapitalEfficiency,
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT,
} from "./torntpharmGateH2OfficialEvidencePack"
import {
  TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE,
} from "./torntpharmGateH2DerivedStatisticsCandidate"

export const TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_VERSION =
  "TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_V1" as const

const capital =
  TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.capitalEfficiency
const balance =
  TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.balanceSheetCredit

if (capital.interquartileRangeLatestHistoryPercentagePoints === null) {
  throw new Error("Capital Efficiency IQR must be locked before evaluation")
}

export const TORNTPHARM_GATE_H2_CAPITAL_EFFICIENCY_READ_ONLY_RESULT =
  evaluateDomesticCapitalEfficiency({
    medianRocePercent: capital.medianRocePercent,
    roceIqrPercentagePoints:
      capital.interquartileRangeLatestHistoryPercentagePoints,
    latestMinusPriorMedianPercentagePoints:
      capital.latestMinusPriorMedianPercentagePoints,
  })

export const TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT =
  evaluateDomesticBalanceSheetCredit({
    medianNetDebtEbitda: balance.medianNetDebtEbitda,
    medianInterestCoverage: balance.medianInterestCoverage,
    latestMinusPriorMedianNetDebtEbitda:
      balance.latestMinusPriorMedianNetDebtEbitda,
  })

export const TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS = {
  version: TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_VERSION,
  securitySymbol: "TORNTPHARM" as const,
  methodologyVersion:
    PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
  quality: {
    state: "READ_ONLY_SCORE_CANDIDATE" as const,
    score: TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT.combinedScore,
    componentScores: {
      level: TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT.levelScore,
      stability: TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT.stabilityScore,
      trend: TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT.trendScore,
    },
  },
  capitalEfficiency: {
    state: "READ_ONLY_SCORE_CANDIDATE" as const,
    score: TORNTPHARM_GATE_H2_CAPITAL_EFFICIENCY_READ_ONLY_RESULT.combinedScore,
    componentScores: {
      level:
        TORNTPHARM_GATE_H2_CAPITAL_EFFICIENCY_READ_ONLY_RESULT.levelScore,
      stability:
        TORNTPHARM_GATE_H2_CAPITAL_EFFICIENCY_READ_ONLY_RESULT.stabilityScore,
      trend:
        TORNTPHARM_GATE_H2_CAPITAL_EFFICIENCY_READ_ONLY_RESULT.trendScore,
    },
  },
  balanceSheetCredit: {
    state: "READ_ONLY_SCORE_CANDIDATE" as const,
    score: TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT.combinedScore,
    componentScores: {
      leverage:
        TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT.leverageScore,
      interestCoverage:
        TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT.interestCoverageScore,
      trendResilience:
        TORNTPHARM_GATE_H2_BALANCE_SHEET_READ_ONLY_RESULT.trendResilienceScore,
    },
  },
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
