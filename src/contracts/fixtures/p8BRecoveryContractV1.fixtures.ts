import type {
  FrozenReplayRouteInput,
  HistoricalCompanyFact,
  HistoricalIdentityKey,
} from "../p8BRecoveryContractV1"

export const HISTORICAL_ONLY_IDENTITY_FIXTURE: HistoricalIdentityKey = {
  historicalIdentityId: "hist-delisted-001",
  historicalIsin: "INE000A01001",
  canonicalSecurityId: null,
}

export const CURRENT_LINKED_IDENTITY_FIXTURE: HistoricalIdentityKey = {
  historicalIdentityId: "hist-current-001",
  historicalIsin: "INE000B01002",
  canonicalSecurityId: "security-current-001",
}

export const DECISION_AT = "2025-01-31T15:30:00.000Z"

export const FACT_STRICTLY_BEFORE_DECISION: HistoricalCompanyFact = {
  factId: "fact-before",
  historicalIdentityId: HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIdentityId,
  sourceAuthority: "NSE",
  publishedAt: "2025-01-30T12:00:00.000Z",
}

export const FACT_AT_DECISION: HistoricalCompanyFact = {
  factId: "fact-equal",
  historicalIdentityId: HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIdentityId,
  sourceAuthority: "NSE",
  publishedAt: DECISION_AT,
}

export const FACT_AFTER_DECISION: HistoricalCompanyFact = {
  factId: "fact-after",
  historicalIdentityId: HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIdentityId,
  sourceAuthority: "BSE",
  publishedAt: "2025-02-01T09:00:00.000Z",
}

export const HISTORICAL_ONLY_REPLAY_INPUT: FrozenReplayRouteInput = {
  historicalIdentityId: HISTORICAL_ONLY_IDENTITY_FIXTURE.historicalIdentityId,
  decisionAt: DECISION_AT,
  historicalClassification: "Industrial Manufacturing",
  historicalBusinessFacts: [FACT_STRICTLY_BEFORE_DECISION],
  presentDayManualAssignment: "CURRENT_MANUAL_PROFILE_MUST_NOT_BE_PROJECTED_BACKWARD",
}
