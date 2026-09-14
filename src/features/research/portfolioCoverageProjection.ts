import {
  buildPortfolioCoverageRecordV1,
  type CoverageDomain,
  type CoverageState,
  type PortfolioCoverageRecord,
  type ResearchProfileReadiness,
  type SourceCoverageInput,
} from "./portfolioCoverageRegistry"
import { mapSectorToPortfolioAiV1, type CanonicalSectorCode } from "./sectorResearchMapping"

export interface CachedCoverageSecurityInput {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly sourceSector: string | null
  readonly sourceIndustry: string | null
  readonly identityState: "FRESH" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  readonly researchProfileCode: string | null
  readonly researchProfileVersion: string | null
  readonly researchProfileReadiness: ResearchProfileReadiness
  readonly fundamentals: SourceCoverageInput
  readonly ownership: SourceCoverageInput
  readonly documents: SourceCoverageInput
  readonly marketHistory: SourceCoverageInput
  readonly scoreRunId: string | null
  readonly scoreReadyCoverage: string | null
  readonly scoringState: "READY" | "MISSING" | "INSUFFICIENT_EVIDENCE" | "BLOCKED_REVIEW"
  readonly recommendationRunId: string | null
  readonly recommendationState: "READY" | "MISSING" | "INSUFFICIENT_EVIDENCE" | "EVIDENCE_PENDING"
  readonly sizingPersistenceAvailable: boolean
}

export interface ProjectedPortfolioCoverageRecord extends PortfolioCoverageRecord {
  readonly sourceSector: string | null
  readonly sourceIndustry: string | null
  readonly canonicalSectorCode: CanonicalSectorCode | null
  readonly classificationMappingBasis: string
}

export interface CoverageSummary {
  readonly holdings: number
  readonly equities: number
  readonly nonEquities: number
  readonly byCanonicalSector: Readonly<Record<string, number>>
  readonly byFirstBlockingDomain: Readonly<Record<string, number>>
  readonly byDomainState: Readonly<Record<CoverageDomain, Readonly<Record<CoverageState, number>>>>
}

export function projectPortfolioCoverageV1(input: CachedCoverageSecurityInput): ProjectedPortfolioCoverageRecord {
  const sectorMapping = mapSectorToPortfolioAiV1(input.sourceSector, input.sourceIndustry)
  const isEquity = input.assetClass.toUpperCase() === "EQUITY"
  const classificationState = !isEquity
    ? "FRESH"
    : sectorMapping.state === "MAPPED"
      ? "FRESH"
      : sectorMapping.state === "MISSING"
        ? "MISSING"
        : "REVIEW_REQUIRED"

  const researchProfileCode = input.researchProfileCode ?? sectorMapping.proposedResearchProfileCode
  const researchProfileVersion = input.researchProfileVersion
  const researchProfileReadiness = input.researchProfileCode
    ? input.researchProfileReadiness
    : isEquity
      ? "PROFILE_PENDING"
      : "NOT_APPLICABLE"

  const record = buildPortfolioCoverageRecordV1({
    portfolioId: input.portfolioId,
    securityId: input.securityId,
    symbol: input.symbol,
    assetClass: input.assetClass,
    canonicalSector: sectorMapping.canonicalSectorCode,
    canonicalIndustry: input.sourceIndustry,
    identityState: input.identityState,
    classificationState,
    researchProfileCode,
    researchProfileVersion,
    researchProfileReadiness,
    fundamentals: input.fundamentals,
    ownership: input.ownership,
    documents: input.documents,
    marketHistory: input.marketHistory,
    scoreRunId: input.scoreRunId,
    scoreReadyCoverage: input.scoreReadyCoverage,
    scoringState: input.scoringState,
    recommendationRunId: input.recommendationRunId,
    recommendationState: input.recommendationState,
    sizingPersistenceAvailable: input.sizingPersistenceAvailable,
  })

  return {
    ...record,
    sourceSector: input.sourceSector,
    sourceIndustry: input.sourceIndustry,
    canonicalSectorCode: sectorMapping.canonicalSectorCode,
    classificationMappingBasis: sectorMapping.mappingBasis,
  }
}

const DOMAINS: readonly CoverageDomain[] = [
  "IDENTITY",
  "CLASSIFICATION",
  "RESEARCH_PROFILE",
  "FUNDAMENTALS",
  "OWNERSHIP",
  "DOCUMENTS",
  "MARKET_HISTORY",
  "SCORING",
  "RECOMMENDATION",
  "POSITION_SIZING",
  "CORE_HEALTH",
  "EXIT_RISK",
]

const STATES: readonly CoverageState[] = [
  "FRESH",
  "STALE",
  "MISSING",
  "CONFLICTING",
  "REVIEW_REQUIRED",
  "NOT_APPLICABLE",
  "READY_TO_DERIVE",
  "BLOCKED_PREREQUISITE",
]

function emptyStateCounts(): Record<CoverageState, number> {
  return Object.fromEntries(STATES.map((state) => [state, 0])) as Record<CoverageState, number>
}

export function summarizePortfolioCoverageV1(records: readonly ProjectedPortfolioCoverageRecord[]): CoverageSummary {
  const byCanonicalSector: Record<string, number> = {}
  const byFirstBlockingDomain: Record<string, number> = {}
  const byDomainState = Object.fromEntries(DOMAINS.map((domain) => [domain, emptyStateCounts()])) as Record<CoverageDomain, Record<CoverageState, number>>

  let equities = 0
  for (const record of records) {
    if (record.assetClass.toUpperCase() === "EQUITY") equities += 1
    const sector = record.canonicalSectorCode ?? "UNMAPPED"
    byCanonicalSector[sector] = (byCanonicalSector[sector] ?? 0) + 1
    const blocker = record.firstBlockingDomain ?? "NONE"
    byFirstBlockingDomain[blocker] = (byFirstBlockingDomain[blocker] ?? 0) + 1
    for (const domain of DOMAINS) {
      const state = record.domains[domain].state
      byDomainState[domain][state] += 1
    }
  }

  return {
    holdings: records.length,
    equities,
    nonEquities: records.length - equities,
    byCanonicalSector,
    byFirstBlockingDomain,
    byDomainState,
  }
}
