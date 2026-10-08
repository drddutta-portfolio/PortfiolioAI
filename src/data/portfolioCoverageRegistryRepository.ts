import { asEdgeFunctionError, invokeEdgeFunction } from "../lib/edgeFunction"

export interface PortfolioCoverageClassification {
  readonly sector: string | null
  readonly industry: string | null
  readonly marketCapCategory: string | null
  readonly enrichmentState: string | null
  readonly freshUntil: string | null
}

export interface PortfolioCoverageSourceState {
  readonly state: string
  readonly sourceCode: string | null
  readonly freshUntil: string | null
  readonly nextEligibleRefreshAt: string | null
  readonly estimatedProviderCalls: number
}

export interface PortfolioCoverageRegistryRecord {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly currentQuantity: string
  readonly classification: PortfolioCoverageClassification
  readonly identityCoverage: PortfolioCoverageSourceState
  readonly fundamentalsCoverage: PortfolioCoverageSourceState & {
    readonly observationCount: number
    readonly selectedDecisionCount: number
    readonly hasConflictingEvidence: boolean
    readonly latestDecisionAt: string | null
  }
  readonly ownershipCoverage: PortfolioCoverageSourceState
  readonly documentsCoverage: PortfolioCoverageSourceState & {
    readonly documentCount: number
    readonly latestDocumentAt: string | null
  }
  readonly marketHistoryCoverage: PortfolioCoverageSourceState & {
    readonly candleCount: number
    readonly firstCandleAt: string | null
    readonly latestCandleAt: string | null
    readonly latestRetrievedAt: string | null
  }
  readonly scoringProfileAssignment: {
    readonly profileCode: string
    readonly assignmentStatus: string
    readonly assignmentBasis: string | null
    readonly assignedAt: string | null
    readonly reviewedAt: string | null
  } | null
  readonly latestScoreRun: {
    readonly id: string
    readonly scoringProfile: string
    readonly runState: string
    readonly evidenceCoverage: string | number | null
    readonly evidenceConfidence: string | number | null
    readonly asOfDate: string | null
    readonly createdAt: string
  } | null
  readonly latestRecommendationRun: {
    readonly id: string
    readonly sourceScoreRunId: string | null
    readonly runState: string
    readonly transitionStatus: string | null
    readonly scoreReadyCoverage: string | number | null
    readonly evidenceConfidence: string | number | null
    readonly createdAt: string
  } | null
  readonly sizingPersistenceAvailable: boolean
}

export interface PortfolioCoverageRegistryResponse {
  readonly registryVersion: "PORTFOLIO_COVERAGE_V1"
  readonly generatedAt: string
  readonly providerCalls: 0
  readonly budgetConsumed: 0
  readonly records: readonly PortfolioCoverageRegistryRecord[]
}

function isRegistryResponse(value: unknown): value is PortfolioCoverageRegistryResponse {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return record.registryVersion === "PORTFOLIO_COVERAGE_V1"
    && typeof record.generatedAt === "string"
    && record.providerCalls === 0
    && record.budgetConsumed === 0
    && Array.isArray(record.records)
}

export async function loadPortfolioCoverageRegistry(portfolioId: string): Promise<PortfolioCoverageRegistryResponse> {
  const { data, error } = await invokeEdgeFunction("portfolio-coverage-registry", { portfolioId },
  )
  if (error) throw asEdgeFunctionError(error, "Portfolio coverage registry failed.")
  if (!isRegistryResponse(data)) throw new Error("Portfolio coverage registry returned an invalid response.")
  return data
}
