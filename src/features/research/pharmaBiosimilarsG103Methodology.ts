export const PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION =
  "PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_V1_CANDIDATE" as const

export const PHARMA_BIOSIMILARS_G10_3_METHODOLOGY = {
  version: PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION,
  state: "CHECKPOINT_B_CANDIDATE" as const,
  supportedPrimarySubprofile: "BIOPHARMA_BIOSIMILARS" as const,
  referenceSymbol: "BIOCON" as const,
  commonTenDimensionSpinePreserved: true,
  gateIRecommendationPolicyUnchanged: true,
  materialOverlayCreatesIndependentScore: false,
  materialOverlayNumericModifierApplied: false,
  materialOverlays: ["GLOBAL_GENERICS", "CDMO_CRAMS"] as const,
  noDomesticBandsReuse: true,
  noApiBandsReuse: true,
  noGlobalGenericsBandsReuse: true,
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
      method: "Biosimilars segment EBITDA-margin level, stability and trend using eight comparable quarters; R&D intensity remains corroborating context and cannot substitute for missing margin history.",
      mandatoryEvidence: "Eight comparable Biosimilars segment EBITDA-margin observations with consistent one-off treatment.",
    },
    {
      dimension: "GROWTH",
      method: "Biosimilars revenue growth across four comparable result cycles plus reviewed launch/approval execution; launch events corroborate rather than numerically replace revenue growth.",
      mandatoryEvidence: "Four comparable Biosimilars revenue-growth observations and official launch/approval lineage.",
    },
    {
      dimension: "CAPITAL_EFFICIENCY",
      method: "Primary-attributable return-on-invested-capital level, stability and trend over at least three comparable annual periods.",
      mandatoryEvidence: "Three comparable annual primary-attributable invested-capital and operating-return observations.",
    },
    {
      dimension: "CASH_FLOW",
      method: "Three matched annual periods of CFO/PAT and FCF/PAT, preserving capex intensity and acquisition/integration cash effects explicitly.",
      mandatoryEvidence: "Three matched annual CFO, PAT, capex and FCF periods on compatible consolidated semantics.",
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      method: "Listed-parent leverage, cash, interest burden and debt-reduction trajectory because financing authority sits at the listed group level.",
      mandatoryEvidence: "At least three comparable annual borrowings, cash and operating-earnings periods.",
    },
    {
      dimension: "BUSINESS_DURABILITY",
      method: "Molecule/geography/stage pipeline evidence, launch breadth, biologics manufacturing qualification/capacity and material partner economics; no qualitative pipeline bonus.",
      mandatoryEvidence: "Current molecule-level pipeline plus reviewed manufacturing and material-partner evidence.",
    },
    {
      dimension: "VALUATION",
      method: "Listed-parent current valuation, self-history context and FCF-yield corroboration; all required components must be present.",
      mandatoryEvidence: "Authoritative current market price plus normalized earnings, enterprise-value and FCF inputs with self-history.",
    },
    {
      dimension: "MOMENTUM",
      method: "Listed-parent 12M absolute, 6M absolute and NIFTY-Pharma-relative momentum.",
      mandatoryEvidence: "Current market history for BIOCON and NIFTY Pharma benchmark history.",
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      method: "Four-quarter ownership stability, pledge/control risk and non-regulatory governance context.",
      mandatoryEvidence: "Four comparable shareholding quarters plus current pledge/control evidence.",
    },
    {
      dimension: "RISK",
      method: "Current regulatory-site state, dated patent/exclusivity/litigation timeline and market-risk evidence; regulatory events are not double-penalized elsewhere.",
      mandatoryEvidence: "Official current site evidence, molecule/geography-linked patent or litigation timeline, and trailing market-risk evidence.",
    },
  ] as const,
} as const
