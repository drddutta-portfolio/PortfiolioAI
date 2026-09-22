export const PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION =
  "PHARMA_API_G10_1_NUMERIC_METHODOLOGY_V1_CANDIDATE" as const

export const PHARMA_API_G10_1_NUMERIC_METHODOLOGY = {
  version: PHARMA_API_G10_1_NUMERIC_METHODOLOGY_VERSION,
  state: "CHECKPOINT_B_CANDIDATE" as const,
  supportedPrimarySubprofile: "API_BULK_DRUGS" as const,
  commonTenDimensionSpinePreserved: true,
  gateIRecommendationPolicyUnchanged: true,
  materialOverlayCreatesIndependentScore: false,
  emergingWatchNumericParticipation: false,
  scorePersistenceEnabled: false,
  recommendationPersistenceEnabled: false,
  methodologyNotes: {
    quality: "Eight-quarter EBITDA margin level, stability and trend using API-specific locked bands.",
    growth: "Four-quarter reported revenue growth level, consistency and trend; no acquisition backfill.",
    capitalEfficiency: "Five-year ROICE level, Type-7 IQR stability and latest-versus-prior trend.",
    cashFlow: "Three-year CFO/PAT, FCF/PAT and consistency; CFO is derived only from issuer FCF plus issuer capex under the locked FCF identity.",
    balanceSheetCredit: "Net-cash persistence, interest-cover strength and resilience through the capex cycle.",
    businessDurability: "Capacity utilization, R&D/pipeline depth, regulated-market reach and backward-integration/capex execution.",
    valuation: "Current PE, EV/EBITDA and FCF-yield context; expensive absolute valuation is not neutralized by momentum.",
    momentum: "12m, 6m and NIFTY Pharma-relative price momentum.",
    ownershipGovernance: "Reviewed ownership stability, pledge/control risk and non-G4 governance context.",
    risk: "Regulatory/site context, customer concentration and API pricing-cycle exposure without double-penalizing G4 events.",
  },
} as const

type Band = { readonly min?: number; readonly max?: number; readonly score: number }

function scoreBand(value: number, bands: readonly Band[]) {
  if (!Number.isFinite(value)) throw new Error("API methodology input must be finite")
  const band = bands.find((item) =>
    (item.min === undefined || value >= item.min)
    && (item.max === undefined || value < item.max))
  if (!band) throw new Error("API methodology input does not match a score band")
  return band.score
}

