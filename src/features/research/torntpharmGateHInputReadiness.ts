import { TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE } from "./torntpharmOfficialManifestFixture"
import {
  TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES,
} from "./torntpharmReadOnlyContentReviewDryRun"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT,
} from "./torntpharmGateGFinal3RuntimeMapping"

export const TORNTPHARM_GATE_H_INPUT_READINESS_VERSION =
  "TORNTPHARM_GATE_H_INPUT_READINESS_V1" as const

export type TorntpharmGateHDimensionCode =
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

export type TorntpharmGateHReadinessState =
  | "RAW_INPUT_MINIMUM_PRESENT_DERIVATION_LOCK_REQUIRED"
  | "PARTIAL_EVIDENCE"
  | "INSUFFICIENT_EVIDENCE"
  | "RUNTIME_REVIEW_REQUIRED"

export interface TorntpharmGateHInputReadinessRow {
  readonly dimension: TorntpharmGateHDimensionCode
  readonly weightPercent: number
  readonly readinessState: TorntpharmGateHReadinessState
  readonly scoreReady: false
  readonly existingEvidence: readonly string[]
  readonly missingInputs: readonly string[]
  readonly sourcePriority: readonly string[]
  readonly reasonCodes: readonly string[]
}

function rowsFor(metricCode: string) {
  return TORNTPHARM_OFFICIAL_MANIFEST_FIXTURE.filter(
    (row) => row.metricCode === metricCode,
  )
}

const operatingRevenueQuarterPeriods = new Set(
  rowsFor("OPERATING_REVENUE_QUARTER").map((row) => row.periodEnd),
)
const operatingProfitQuarterPeriods = new Set(
  rowsFor("OPERATING_PROFIT_QUARTER").map((row) => row.periodEnd),
)
const matchedOperatingMarginQuarterCount = [...operatingRevenueQuarterPeriods].filter(
  (period) => operatingProfitQuarterPeriods.has(period),
).length

const exportGrowthCandidateCount =
  TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.filter(
    (row) => row.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH",
  ).length

const regulatoryCandidateCount =
  TORNTPHARM_PROPOSED_EVIDENCE_CANDIDATES.filter(
    (row) => row.metricCode === "PHARMA_REGULATORY_SITE_STATUS",
  ).length

