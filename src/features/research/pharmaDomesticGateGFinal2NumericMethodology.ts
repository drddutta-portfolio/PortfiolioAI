export const PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION =
  "PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_V1_OWNER_APPROVED" as const

export interface NumericBand {
  readonly minimumInclusive?: number
  readonly maximumExclusive?: number
  readonly score: number
}

function assertFinite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite`)
}

function assertScore(value: number, label: string) {
  assertFinite(value, label)
  if (value < 0 || value > 100) throw new Error(`${label} must be between 0 and 100`)
}

function scoreBand(value: number, bands: readonly NumericBand[], label: string) {
  assertFinite(value, label)
  const band = bands.find((item) =>
    (item.minimumInclusive === undefined || value >= item.minimumInclusive)
    && (item.maximumExclusive === undefined || value < item.maximumExclusive))
  if (!band) throw new Error(`${label} does not match a score band`)
  return band.score
}

export const PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY = {
  version: PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY_VERSION,
  state: "OWNER_APPROVED_NOT_ACTIVE" as const,
  supportedPrimarySubprofile: "DOMESTIC_FORMULATIONS" as const,
  benchmark: {
    code: "NIFTY_PHARMA" as const,
    use: "SECTOR_RELATIVE_MOMENTUM_AND_VOLATILITY_CONTEXT" as const,
  },
  capitalEfficiency: {
    weights: { level: 60, stability: 20, trend: 20 },
    levelBands: [
      { minimumInclusive: 30, score: 100 },
      { minimumInclusive: 25, maximumExclusive: 30, score: 85 },
      { minimumInclusive: 20, maximumExclusive: 25, score: 70 },
      { minimumInclusive: 15, maximumExclusive: 20, score: 55 },
      { minimumInclusive: 10, maximumExclusive: 15, score: 35 },
      { maximumExclusive: 10, score: 15 },
    ] as const,
    stabilityBands: [
      { maximumExclusive: 3, score: 100 },
      { minimumInclusive: 3, maximumExclusive: 6, score: 80 },
      { minimumInclusive: 6, maximumExclusive: 10, score: 60 },
      { minimumInclusive: 10, maximumExclusive: 15, score: 40 },
      { minimumInclusive: 15, score: 20 },
    ] as const,
    trendBands: [
      { minimumInclusive: 5, score: 100 },
      { minimumInclusive: 2, maximumExclusive: 5, score: 80 },
      { minimumInclusive: -2, maximumExclusive: 2, score: 60 },
      { minimumInclusive: -5, maximumExclusive: -2, score: 40 },
      { maximumExclusive: -5, score: 20 },
    ] as const,
  },
  cashFlow: {
    weights: { cfoToPat: 45, fcfToPat: 35, consistencyTrend: 20 },
    cfoToPatBands: [
      { minimumInclusive: 1.1, score: 100 },
      { minimumInclusive: 0.9, maximumExclusive: 1.1, score: 85 },
      { minimumInclusive: 0.75, maximumExclusive: 0.9, score: 70 },
      { minimumInclusive: 0.6, maximumExclusive: 0.75, score: 55 },
      { minimumInclusive: 0.4, maximumExclusive: 0.6, score: 35 },
      { maximumExclusive: 0.4, score: 15 },
    ] as const,
    fcfToPatBands: [
      { minimumInclusive: 1, score: 100 },
      { minimumInclusive: 0.8, maximumExclusive: 1, score: 85 },
      { minimumInclusive: 0.6, maximumExclusive: 0.8, score: 70 },
      { minimumInclusive: 0.4, maximumExclusive: 0.6, score: 55 },
      { minimumInclusive: 0.2, maximumExclusive: 0.4, score: 35 },
      { maximumExclusive: 0.2, score: 15 },
    ] as const,
    positiveFcfYearScores: { "0": 10, "1": 35, "2": 70, "3": 100 } as const,
    cfoTrendBands: [
      { minimumInclusive: 0.15, score: 100 },
      { minimumInclusive: 0.05, maximumExclusive: 0.15, score: 80 },
      { minimumInclusive: -0.05, maximumExclusive: 0.05, score: 60 },
      { minimumInclusive: -0.15, maximumExclusive: -0.05, score: 40 },
      { maximumExclusive: -0.15, score: 20 },
    ] as const,
    consistencyTrendSubweights: { positiveFcfYears: 60, cfoTrend: 40 },
  },
  balanceSheetCredit: {
    weights: { leverage: 50, interestCoverage: 30, trendResilience: 20 },
    netDebtEbitdaBands: [
      { maximumExclusive: 0, score: 100 },
      { minimumInclusive: 0, maximumExclusive: 0.5, score: 90 },
      { minimumInclusive: 0.5, maximumExclusive: 1, score: 80 },
      { minimumInclusive: 1, maximumExclusive: 1.5, score: 65 },
      { minimumInclusive: 1.5, maximumExclusive: 2.5, score: 45 },
      { minimumInclusive: 2.5, maximumExclusive: 3.5, score: 25 },
      { minimumInclusive: 3.5, score: 10 },
    ] as const,
    interestCoverageBands: [
      { minimumInclusive: 15, score: 100 },
      { minimumInclusive: 10, maximumExclusive: 15, score: 85 },
      { minimumInclusive: 6, maximumExclusive: 10, score: 70 },
      { minimumInclusive: 3, maximumExclusive: 6, score: 50 },
      { minimumInclusive: 1.5, maximumExclusive: 3, score: 30 },
      { maximumExclusive: 1.5, score: 10 },
    ] as const,
    leverageTrendBands: [
      { maximumExclusive: -0.5, score: 100 },
      { minimumInclusive: -0.5, maximumExclusive: -0.2, score: 80 },
      { minimumInclusive: -0.2, maximumExclusive: 0.2, score: 60 },
      { minimumInclusive: 0.2, maximumExclusive: 0.5, score: 40 },
      { minimumInclusive: 0.5, score: 20 },
    ] as const,
  },
  businessDurability: {
    weights: {
      brandTherapyLeadership: 35,
      fieldForceProductivity: 25,
      rndProductivity: 20,
      pipelineCorporateExecution: 20,
    },
    normalizedReviewedComponentScoresRequired: true,
  },
  momentum: {
    weights: { absolute12m: 40, absolute6m: 25, relativeStrength12m: 35 },
    absolute12mBands: [
      { minimumInclusive: 30, score: 100 },
      { minimumInclusive: 15, maximumExclusive: 30, score: 80 },
      { minimumInclusive: 5, maximumExclusive: 15, score: 65 },
      { minimumInclusive: -5, maximumExclusive: 5, score: 50 },
      { minimumInclusive: -15, maximumExclusive: -5, score: 30 },
      { maximumExclusive: -15, score: 10 },
    ] as const,
    absolute6mBands: [
      { minimumInclusive: 20, score: 100 },
      { minimumInclusive: 10, maximumExclusive: 20, score: 80 },
      { minimumInclusive: 3, maximumExclusive: 10, score: 65 },
      { minimumInclusive: -3, maximumExclusive: 3, score: 50 },
      { minimumInclusive: -10, maximumExclusive: -3, score: 30 },
      { maximumExclusive: -10, score: 10 },
    ] as const,
    relativeStrength12mBands: [
      { minimumInclusive: 15, score: 100 },
      { minimumInclusive: 7.5, maximumExclusive: 15, score: 80 },
      { minimumInclusive: 2.5, maximumExclusive: 7.5, score: 65 },
      { minimumInclusive: -2.5, maximumExclusive: 2.5, score: 50 },
      { minimumInclusive: -7.5, maximumExclusive: -2.5, score: 30 },
      { maximumExclusive: -7.5, score: 10 },
    ] as const,
  },
  ownershipGovernance: {
    weights: { ownershipStability: 45, pledgeControlRisk: 35, nonG4GovernanceContext: 20 },
    normalizedReviewedComponentScoresRequired: true,
    g4ConsumedEventsMayReduceDimensionScore: false,
    mechanicalPromoterOwnershipLevelScoringAllowed: false,
    zeroPledgeAutomaticallyBestScore: false,
  },
  risk: {
    weights: { regulatoryContext: 40, maxDrawdown1Y: 35, relativeVolatility: 25 },
    maxDrawdownBands: [
      { minimumInclusive: -15, score: 100 },
      { minimumInclusive: -25, maximumExclusive: -15, score: 80 },
      { minimumInclusive: -35, maximumExclusive: -25, score: 60 },
      { minimumInclusive: -45, maximumExclusive: -35, score: 40 },
      { minimumInclusive: -60, maximumExclusive: -45, score: 20 },
      { maximumExclusive: -60, score: 5 },
    ] as const,
    relativeVolatilityRatioBands: [
      { maximumExclusive: 0.8, score: 100 },
      { minimumInclusive: 0.8, maximumExclusive: 1, score: 80 },
      { minimumInclusive: 1, maximumExclusive: 1.2, score: 60 },
      { minimumInclusive: 1.2, maximumExclusive: 1.5, score: 40 },
      { minimumInclusive: 1.5, score: 20 },
    ] as const,
    regulatoryContextScoreSuppliedByGovernanceRuntimeContract: true,
    g4ConsumedEventsMayReceiveSecondPenalty: false,
  },
  methodologyApproved: true,
  ownerApprovalRequired: false,
  activationApproved: false,
  scoreExecutionEnabled: false,
  persistedScoreRunEnabled: false,
  recommendationEnabled: false,
  positionSizingEnabled: false,
} as const

export interface DomesticCapitalEfficiencyStatistics {
  readonly medianRocePercent: number
  readonly roceIqrPercentagePoints: number
  readonly latestMinusPriorMedianPercentagePoints: number
}

export function evaluateDomesticCapitalEfficiency(
  input: DomesticCapitalEfficiencyStatistics,
) {
  if (input.roceIqrPercentagePoints < 0) throw new Error("ROCE IQR cannot be negative")
  const contract = PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.capitalEfficiency
  const levelScore = scoreBand(input.medianRocePercent, contract.levelBands, "medianRocePercent")
  const stabilityScore = scoreBand(input.roceIqrPercentagePoints, contract.stabilityBands, "roceIqrPercentagePoints")
  const trendScore = scoreBand(input.latestMinusPriorMedianPercentagePoints, contract.trendBands, "latestMinusPriorMedianPercentagePoints")
  return {
    levelScore,
    stabilityScore,
    trendScore,
    combinedScore: levelScore * 0.6 + stabilityScore * 0.2 + trendScore * 0.2,
  }
}

export interface DomesticCashFlowStatistics {
  readonly medianCfoToPat: number
  readonly medianFcfToPat: number
  readonly positiveFcfYearsOutOf3: 0 | 1 | 2 | 3
  readonly latestCfoToPatMinusPriorMedian: number
}

export function evaluateDomesticCashFlow(input: DomesticCashFlowStatistics) {
  const contract = PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.cashFlow
  const cfoToPatScore = scoreBand(input.medianCfoToPat, contract.cfoToPatBands, "medianCfoToPat")
  const fcfToPatScore = scoreBand(input.medianFcfToPat, contract.fcfToPatBands, "medianFcfToPat")
  const positiveFcfYearsScore = contract.positiveFcfYearScores[String(input.positiveFcfYearsOutOf3) as "0" | "1" | "2" | "3"]
  const cfoTrendScore = scoreBand(input.latestCfoToPatMinusPriorMedian, contract.cfoTrendBands, "latestCfoToPatMinusPriorMedian")
  const consistencyTrendScore = positiveFcfYearsScore * 0.6 + cfoTrendScore * 0.4
  return {
    cfoToPatScore,
    fcfToPatScore,
    consistencyTrendScore,
    combinedScore: cfoToPatScore * 0.45 + fcfToPatScore * 0.35 + consistencyTrendScore * 0.2,
  }
}

export interface DomesticBalanceSheetStatistics {
  readonly medianNetDebtEbitda: number
  readonly medianInterestCoverage: number
  readonly latestMinusPriorMedianNetDebtEbitda: number
}

export function evaluateDomesticBalanceSheetCredit(input: DomesticBalanceSheetStatistics) {
  const contract = PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.balanceSheetCredit
  const leverageScore = scoreBand(input.medianNetDebtEbitda, contract.netDebtEbitdaBands, "medianNetDebtEbitda")
  const interestCoverageScore = scoreBand(input.medianInterestCoverage, contract.interestCoverageBands, "medianInterestCoverage")
  const trendResilienceScore = scoreBand(input.latestMinusPriorMedianNetDebtEbitda, contract.leverageTrendBands, "latestMinusPriorMedianNetDebtEbitda")
  return {
    leverageScore,
    interestCoverageScore,
    trendResilienceScore,
    combinedScore: leverageScore * 0.5 + interestCoverageScore * 0.3 + trendResilienceScore * 0.2,
  }
}

export interface DomesticBusinessDurabilityScores {
  readonly brandTherapyLeadershipScore: number
  readonly fieldForceProductivityScore: number
  readonly rndProductivityScore: number
  readonly pipelineCorporateExecutionScore: number
}

export function evaluateDomesticBusinessDurability(input: DomesticBusinessDurabilityScores) {
  Object.entries(input).forEach(([key, value]) => assertScore(value, key))
  return {
    combinedScore:
      input.brandTherapyLeadershipScore * 0.35
      + input.fieldForceProductivityScore * 0.25
      + input.rndProductivityScore * 0.2
      + input.pipelineCorporateExecutionScore * 0.2,
  }
}

export interface DomesticMomentumStatistics {
  readonly absolute12mPercent: number
  readonly absolute6mPercent: number
  readonly relativeStrength12mPercent: number
}

export function evaluateDomesticMomentum(input: DomesticMomentumStatistics) {
  const contract = PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.momentum
  const absolute12mScore = scoreBand(input.absolute12mPercent, contract.absolute12mBands, "absolute12mPercent")
  const absolute6mScore = scoreBand(input.absolute6mPercent, contract.absolute6mBands, "absolute6mPercent")
  const relativeStrength12mScore = scoreBand(input.relativeStrength12mPercent, contract.relativeStrength12mBands, "relativeStrength12mPercent")
  return {
    absolute12mScore,
    absolute6mScore,
    relativeStrength12mScore,
    combinedScore: absolute12mScore * 0.4 + absolute6mScore * 0.25 + relativeStrength12mScore * 0.35,
  }
}

export interface DomesticOwnershipGovernanceScores {
  readonly ownershipStabilityScore: number
  readonly pledgeControlRiskScore: number
  readonly nonG4GovernanceContextScore: number
}

export function evaluateDomesticOwnershipGovernance(input: DomesticOwnershipGovernanceScores) {
  Object.entries(input).forEach(([key, value]) => assertScore(value, key))
  return {
    combinedScore:
      input.ownershipStabilityScore * 0.45
      + input.pledgeControlRiskScore * 0.35
      + input.nonG4GovernanceContextScore * 0.2,
  }
}

export interface DomesticRiskStatistics {
  readonly regulatoryContextScore: number
  readonly maxDrawdown1YPercent: number
  readonly relativeVolatilityRatio: number
}

export function evaluateDomesticRisk(input: DomesticRiskStatistics) {
  assertScore(input.regulatoryContextScore, "regulatoryContextScore")
  if (input.maxDrawdown1YPercent > 0 || input.maxDrawdown1YPercent < -100) {
    throw new Error("maxDrawdown1YPercent must be between -100 and 0")
  }
  if (!Number.isFinite(input.relativeVolatilityRatio) || input.relativeVolatilityRatio < 0) {
    throw new Error("relativeVolatilityRatio must be finite and non-negative")
  }
  const contract = PHARMA_DOMESTIC_GATE_G_FINAL_2_NUMERIC_METHODOLOGY.risk
  const maxDrawdownScore = scoreBand(input.maxDrawdown1YPercent, contract.maxDrawdownBands, "maxDrawdown1YPercent")
  const relativeVolatilityScore = scoreBand(input.relativeVolatilityRatio, contract.relativeVolatilityRatioBands, "relativeVolatilityRatio")
  return {
    regulatoryContextScore: input.regulatoryContextScore,
    maxDrawdownScore,
    relativeVolatilityScore,
    combinedScore:
      input.regulatoryContextScore * 0.4
      + maxDrawdownScore * 0.35
      + relativeVolatilityScore * 0.25,
  }
}
