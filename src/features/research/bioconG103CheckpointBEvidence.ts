import { PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION } from "./pharmaBiosimilarsG103Methodology"

export const BIOCON_G10_3_CHECKPOINT_B_EVIDENCE_VERSION =
  "BIOCON_G10_3_CHECKPOINT_B_EVIDENCE_V1" as const

export const BIOCON_G10_3_CHECKPOINT_B_EVIDENCE = {
  version: BIOCON_G10_3_CHECKPOINT_B_EVIDENCE_VERSION,
  methodologyVersion: PHARMA_BIOSIMILARS_G10_3_METHODOLOGY_VERSION,
  symbol: "BIOCON" as const,
  evidenceThrough: "2026-09-21" as const,
  sources: [
    {
      code: "BIOCON_FY26_INVESTOR_PRESENTATION",
      url: "https://www.biocon.com/docs/IR-Presentation-June2026.pdf",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "BIOCON_Q4_FY26_RESULTS",
      url: "https://www.biocon.com/biocon-q4fy26-revenue/",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "BIOCON_Q1_FY27_RESULTS",
      url: "https://www.biocon.com/biocon-q1fy27-revenue/",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "BIOCON_SHAREHOLDING_PATTERN",
      url: "https://www.biocon.com/investor-relations/stock-exchange-disclosures/shareholding-pattern/",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "BIOCON_COMPANY_STATEMENTS_2026",
      url: "https://www.biocon.com/news-biocon/company-statements/",
      authority: "ISSUER_OFFICIAL",
    },
  ] as const,
  observed: {
    fy26: {
      groupRevenueFromOperationsCr: 16927,
      groupEbitdaCr: 3798,
      groupNetRndCr: 982,
      groupBorrowingsCr: 14825,
      groupCashAndBankCr: 4493,
      groupNetDebtCr: 10332,
      biosimilarsRevenueCr: 10431,
      biosimilarsRevenueGrowthPercent: 16,
      biosimilarsEbitdaCr: 2751,
      biosimilarsEbitdaMarginPercent: 26,
      biosimilarsRndPercentOfRevenue: 7,
      biosimilarsPatientsMillion: 6.5,
    },
    q1fy27: {
      biosimilarsRevenueCr: 2855,
      biosimilarsRevenueGrowthPercent: 16,
      groupEbitdaMarginPercent: 21,
      groupNetRndCr: 240,
    },
    regulatoryContext: {
      biosimilarsBengaluruPliForm483Observations: 5,
      observationsDescribedAsProcedural: true,
      noDataIntegrityOrQualityOversightObservationReported: true,
      repeatObservationsReported: false,
    },
    recentExecution: {
      denosumabUsLaunch: true,
      afliberceptUsLaunch: true,
      ustekinumabAutoinjectorUsApproval: true,
      pegfilgrastimJapanApproval: true,
      pertuzumabEmaChmpPositiveOpinion: true,
    },
  },
  dimensionEvidence: [
    {
      dimension: "QUALITY",
      state: "INCOMPLETE",
      reason: "The locked methodology requires eight comparable Biosimilars EBITDA-margin quarters; the current bounded package does not lock eight comparable quarters.",
    },
    {
      dimension: "GROWTH",
      state: "PARTIAL",
      reason: "FY26 and Q1FY27 Biosimilars growth plus launch/approval execution are official, but four comparable result-cycle growth observations are not yet locked into this package.",
    },
    {
      dimension: "CAPITAL_EFFICIENCY",
      state: "INCOMPLETE",
      reason: "Three comparable annual primary-attributable invested-capital return observations are not disclosed in the bounded evidence package.",
    },
    {
      dimension: "CASH_FLOW",
      state: "INCOMPLETE",
      reason: "Three matched annual CFO/PAT/capex/FCF periods with compatible semantics are not yet normalized in the bounded evidence package.",
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      state: "PARTIAL",
      reason: "FY22-FY26 balance-sheet series and FY26 net debt are available, but the complete approved numeric scoring normalization is not locked for G10.3.",
    },
    {
      dimension: "BUSINESS_DURABILITY",
      state: "PARTIAL",
      reason: "Official launch, approval and manufacturing evidence is strong, but molecule-level partner economics and full manufacturing-capacity/utilization evidence are not complete.",
    },
    {
      dimension: "VALUATION",
      state: "INCOMPLETE",
      reason: "Current authoritative market price, normalized self-history and FCF-yield corroboration have not been locked for this checkpoint.",
    },
    {
      dimension: "MOMENTUM",
      state: "INCOMPLETE",
      reason: "Required 12M, 6M and NIFTY-Pharma-relative market history is not locked in the bounded evidence package.",
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      state: "PARTIAL",
      reason: "Official shareholding disclosures exist, but four-quarter ownership and pledge/control fields are not normalized in this package.",
    },
    {
      dimension: "RISK",
      state: "INCOMPLETE",
      reason: "Current regulatory-site evidence exists, but the mandatory molecule/geography-linked patent/litigation timeline and trailing market-risk evidence are not complete.",
    },
  ] as const,
  materialOverlays: ["GLOBAL_GENERICS", "CDMO_CRAMS"] as const,
  overlayNumericParticipation: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
} as const

export const BIOCON_G10_3_MANDATORY_EVIDENCE_BLOCKERS =
  BIOCON_G10_3_CHECKPOINT_B_EVIDENCE.dimensionEvidence.filter(
    (item) => item.state === "INCOMPLETE",
  )
