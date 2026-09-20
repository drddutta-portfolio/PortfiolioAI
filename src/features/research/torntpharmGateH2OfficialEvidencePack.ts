import {
  evaluateDomesticCashFlow,
} from "./pharmaDomesticGateGFinal2NumericMethodology"
import {
  evaluatePharmaOperatingMarginCurveProposal,
} from "./pharmaOperatingMarginCurveProposal"
import {
  evaluatePharmaSegmentGrowthCurveProposal,
} from "./pharmaSegmentGrowthCurveProposal"

export const TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION =
  "TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_V1" as const

export const TORNTPHARM_GATE_H2_OFFICIAL_SOURCES = {
  q1Fy25:
    "https://torrentpharma.com/pdf/investors/Press_Release_Q1_24_25.pdf",
  q2Fy25:
    "https://torrentpharma.com/pdf/investors/Torrent_Pharma_Q2_FY_25_Results_Press_Release.pdf",
  q1Fy26:
    "https://www.torrentpharma.com/assets/Torrent_Pharma_Press_Release_Q1_FY_26_Results_a857463993.pdf",
  q2Fy26:
    "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q2_25_26_90203574c9.pdf",
  q3Fy26:
    "https://www.torrentpharma.com/docs/Press_release_Q3_25_26_V6_9c697bb7fe.pdf",
  q4Fy26:
    "https://www.torrentpharma.com/docs/Torrent_Pharma_Press_release_Q4_25_26_e5822c6449.pdf",
  annualReportFy25:
    "https://www.torrentpharma.com/pdf/investors/AR-2024-25_Single_page_view.pdf",
  annualReportFy26:
    "https://www.torrentpharma.com/pdf/investors/AR-2025-26.pdf",
} as const

function median(values: readonly number[]): number {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Median requires at least one finite value")
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 1) return sorted[middle]!
  return (sorted[middle - 1]! + sorted[middle]!) / 2
}

function percentileType7(values: readonly number[], p: number): number {
  if (!values.length || values.some((value) => !Number.isFinite(value))) {
    throw new Error("Percentile requires finite values")
  }
  if (!Number.isFinite(p) || p < 0 || p > 1) {
    throw new Error("Percentile p must be between 0 and 1")
  }
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]!
  const h = (sorted.length - 1) * p
  const lower = Math.floor(h)
  const upper = Math.ceil(h)
  const fraction = h - lower
  return sorted[lower]! + fraction * (sorted[upper]! - sorted[lower]!)
}

export const TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_SERIES = [
  {
    periodEnd: "2025-06-30",
    growthPercent: 11,
    basis: "INDIA_REVENUE_YOY_REPORTED",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q1Fy26,
  },
  {
    periodEnd: "2025-09-30",
    growthPercent: 12,
    basis: "INDIA_REVENUE_YOY_REPORTED",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q2Fy26,
  },
  {
    periodEnd: "2025-12-31",
    growthPercent: 14,
    basis: "INDIA_REVENUE_YOY_REPORTED",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q3Fy26,
  },
  {
    periodEnd: "2026-03-31",
    growthPercent: 15,
    basis: "INDIA_BASE_BUSINESS_YOY_EXCLUDING_JB_ACQUISITION_EFFECT",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q4Fy26,
  },
] as const

export const TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_STATISTICS = {
  medianLatest4ComparableQuartersPercent: 13,
  positiveQuartersOutOfLatest4: 4 as const,
  latestMinusMedianPrior3PercentagePoints: 3,
} as const

export const TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_READ_ONLY_RESULT =
  evaluatePharmaSegmentGrowthCurveProposal(
    TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_STATISTICS,
  )

export const TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES = [
  {
    period: "Q1_FY25",
    revenueCrore: 2859,
    operatingEbitdaCrore: 904,
    normalization: "REPORTED",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q1Fy25,
  },
  {
    period: "Q2_FY25",
    revenueCrore: 2889,
    operatingEbitdaCrore: 939,
    normalization: "REPORTED",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q2Fy25,
  },
  {
    period: "Q3_FY25",
    revenueCrore: 2809,
    operatingEbitdaCrore: 914,
    normalization: "COMPARATIVE_DISCLOSED_IN_Q3_FY26_RELEASE",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q3Fy26,
  },
  {
    period: "Q4_FY25",
    revenueCrore: 2959,
    operatingEbitdaCrore: 964,
    normalization: "COMPARATIVE_DISCLOSED_IN_Q4_FY26_RELEASE",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q4Fy26,
  },
  {
    period: "Q1_FY26",
    revenueCrore: 3178,
    operatingEbitdaCrore: 1047,
    normalization: "ISSUER_ADJUSTED_FOR_RS15CR_ACQUISITION_ONE_OFF",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q1Fy26,
  },
  {
    period: "Q2_FY26",
    revenueCrore: 3302,
    operatingEbitdaCrore: 1083,
    normalization: "REPORTED_BEFORE_EXCEPTIONAL_ITEMS",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q2Fy26,
  },
  {
    period: "Q3_FY26",
    revenueCrore: 3303,
    operatingEbitdaCrore: 1088,
    normalization: "REPORTED_BEFORE_EXCEPTIONAL_ITEMS",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q3Fy26,
  },
  {
    period: "Q4_FY26",
    revenueCrore: 3424,
    operatingEbitdaCrore: 1120,
    normalization: "ISSUER_BASE_BUSINESS_EXCLUDING_JB_AND_PPA_EFFECTS",
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.q4Fy26,
  },
] as const

export const TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES =
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES.map((row) =>
    (row.operatingEbitdaCrore / row.revenueCrore) * 100)

