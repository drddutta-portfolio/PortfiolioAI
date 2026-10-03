export const P8_B_RECOVERY_CONTRACT_VERSION = "P8_B_RECOVERY_CONTRACT_V1" as const
export const P8_REPLAY_METHODOLOGY_VERSION = "P8_R6_R10_REPLAY_V1" as const
export const P8_HISTORICAL_CLASSIFICATION_VERSION = "P8_HISTORICAL_CLASSIFICATION_V1" as const

export const P8_B_RECOVERY_COVERAGE = {
  fullAuditSurfacePairs: 144_768,
  b2EligibleCandidatePairs: 121_956,
  exclusionCeiling: null,
  exclusionCeilingState: "PENDING_OWNER_FREEZE",
} as const

export type HistoricalIdentityKey = {
  readonly historicalIdentityId: string
  readonly historicalIsin: string
  readonly canonicalSecurityId?: string | null
}

export type HistoricalCompanyFact = {
  readonly factId: string
  readonly historicalIdentityId: string
  readonly sourceAuthority: "NSE" | "BSE" | "OFFICIAL_COMPANY_REGULATORY"
  readonly publishedAt: string
}

export type FrozenReplayRouteInput = {
  readonly historicalIdentityId: string
  readonly decisionAt: string
  readonly historicalClassification: string
  readonly historicalBusinessFacts: readonly HistoricalCompanyFact[]
  /**
   * Present-day/manual assignments may be carried for audit visibility only.
   * They are never an input to the frozen retrospective router.
   */
  readonly presentDayManualAssignment?: string | null
}

export type FrozenReplayRoute = {
  readonly methodologyVersion: typeof P8_REPLAY_METHODOLOGY_VERSION
  readonly historicalIdentityId: string
  readonly routeKey: string
}

export type CoverageCounts = {
  readonly fullAuditSurfacePairs: number
  readonly b2EligibleCandidatePairs: number
  readonly replayReadyEligiblePairs: number
}

export function assertHistoricalIdentityKey(identity: HistoricalIdentityKey): HistoricalIdentityKey {
  if (!identity.historicalIdentityId.trim()) throw new Error("historical_identity_id is mandatory")
  if (!identity.historicalIsin.trim()) throw new Error("historical_isin is mandatory")
  return identity
}

export function isStrictlyAvailableBeforeDecision(
  fact: HistoricalCompanyFact,
  decisionAt: string,
): boolean {
  const published = Date.parse(fact.publishedAt)
  const decision = Date.parse(decisionAt)
  if (!Number.isFinite(published) || !Number.isFinite(decision)) {
    throw new Error("publishedAt and decisionAt must be valid timestamps")
  }
  return published < decision
}

export function assertHistoricalFactsPointInTime(
  historicalIdentityId: string,
  facts: readonly HistoricalCompanyFact[],
  decisionAt: string,
): void {
  for (const fact of facts) {
    if (fact.historicalIdentityId !== historicalIdentityId) {
      throw new Error("cross-security historical fact is prohibited")
    }
    if (!isStrictlyAvailableBeforeDecision(fact, decisionAt)) {
      throw new Error("historical company fact must be published strictly before decision")
    }
  }
}

export function applyFrozenReplayRouter(
  input: FrozenReplayRouteInput,
  routeFromHistoricalFacts: (input: Omit<FrozenReplayRouteInput, "presentDayManualAssignment">) => string,
): FrozenReplayRoute {
  assertHistoricalFactsPointInTime(
    input.historicalIdentityId,
    input.historicalBusinessFacts,
    input.decisionAt,
  )

  const routeKey = routeFromHistoricalFacts({
    historicalIdentityId: input.historicalIdentityId,
    decisionAt: input.decisionAt,
    historicalClassification: input.historicalClassification,
    historicalBusinessFacts: input.historicalBusinessFacts,
  })

  if (!routeKey.trim()) throw new Error("frozen methodology router must resolve one deterministic route")

  return {
    methodologyVersion: P8_REPLAY_METHODOLOGY_VERSION,
    historicalIdentityId: input.historicalIdentityId,
    routeKey,
  }
}

export function assertRecoveryCoverage(counts: CoverageCounts): CoverageCounts {
  if (counts.fullAuditSurfacePairs !== P8_B_RECOVERY_COVERAGE.fullAuditSurfacePairs) {
    throw new Error("full audit surface must remain 144,768 identity/date dispositions")
  }
  if (counts.b2EligibleCandidatePairs !== P8_B_RECOVERY_COVERAGE.b2EligibleCandidatePairs) {
    throw new Error("B2-eligible candidate denominator must remain 121,956")
  }
  if (
    counts.replayReadyEligiblePairs < 0 ||
    counts.replayReadyEligiblePairs > counts.b2EligibleCandidatePairs
  ) {
    throw new Error("replay-ready numerator must be bounded by the B2-eligible denominator")
  }
  return counts
}

export function recoveryExclusionCeilingIsFrozen(): boolean {
  return P8_B_RECOVERY_COVERAGE.exclusionCeiling !== null
}
