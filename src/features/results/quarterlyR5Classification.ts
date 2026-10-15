import Decimal from "decimal.js"
import { compareQuarterMetric } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

/**
 * R5-C current-display operating signal. The ONLY calibration cohort is
 * source-selected Sep 2025–Jun 2026 data within the exact reviewed
 * (sector, industry) pair. No sector-wide thresholds or adjacent-industry
 * substitutes are permitted.
 */
export const RESULTS_GRADING_VERSION = "R5_INDUSTRY_AND_COMPANY_TREND_20261015_V3"
export type R5Grade = "STRONG" | "MIXED" | "WEAK" | "UNAVAILABLE"
export interface ResultsQuarterGrade {
  readonly status: R5Grade
  readonly policyVersion: string
  readonly group: string
  readonly scope: "QOQ_ONLY"
  readonly explanation: string
  readonly supportingMetrics: readonly string[]
  readonly sampleSize: number
  /** Separates calibrated peer ranking from company-only directional evidence. */
  readonly basis: "INDUSTRY_PEER" | "COMPANY_TREND" | "UNAVAILABLE"
}
export interface R5IndustryPeer {
  readonly securityId: string
  readonly sector: string | null
  readonly industry: string | null
}
export interface R5IndustryCalibration {
  readonly group: string
  readonly sampleSize: number
  readonly distinctIssuers: number
  readonly topCode: "NET_INTEREST_INCOME_QUARTER" | "OPERATING_REVENUE_QUARTER"
  readonly p25Top: string
  readonly p75Top: string
  readonly p25Profit: string
  readonly p75Profit: string
}
export type R5IndustryCalibrations = ReadonlyMap<string, R5IndustryCalibration>

const ENDS = ["2025-12-31", "2026-03-31", "2026-06-30"] as const
const MIN_PAIRS = 12
const MIN_ISSUERS = 4
const normalized = (value: string | null) =>
  value?.trim().replace(/\s+/g, " ").toUpperCase() ?? ""
const groupKey = (sector: string | null, industry: string | null) =>
  normalized(sector) + "::" + normalized(industry)
const bankIndustry = (industry: string) => /\bBANKS?\b/.test(industry)

/** Unknown, unreviewed or incompatible business-model groups remain ungraded. */
function modelFor(sector: string | null, industry: string | null):
  "NET_INTEREST_INCOME_QUARTER" | "OPERATING_REVENUE_QUARTER" | null {
  const s = normalized(sector), i = normalized(industry)
  if (!s || !i || s === "UNCLASSIFIED" || i === "UNCLASSIFIED") return null
  if (s === "BANKING") return bankIndustry(i) ? "NET_INTEREST_INCOME_QUARTER" : null
  if (s === "FINANCIAL SERVICES" || s === "FINANCE" ||
      /BANK|NBFC|INSUR|LENDING|HOUSING FINANCE|ASSET MANAGEMENT|BROKER|INVESTMENT|DEPOSITOR/.test(i)) return null
  // A sector label must not override explicitly contradictory industry evidence.
  if (s === "DEFENCE" && !/AEROSPACE|DEFEN[CS]E/.test(i)) return null
  if (s === "ENERGY" && !/^(?:GAS|OIL|REFINERIES|PETRO-PRODUCTS)$/.test(i)) return null
  return "OPERATING_REVENUE_QUARTER"
}

const fail = (group: string, why: string): ResultsQuarterGrade => ({
  status: "UNAVAILABLE", policyVersion: RESULTS_GRADING_VERSION,
  group, scope: "QOQ_ONLY", explanation: why, supportingMetrics: [], sampleSize: 0, basis: "UNAVAILABLE",
})

