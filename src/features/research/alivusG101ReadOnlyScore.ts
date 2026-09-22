import { PHARMA_V1_DIMENSION_WEIGHTS } from "./pharmaGateGScoringMethodProposal"
import type { PharmaG7DimensionCode } from "./pharmaG7ReadOnlyScoringAdapter"
import {
  evaluateApiCapitalEfficiency,
  evaluateApiCashFlow,
  evaluateApiGrowth,
  evaluateApiMomentum,
  evaluateApiQuality,
  evaluateApiValuation,
  PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION,
} from "./pharmaApiG101NumericMethodology"

export const ALIVUS_G10_1_READ_ONLY_SCORE_VERSION =
  "ALIVUS_G10_1_API_READ_ONLY_SCORE_V1_CANDIDATE" as const

export const ALIVUS_G10_1_EVIDENCE_SNAPSHOT = {
  evidenceThrough: "2026-09-18",
  sourceReferences: [
    "ALIVUS_Q4_FY26_INVESTOR_PRESENTATION",
    "ALIVUS_FY25_INTEGRATED_ANNUAL_REPORT",
    "ALIVUS_FY24_INVESTOR_PRESENTATION",
    "ALIVUS_Q1_Q2_Q3_Q4_FY26_RESULTS",
    "ALIVUS_OFFICIAL_SHAREHOLDING_PATTERN",
    "ALIVUS_OFFICIAL_CREDIT_RATING_DISCLOSURE_2025_09_16",
    "PORTFOLIOAI_CANONICAL_MARKET_PRICE_2026_09_18",
    "PUBLIC_MARKET_HISTORY_ALIVUS_2025_09_TO_2026_09",
    "NIFTY_PHARMA_12M_CONTEXT_2026_09",
  ],
  eightQuarterEbitdaMarginsPercent: [28.0, 28.2, 31.3, 32.1, 30.1, 33.0, 36.4, 34.4],
  fourQuarterRevenueGrowthPercent: [2.2, 16.0, 4.8, 6.1],
  roiceFiveYearPercent: [40, 34, 32, 27, 30],
  patMnFy24ToFy26: [4709, 4857, 5645],
  fcfMnFy24ToFy26: [2845, 2328, 2590],
  capexMnFy24ToFy26: [1290, 1662, 3062],
  balanceSheet: {
    netCashPersistentFy24ToFy26: true,
    interestCoverAbove15x: true,
    resilienceScore: 75,
  },
  businessDurability: {
    capacityUtilizationScore: 85,
    rndPipelineDepthScore: 85,
    regulatedMarketReachScore: 85,
    backwardIntegrationCapexExecutionScore: 75,
  },
  valuation: {
    price: 1430.8,
    epsFy26: 45.99,
    sharesMn: 122.537052,
    cashMn: 7824,
    ebitdaMnFy26: 8577,
    fcfMnFy26: 2590,
  },
  momentum: {
    priceNow: 1430.8,
    price12mAgo: 946.85,
    price6mAgo: 972.7,
    niftyPharma12mReturnPercent: 21.4,
  },
  ownershipGovernance: {
    ownershipStabilityScore: 75,
    pledgeControlRiskScore: 75,
    nonG4GovernanceContextScore: 75,
  },
  risk: {
    regulatorySiteContextScore: 80,
    customerConcentrationScore: 60,
    apiPricingCycleScore: 60,
  },
} as const

const quality = evaluateApiQuality(ALIVUS_G10_1_EVIDENCE_SNAPSHOT.eightQuarterEbitdaMarginsPercent)
const growth = evaluateApiGrowth(ALIVUS_G10_1_EVIDENCE_SNAPSHOT.fourQuarterRevenueGrowthPercent)
const capitalEfficiency = evaluateApiCapitalEfficiency(ALIVUS_G10_1_EVIDENCE_SNAPSHOT.roiceFiveYearPercent)
const cashFlow = evaluateApiCashFlow({
  pat: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.patMnFy24ToFy26,
  fcf: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.fcfMnFy24ToFy26,
  capex: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.capexMnFy24ToFy26,
})
const valuation = evaluateApiValuation({
  price: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.price,
  eps: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.epsFy26,
  marketCapMn: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.price * ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.sharesMn,
  cashMn: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.cashMn,
  ebitdaMn: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.ebitdaMnFy26,
  fcfMn: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.valuation.fcfMnFy26,
})
const momentum = evaluateApiMomentum(ALIVUS_G10_1_EVIDENCE_SNAPSHOT.momentum)

