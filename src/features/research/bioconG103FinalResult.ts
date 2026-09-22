import { BIOCON_G10_3_CHECKPOINT_B_EVIDENCE_VERSION } from "./bioconG103CheckpointBEvidence"
import { PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION } from "./pharmaBiosimilarsG103Methodology"

export const BIOCON_G10_3_FINAL_RESULT_VERSION =
  "BIOCON_G10_3_FINAL_RESULT_V1_FAIL_CLOSED" as const

export const BIOCON_G10_3_FINAL_RESULT = {
  version: BIOCON_G10_3_FINAL_RESULT_VERSION,
  stage: "G10.3" as const,
  checkpoint: "B" as const,
  state: "COMPLETE_FAIL_CLOSED" as const,
  symbol: "BIOCON" as const,
  primarySubprofile: "BIOPHARMA_BIOSIMILARS" as const,
  materialOverlays: ["GLOBAL_GENERICS", "CDMO_CRAMS"] as const,
  methodologyVersion: PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION,
  evidenceVersion: BIOCON_G10_3_CHECKPOINT_B_EVIDENCE_VERSION,
  scoreState: "SCORE_NOT_COMPUTABLE" as const,
  recommendationState: "RECOMMENDATION_NOT_COMPUTABLE" as const,
  noPartialScoreReconstruction: true,
  noRenormalization: true,
  materialOverlayNumericParticipation: false,
  secondIndependentStockScore: null,
  blockerGroups: [
    {
      code: "QUALITY_EIGHT_QUARTER_BIOSIMILARS_MARGIN_HISTORY_INCOMPLETE",
      details: [
        "Eight comparable Biosimilars EBITDA-margin quarters are mandatory under the G10.3 methodology candidate.",
        "The bounded evidence package does not fabricate or splice an eight-quarter series.",
      ],
    },
    {
      code: "CAPITAL_EFFICIENCY_PRIMARY_ATTRIBUTION_INCOMPLETE",
      details: [
        "Three comparable annual primary-attributable invested-capital return observations are not locked.",
        "Group-level returns are not silently substituted for Biosimilars-primary capital efficiency.",
      ],
    },
    {
      code: "CASH_FLOW_MATCHED_HISTORY_INCOMPLETE",
      details: [
        "Three matched annual CFO, PAT, capex and FCF periods with compatible semantics are not normalized.",
        "No partial cash-flow score is reconstructed.",
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
        "Official shareholding disclosures exist, but the required four-quarter ownership and pledge/control normalization is incomplete.",
      ],
    },
    {
      code: "RISK_PATENT_LITIGATION_AND_MARKET_RISK_INCOMPLETE",
      details: [
        "Regulatory-site evidence is available, including the April 2026 Biosimilars-site PLI outcome.",
        "Mandatory molecule/geography-linked patent or litigation timeline and trailing market-risk evidence remain incomplete.",
      ],
    },
  ] as const,
  gateI: {
    executed: false,
    reason: "NO_COMPLETE_TEN_DIMENSION_SCORE" as const,
    policyUnchanged: true,
  },
  isolation: {
    auropharmaBiosimilarsExposureResolved: false,
    reason: "G10.3 methodology availability does not resolve AUROPHARMA company-specific exposure classification.",
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
