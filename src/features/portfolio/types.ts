export type PortfolioRole = "CORE" | "SATELLITE" | "THEMATIC" | "UNCLASSIFIED"

export interface LedgerTransaction {
  readonly id: string
  readonly portfolioId: string
  readonly securityId: string
  readonly sourceRowId: string | null
  readonly brokerAccountId: string | null
  readonly transactionType: string
  readonly transactionDate: string | null
  readonly quantity: string | null
  readonly unitPrice: string | null
  readonly charges: string | null
  readonly taxes: string | null
  readonly dataQualityStatus: string
  readonly sourceSequence: number | null
}

export interface SecurityReference {
  readonly id: string
  readonly symbol: string
  readonly name: string
  readonly sector: string | null
  readonly assetClass: string
}

export interface BrokerAccountReference {
  readonly id: string
  readonly name: string
  readonly brokerName: string
}

export interface MarketPrice {
  readonly securityId: string
  readonly price: string
  readonly currency: string
  readonly observedAt: string
  readonly source: string
}

export interface PortfolioLedgerSnapshot {
  readonly portfolio: { readonly id: string; readonly name: string; readonly currency: string }
  readonly transactions: readonly LedgerTransaction[]
  readonly securities: readonly SecurityReference[]
  readonly brokerAccounts: readonly BrokerAccountReference[]
  readonly roles: ReadonlyMap<string, PortfolioRole>
  readonly prices: readonly MarketPrice[]
}

export interface BrokerExposure {
  readonly broker: string
  readonly quantity: string
}

export interface PortfolioPosition {
  readonly securityId: string
  readonly symbol: string
  readonly company: string
  readonly sector: string | null
  readonly role: PortfolioRole
  readonly quantity: string
  readonly transactionCount: number
  readonly averageCost: string | null
  readonly investedAmount: string | null
  readonly currentPrice: string | null
  readonly currentValue: string | null
  readonly unrealisedPnl: string | null
  readonly unrealisedPnlPercent: string | null
  readonly realisedPnl: string | null
  readonly brokerExposure: readonly BrokerExposure[] | null
  readonly hasMissingDates: boolean
  readonly hasMissingBrokers: boolean
  readonly hasMissingPrices: boolean
  readonly costBasisReason: string | null
  readonly realisedPnlReason: string | null
}

export interface PortfolioViewModel {
  readonly portfolio: PortfolioLedgerSnapshot["portfolio"]
  readonly openPositions: readonly PortfolioPosition[]
  readonly closedPositions: readonly PortfolioPosition[]
  readonly totals: {
    readonly openHoldings: number
    readonly closedHistories: number
    readonly securityHistories: number
    readonly investedAmount: string | null
    readonly investedCoverage: number
    readonly currentValue: string | null
    readonly priceCoverage: number
    readonly unrealisedPnl: string | null
    readonly unrealisedPnlPercent: string | null
    readonly realisedPnl: string | null
    readonly realisedCoverage: number
  }
  readonly quality: {
    readonly holdingsWithMissingDates: number
    readonly holdingsWithMissingBrokers: number
    readonly holdingsWithMissingPrices: number
  }
}
