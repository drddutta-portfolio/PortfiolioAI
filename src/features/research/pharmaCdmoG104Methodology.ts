export const PHARMA_CDMO_G10_4_METHODOLOGY_VERSION =
  "PHARMA_CDMO_G10_4_METHODOLOGY_V1_CANDIDATE" as const

export const PHARMA_CDMO_G10_4_METHODOLOGY = {
  version: PHARMA_CDMO_G10_4_METHODOLOGY_VERSION,
  state: "CHECKPOINT_B_CANDIDATE" as const,
  supportedPrimarySubprofile: "CDMO_CRAMS" as const,
  referenceSymbol: "SYNGENE" as const,
  commonTenDimensionSpinePreserved: true,
  gateIRecommendationPolicyUnchanged: true,
  materialOverlayCreatesIndependentScore: false,
  materialOverlayNumericModifierApplied: false,
  materialOverlays: [] as const,
  noDomesticBandsReuse: true,
  noApiBandsReuse: true,
  noGlobalGenericsBandsReuse: true,
  noBiosimilarsBandsReuse: true,
  noBankNbfcBandsReuse: true,
  missingMandatoryComponentTreatment: "FAIL_CLOSED" as const,
  noPartialScoreReconstruction: true,
  noHiddenRenormalization: true,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  positionSizingEnabled: false,
  aiInterpretationEnabled: false,
  dimensionContracts: [
    {
      dimension: "QUALITY",
      method:
        "Eight comparable quarterly operating-EBITDA margins plus current quality/regulatory execution. Margin history is primary; audit outcomes corroborate and cannot substitute for missing comparable quarters.",
      mandatoryEvidence:
        "Eight comparable quarterly operating-EBITDA-margin observations with compatible treatment of acquisition/ramp effects.",
    },
    {
      dimension: "GROWTH",
      method:
        "Four comparable revenue-growth observations combined with reviewed service/project-mix progression. Revenue visibility is mandatory and cannot be replaced by qualitative pipeline language.",
      mandatoryEvidence:
        "Four comparable revenue-growth observations plus an approved revenue-visibility equivalent such as signed backlog, committed capacity, long-term contract coverage or management-disclosed visibility.",
    },
    {
      dimension: "CAPITAL_EFFICIENCY",
      method:
        "Three comparable annual ROCE/ROIC observations with explicit treatment of acquisitions, CWIP and newly commissioned capacity.",
      mandatoryEvidence:
        "Three comparable annual operating-return and invested-capital observations using consistent acquisition/CWIP semantics.",
    },
    {
      dimension: "CASH_FLOW",
      method:
        "Three matched annual periods of CFO/PAT and FCF/PAT with capex and acquisition cash effects preserved explicitly.",
      mandatoryEvidence:
        "Three matched annual CFO, PAT, capex and FCF periods on compatible consolidated semantics.",
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      method:
        "Three comparable annual periods of borrowings, cash, interest burden and debt/cash trajectory at the listed-company level.",
      mandatoryEvidence:
        "At least three comparable annual borrowings, cash and operating-earnings periods.",
    },
    {
      dimension: "BUSINESS_DURABILITY",
      method:
        "Revenue visibility, disclosed client concentration, service/project mix, capacity utilization and capex-ramp execution. Missing client concentration or capacity utilization remains unavailable rather than neutral.",
      mandatoryEvidence:
        "Current revenue-visibility evidence plus disclosed client concentration and compatible capacity-utilization evidence.",
    },
    {
      dimension: "VALUATION",
      method:
        "Listed-parent current valuation, self-history context and FCF-yield corroboration; all required components must be present.",
      mandatoryEvidence:
        "Authoritative current market price plus normalized earnings, enterprise-value and FCF inputs with self-history.",
    },
    {
      dimension: "MOMENTUM",
      method:
        "Listed-parent 12M absolute, 6M absolute and NIFTY-Pharma-relative momentum.",
      mandatoryEvidence:
        "Current market history for SYNGENE and NIFTY Pharma benchmark history.",
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      method:
        "Four-quarter ownership stability, pledge/control risk and non-regulatory governance context.",
      mandatoryEvidence:
        "Four comparable shareholding quarters plus current pledge/control evidence.",
    },
    {
      dimension: "RISK",
      method:
        "Client concentration, current site/quality state, capacity-ramp execution and trailing market-risk evidence. The same quality event is not double-penalized across dimensions.",
      mandatoryEvidence:
        "Disclosed client concentration, current site/quality evidence and trailing drawdown/volatility evidence.",
    },
  ] as const,
} as const
