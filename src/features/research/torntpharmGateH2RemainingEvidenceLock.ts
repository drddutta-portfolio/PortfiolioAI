import {
  PHARMA_OVERLAY_MODIFIER_CONTRACT,
  buildPharmaOverlayModifierProposal,
} from "./pharmaOverlayModifierContract"
import {
  TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT,
} from "./torntpharmGateGFinal3RuntimeMapping"

export const TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION =
  "TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_V1" as const

export const TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT = {
  snapshotDate: "2026-09-20" as const,
  canonicalDatabase: {
    marketMetricObservationsForTorntpharm: 0,
    marketPriceHistoryRowsForTorntpharm: 0,
    reviewedDomesticFormulationsAssignments: ["TORNTPHARM"] as const,
  },
  valuation: {
    latestAvailableSelfHistoryObservation: {
      metricCode: "PE_5Y_AVG_IMPLIED_UPSIDE_PERCENT" as const,
      numericValue: -14.87,
      sourceCode: "TRENDLYNE_MCP" as const,
      freshUntilDate: "2026-09-18" as const,
      staleAtSnapshot: true,
    },
    currentPeTtmObservationAvailable: true,
    currentAuthoritativeMarketPriceAvailable: false,
    reviewedDomesticPeerCohortAvailable: false,
    fcfYieldCurrentMarketCapAuthorityAvailable: false,
  },
  overlay: {
    code: "GLOBAL_GENERICS" as const,
    reviewedAssignmentState: "MATERIAL" as const,
    reviewedConfidence: "MEDIUM" as const,
    evidenceBasisEconomicMaterialityPercent: 12.05,
    contractMinimumMaterialOverlayPercent:
      PHARMA_OVERLAY_MODIFIER_CONTRACT.materialOverlayMinimumPercent,
  },
  governanceRuntime: {
    gateState: TORNTPHARM_GATE_G_FINAL_3_RUNTIME_RESULT.gateState,
  },
} as const

export const TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK =
  buildPharmaOverlayModifierProposal({
    overlayCode: "GLOBAL_GENERICS",
    overlayRole: "BELOW_SCORING_MATERIALITY",
    dimensionCode: "GROWTH",
    economicMaterialityPercent:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay
        .evidenceBasisEconomicMaterialityPercent,
    evidenceCompleteness: null,
    evidenceConfidence:
      TORNTPHARM_GATE_H2_CANONICAL_READ_ONLY_SNAPSHOT.overlay.reviewedConfidence,
    normalizedOverlaySignal: null,
    contradictionState: "NONE",
  })

export const TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK = {
  version: TORNTPHARM_GATE_H2_REMAINING_EVIDENCE_LOCK_VERSION,
  state: "READ_ONLY_BLOCKER_LOCK" as const,
  dimensions: {
    businessDurability: {
      scoreReady: false,
      blockers: [
        "BRAND_THERAPY_LEADERSHIP_LICENSED_MARKET_CROSS_CHECK_REQUIRED",
      ] as const,
    },
    valuation: {
      scoreReady: false,
      blockers: [
        "CURRENT_AUTHORITATIVE_MARKET_PRICE_ABSENT",
        "SELF_HISTORY_OBSERVATION_STALE_AT_SNAPSHOT",
        "REVIEWED_DOMESTIC_FORMULATIONS_PEER_COHORT_ABSENT",
        "CURRENT_MARKET_CAP_AUTHORITY_FOR_FCF_YIELD_ABSENT",
      ] as const,
    },
    momentum: {
      scoreReady: false,
      blockers: [
        "TORNTPHARM_CANONICAL_PRICE_HISTORY_ABSENT",
        "NIFTY_PHARMA_CANONICAL_BENCHMARK_HISTORY_ABSENT",
        "DERIVED_12M_6M_RELATIVE_STRENGTH_INPUTS_ABSENT",
      ] as const,
    },
    risk: {
      scoreReady: false,
      blockers: [
        "TORNTPHARM_1Y_MAX_DRAWDOWN_ABSENT",
        "TORNTPHARM_1Y_VOLATILITY_ABSENT",
        "NIFTY_PHARMA_1Y_VOLATILITY_ABSENT",
      ] as const,
    },
  },
  globalGenericsOverlay: {
    numericReady: false,
    eligibilityState:
      TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK.modifierState,
    reasonCodes:
      TORNTPHARM_GATE_H2_GLOBAL_GENERICS_ELIGIBILITY_CHECK.reasonCodes,
    reviewedMaterialityLabel: "MATERIAL" as const,
    evidenceBasisEconomicMaterialityPercent: 12.05,
    minimumNumericMaterialityPercent:
      PHARMA_OVERLAY_MODIFIER_CONTRACT.materialOverlayMinimumPercent,
    semanticReconciliation:
      "MATERIAL_BUSINESS_EXPOSURE_AT_GATE_E_BUT_BELOW_15_PERCENT_NUMERIC_OVERLAY_THRESHOLD" as const,
  },
  requiredNextActions: [
    "SEPARATE_EXPLICIT_AUTHORIZATION_FOR_MARKET_HISTORY_PROVIDER_REFRESH_OR_EQUIVALENT_APPROVED_CANONICAL_IMPORT",
    "SEPARATE_EXPLICIT_AUTHORIZATION_FOR_LICENSED_MARKET_SOURCE_BRAND_THERAPY_CROSS_CHECK",
    "PUBLIC_OFFICIAL_RESEARCH_FOR_FIELD_FORCE_HISTORY_AND_COMPANY_WIDE_REGULATORY_SCOPE_MAY_CONTINUE_READ_ONLY",
    "GLOBAL_GENERICS_NUMERIC_OVERLAY_EXCLUDED_BELOW_15_PERCENT_THRESHOLD_WHILE_MATERIAL_BUSINESS_EXPOSURE_REMAINS_VALID",
  ] as const,
  allTenDimensionsScoreReady: false,
  h2ExitEligible: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
