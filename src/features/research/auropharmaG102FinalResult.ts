export const AUROPHARMA_G10_2_FINAL_RESULT_VERSION =
  "AUROPHARMA_G10_2_FINAL_RESULT_V1_FAIL_CLOSED" as const

export const AUROPHARMA_G10_2_FINAL_RESULT = {
  version: AUROPHARMA_G10_2_FINAL_RESULT_VERSION,
  stage: "G10.2" as const,
  checkpoint: "B" as const,
  state: "COMPLETE_FAIL_CLOSED" as const,
  symbol: "AUROPHARMA" as const,
  primarySubprofile: "GLOBAL_GENERICS" as const,
  methodologyState: "OWNER_APPROVED" as const,
  scoreState: "SCORE_NOT_COMPUTABLE" as const,
  recommendationState: "RECOMMENDATION_NOT_COMPUTABLE" as const,
  noPartialScoreReconstruction: true,
  noRenormalization: true,
  blockerGroups: [
    {
      code: "GROWTH_PRICE_EROSION_METHOD_AND_EVIDENCE_INCOMPLETE",
      details: [
        "The Global Generics price-erosion curve remains proposal-only.",
        "Required disclosed ASP/price evidence across comparable periods is not complete.",
      ],
    },
    {
      code: "VALUATION_REQUIRED_COMPONENTS_INCOMPLETE",
      details: [
        "Required current peer-relative valuation inputs are incomplete.",
        "Required self-history valuation context is not fully established.",
        "Required FCF-yield corroboration is incomplete.",
      ],
    },
    {
      code: "MOMENTUM_REQUIRED_6M_AND_BENCHMARK_EVIDENCE_INCOMPLETE",
      details: [
        "6M stock return is absent from the preserved Trendlyne evidence.",
        "The approved 12M/6M/NIFTY-Pharma-relative momentum method cannot be reconstructed from the available payload without substitution.",
      ],
    },
    {
      code: "RISK_REQUIRED_DRAWDOWN_VOLATILITY_EVIDENCE_INCOMPLETE",
      details: [
        "Trailing-1Y drawdown and volatility evidence is not available in the preserved approved payload.",
        "Angel One authentication passes, but the historical getCandleData path returned HTTP 403 in this session.",
      ],
    },
    {
      code: "OWNERSHIP_REQUIRED_CURRENT_AND_MULTI_PERIOD_CONTEXT_INCOMPLETE",
      details: [
        "Promoter-related fields are present, but the exact four-period current holding context required by the approved method is not fully normalized.",
      ],
    },
  ] as const,
  providerEvidenceSummary: {
    preservedTrendlyneCalls: 3,
    successfulGapFillTrendlyneCalls: 2,
    totalTrendlyneResultsReused: 5,
    angelAuthenticationVerified: true,
    angelHistoricalPathHealthy: false,
    productionWrites: 0,
  },
  gateI: {
    executed: false,
    reason: "NO_COMPLETE_TEN_DIMENSION_SCORE" as const,
  },
  safety: {
    scorePersistenceEnabled: false,
    recommendationPersistenceEnabled: false,
    positionSizingEnabled: false,
    aiInterpretationEnabled: false,
    productionMutationPerformed: false,
    deploymentPerformed: false,
    prMergePerformed: false,
  },
} as const
