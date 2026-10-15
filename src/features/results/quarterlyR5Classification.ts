import Decimal from "decimal.js"
import { compareQuarterMetric } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

/**
 * R5-QOQ-20261015-V1: a current-display-only operating signal.
 * Calibrated to 2025-09 through 2026-06 selected issuer filings (n>=12
 * within each published canonical sector). Bounds are the observed p25/p75
 * of exact comparable QoQ changes with positive baselines; never investment
 * research scores. For missing/uncertain classification, fail closed.
 */
export const RESULTS_GRADING_VERSION = "R5_QOQ_EMPIRICAL_20261015_V1"
export type R5Grade = "STRONG" | "MIXED" | "WEAK" | "UNAVAILABLE"
export interface ResultsQuarterGrade {
  readonly status: R5Grade
  readonly policyVersion: string
  readonly group: string
  readonly scope: "QOQ_ONLY"
  readonly explanation: string
  readonly supportingMetrics: readonly string[]
  readonly sampleSize: number
}
/** [topline p25, p75, PAT p25, p75, minimum cohort observations]. */
const SECTOR_BOUNDS: Readonly<Record<string, readonly [string, string, string, string, number]>> = {
  "BANKING": ["1.7", "5.4", "0.2", "19.6", 31],
  "INFORMATION TECHNOLOGY": ["1.9", "12.9", "-8.0", "20.8", 50],
  "PHARMA": ["-2.4", "10.7", "-25.6", "28.4", 69],
  "HEALTHCARE": ["3.5", "15.9", "-19.1", "19.7", 18],
  "CAPITAL GOODS": ["-5.3", "11.9", "-20.8", "22.2", 61],
  "DEFENCE": ["-5.3", "11.9", "-20.8", "22.2", 61], // documented Capital Goods aerospace/defence proxy
  "INDUSTRIAL": ["-8.5", "28.4", "-41.8", "95.8", 17],
  "WASTE MANAGMENT": ["-15.9", "17.5", "-31.5", "23.3", 21],
  "CHEMICALS": ["-4.6", "14.5", "-22.6", "32.5", 39],
  "POWER": ["-7.0", "18.5", "-21.6", "10.8", 12],
  "AUTOMOBILE AND AUTO COMPONENTS": ["2.2", "10.9", "-5.5", "24.7", 33],
  "CONSUMER DURABLES": ["-2.4", "20.8", "-14.1", "62.0", 20],
  "CONSUMER SERVICES": ["-2.5", "20.5", "-35.9", "74.1", 31],
  "FAST MOVING CONSUMER GOODS": ["-3.7", "9.4", "-14.2", "15.8", 25],
  "FMCG": ["-3.7", "9.4", "-14.2", "15.8", 25],
  "METALS & MINING": ["-0.5", "16.4", "-10.6", "35.7", 27],
  "OIL GAS & CONSUMABLE FUELS": ["1.9", "13.1", "-14.0", "33.4", 19],
  "ENERGY": ["1.9", "13.1", "-14.0", "33.4", 19], // related oil and gas proxy only, subject to metric evidence
  "TEXTILES": ["-0.8", "10.8", "-3.2", "71.9", 15],
  "GEMS AND JEWELLERY": ["-4.8", "40.4", "-34.1", "74.3", 18],
  "FINANCIAL SERVICES": ["0.3", "13.3", "0.8", "39.5", 14],
}
const fail = (group: string, why: string): ResultsQuarterGrade => ({
  status: "UNAVAILABLE", policyVersion: RESULTS_GRADING_VERSION,
  group, scope: "QOQ_ONLY", explanation: why, supportingMetrics: [], sampleSize: 0,
})
export function gradeQuarterR5(
  observations: readonly ResultsSourceObservation[],
  securityId: string,
  end: string,
  sector: string | null,
  industry: string | null,
): ResultsQuarterGrade {
  const group = sector?.trim().toUpperCase() ?? "UNCLASSIFIED"
  const bank = group === "BANKING"
  if (!sector || !SECTOR_BOUNDS[group]) return fail(group, "No calibrated current-display sector rule; source data alone is not a performance grade.")
  if (group === "FINANCIAL SERVICES" &&
      /(?:BANKING FINANCIAL|NBFC|INSURANCE|INVESTMENT|ASSET MANAGEMENT|HOUSING FINANCE)/i.test(industry ?? "")) {
    return fail(group, "Lending or insurance financial statements need a separately validated earnings contract.")
  }
  const topCode = bank ? "NET_INTEREST_INCOME_QUARTER" : "OPERATING_REVENUE_QUARTER"
  const profitCode = "NET_PROFIT_QUARTER"
  const top = compareQuarterMetric(observations, securityId, end, topCode)
  const profit = compareQuarterMetric(observations, securityId, end, profitCode)
  if (!top.current || !profit.current || top.qoq === null || profit.qoq === null) {
    return fail(group, "At least two source-selected, comparable consecutive quarters of sector-appropriate revenue/NII and PAT are required.")
  }
  if (top.current.scope !== profit.current.scope ||
      top.current.sourceRecordId !== profit.current.sourceRecordId) {
    return fail(group, "The current NII/revenue and PAT are not from one selected issuer filing and accounting scope.")
  }
  if (!new Decimal(top.current.value).gt(0)) {
    return fail(group, "Current quarter has no positive sector topline for a calibrated growth assessment.")
  }
  const [lowTop,highTop,lowProfit,highProfit,n] = SECTOR_BOUNDS[group]
  const t=new Decimal(top.qoq),p=new Decimal(profit.qoq)
  const positiveProfit=new Decimal(profit.current.value).gt(0)
  const strong = positiveProfit && t.gte(highTop) && p.gte(highProfit)
  const weak = !positiveProfit || (t.lte(lowTop) && p.lte(lowProfit) && (t.isNegative() || p.isNegative()))
  const status: R5Grade = strong ? "STRONG" : weak ? "WEAK" : "MIXED"
  const explanation =
    "QoQ-only sector-calibrated operating signal (" + group + ", " + n +
    " comparable historical observations). " +
    (strong ? "Both core growth indicators reach their historical upper-quartile thresholds." :
      weak ? "Profitability or combined growth deterioration warrants review." :
      "Core growth indicators are not jointly strong or weak under the calibrated thresholds.") +
    " No YoY conclusion, investment recommendation or V1-4 score is inferred."
  return { status, policyVersion: RESULTS_GRADING_VERSION, group,
    scope:"QOQ_ONLY", explanation, supportingMetrics:[topCode,profitCode],sampleSize:n }
}