/** Guard *both* issuer filings in a two-quarter pair, not just the current one. */
function comparable(
  observations: readonly ResultsSourceObservation[],
  securityId: string, end: string,
  topCode: "NET_INTEREST_INCOME_QUARTER" | "OPERATING_REVENUE_QUARTER",
): { top: Decimal; profit: Decimal; currentProfit: Decimal } | null {
  const top = compareQuarterMetric(observations, securityId, end, topCode)
  const profit = compareQuarterMetric(observations, securityId, end, "NET_PROFIT_QUARTER")
  if (!top.current || !profit.current || top.qoq === null || profit.qoq === null) return null
  const previous = ({
    "2025-12-31": "2025-09-30",
    "2026-03-31": "2025-12-31",
    "2026-06-30": "2026-03-31",
  } as Record<string, string>)[end]
  if (!previous) return null
  const pair = observations.filter(r => r.securityId === securityId && r.selected &&
    (r.periodEnd === previous || r.periodEnd === end) &&
    (r.code === topCode || r.code === "NET_PROFIT_QUARTER"))
  const coherent = (quarter: string): boolean => {
    const rows = pair.filter(r => r.periodEnd === quarter)
    if (rows.length !== 2 || new Set(rows.map(r => r.code)).size !== 2) return false
    return rows[0]!.sourceRecordId !== null && rows[0]!.sourceRecordId !== undefined &&
      rows[0]!.sourceRecordId === rows[1]!.sourceRecordId &&
      rows[0]!.scope === rows[1]!.scope
  }
  if (!coherent(end) || !coherent(previous)) return null
  try {
    if (!new Decimal(top.current.value).gt(0)) return null
    return { top: new Decimal(top.qoq), profit: new Decimal(profit.qoq),
      currentProfit: new Decimal(profit.current.value) }
  } catch { return null }
}

function quantile(sorted: readonly Decimal[], p: string): string {
  const pos = new Decimal(sorted.length - 1).times(p)
  const lo = pos.floor().toNumber()
  const fraction = pos.minus(lo)
  const next = sorted[Math.min(lo + 1, sorted.length - 1)]!
  return sorted[lo]!.plus(next.minus(sorted[lo]!).times(fraction))
    .toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toFixed(4)
}

/**
 * Builds deterministic empirical bounds from existing qualified observations.
 * Executed once per inventory update, never once per UI cell or provider call.
 * Requires >=4 independent issuers and >=12 coherent quarter pairs.
 */
export function buildIndustryR5Calibrations(
  observations: readonly ResultsSourceObservation[],
  peers: readonly R5IndustryPeer[],
): R5IndustryCalibrations {
  const profiles = new Map<string, R5IndustryPeer | null>()
  for (const peer of peers) {
    const prior = profiles.get(peer.securityId)
    if (prior !== undefined && prior !== null &&
      groupKey(prior.sector, prior.industry) !== groupKey(peer.sector, peer.industry)) {
      profiles.set(peer.securityId, null)
    } else if (!profiles.has(peer.securityId)) profiles.set(peer.securityId, peer)
  }
  const grouped = new Map<string, { topCode: "NET_INTEREST_INCOME_QUARTER" | "OPERATING_REVENUE_QUARTER"; top: Decimal[]; profit: Decimal[]; issuers: Set<string> }>()
  for (const [securityId, peer] of profiles) {
    if (!peer) continue
    const topCode = modelFor(peer.sector, peer.industry)
    if (!topCode) continue
    const key = groupKey(peer.sector, peer.industry)
    const bucket = grouped.get(key) ?? { topCode, top: [], profit: [], issuers: new Set<string>() }
    const ownRows = observations.filter(r => r.securityId === securityId)
    for (const end of ENDS) {
      const pair = comparable(ownRows, securityId, end, topCode)
      if (!pair) continue
      bucket.top.push(pair.top)
      bucket.profit.push(pair.profit)
      bucket.issuers.add(securityId)
    }
    grouped.set(key, bucket)
  }
  const result = new Map<string, R5IndustryCalibration>()
  for (const [key, bucket] of grouped) {
    if (bucket.top.length < MIN_PAIRS || bucket.issuers.size < MIN_ISSUERS) continue
    bucket.top.sort((a,b) => a.comparedTo(b))
    bucket.profit.sort((a,b) => a.comparedTo(b))
    result.set(key, {
      group: key.replace("::", " / "), topCode: bucket.topCode,
      sampleSize: bucket.top.length, distinctIssuers: bucket.issuers.size,
      p25Top: quantile(bucket.top, "0.25"), p75Top: quantile(bucket.top, "0.75"),
      p25Profit: quantile(bucket.profit, "0.25"), p75Profit: quantile(bucket.profit, "0.75"),
    })
  }
  return result
}

/** An explicit *unranked* directional fallback for industries with too few peers.
 * It uses the issuer's own (at most 3) source-coherent quarterly comparisons,
 * never converts company history into a purported industry percentile.  Strong
 * and Weak are directional descriptions, not calibrated peer rankings.
 * To prevent a single volatile quarter from driving the answer, require
 * two independent valid sequential comparisons INCLUDING the current one.
 */