const balanceSheetCredit = 100 * 0.5 + 100 * 0.3 + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.balanceSheet.resilienceScore * 0.2
const businessDurability =
  ALIVUS_G10_1_EVIDENCE_SNAPSHOT.businessDurability.capacityUtilizationScore * 0.3
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.businessDurability.rndPipelineDepthScore * 0.25
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.businessDurability.regulatedMarketReachScore * 0.25
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.businessDurability.backwardIntegrationCapexExecutionScore * 0.2
const ownershipGovernance =
  ALIVUS_G10_1_EVIDENCE_SNAPSHOT.ownershipGovernance.ownershipStabilityScore * 0.45
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.ownershipGovernance.pledgeControlRiskScore * 0.35
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.ownershipGovernance.nonG4GovernanceContextScore * 0.2
const risk =
  ALIVUS_G10_1_EVIDENCE_SNAPSHOT.risk.regulatorySiteContextScore * 0.45
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.risk.customerConcentrationScore * 0.35
  + ALIVUS_G10_1_EVIDENCE_SNAPSHOT.risk.apiPricingCycleScore * 0.2

const scoreByDimension: Readonly<Record<PharmaG7DimensionCode, number>> = {
  QUALITY: quality.score,
  GROWTH: growth.score,
  CAPITAL_EFFICIENCY: capitalEfficiency.score,
  CASH_FLOW: cashFlow.score,
  BALANCE_SHEET_CREDIT: balanceSheetCredit,
  BUSINESS_DURABILITY: businessDurability,
  VALUATION: valuation.score,
  MOMENTUM: momentum.score,
  OWNERSHIP_GOVERNANCE: ownershipGovernance,
  RISK: risk,
}

const overallScore = PHARMA_V1_DIMENSION_WEIGHTS.reduce(
  (sum, item) => sum + scoreByDimension[item.dimensionCode as PharmaG7DimensionCode] * item.weight / 100,
  0,
)

const dimensions = PHARMA_V1_DIMENSION_WEIGHTS.map((item) => ({
  dimensionCode: item.dimensionCode as PharmaG7DimensionCode,
  finalScore: scoreByDimension[item.dimensionCode as PharmaG7DimensionCode],
  primaryScoreContractVersion: PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION,
  evidenceLineage: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.sourceReferences,
  methodologyLineage: [{
    decisionId: "G10.1_API_CHECKPOINT_B",
    contractVersion: PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION,
  }],
  readinessCoverage: 1,
}))

export const ALIVUS_G10_1_READ_ONLY_SCORE_RESULT = {
  securitySymbol: "ALIVUS",
  profileCode: "PHARMA_V1",
  primarySubprofile: "API_BULK_DRUGS",
  contractVersion: ALIVUS_G10_1_READ_ONLY_SCORE_VERSION,
  overallScore,
  dimensions,
  governance: {
    constraintState: "CLEAR",
  },
  materialOverlay: {
    code: null,
    numericModifierApplied: false,
    secondIndependentStockScore: null,
  },
  emergingWatch: {
    code: "CDMO_CRAMS",
    numericParticipation: false,
  },
  componentAudit: {
    quality,
    growth,
    capitalEfficiency,
    cashFlow,
    valuation,
    momentum,
    balanceSheetCredit,
    businessDurability,
    ownershipGovernance,
    risk,
  },
  evidenceLineage: ALIVUS_G10_1_EVIDENCE_SNAPSHOT.sourceReferences,
  methodologyLineage: [{
    decisionId: "G10.1_API_CHECKPOINT_B",
    contractVersion: PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION,
  }],
  readOnly: true,
  nonPersisting: true,
  persistedScoreRunEnabled: false,
} as const
