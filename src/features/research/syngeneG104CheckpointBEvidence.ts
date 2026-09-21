import { PHARMA_CDMO_G10_4_METHODOLOGY_VERSION } from "./pharmaCdmoG104Methodology"

export const SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE_VERSION =
  "SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE_V1" as const

export const SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE = {
  version: SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE_VERSION,
  methodologyVersion: PHARMA_CDMO_G10_4_METHODOLOGY_VERSION,
  symbol: "SYNGENE" as const,
  evidenceThrough: "2026-09-21" as const,
  sources: [
    {
      code: "SYNGENE_FY26_ANNUAL_REPORT",
      url: "https://annualreport.syngeneintl.com/",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "SYNGENE_FY26_QUALITY_MANAGEMENT",
      url: "https://annualreport.syngeneintl.com/quality-management.html",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "SYNGENE_FY25_CFO_MESSAGE",
      url: "https://annualreport.syngeneintl.com/message-from-our-chief-financial-officer.html",
      authority: "ISSUER_OFFICIAL",
    },
    {
      code: "SYNGENE_FY25_CDMO_REVIEW",
      url: "https://annualreport.syngeneintl.com/contract-development-and-manufacturing-services.html",
      authority: "ISSUER_OFFICIAL",
    },
  ] as const,
  observed: {
    fy25: {
      revenueGrowthPercent: 4,
      operatingEbitdaMarginPercent: 29,
      operatingCashFlowCr: 1168,
      netCashCr: 1279,
      largeMoleculeRevenueSharePercent: 25,
      smallMoleculeCdmoRevenueSharePercent: 12,
      baseCapexUsdMn: 48,
      capexIncludingUsBiologicsAcquisitionUsdMn: 85,
    },
    fy26: {
      revenueFromOperationsMn: 37387,
      profitAfterTaxBeforeExceptionalMn: 3799,
      activeCustomersApprox: 400,
      scientists: 5778,
      totalWorkforce: 8373,
      rndAndManufacturingAreaSqFtApprox: 3000000,
    },
    capacityAndExecution: {
      usBiologicsFacilityCapacityLitres: 20000,
      biologicsUnit3ReadyForOperationsFy25: true,
      mangaluruApiCommercialManufacturingActive: true,
      integratedSmallAndLargeMoleculeCapability: true,
    },
  },
  dimensionEvidence: [
    {
      dimension: "QUALITY",
      state: "INCOMPLETE",
      reason:
        "Current annual quality and margin evidence is available, but the locked methodology requires eight comparable quarterly operating-EBITDA-margin observations.",
    },
    {
      dimension: "GROWTH",
      state: "PARTIAL",
      reason:
        "FY25 growth and management visibility language are available, but four comparable growth observations plus an approved quantitative revenue-visibility equivalent are not locked.",
    },
    {
      dimension: "CAPITAL_EFFICIENCY",
      state: "INCOMPLETE",
      reason:
        "Three comparable annual ROCE/ROIC observations with consistent acquisition/CWIP treatment are not normalized in the bounded package.",
    },
    {
      dimension: "CASH_FLOW",
      state: "INCOMPLETE",
      reason:
        "FY25 operating cash flow is disclosed, but three matched annual CFO/PAT/capex/FCF periods on compatible semantics are not locked.",
    },
    {
      dimension: "BALANCE_SHEET_CREDIT",
      state: "PARTIAL",
      reason:
        "FY25 net cash and cash generation are disclosed, but three comparable annual borrowings/cash/earnings periods are not normalized.",
    },
    {
      dimension: "BUSINESS_DURABILITY",
      state: "INCOMPLETE",
      reason:
        "Service breadth and capacity additions are well documented, but mandatory disclosed client concentration and compatible capacity-utilization evidence are not complete.",
    },
    {
      dimension: "VALUATION",
      state: "INCOMPLETE",
      reason:
        "Current authoritative market price, self-history valuation context and FCF-yield corroboration are not locked.",
    },
    {
      dimension: "MOMENTUM",
      state: "INCOMPLETE",
      reason:
        "Required 12M, 6M and NIFTY-Pharma-relative market history is not locked.",
    },
    {
      dimension: "OWNERSHIP_GOVERNANCE",
      state: "INCOMPLETE",
      reason:
        "The required four-quarter ownership and current pledge/control normalization are not present in this bounded package.",
    },
    {
      dimension: "RISK",
      state: "INCOMPLETE",
      reason:
        "Current quality/site context is available, but mandatory disclosed client concentration and trailing drawdown/volatility evidence remain incomplete.",
    },
  ] as const,
  materialOverlays: [] as const,
  overlayNumericParticipation: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
} as const

export const SYNGENE_G10_4_MANDATORY_EVIDENCE_BLOCKERS =
  SYNGENE_G10_4_CHECKPOINT_B_EVIDENCE.dimensionEvidence.filter(
    (item) => item.state === "INCOMPLETE",
  )
