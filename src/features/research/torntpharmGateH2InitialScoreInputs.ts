import {
  evaluateDomesticBalanceSheetCredit,
  PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE,
} from "./torntpharmGateH2DerivedStatisticsCandidate"

export const TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_VERSION =
  "TORNTPHARM_GATE_H2_INITIAL_SCORE_INPUTS_V1" as const

const balance =
  TORNTPHARM_GATE_H2_DERIVED_STATISTICS_CANDIDATE.balanceSheetCredit

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
  capitalEfficiency: {
    state: "BLOCKED_IQR_CONVENTION_DECISION" as const,
    score: null,
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