export const TORNTPHARM_GATE_H_INPUT_READINESS = {
  version: TORNTPHARM_GATE_H_INPUT_READINESS_VERSION,
  state: "H1_READ_ONLY_AUDIT" as const,
  securitySymbol: "TORNTPHARM" as const,
  profileCode: "PHARMA_V1" as const,
  primarySubprofile: "DOMESTIC_FORMULATIONS" as const,
  materialOverlay: "GLOBAL_GENERICS" as const,
  emergingWatch: "CDMO_CRAMS" as const,
  rows: [
    {
      dimension: "QUALITY",
      weightPercent: 13,
      readinessState: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        `OPERATING_REVENUE_QUARTER_COUNT_${rowsFor("OPERATING_REVENUE_QUARTER").length}`,
        `OPERATING_PROFIT_QUARTER_COUNT_${rowsFor("OPERATING_PROFIT_QUARTER").length}`,
        `MATCHED_OPERATING_MARGIN_QUARTERS_${matchedOperatingMarginQuarterCount}`,
      ],
      missingInputs: [
        "EIGHT_COMPARABLE_MATCHED_OPERATING_REVENUE_AND_OPERATING_PROFIT_QUARTERS",
        "LATEST_8_MARGIN_SERIES",
        "MEDIAN_LATEST_8_OPERATING_MARGIN_PERCENT",
        "IQR_LATEST_8_OPERATING_MARGIN_PERCENTAGE_POINTS",
        "MEDIAN_LATEST_4_MINUS_PRIOR_4_PERCENTAGE_POINTS",
      ],
      sourcePriority: [
        "EXISTING_CANONICAL_OBSERVATIONS",
        "STORED_ISSUER_QUARTERLY_RESULTS",
        "PUBLIC_OFFICIAL_ISSUER_RESULTS",
      ],
      reasonCodes: [
        "QUALITY_REQUIRES_8_MATCHED_COMPARABLE_QUARTERS",
        "CURRENT_FIXTURE_HAS_ZERO_MATCHED_QUARTERS",
        "MISSING_EVIDENCE_NOT_ZERO_OR_NEUTRAL",
      ],
    },
    {
      dimension: "GROWTH",
      weightPercent: 15,
      readinessState: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        "DOMESTIC_PRIMARY_GROWTH_SERIES_NOT_LOCKED",
        `GLOBAL_GENERICS_EXPORT_GROWTH_PROPOSED_CANDIDATES_${exportGrowthCandidateCount}`,
        "Q4_FY26_US_BASE_BUSINESS_SEMANTIC_GUARD_REVIEWED",
      ],
      missingInputs: [
        "FOUR_COMPARABLE_PRIMARY_DOMESTIC_REVENUE_GROWTH_QUARTERS",
        "PRIMARY_DOMESTIC_GROWTH_DERIVED_STATISTICS",
        "CANONICAL_PROMOTION_OR_EQUIVALENT_LOCK_OF_GLOBAL_GENERICS_GROWTH_CANDIDATES",
        "OVERLAY_ECONOMIC_MATERIALITY_PERCENT",
        "OVERLAY_EVIDENCE_COMPLETENESS",
        "OVERLAY_CONFIDENCE",
        "OVERLAY_NORMALIZED_SIGNAL",
      ],
      sourcePriority: [
        "EXISTING_CANONICAL_OBSERVATIONS",
        "STORED_ISSUER_RESULTS",
        "PUBLIC_OFFICIAL_ISSUER_RESULTS",
      ],
      reasonCodes: [
        "PRIMARY_DOMESTIC_GROWTH_SERIES_NOT_LOCKED",
        "MATERIAL_OVERLAY_CANDIDATE_HISTORY_EXISTS_BUT_IS_NOT_CANONICAL_SCORE_INPUT",
        "ACQUISITION_DISTORTED_Q4_REPORTED_US_GROWTH_EXCLUDED",
      ],
    },
    {
      dimension: "CAPITAL_EFFICIENCY",
      weightPercent: 10,
      readinessState: "RAW_INPUT_MINIMUM_PRESENT_DERIVATION_LOCK_REQUIRED",
      scoreReady: false,
      existingEvidence: [
        `ROCE_MANAGEMENT_ANNUAL_COUNT_${rowsFor("ROCE_MANAGEMENT_ANNUAL").length}`,
        "ROCE_PERIODS_2024_2025_2026",
      ],
      missingInputs: [
        "VERSIONED_ROCE_DERIVED_STATISTIC_PACKAGE",
        "MEDIAN_ROCE_PERCENT",
        "ROCE_IQR_PERCENTAGE_POINTS",
        "LATEST_MINUS_PRIOR_MEDIAN_ROCE_PERCENTAGE_POINTS",
      ],
      sourcePriority: [
        "EXISTING_OFFICIAL_MANIFEST_FIXTURE",
      ],
      reasonCodes: [
        "THREE_YEAR_ROCE_RAW_HISTORY_PRESENT",
        "RAW_HISTORY_SUFFICIENT_FOR_H2_DERIVATION_LOCK",
        "H1_DOES_NOT_INFER_UNVERSIONED_DERIVED_STATISTICS",
      ],
    },
    {
      dimension: "CASH_FLOW",
      weightPercent: 10,
      readinessState: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        `CFO_ANNUAL_COUNT_${rowsFor("CFO_ANNUAL").length}`,
        `PAT_ANNUAL_COUNT_${rowsFor("PAT_ATTRIBUTABLE_ANNUAL").length}`,
        `CAPEX_ANNUAL_COUNT_${rowsFor("CAPEX_ANNUAL").length}`,
        `FCF_ANNUAL_COUNT_${rowsFor("FREE_CASH_FLOW_ANNUAL").length}`,
      ],
      missingInputs: [
        "AT_LEAST_THREE_MATCHED_CFO_ANNUAL_PERIODS",
        "THREE_YEAR_CFO_TO_PAT_SERIES",
        "THREE_YEAR_FCF_TO_PAT_SERIES",
        "POSITIVE_FCF_YEARS_OUT_OF_3",
        "LATEST_CFO_TO_PAT_MINUS_PRIOR_MEDIAN",
      ],
      sourcePriority: [
        "EXISTING_CANONICAL_OBSERVATIONS",
        "STORED_ANNUAL_REPORTS",
        "PUBLIC_OFFICIAL_ANNUAL_REPORTS",
      ],
      reasonCodes: [
        "CFO_HISTORY_ONLY_ONE_ANNUAL_PERIOD_IN_CURRENT_FIXTURE",
        "PAT_CAPEX_FCF_HAVE_THREE_PERIODS_BUT_CFO_DOES_NOT",
        "NO_PARTIAL_CASH_FLOW_SCORE",
      ],
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      weightPercent: 10,
      readinessState: "RAW_INPUT_MINIMUM_PRESENT_DERIVATION_LOCK_REQUIRED",
      scoreReady: false,
      existingEvidence: [
        `NET_DEBT_EBITDA_COUNT_${rowsFor("NET_DEBT_EBITDA_ANNUAL").length}`,
        `INTEREST_COVERAGE_COUNT_${rowsFor("INTEREST_COVERAGE_ANNUAL").length}`,
        `TOTAL_DEBT_COUNT_${rowsFor("TOTAL_DEBT_ANNUAL").length}`,
        `CASH_EQUIVALENTS_COUNT_${rowsFor("CASH_EQUIVALENTS_ANNUAL").length}`,
        `EBITDA_COUNT_${rowsFor("EBITDA_ANNUAL").length}`,
      ],
      missingInputs: [
        "VERSIONED_BALANCE_SHEET_DERIVED_STATISTIC_PACKAGE",
        "MEDIAN_NET_DEBT_EBITDA",
        "MEDIAN_INTEREST_COVERAGE",
        "LATEST_MINUS_PRIOR_MEDIAN_NET_DEBT_EBITDA",
      ],
      sourcePriority: [
        "EXISTING_OFFICIAL_MANIFEST_FIXTURE",
      ],
      reasonCodes: [
        "THREE_YEAR_LEVERAGE_AND_COVERAGE_RAW_HISTORY_PRESENT",
        "SUPPORTING_DEBT_CASH_EBITDA_HISTORY_PRESENT",
        "H1_DOES_NOT_INFER_UNVERSIONED_DERIVED_STATISTICS",
      ],
    },
    {
      dimension: "BUSINESS_DURABILITY",
      weightPercent: 10,
      readinessState: "PARTIAL_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        `RND_EXPENSE_ANNUAL_COUNT_${rowsFor("RND_EXPENSE_ANNUAL").length}`,
        `RND_INTENSITY_PERCENT_COUNT_${rowsFor("RND_INTENSITY_PERCENT").length}`,
        "PUBLIC_OFFICIAL_SOURCE_FAMILIES_DISCOVERED_FOR_FIELD_FORCE_PIPELINE_LAUNCH_EXECUTION",
      ],
      missingInputs: [
        "REVIEWED_NORMALIZED_BRAND_THERAPY_LEADERSHIP_SCORE",
        "REVIEWED_NORMALIZED_FIELD_FORCE_PRODUCTIVITY_SCORE",
        "REVIEWED_NORMALIZED_RND_PRODUCTIVITY_SCORE",
        "REVIEWED_NORMALIZED_PIPELINE_CORPORATE_EXECUTION_SCORE",
        "COMPONENT_RATIONALE_CONFIDENCE_CONTRADICTION_AND_LINEAGE",
      ],
      sourcePriority: [
        "EXISTING_REVIEWED_ISSUER_EVIDENCE",
        "STORED_ANNUAL_REPORTS_AND_RESULTS",
        "PUBLIC_OFFICIAL_ISSUER_AND_EXCHANGE_ARTIFACTS",
      ],
      reasonCodes: [
        "RND_HISTORY_ONLY_PARTIALLY_COVERS_DURABILITY",
        "FOUR_REVIEWED_NORMALIZED_COMPONENTS_REQUIRED",
        "QUALITATIVE_CLAIMS_MAY_NOT_BECOME_SCORES_DIRECTLY",
      ],
    },
    {
      dimension: "VALUATION",
      weightPercent: 12,
      readinessState: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        "OWNER_APPROVED_COMBINED_VALUATION_WEIGHTING_40_40_20",
        "OWNER_APPROVED_PEER_COMBINED_SCORE_WEIGHTING_50_50",
        "CURRENT_TORNTPHARM_COMPONENT_SCORE_PACKAGE_NOT_FOUND",
      ],
      missingInputs: [
        "SELF_HISTORY_RELATIVE_VALUATION_SCORE",
        "PEER_RELATIVE_PE_SCORE",
        "PEER_RELATIVE_EV_EBITDA_SCORE",
        "PEER_RELATIVE_COMBINED_SCORE",
        "CASH_FLOW_CORROBORATION_SCORE",
        "CURRENT_AUTHORITATIVE_MARKET_PRICE_AND_MARKET_CAP_INPUTS",
        "CURRENT_REVIEWED_EARNINGS_AND_VALUATION_DENOMINATORS",
        "ELIGIBLE_DOMESTIC_FORMULATIONS_PEER_COHORT_INPUTS",
      ],
      sourcePriority: [
        "EXISTING_CANONICAL_MARKET_AND_FUNDAMENTAL_INPUTS",
        "STORED_MARKET_SOURCE_RECORDS_IF_ALREADY_PRESENT",
        "AUTHORIZED_MARKET_HISTORY_OR_CURRENT_PRICE_SOURCE_ONLY_IF_REQUIRED",
      ],
      reasonCodes: [
        "COMBINED_VALUATION_METHOD_APPROVED_BUT_COMPANY_COMPONENT_INPUTS_NOT_LOCKED",
        "MISSING_COMPONENT_RENORMALIZATION_PROHIBITED",
        "LEGACY_PROPOSAL_PREDECESSOR_FILES_ARE_NOT_AUTHORITY_OVER_APPROVED_SUCCESSOR_CONTRACTS",
      ],
    },
    {
      dimension: "MOMENTUM",
      weightPercent: 8,
      readinessState: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        "NIFTY_PHARMA_BENCHMARK_APPROVED",
        "NO_TORNTPHARM_GATE_H_MARKET_HISTORY_FIXTURE_FOUND",
      ],
      missingInputs: [
        "TORNTPHARM_12M_RETURN",
        "TORNTPHARM_6M_RETURN",
        "NIFTY_PHARMA_12M_RETURN",
        "TORNTPHARM_12M_RELATIVE_STRENGTH_VS_NIFTY_PHARMA",
        "EXACT_LOOKBACK_DATE_AND_TRADING_DAY_CONVENTION",
      ],
      sourcePriority: [
        "EXISTING_CANONICAL_MARKET_HISTORY",
        "STORED_MARKET_SOURCE_RECORDS",
        "AUTHORIZED_MARKET_HISTORY_PROVIDER_ONLY_IF_REQUIRED",
      ],
      reasonCodes: [
        "MARKET_HISTORY_INPUT_NOT_LOCKED",
        "NIFTY_BANK_AND_BANK_NBFC_MOMENTUM_LOGIC_PROHIBITED",
      ],
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      weightPercent: 6,
      readinessState: "INSUFFICIENT_EVIDENCE",
      scoreReady: false,
      existingEvidence: [
        "NO_TORNTPHARM_FOUR_QUARTER_OWNERSHIP_PACKAGE_FOUND",
        "G4_EVENT_ANTI_DOUBLE_COUNTING_RULE_APPROVED",
      ],
      missingInputs: [
        "MINIMUM_FOUR_QUARTERS_OWNERSHIP_HISTORY",
        "LATEST_OWNERSHIP_QUARTER",
        "OWNERSHIP_STABILITY_REVIEWED_COMPONENT_SCORE",
        "PLEDGE_CONTROL_RISK_REVIEWED_COMPONENT_SCORE",
        "NON_G4_GOVERNANCE_CONTEXT_REVIEWED_COMPONENT_SCORE",
      ],
      sourcePriority: [
        "EXISTING_CANONICAL_SHAREHOLDING_EVIDENCE",
        "STORED_EXCHANGE_SHAREHOLDING_FILINGS",
        "PUBLIC_OFFICIAL_EXCHANGE_OR_ISSUER_FILINGS",
      ],
      reasonCodes: [
        "OWNERSHIP_HISTORY_NOT_LOCKED",
        "PROMOTER_PERCENTAGE_ALONE_IS_NOT_A_SCORE",
        "ZERO_PLEDGE_ALONE_IS_NOT_AUTOMATIC_BEST_SCORE",
        "G4_EVENTS_MAY_NOT_BE_PENALIZED_TWICE",
      ],
    },
    {
      dimension: "RISK",
      weightPercent: 6,
      readinessState: "RUNTIME_REVIEW_REQUIRED",
      scoreReady: false,
      existingEvidence: [
        `REGULATORY_EVENT_CANDIDATE_COUNT_${regulatoryCandidateCount}`,
        "INDRAD_WARNING_TO_CLOSEOUT_CHAIN_REVIEWED",
        `GOVERNANCE_RUNTIME_STATE_${TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.gateState}`,
        "NO_TORNTPHARM_GATE_H_DRAWDOWN_VOLATILITY_FIXTURE_FOUND",
      ],
      missingInputs: [
        "COMPANY_WIDE_CURRENT_REGULATORY_SCOPE_CLASSIFICATION",
        "REGULATORY_MATERIALITY_CLASSIFICATION",
        "SUBSEQUENT_OUTCOME_CONTEXT",
        "TORNTPHARM_1Y_MAX_DRAWDOWN",
        "TORNTPHARM_1Y_VOLATILITY",
        "NIFTY_PHARMA_1Y_VOLATILITY",
        "RELATIVE_VOLATILITY_RATIO",
      ],
      sourcePriority: [
        "EXISTING_REVIEWED_REGULATOR_AND_ISSUER_EVIDENCE",
        "PUBLIC_OFFICIAL_REGULATOR_AND_ISSUER_RESEARCH",
        "EXISTING_CANONICAL_MARKET_HISTORY",
        "AUTHORIZED_MARKET_HISTORY_PROVIDER_ONLY_IF_REQUIRED",
      ],
      reasonCodes: [
        "INDRAD_SITE_HISTORY_IS_NOT_COMPANY_WIDE_CURRENT_CLEARANCE",
        "REGULATORY_MATERIALITY_MAY_NOT_BE_INFERRED",
        "MARKET_RISK_INPUTS_NOT_LOCKED",
        "NO_G4_DOUBLE_COUNTING",
      ],
    },
  ] as const satisfies readonly TorntpharmGateHInputReadinessRow[],
  crossCutting: {
    governanceRuntimeState:
      TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.gateState,
    globalGenericsOverlay: {
      candidateGrowthHistoryCount: exportGrowthCandidateCount,
      canonicalScoreInputReady: false,
      economicMaterialityPercentLocked: false,
      evidenceCompletenessLocked: false,
      evidenceConfidenceLocked: false,
      normalizedOverlaySignalLocked: false,
      contradictionStateLocked: false,
    },
  },
  scoreReadyDimensionCount: 0,
  allTenDimensionsScoreReady: false,
  h1Complete: true,
  h2Eligible: true,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const
