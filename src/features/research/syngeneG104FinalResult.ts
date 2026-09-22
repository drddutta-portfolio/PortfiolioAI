import { PHARMA_CDMO_G10_4_METHODOLOGY_VERSION } from "./pharmaCdmoG104Methodology"
import { SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE_VERSION } from "./syngeneG104CheckpointBEvidence"

export const SYNGENE_G10_4_FINAL_RESULT_VERSION =
  "SYNGENE_G10_4_FINAL_RESULT_V1_FAIL_CLOSED" as const

export const SYNGENE_G10_4_FINAL_RESULT = {
  version: SYNGENE_G10_4_FINAL_RESULT_VERSION,
  stage: "G10.4" as const,
  checkpoint: "B" as const,
  state: "COMPLETE_FAIL_CLOSED" as const,
  symbol: "SYNGENE" as const,
  primarySubprofile: "CDMO_CRAMS" as const,
  materialOverlays: [] as const,
  methodologyVersion: PHARMA_CDMO_G10_4_METHODOLOGY_VERSION,
  evidenceVersion: SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE_VERSION,
  scoreState: "SCORE_NOT_COMPUTABLE" as const,
  recommendationState: "RECOMMENDATION_NOT_COMPUTABLE" as const,
  noPartialScoreReconstruction: true,
  noRenormalization: true,
  materialOverlayNumericParticipation: false,
  secondIndependentStockScore: null,
  blockerGroups: [
    {
      code: "QUALITY_EIGHT_QUARTER_MARGIN_HISTORY_INCOMPLETE",
      details: [
        "Eight comparable quarterly operating-EBITDA-margin observations are mandatory under the G10.4 methodology candidate.",
        "Annual margin evidence is not expanded into a synthetic quarterly series.",
      ],
    },
    {
      code: "CAPITAL_EFFICIENCY_AND_CASH_FLOW_HISTORY_INCOMPLETE",
      details: [
        "Three comparable annual ROCE/ROIC observations with acquisition/CWIP treatment are not normalized.",
        "Three matched CFO/PAT/capex/FCF periods are also incomplete, so no partial financial-quality score is reconstructed.",
      ],
    },
    {
      code: "CDMO_DURABILITY_MANDATORY_DISCLOSURES_INCOMPLETE",
      details: [
        "Mandatory disclosed client concentration is not locked in the bounded package.",
        "Compatible capacity-utilization evidence is also incomplete; physical capacity additions do not substitute for utilization.",
      ],
    },
    {
      code: "VALUATION_AND_MOMENTUM_MARKET_PACKAGE_INCOMPLETE",
      details: [
        "Current valuation self-history/FCF corroboration is not locked.",
        "12M, 6M and NIFTY-Pharma-relative momentum evidence is not locked.",
      ],
    },
    {
      code: "OWNERSHIP_FOUR_QUARTER_NORMALIZATION_INCOMPLETE",
      details: [
        "The required four-quarter ownership and current pledge/control normalization is incomplete.",
      ],
    },
    {
      code: "RISK_CLIENT_CONCENTRATION_AND_MARKET_RISK_INCOMPLETE",
      details: [
        "Current quality/site context is available.",
        "Mandatory disclosed client concentration and trailing drawdown/volatility evidence remain incomplete.",
      ],
    },
  ] as const,
  gateI: {
    executed: false,
    reason: "NO_COMPLETE_TEN_DIMENSION_SCORE" as const,
    policyUnchanged: true,
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
