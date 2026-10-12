export type ResultStrength = "STRONG" | "MIXED" | "WEAK" | "UNAVAILABLE"

export interface ReportingPeriod {
  readonly id: string
  readonly label: string
  readonly fiscalYear: number
  readonly quarter: 1 | 2 | 3 | 4
  readonly latest?: boolean
}

export interface QuarterlyMetric {
  readonly id: string
  readonly label: string
  readonly value: number | null
  readonly unit: "INR_CRORE" | "INR" | "PERCENT"
  readonly qoqPercent: number | null
  readonly yoyPercent: number | null
}

export interface QuarterlyResultSummary {
  readonly securityId: string
  readonly periodId: string
  readonly primaryMetricLabel: string
  readonly primaryMetricYoY: number | null
  readonly strength: ResultStrength
  readonly newlyReported: boolean
  readonly available: boolean
  readonly verificationState: "DEMO"
  readonly metrics: readonly QuarterlyMetric[]
}

export interface ResultsPortfolioPosition {
  readonly status: "OPEN" | "CLOSED"
  readonly quantity: number
  readonly averageCost: number | null
  readonly currentPrice: number | null
  readonly currentValue: number | null
  readonly pnl: number | null
  readonly pnlPercent: number | null
  readonly allocationPercent: number | null
}

export interface ResultSecurity {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly industry: string
  readonly positionKind: "CURRENT" | "CLOSED"
  readonly position: ResultsPortfolioPosition
  readonly results: readonly QuarterlyResultSummary[]
}

export interface ResultCollectionStatus {
  readonly configured: boolean
  readonly label: string
  readonly lastScanAt: string | null
  readonly newResults: number | null
  readonly coverageLabel: string
}

export interface ResultsMatrixViewModel {
  readonly periods: readonly ReportingPeriod[]
  readonly securities: readonly ResultSecurity[]
  readonly collectionStatus: ResultCollectionStatus
}
