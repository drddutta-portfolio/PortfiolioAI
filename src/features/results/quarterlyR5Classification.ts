import Decimal from "decimal.js"
import { compareQuarterMetric } from "./quarterlyR5"
import type { ResultsSourceObservation } from "./resultsSourceRepository"

/**
 * R5 rolling historical operating performance (no investment action).
 * Each historical quarter uses ONLY its own and earlier qualified financials
 * and period-specific exact-industry peers. No future-quarter threshold leakage.
 */
export const RESULTS_GRADING_VERSION = "R5_ROLLING_HISTORICAL_20261017_V5"
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

const FIRST_GRADED_QUARTER = "2025-03-31"
const FIRST_COMPARISON_QUARTER = "2024-12-31"
const LATEST_FROZEN_GRADE_QUARTER = "2026-06-30"

/** Previous real calendar-quarter end; always fails closed on invalid dates. */
function previousQuarterEnd(end: string): string | null {
  const found = /^(\d{4})-(03|06|09|12)-(30|31)$/.exec(end)
  if (!found) return null
  const year = Number(found[1]), month = Number(found[2])
  if (new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10) !== end) return null
  return new Date(Date.UTC(year, month - 3, 0)).toISOString().slice(0, 10)
}

/** Up to three eligible two-quarter comparisons, all <= the grade date. */
function comparisonEndsThrough(end: string): readonly string[] {
  if (end < FIRST_GRADED_QUARTER || !previousQuarterEnd(end)) return []
  const latestToOldest: string[] = []
  let cursor: string | null = end
  while (cursor && cursor >= FIRST_COMPARISON_QUARTER && latestToOldest.length < 3) {
    latestToOldest.push(cursor)
    cursor = previousQuarterEnd(cursor)
  }
  return latestToOldest.reverse()
}
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
  // Cash-operating financial platforms can use their OWN revenue/PAT trends,
  // never a bank NII contract or cross-industry peer percentile.
  if (s === "FINANCIAL SERVICES") {
    return /^(FINANCIAL TECHNOLOGY \(FINTECH\)|INTERNET SOFTWARE & SERVICES|DEPOSITORIES, CLEARING HOUSES AND OTHER INTERMEDIARIES|STOCKBROKING & ALLIED|FINTECH \/ INSURANCE BROKERAGE & PLATFORM)$/.test(i)
      ? "OPERATING_REVENUE_QUARTER" : null
  }
  if (s === "FINANCE" ||
      /BANK|NBFC|LENDING|HOUSING FINANCE|ASSET MANAGEMENT|INVESTMENT/.test(i)) return null
  // A sector label must not override explicitly contradictory industry evidence.
  if (s === "DEFENCE" && !/AEROSPACE|DEFEN[CS]E/.test(i)) return null
  // Renewable power generation is eligible for an OWN-company Revenue/PAT
  // directional contract; it is never compared to oil/gas issuer percentiles.
  if (s === "ENERGY" && !/^(?:GAS|OIL|REFINERIES|PETRO-PRODUCTS|POWER GENERATION)$/.test(i)) return null
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
  const previous = previousQuarterEnd(end)
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
  end: string = LATEST_FROZEN_GRADE_QUARTER,
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
    for (const quarter of comparisonEndsThrough(end)) {
      const pair = comparable(ownRows, securityId, quarter, topCode)
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

/** Computes period-specific peer calibrations once per update. Older grades
 * NEVER read future-quarter peers; the current frozen June 2026 group keeps
 * the original bare group-key mapping for existing R5 clients/tests.
 */
export function buildRollingIndustryR5Calibrations(
  observations: readonly ResultsSourceObservation[],
  peers: readonly R5IndustryPeer[],
  quarters: readonly string[],
): R5IndustryCalibrations {
  const combined = new Map<string,R5IndustryCalibration>()
  for (const end of new Set(quarters)) {
    for (const [key,calibration] of buildIndustryR5Calibrations(observations,peers,end)) {
      combined.set(end + "|" + key,calibration)
      if (end === LATEST_FROZEN_GRADE_QUARTER) combined.set(key,calibration)
    }
  }
  return combined
}

/** Directional verification can compare an issuer's PAT loss-to-profit turn
 * even when a QoQ percentage is mathematically undefined due to <=0 PAT
 * baseline. Every quarter still must contain one matching original, identity,
 * scope, unit and period; no percentage is inferred from negative baselines.
 */
function directionalComparison(
  rows: readonly ResultsSourceObservation[],
  securityId: string,
  end: string,
  topCode: "NET_INTEREST_INCOME_QUARTER" | "OPERATING_REVENUE_QUARTER",
): { top: Decimal; profit: Decimal; currentProfit: Decimal } | null {
  const previous = previousQuarterEnd(end)
  if (!previous) return null
  const read = (date: string, code: string) => compareQuarterMetric(rows, securityId, date, code).current
  const top = read(end,topCode), profit = read(end,"NET_PROFIT_QUARTER")
  const beforeTop = read(previous,topCode), beforeProfit = read(previous,"NET_PROFIT_QUARTER")
  if (!top || !profit || !beforeTop || !beforeProfit) return null
  const matching = (a: ResultsSourceObservation, b: ResultsSourceObservation) =>
    Boolean(a.sourceRecordId && a.sourceRecordId === b.sourceRecordId && a.scope === b.scope)
  if (!matching(top,profit) || !matching(beforeTop,beforeProfit) ||
      top.scope !== beforeTop.scope || profit.scope !== beforeProfit.scope) return null
  try {
    const nTop=new Decimal(top.value), pTop=new Decimal(beforeTop.value)
    const nPat=new Decimal(profit.value), pPat=new Decimal(beforeProfit.value)
    if (!nTop.gt(0) || pTop.lt(0)) return null
    // The levels have identical units; only the sign of their difference is used.
    return { top:nTop.minus(pTop), profit:nPat.minus(pPat), currentProfit:nPat }
  } catch { return null }
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
  if (end < FIRST_GRADED_QUARTER || !previousQuarterEnd(end)) {
    return fail(group, "Historical quarter is outside the approved R5 grading calendar.")
  }
  const pairs = comparisonEndsThrough(end)
    .map(date => directionalComparison(observations, securityId, date, topCode))
    .filter((pair): pair is NonNullable<typeof pair> => pair !== null)
  const current = directionalComparison(observations, securityId, end, topCode)
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
      " source-coherent adjacent-quarter level changes and the " +
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
  if (!comparisonEndsThrough(end).length) return fail(group, "Historical quarter is outside the approved R5 grading calendar.")
  if (!topCode) return fail(group, "Industry is unavailable or its financial-statement model is not supported.")
  const calibration = calibrations.get(end + "|" + groupKey(sector,industry)) ??
    (end === LATEST_FROZEN_GRADE_QUARTER ? calibrations.get(groupKey(sector,industry)) : undefined)
  if (!calibration || calibration.topCode !== topCode) {
    return gradeCompanyTrajectory(observations, securityId, end, topCode, group)
  }
  const pair = comparable(observations, securityId, end, topCode)
  if (!pair) {
    // Calibrated peers cannot rescue an issuer's mathematically invalid
    // percentage baseline. But the *already approved* same-original own-company
    // level-change contract remains legitimate if >=2 independent comparisons
    // INCLUDING the current quarter independently satisfy that stricter rule.
    // Mark the answer as COMPANY_TREND, never as an industry percentile.
    const ownTrend = gradeCompanyTrajectory(observations, securityId, end, topCode, group)
    if (ownTrend.status !== "UNAVAILABLE") return {
      ...ownTrend,
      explanation: "Industry-peer percentages unavailable for this issuer; no peer percentile assigned. " + ownTrend.explanation,
    }
    return fail(group, "Comparable, same-filing Revenue/NII and PAT percentage comparisons are missing or incompatible in either quarter.")
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
