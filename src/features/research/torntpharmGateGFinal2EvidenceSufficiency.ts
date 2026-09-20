import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE } from "./torntpharmOfficialManifestFixture"
import {
  TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES,
} from "./torntpharmReadOnlyContentReviewDryRun"

export const TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY_VERSION =
  "TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY_V1" as const

export type TorntpharmGateGFinal2EvidenceState =
  | "MINIMUM_HISTORY_PRESENT"
  | "PARTIAL_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "SCOPE_INCOMPLETE"

export interface TorntpharmGateGFinal2EvidenceRow {
  readonly dimension:
    | "CAPITAL_EFFICIENCY"
    | "CASH_FLOW"
    | "BALANCE_SHEET_CREDIT"
    | "BUSINESS_DURABILITY"
    | "MOMENTUM"
    | "OWNERSHIP_GOVERNANCE"
    | "RISK"
  readonly state: TorntpharmGateGFinal2EvidenceState
  readonly scoreReady: false
  readonly reasonCodes: readonly string[]
}

function count(metricCode: string) {
  return TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE.filter(
    (row) => row.metricCode === metricCode,
  ).length
}

const regulatoryCandidates = TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.filter(
  (row) => row.metricCode === "PHARMA_REGULATORY_SITE_STATUS",
).length

export const TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY = {
  version: TORNTPHARM_GATE_G_FINAL_2_EVIDENCE_SUFFICIENCY_VERSION,
  state: "READ_ONLY_EVIDENCE_LOCK" as const,
  securitySymbol: "TORNTPHARM" as const,
  rows: [
    {
      dimension: "CAPITAL_EFFICIENCY",
      state: count("ROCE_MANAGEMENT_ANNUAL") >= 3
        ? "MINIMUM_HISTORY_PRESENT"
        : "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "ROCE_THREE_ANNUAL_PERIODS_PRESENT",
        "NUMERIC_CALIBRATION_NOT_YET_APPROVED",
      ],
    },
    {
      dimension: "CASH_FLOW",
      state:
        count("CFO_ANNUAL") >= 3
        && count("PAT_ATTRIBUTABLE_ANNUAL") >= 3
        && count("CAPEX_ANNUAL") >= 3
        && count("FREE_CASH_FLOW_ANNUAL") >= 3
          ? "MINIMUM_HISTORY_PRESENT"
          : "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "MATCHED_CFO_PAT_CAPEX_FCF_THREE_YEAR_HISTORY_REQUIRED",
        count("CFO_ANNUAL") < 3
          ? "CFO_HISTORY_BELOW_THREE_ANNUAL_PERIODS"
          : "CFO_HISTORY_MINIMUM_PRESENT",
        "MISSING_EVIDENCE_MAY_NOT_BECOME_NEUTRAL",
      ],
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      state:
        count("NET_DEBT_EBITDA_ANNUAL") >= 3
        && count("INTEREST_COVERAGE_ANNUAL") >= 3
        && count("TOTAL_DEBT_ANNUAL") >= 3
        && count("CASH_EQUIVALENTS_ANNUAL") >= 3
        && count("EBITDA_ANNUAL") >= 3
          ? "MINIMUM_HISTORY_PRESENT"
          : "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "THREE_YEAR_LEVERAGE_COVERAGE_DEBT_CASH_EBITDA_STRUCTURE_PRESENT",
        "NUMERIC_CALIBRATION_NOT_YET_APPROVED",
      ],
    },
    {
      dimension: "BUSINESS_DURABILITY",
      state:
        count("RND_INTENSITY_PERCENT") >= 3
          ? "PARTIAL_EVIDENCE"
          : "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "RND_INTENSITY_THREE_YEAR_HISTORY_PRESENT",
        "WHOLE_DIMENSION_AGGREGATION_NOT_APPROVED",
        "DOMESTIC_FRANCHISE_AND_PIPELINE_EVIDENCE_NOT_LOCKED_IN_THIS_FIXTURE",
      ],
    },
    {
      dimension: "MOMENTUM",
      state: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "MARKET_EVIDENCE_LANES_EXIST_SYSTEM_WIDE",
        "TORNTPHARM_GATE_G_MOMENTUM_FIXTURE_NOT_LOCKED",
        "PHARMA_BENCHMARK_NOT_APPROVED",
      ],
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      state: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "MINIMUM_FOUR_SHAREHOLDING_QUARTERS_REQUIRED",
        "TORNTPHARM_OWNERSHIP_HISTORY_NOT_LOCKED_IN_CURRENT_GATE_G_FIXTURE",
        "MISSING_EVIDENCE_MAY_NOT_BECOME_NEUTRAL",
      ],
    },
    {
      dimension: "RISK",
      state: regulatoryCandidates > 0 ? "SCOPE_INCOMPLETE" : "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      reasonCodes: [
        "INDRAD_WARNING_TO_CLOSEOUT_CHAIN_REVIEWED",
        "COMPANY_WIDE_CURRENT_REGULATORY_SCOPE_NOT_ESTABLISHED",
        "MARKET_DRAWDOWN_AND_VOLATILITY_GATE_G_FIXTURE_NOT_LOCKED",
      ],
    },
  ] as const satisfies readonly TorntpharmGateGFinal2EvidenceRow[],
  allSevenDimensionsScoreReady: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const