function gradeCompanyTrajectory(
  observations: readonly ResultsSourceObservation[],
  securityId: string,
  end: string,
  topCode: "NET_INTEREST_INCOME_QUARTER" | "OPERATING_REVENUE_QUARTER",
  group: string,
): ResultsQuarterGrade {
  if (!ENDS.includes(end as (typeof ENDS)[number])) {
    return fail(group, "No qualified preceding quarter exists inside the approved four-quarter R5 window.")
  }
  const pairs = ENDS.filter(date => date <= end)
    .map(date => comparable(observations, securityId, date, topCode))
    .filter((pair): pair is NonNullable<typeof pair> => pair !== null)
  const current = comparable(observations, securityId, end, topCode)
  if (!current || pairs.length < 2) {
    return fail(group, "No eligible industry peers and fewer than two source-coherent company quarter comparisons including the selected quarter.")
  }
  const up = pairs.filter(p => p.top.gt(0) && p.profit.gt(0)).length
  const down = pairs.filter(p => p.top.lt(0) && p.profit.lt(0)).length
  const latestUp = current.top.gt(0) && current.profit.gt(0)
  const latestDown = current.top.lt(0) && current.profit.lt(0)
  const strong = current.currentProfit.gt(0) && latestUp && up >= 2
  const weak = current.currentProfit.lte(0) || (latestDown && down >= 2)
  const status: R5Grade = strong ? "STRONG" : weak ? "WEAK" : "MIXED"
  return {
    status, policyVersion: RESULTS_GRADING_VERSION, group,
    scope: "QOQ_ONLY", supportingMetrics: [topCode, "NET_PROFIT_QUARTER"],
    sampleSize: pairs.length, basis: "COMPANY_TREND",
    explanation: "Company-only quarterly trend using " + pairs.length +
      " independently verified consecutive comparisons and the " +
      (topCode === "NET_INTEREST_INCOME_QUARTER" ? "bank NII/PAT" : "operating Revenue/PAT") +
      " contract. " +
      (strong ? "At least two comparisons show joint improvement, including the latest quarter, with a profitable current quarter." :
       weak ? "The latest loss or repeated joint contraction merits review." :
       "The available company trend is neither consistently improving nor consistently weakening.") +
      " This is NOT an industry percentile or investment recommendation; exact-industry peer grading remains unavailable.",
  }
}

export function gradeQuarterR5(
  observations: readonly ResultsSourceObservation[],
  securityId: string,
  end: string,
  sector: string | null,
  industry: string | null,
  calibrations: R5IndustryCalibrations,
): ResultsQuarterGrade {
  const group = (normalized(sector) || "UNCLASSIFIED") + " / " + (normalized(industry) || "UNCLASSIFIED")
  const topCode = modelFor(sector, industry)
  if (!topCode) return fail(group, "Industry is unavailable or its financial-statement model is not supported.")
  const calibration = calibrations.get(groupKey(sector,industry))
  const pair = comparable(observations, securityId, end, topCode)
  if (!pair) return fail(group, "Comparable, same-filing Revenue/NII and PAT selections are missing or incompatible in either quarter.")
  if (!calibration || calibration.topCode !== topCode) {
    return gradeCompanyTrajectory(observations, securityId, end, topCode, group)
  }
  const strong = pair.currentProfit.gt(0) &&
    pair.top.gte(calibration.p75Top) && pair.profit.gte(calibration.p75Profit)
  const weak = !pair.currentProfit.gt(0) ||
    (pair.top.lte(calibration.p25Top) && pair.profit.lte(calibration.p25Profit) &&
    (pair.top.isNegative() || pair.profit.isNegative()))
  const status: R5Grade = strong ? "STRONG" : weak ? "WEAK" : "MIXED"
  const reason = strong ? "Both growth indicators meet the industry upper-quartile thresholds." :
    weak ? "Profitability or joint industry-lower-quartile deterioration needs review." :
    "The two qualified growth indicators are neither jointly strong nor jointly weak."
  return {
    status, policyVersion: RESULTS_GRADING_VERSION, group,
    scope: "QOQ_ONLY", supportingMetrics: [topCode, "NET_PROFIT_QUARTER"],
    sampleSize: calibration.sampleSize, basis: "INDUSTRY_PEER",
    explanation: "QoQ-only, exact-industry empirical calibration (" +
      calibration.distinctIssuers + " issuers, " + calibration.sampleSize +
      " source-qualified quarter pairs). " + reason +
      " No YoY conclusion, investment recommendation or V1-4 score is inferred.",
  }
}