const prior4OperatingMargin =
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES.slice(0, 4)
const latest4OperatingMargin =
  TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES.slice(4)

export const TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS = {
  percentileConvention: "LINEAR_INTERPOLATION_TYPE_7" as const,
  medianLatest8OperatingMarginPercent: median(
    TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES,
  ),
  interquartileRangeLatest8PercentagePoints:
    percentileType7(TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES, 0.75)
    - percentileType7(TORNTPHARM_GATE_H2_OPERATING_MARGIN_PERCENT_SERIES, 0.25),
  medianLatest4MinusPrior4PercentagePoints:
    median(latest4OperatingMargin) - median(prior4OperatingMargin),
} as const

export const TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT =
  evaluatePharmaOperatingMarginCurveProposal(
    TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS,
  )

export const TORNTPHARM_GATE_H2_CASH_FLOW_SERIES = [
  {
    periodEnd: "2024-03-31",
    cfoCrore: 3266.08,
    patCrore: 1656.38,
    capexCrore: 432.78,
    fcfCrore: 2833.30,
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.annualReportFy25,
  },
  {
    periodEnd: "2025-03-31",
    cfoCrore: 2585.11,
    patCrore: 1911.25,
    capexCrore: 611.87,
    fcfCrore: 1973.24,
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.annualReportFy25,
  },
  {
    periodEnd: "2026-03-31",
    cfoCrore: 3022.71,
    patCrore: 2163.37,
    capexCrore: 677.39,
    fcfCrore: 2345.32,
    source: TORNTPHARM_GATE_H2_OFFICIAL_SOURCES.annualReportFy26,
  },
] as const

export const TORNTPHARM_GATE_H2_CFO_TO_PAT_SERIES =
  TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.map((row) => row.cfoCrore / row.patCrore)

export const TORNTPHARM_GATE_H2_FCF_TO_PAT_SERIES =
  TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.map((row) => row.fcfCrore / row.patCrore)

export const TORNTPHARM_GATE_H2_CASH_FLOW_STATISTICS = {
  medianCfoToPat: median(TORNTPHARM_GATE_H2_CFO_TO_PAT_SERIES),
  medianFcfToPat: median(TORNTPHARM_GATE_H2_FCF_TO_PAT_SERIES),
  positiveFcfYearsOutOf3:
    TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.filter((row) => row.fcfCrore > 0)
      .length as 0 | 1 | 2 | 3,
  latestCfoToPatMinusPriorMedian:
    TORNTPHARM_GATE_H2_CFO_TO_PAT_SERIES.at(-1)!
    - median(TORNTPHARM_GATE_H2_CFO_TO_PAT_SERIES.slice(0, -1)),
} as const

export const TORNTPHARM_GATE_H2_CASH_FLOW_READ_ONLY_RESULT =
  evaluateDomesticCashFlow(TORNTPHARM_GATE_H2_CASH_FLOW_STATISTICS)

export const TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK = {
  version: TORNTPHARM_GATE_H2_OFFICIAL_EVIDENCE_PACK_VERSION,
  state: "READ_ONLY_OFFICIAL_EVIDENCE_REVIEW" as const,
  domesticGrowth: {
    minimumComparableQuartersPresent:
      TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_SERIES.length === 4,
    score:
      TORNTPHARM_GATE_H2_DOMESTIC_GROWTH_READ_ONLY_RESULT.combinedScore,
    scoreReadyCandidate: true,
  },
  cashFlow: {
    matchedAnnualPeriodCount: TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.length,
    minimumMatchedAnnualPeriodsPresent:
      TORNTPHARM_GATE_H2_CASH_FLOW_SERIES.length === 3,
    derivedStatistics: TORNTPHARM_GATE_H2_CASH_FLOW_STATISTICS,
    score: TORNTPHARM_GATE_H2_CASH_FLOW_READ_ONLY_RESULT.combinedScore,
    scoreReadyCandidate: true,
    reasonCodes: [
      "THREE_MATCHED_CFO_PAT_FCF_ANNUAL_PERIODS_LOCKED",
      "FY2024_AND_FY2025_CFO_CONFIRMED_FROM_OFFICIAL_CONSOLIDATED_CASH_FLOW_STATEMENT",
      "FY2026_CFO_ALREADY_PRESENT_IN_LOCKED_OFFICIAL_MANIFEST",
      "FCF_REMAINS_CFO_MINUS_CAPEX_WITH_EXISTING_LOCKED_VALUES",
    ] as const,
  },
  qualityOperatingMargin: {
    matchedComparableQuarterCount:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES.length,
    minimumComparableQuartersPresent:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_RAW_SERIES.length >= 8,
    rawEvidenceReady: true,
    derivedStatisticLockPending: false,
    percentileConvention:
      TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS.percentileConvention,
    derivedStatistics: TORNTPHARM_GATE_H2_OPERATING_MARGIN_STATISTICS,
    score: TORNTPHARM_GATE_H2_QUALITY_READ_ONLY_RESULT.combinedScore,
    scoreReadyCandidate: true,
    reasonCodes: [
      "EIGHT_COMPARABLE_QUARTERS_ASSEMBLED_FROM_OFFICIAL_RELEASES",
      "Q1_FY26_ISSUER_ONE_OFF_NORMALIZATION_EXPLICIT",
      "Q4_FY26_BASE_BUSINESS_NORMALIZATION_EXPLICIT",
      "TYPE_7_PERCENTILE_CONVENTION_REUSED_FROM_OWNER_APPROVED_H2_CONVENTION",
    ] as const,
  },
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
} as const
