export const PORTFOLIO_COVERAGE_REGISTRY_VERSION = "PORTFOLIO_COVERAGE_V1" as const

export type CoverageState =
  | "FRESH"
  | "STALE"
  | "MISSING"
  | "CONFLICTING"
  | "REVIEW_REQUIRED"
  | "NOT_APPLICABLE"
  | "READY_TO_DERIVE"
  | "BLOCKED_PREREQUISITE"

export type CoverageDomain =
  | "IDENTITY"
  | "CLASSIFICATION"
  | "RESEARCH_PROFILE"
  | "FUNDAMENTALS"
  | "OWNERSHIP"
  | "DOCUMENTS"
  | "MARKET_HISTORY"
  | "SCORING"
  | "RECOMMENDATION"
  | "POSITION_SIZING"
  | "CORE_HEALTH"
  | "EXIT_RISK"

export type ResearchProfileReadiness =
  | "READY"
  | "PARTIAL"
  | "INSUFFICIENT_EVIDENCE"
  | "PROFILE_PENDING"
  | "BLOCKED_REVIEW"
  | "NOT_APPLICABLE"

export type CoverageReasonCode =
  | "ASSET_CLASS_NOT_EQUITY"
  | "IDENTITY_MISSING"
  | "IDENTITY_CONFLICTING"
  | "IDENTITY_REVIEW_REQUIRED"
  | "CLASSIFICATION_MISSING"
  | "CLASSIFICATION_CONFLICTING"
  | "RESEARCH_PROFILE_MISSING"
  | "RESEARCH_PROFILE_NOT_READY"
  | "FUNDAMENTALS_MISSING"
  | "FUNDAMENTALS_STALE"
  | "FUNDAMENTALS_CONFLICTING"
  | "OWNERSHIP_MISSING"
  | "OWNERSHIP_STALE"
  | "DOCUMENTS_MISSING"
  | "DOCUMENTS_STALE"
  | "MARKET_HISTORY_MISSING"
  | "MARKET_HISTORY_STALE"
  | "SCORING_MISSING"
  | "SCORING_NOT_READY"
  | "RECOMMENDATION_MISSING"
  | "RECOMMENDATION_NOT_READY"
  | "SIZING_PERSISTENCE_NOT_AVAILABLE"
  | "CORE_HEALTH_NOT_IMPLEMENTED"
  | "EXIT_RISK_NOT_IMPLEMENTED"

export interface SourceCoverageInput {
  readonly state: Exclude<CoverageState, "READY_TO_DERIVE" | "BLOCKED_PREREQUISITE" | "NOT_APPLICABLE">
  readonly sourceCode: string | null
  readonly freshUntil: string | null
  readonly nextEligibleRefreshAt: string | null
  readonly estimatedProviderCalls: number
}

