import {
  buildPortfolioCoverageRecordV1,
  type CoverageDomain,
  type CoverageState,
  type PortfolioCoverageRecord,
  type ResearchProfileReadiness,
  type SourceCoverageInput,
} from "./portfolioCoverageRegistry"
import { routeResearchProfileV1, type ResearchProfileRoutingState } from "./researchProfileRouting"
import { mapSectorToPortfolioAiV1 } from "./sectorResearchMapping"

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
  readonly applicationSector: string | null
  readonly classificationMappingBasis: string
  readonly proposedResearchProfileCode: string | null
  readonly researchProfileRoutingState: ResearchProfileRoutingState
  readonly researchProfileRoutingReason: string
}

export interface CoverageSummary {
  readonly holdings: number
  readonly equities: number
  readonly nonEquities: number
  readonly byApplicationSector: Readonly<Record<string, number>>
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
      : "MISSING"

  const routing = routeResearchProfileV1({
    assetClass: input.assetClass,
    applicationSector: sectorMapping.applicationSector,
    applicationIndustry: input.sourceIndustry,
  })

  // Routing is methodology planning only. It must never promote a holding to
  // research-profile READY until a reviewed/versioned profile assignment exists.
  const researchProfileCode = input.researchProfileCode ?? routing.profileCode
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
    canonicalSector: sectorMapping.applicationSector,
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
    applicationSector: sectorMapping.applicationSector,
    classificationMappingBasis: sectorMapping.mappingBasis,
    proposedResearchProfileCode: routing.profileCode,
    researchProfileRoutingState: routing.state,
    researchProfileRoutingReason: routing.reasonCode,
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
  const byApplicationSector: Record<string, number> = {}
  const byFirstBlockingDomain: Record<string, number> = {}
  const byDomainState = Object.fromEntries(DOMAINS.map((domain) => [domain, emptyStateCounts()])) as Record<CoverageDomain, Record<CoverageState, number>>

  let equities = 0
  for (const record of records) {
    if (record.assetClass.toUpperCase() === "EQUITY") equities += 1
    const sector = record.applicationSector ?? "UNCLASSIFIED"
    byApplicationSector[sector] = (byApplicationSector[sector] ?? 0) + 1
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
    byApplicationSector,
    byFirstBlockingDomain,
    byDomainState,
  }
}