export function median(values: readonly number[]) {
  if (!values.length) throw new Error("median requires values")
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

export function quantileType7(values: readonly number[], probability: number) {
  if (!values.length) throw new Error("quantile requires values")
  if (probability < 0 || probability > 1) throw new Error("probability must be between 0 and 1")
  const sorted = [...values].sort((a, b) => a - b)
  if (sorted.length === 1) return sorted[0]!
  const h = (sorted.length - 1) * probability
  const lower = Math.floor(h)
  const upper = Math.ceil(h)
  if (lower === upper) return sorted[lower]!
  return sorted[lower]! + (h - lower) * (sorted[upper]! - sorted[lower]!)
}

export function evaluateApiQuality(margins: readonly number[]) {
  if (margins.length !== 8) throw new Error("API quality requires exactly eight comparable quarters")
  const level = median(margins)
  const iqr = quantileType7(margins, 0.75) - quantileType7(margins, 0.25)
  const trend = median(margins.slice(4)) - median(margins.slice(0, 4))
  const levelScore = scoreBand(level, [
    { min: 25, score: 100 }, { min: 20, max: 25, score: 85 }, { min: 16, max: 20, score: 70 },
    { min: 12, max: 16, score: 55 }, { min: 8, max: 12, score: 35 }, { max: 8, score: 15 },
  ])
  const stabilityScore = scoreBand(iqr, [
    { max: 2, score: 100 }, { min: 2, max: 4, score: 80 }, { min: 4, max: 6, score: 60 },
    { min: 6, max: 9, score: 40 }, { min: 9, score: 20 },
  ])
  const trendScore = scoreBand(trend, [
    { min: 3, score: 100 }, { min: 1, max: 3, score: 80 }, { min: -1, max: 1, score: 60 },
    { min: -3, max: -1, score: 40 }, { max: -3, score: 20 },
  ])
  return { level, iqr, trend, levelScore, stabilityScore, trendScore, score: levelScore * 0.5 + stabilityScore * 0.3 + trendScore * 0.2 }
}

export function evaluateApiGrowth(quarterlyRevenueGrowthPercent: readonly number[]) {
  if (quarterlyRevenueGrowthPercent.length !== 4) throw new Error("API growth requires four comparable quarters")
  const level = median(quarterlyRevenueGrowthPercent)
  const positives = quarterlyRevenueGrowthPercent.filter((value) => value > 0).length
  const trend = quarterlyRevenueGrowthPercent[3]! - median(quarterlyRevenueGrowthPercent.slice(0, 3))
  const levelScore = scoreBand(level, [
    { min: 20, score: 100 }, { min: 15, max: 20, score: 85 }, { min: 10, max: 15, score: 70 },
    { min: 5, max: 10, score: 55 }, { min: 0, max: 5, score: 40 }, { max: 0, score: 20 },
  ])
  const consistencyScore = [0, 25, 50, 75, 100][positives]!
  const trendScore = scoreBand(trend, [
    { min: 5, score: 100 }, { min: 0, max: 5, score: 75 }, { min: -5, max: 0, score: 50 },
    { min: -10, max: -5, score: 25 }, { max: -10, score: 0 },
  ])
  return { level, positives, trend, levelScore, consistencyScore, trendScore, score: levelScore * 0.6 + consistencyScore * 0.25 + trendScore * 0.15 }
}

export function evaluateApiCapitalEfficiency(roicePercent: readonly number[]) {
  if (roicePercent.length !== 5) throw new Error("API capital efficiency requires five annual ROICE observations")
  const level = median(roicePercent)
  const iqr = quantileType7(roicePercent, 0.75) - quantileType7(roicePercent, 0.25)
  const trend = roicePercent[4]! - median(roicePercent.slice(0, 4))
  const levelScore = scoreBand(level, [
    { min: 30, score: 100 }, { min: 25, max: 30, score: 85 }, { min: 20, max: 25, score: 70 },
    { min: 15, max: 20, score: 55 }, { min: 10, max: 15, score: 35 }, { max: 10, score: 15 },
  ])
  const stabilityScore = scoreBand(iqr, [
    { max: 3, score: 100 }, { min: 3, max: 6, score: 80 }, { min: 6, max: 10, score: 60 },
    { min: 10, max: 15, score: 40 }, { min: 15, score: 20 },
  ])
  const trendScore = scoreBand(trend, [
    { min: 5, score: 100 }, { min: 2, max: 5, score: 80 }, { min: -2, max: 2, score: 60 },
    { min: -5, max: -2, score: 40 }, { max: -5, score: 20 },
  ])
  return { level, iqr, trend, levelScore, stabilityScore, trendScore, score: levelScore * 0.6 + stabilityScore * 0.2 + trendScore * 0.2 }
}

export function evaluateApiCashFlow(input: {
  readonly pat: readonly number[]
  readonly fcf: readonly number[]
  readonly capex: readonly number[]
}) {
  if (input.pat.length !== 3 || input.fcf.length !== 3 || input.capex.length !== 3) {
    throw new Error("API cash flow requires three matched annual PAT/FCF/capex periods")
  }
  const cfo = input.fcf.map((value, index) => value + input.capex[index]!)
  const cfoToPat = cfo.map((value, index) => value / input.pat[index]!)
  const fcfToPat = input.fcf.map((value, index) => value / input.pat[index]!)
  const medianCfoToPat = median(cfoToPat)
  const medianFcfToPat = median(fcfToPat)
  const latestCfoToPatMinusPriorMedian = cfoToPat[2]! - median(cfoToPat.slice(0, 2))
  const cfoScore = scoreBand(medianCfoToPat, [
    { min: 1.1, score: 100 }, { min: 0.9, max: 1.1, score: 85 }, { min: 0.75, max: 0.9, score: 70 },
    { min: 0.6, max: 0.75, score: 55 }, { min: 0.4, max: 0.6, score: 35 }, { max: 0.4, score: 15 },
  ])
  const fcfScore = scoreBand(medianFcfToPat, [
    { min: 1, score: 100 }, { min: 0.8, max: 1, score: 85 }, { min: 0.6, max: 0.8, score: 70 },
    { min: 0.4, max: 0.6, score: 55 }, { min: 0.2, max: 0.4, score: 35 }, { max: 0.2, score: 15 },
  ])
  const trendScore = scoreBand(latestCfoToPatMinusPriorMedian, [
    { min: 0.15, score: 100 }, { min: 0.05, max: 0.15, score: 80 }, { min: -0.05, max: 0.05, score: 60 },
    { min: -0.15, max: -0.05, score: 40 }, { max: -0.15, score: 20 },
  ])
  const consistencyTrendScore = 100 * 0.6 + trendScore * 0.4
  return { cfo, cfoToPat, fcfToPat, medianCfoToPat, medianFcfToPat, latestCfoToPatMinusPriorMedian, cfoScore, fcfScore, consistencyTrendScore, score: cfoScore * 0.45 + fcfScore * 0.35 + consistencyTrendScore * 0.2 }
}

export function evaluateApiValuation(input: { readonly price: number; readonly eps: number; readonly marketCapMn: number; readonly cashMn: number; readonly ebitdaMn: number; readonly fcfMn: number }) {
  const pe = input.price / input.eps
  const evEbitda = (input.marketCapMn - input.cashMn) / input.ebitdaMn
  const fcfYieldPercent = input.fcfMn / input.marketCapMn * 100
  const peScore = scoreBand(pe, [
    { max: 18, score: 80 }, { min: 18, max: 24, score: 65 }, { min: 24, max: 30, score: 50 },
    { min: 30, max: 36, score: 35 }, { min: 36, score: 20 },
  ])
  const evEbitdaScore = scoreBand(evEbitda, [
    { max: 12, score: 80 }, { min: 12, max: 16, score: 65 }, { min: 16, max: 19, score: 50 },
    { min: 19, max: 23, score: 35 }, { min: 23, score: 20 },
  ])
  const fcfYieldScore = scoreBand(fcfYieldPercent, [
    { min: 5, score: 85 }, { min: 3.5, max: 5, score: 70 }, { min: 2, max: 3.5, score: 55 },
    { min: 1, max: 2, score: 35 }, { max: 1, score: 20 },
  ])
  return { pe, evEbitda, fcfYieldPercent, peScore, evEbitdaScore, fcfYieldScore, score: peScore * 0.4 + evEbitdaScore * 0.35 + fcfYieldScore * 0.25 }
}

export function evaluateApiMomentum(input: { readonly priceNow: number; readonly price12mAgo: number; readonly price6mAgo: number; readonly niftyPharma12mReturnPercent: number }) {
  const absolute12mPercent = (input.priceNow / input.price12mAgo - 1) * 100
  const absolute6mPercent = (input.priceNow / input.price6mAgo - 1) * 100
  const relativeStrength12mPercent = absolute12mPercent - input.niftyPharma12mReturnPercent
  const absolute12mScore = scoreBand(absolute12mPercent, [
    { min: 30, score: 100 }, { min: 15, max: 30, score: 80 }, { min: 5, max: 15, score: 65 },
    { min: -5, max: 5, score: 50 }, { min: -15, max: -5, score: 30 }, { max: -15, score: 10 },
  ])
  const absolute6mScore = scoreBand(absolute6mPercent, [
    { min: 20, score: 100 }, { min: 10, max: 20, score: 80 }, { min: 3, max: 10, score: 65 },
    { min: -3, max: 3, score: 50 }, { min: -10, max: -3, score: 30 }, { max: -10, score: 10 },
  ])
  const relativeStrength12mScore = scoreBand(relativeStrength12mPercent, [
    { min: 15, score: 100 }, { min: 7.5, max: 15, score: 80 }, { min: 2.5, max: 7.5, score: 65 },
    { min: -2.5, max: 2.5, score: 50 }, { min: -7.5, max: -2.5, score: 30 }, { max: -7.5, score: 10 },
  ])
  return { absolute12mPercent, absolute6mPercent, relativeStrength12mPercent, absolute12mScore, absolute6mScore, relativeStrength12mScore, score: absolute12mScore * 0.4 + absolute6mScore * 0.25 + relativeStrength12mScore * 0.35 }
}