export interface PortfolioCoverageInput {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly canonicalSector: string | null
  readonly canonicalIndustry: string | null
  readonly identityState: "FRESH" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
  readonly classificationState: "FRESH" | "STALE" | "MISSING" | "CONFLICTING" | "REVIEW_REQUIRED"
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

export interface DomainCoverage {
  readonly domain: CoverageDomain
  readonly state: CoverageState
  readonly blockers: readonly CoverageReasonCode[]
  readonly sourceCode: string | null
  readonly freshUntil: string | null
  readonly nextEligibleRefreshAt: string | null
  readonly estimatedProviderCalls: number
}

export interface PortfolioCoverageRecord {
  readonly registryVersion: typeof PORTFOLIO_COVERAGE_REGISTRY_VERSION
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly assetClass: string
  readonly canonicalSector: string | null
  readonly canonicalIndustry: string | null
  readonly researchProfileCode: string | null
  readonly researchProfileVersion: string | null
  readonly researchProfileReadiness: ResearchProfileReadiness
  readonly domains: Readonly<Record<CoverageDomain, DomainCoverage>>
  readonly totalEstimatedProviderCalls: number
  readonly firstBlockingDomain: CoverageDomain | null
}

function domain(
  name: CoverageDomain,
  state: CoverageState,
  blockers: readonly CoverageReasonCode[] = [],
  source?: SourceCoverageInput,
): DomainCoverage {
  return {
    domain: name,
    state,
    blockers,
    sourceCode: source?.sourceCode ?? null,
    freshUntil: source?.freshUntil ?? null,
    nextEligibleRefreshAt: source?.nextEligibleRefreshAt ?? null,
    estimatedProviderCalls: source?.estimatedProviderCalls ?? 0,
  }
}

function reasonForSource(domainName: "FUNDAMENTALS" | "OWNERSHIP" | "DOCUMENTS" | "MARKET_HISTORY", state: SourceCoverageInput["state"]): readonly CoverageReasonCode[] {
  if (domainName === "FUNDAMENTALS") {
    if (state === "MISSING") return ["FUNDAMENTALS_MISSING"]
    if (state === "STALE") return ["FUNDAMENTALS_STALE"]
    if (state === "CONFLICTING" || state === "REVIEW_REQUIRED") return ["FUNDAMENTALS_CONFLICTING"]
  }
  if (domainName === "OWNERSHIP") {
    if (state === "MISSING") return ["OWNERSHIP_MISSING"]
    if (state === "STALE") return ["OWNERSHIP_STALE"]
  }
  if (domainName === "DOCUMENTS") {
    if (state === "MISSING") return ["DOCUMENTS_MISSING"]
    if (state === "STALE") return ["DOCUMENTS_STALE"]
  }
  if (domainName === "MARKET_HISTORY") {
    if (state === "MISSING") return ["MARKET_HISTORY_MISSING"]
    if (state === "STALE") return ["MARKET_HISTORY_STALE"]
  }
  return []
}

function isBlocking(state: CoverageState): boolean {
  return state === "MISSING" || state === "CONFLICTING" || state === "REVIEW_REQUIRED" || state === "BLOCKED_PREREQUISITE"
}

export function buildPortfolioCoverageRecordV1(input: PortfolioCoverageInput): PortfolioCoverageRecord {
  const isEquity = input.assetClass.toUpperCase() === "EQUITY"

  const identityBlockers: CoverageReasonCode[] = []
  if (input.identityState === "MISSING") identityBlockers.push("IDENTITY_MISSING")
  if (input.identityState === "CONFLICTING") identityBlockers.push("IDENTITY_CONFLICTING")
  if (input.identityState === "REVIEW_REQUIRED") identityBlockers.push("IDENTITY_REVIEW_REQUIRED")

  const classificationBlockers: CoverageReasonCode[] = []
  if (input.classificationState === "MISSING") classificationBlockers.push("CLASSIFICATION_MISSING")
  if (input.classificationState === "CONFLICTING" || input.classificationState === "REVIEW_REQUIRED") classificationBlockers.push("CLASSIFICATION_CONFLICTING")

  const profileBlockers: CoverageReasonCode[] = []
  if (!input.researchProfileCode || !input.researchProfileVersion) profileBlockers.push("RESEARCH_PROFILE_MISSING")
  if (input.researchProfileReadiness !== "READY") profileBlockers.push("RESEARCH_PROFILE_NOT_READY")

  const identity = domain("IDENTITY", input.identityState, identityBlockers)
  const classification = domain("CLASSIFICATION", input.classificationState, classificationBlockers)

  let researchProfile: DomainCoverage
  if (!isEquity) {
    researchProfile = domain("RESEARCH_PROFILE", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  } else if (profileBlockers.length > 0 || isBlocking(identity.state) || isBlocking(classification.state)) {
    researchProfile = domain("RESEARCH_PROFILE", "BLOCKED_PREREQUISITE", profileBlockers.length > 0 ? profileBlockers : [...identity.blockers, ...classification.blockers])
  } else {
    researchProfile = domain("RESEARCH_PROFILE", "FRESH")
  }

  const fundamentals = isEquity
    ? domain("FUNDAMENTALS", input.fundamentals.state, reasonForSource("FUNDAMENTALS", input.fundamentals.state), input.fundamentals)
    : domain("FUNDAMENTALS", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  const ownership = isEquity
    ? domain("OWNERSHIP", input.ownership.state, reasonForSource("OWNERSHIP", input.ownership.state), input.ownership)
    : domain("OWNERSHIP", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  const documents = isEquity
    ? domain("DOCUMENTS", input.documents.state, reasonForSource("DOCUMENTS", input.documents.state), input.documents)
    : domain("DOCUMENTS", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  const marketHistory = isEquity
    ? domain("MARKET_HISTORY", input.marketHistory.state, reasonForSource("MARKET_HISTORY", input.marketHistory.state), input.marketHistory)
    : domain("MARKET_HISTORY", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])

  const researchBlocked = !isEquity || researchProfile.state !== "FRESH" || fundamentals.state !== "FRESH"
  let scoring: DomainCoverage
  if (!isEquity) scoring = domain("SCORING", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  else if (researchBlocked) scoring = domain("SCORING", "BLOCKED_PREREQUISITE", ["SCORING_NOT_READY"])
  else if (input.scoringState === "READY" && input.scoreRunId) scoring = domain("SCORING", "FRESH")
  else if (input.scoringState === "MISSING" || !input.scoreRunId) scoring = domain("SCORING", "READY_TO_DERIVE", ["SCORING_MISSING"])
  else scoring = domain("SCORING", "BLOCKED_PREREQUISITE", ["SCORING_NOT_READY"])

  let recommendation: DomainCoverage
  if (!isEquity) recommendation = domain("RECOMMENDATION", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  else if (scoring.state !== "FRESH") recommendation = domain("RECOMMENDATION", "BLOCKED_PREREQUISITE", ["RECOMMENDATION_NOT_READY"])
  else if (input.recommendationState === "READY" && input.recommendationRunId) recommendation = domain("RECOMMENDATION", "FRESH")
  else if (input.recommendationState === "MISSING" || !input.recommendationRunId) recommendation = domain("RECOMMENDATION", "READY_TO_DERIVE", ["RECOMMENDATION_MISSING"])
  else recommendation = domain("RECOMMENDATION", "BLOCKED_PREREQUISITE", ["RECOMMENDATION_NOT_READY"])

  let sizing: DomainCoverage
  if (!isEquity) sizing = domain("POSITION_SIZING", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  else if (recommendation.state !== "FRESH") sizing = domain("POSITION_SIZING", "BLOCKED_PREREQUISITE", ["RECOMMENDATION_NOT_READY"])
  else if (!input.sizingPersistenceAvailable) sizing = domain("POSITION_SIZING", "READY_TO_DERIVE", ["SIZING_PERSISTENCE_NOT_AVAILABLE"])
  else sizing = domain("POSITION_SIZING", "READY_TO_DERIVE")

  const coreHealth = isEquity
    ? domain("CORE_HEALTH", "BLOCKED_PREREQUISITE", ["CORE_HEALTH_NOT_IMPLEMENTED"])
    : domain("CORE_HEALTH", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])
  const exitRisk = isEquity
    ? domain("EXIT_RISK", "BLOCKED_PREREQUISITE", ["EXIT_RISK_NOT_IMPLEMENTED"])
    : domain("EXIT_RISK", "NOT_APPLICABLE", ["ASSET_CLASS_NOT_EQUITY"])

  const domains: Readonly<Record<CoverageDomain, DomainCoverage>> = {
    IDENTITY: identity,
    CLASSIFICATION: classification,
    RESEARCH_PROFILE: researchProfile,
    FUNDAMENTALS: fundamentals,
    OWNERSHIP: ownership,
    DOCUMENTS: documents,
    MARKET_HISTORY: marketHistory,
    SCORING: scoring,
    RECOMMENDATION: recommendation,
    POSITION_SIZING: sizing,
    CORE_HEALTH: coreHealth,
    EXIT_RISK: exitRisk,
  }

  const orderedDomains: CoverageDomain[] = [
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
  const firstBlockingDomain = orderedDomains.find((name) => isBlocking(domains[name].state)) ?? null
  const totalEstimatedProviderCalls = Object.values(domains).reduce((sum, item) => sum + item.estimatedProviderCalls, 0)

  return {
    registryVersion: PORTFOLIO_COVERAGE_REGISTRY_VERSION,
    portfolioId: input.portfolioId,
    securityId: input.securityId,
    symbol: input.symbol,
    assetClass: input.assetClass,
    canonicalSector: input.canonicalSector,
    canonicalIndustry: input.canonicalIndustry,
    researchProfileCode: input.researchProfileCode,
    researchProfileVersion: input.researchProfileVersion,
    researchProfileReadiness: input.researchProfileReadiness,
    domains,
    totalEstimatedProviderCalls,
    firstBlockingDomain,
  }
}
