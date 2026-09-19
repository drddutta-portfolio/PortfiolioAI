import type {
  PharmaGlobalGenericsPipelineEvidenceItem,
  PharmaGlobalGenericsPipelineStage,
} from "./pharmaGlobalGenericsPipelineEvidenceContract"
import { normalizeGlobalGenericsPipelineEvent } from "./pharmaGlobalGenericsPipelineStageNormalization"

export const PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_VERSION =
  "PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_V1_OWNER_APPROVED" as const

export interface PharmaGlobalGenericsPipelineCombinedScoreContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_VERSION
  readonly state: "OWNER_APPROVED_NOT_ACTIVE"
  readonly metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "BUSINESS_DURABILITY"
  readonly method: "LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE"
  readonly pipelineIdentity: readonly ["PRODUCT_OR_MOLECULE", "GEOGRAPHY"]
  readonly adverseStages: readonly ["DELAYED_OR_BLOCKED", "WITHDRAWN_OR_DISCONTINUED"]
  readonly sameDateContradictoryLatestStagesRequireReview: true
  readonly olderLifecycleStatesRetainedForAudit: true
  readonly ageBasedRecencyWeightingApproved: false
  readonly materialityRemainsEligibilityGateOnly: true
  readonly economicRelevanceRemainsEligibilityGateOnly: true
  readonly eventCountBonusAllowed: false
  readonly unrelatedPositiveOffsetAllowed: false
  readonly executableCombinedScoreFunctionPresent: true
  readonly combinedPipelineScoreReady: true
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
  readonly persistedScoreRunEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE:
  PharmaGlobalGenericsPipelineCombinedScoreContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_PIPELINE_COMBINED_SCORE_VERSION,
    state: "OWNER_APPROVED_NOT_ACTIVE",
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "BUSINESS_DURABILITY",
    method: "LATEST_STATE_PER_PIPELINE_IDENTITY_THEN_MEDIAN_IF_NO_ADVERSE",
    pipelineIdentity: ["PRODUCT_OR_MOLECULE", "GEOGRAPHY"],
    adverseStages: ["DELAYED_OR_BLOCKED", "WITHDRAWN_OR_DISCONTINUED"],
    sameDateContradictoryLatestStagesRequireReview: true,
    olderLifecycleStatesRetainedForAudit: true,
    ageBasedRecencyWeightingApproved: false,
    materialityRemainsEligibilityGateOnly: true,
    economicRelevanceRemainsEligibilityGateOnly: true,
    eventCountBonusAllowed: false,
    unrelatedPositiveOffsetAllowed: false,
    executableCombinedScoreFunctionPresent: true,
    combinedPipelineScoreReady: true,
    activationApproved: false,
    scoreExecutionEnabled: false,
    persistedScoreRunEnabled: false,
  }

export interface PharmaGlobalGenericsPipelineIdentityState {
  readonly productOrMolecule: string
  readonly geography: string
  readonly latestEventDate: string
  readonly latestStage: PharmaGlobalGenericsPipelineStage
  readonly normalizedScore: number
  readonly historicalEventCount: number
}

export interface PharmaGlobalGenericsPipelineCombinedScoreResult {
  readonly state: "READY" | "INSUFFICIENT_EVIDENCE" | "REVIEW_REQUIRED"
  readonly combinedScore: number | null
  readonly distinctPipelineIdentityCount: number
  readonly adverseIdentityCount: number
  readonly latestIdentityStates: readonly PharmaGlobalGenericsPipelineIdentityState[]
  readonly reason:
    | "COMBINED_MEDIAN_READY"
    | "NO_ELIGIBLE_EVENTS"
    | "INELIGIBLE_EVENT_PRESENT"
    | "CONTRADICTORY_LATEST_STATE"
    | "LATEST_ADVERSE_STATE_PRESENT"
}

function identityKey(item: PharmaGlobalGenericsPipelineEvidenceItem) {
  return `${item.productOrMolecule.trim().toLocaleUpperCase()}::${item.geography.trim().toLocaleUpperCase()}`
}

function median(values: readonly number[]): number | null {
  if (!values.length) return null

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  const upper = sorted[middle]

  if (upper === undefined) return null
  if (sorted.length % 2 === 1) return upper

  const lower = sorted[middle - 1]
  if (lower === undefined) return null

  return (lower + upper) / 2
}

function isAdverseStage(stage: PharmaGlobalGenericsPipelineStage) {
  return stage === "DELAYED_OR_BLOCKED" || stage === "WITHDRAWN_OR_DISCONTINUED"
}

export function combineGlobalGenericsPipelineScores(
  items: readonly PharmaGlobalGenericsPipelineEvidenceItem[],
): PharmaGlobalGenericsPipelineCombinedScoreResult {
  if (!items.length) {
    return {
      state: "INSUFFICIENT_EVIDENCE",
      combinedScore: null,
      distinctPipelineIdentityCount: 0,
      adverseIdentityCount: 0,
      latestIdentityStates: [],
      reason: "NO_ELIGIBLE_EVENTS",
    }
  }

  const normalized = items.map((item) => ({
    item,
    normalized: normalizeGlobalGenericsPipelineEvent(item),
  }))

  if (normalized.some((entry) => entry.normalized === null)) {
    return {
      state: "REVIEW_REQUIRED",
      combinedScore: null,
      distinctPipelineIdentityCount: 0,
      adverseIdentityCount: 0,
      latestIdentityStates: [],
      reason: "INELIGIBLE_EVENT_PRESENT",
    }
  }

  const grouped = new Map<string, typeof normalized>()
  for (const entry of normalized) {
    const key = identityKey(entry.item)
    const existing = grouped.get(key)
    if (existing) existing.push(entry)
    else grouped.set(key, [entry])
  }

  const latestIdentityStates: PharmaGlobalGenericsPipelineIdentityState[] = []

  for (const entries of grouped.values()) {
    const sorted = [...entries].sort((a, b) => a.item.eventDate.localeCompare(b.item.eventDate))
    const latestSortedEntry = sorted.at(-1)

    if (!latestSortedEntry) {
      return {
        state: "INSUFFICIENT_EVIDENCE",
        combinedScore: null,
        distinctPipelineIdentityCount: grouped.size,
        adverseIdentityCount: 0,
        latestIdentityStates: [],
        reason: "NO_ELIGIBLE_EVENTS",
      }
    }

    const latestDate = latestSortedEntry.item.eventDate
    const latestEntries = sorted.filter((entry) => entry.item.eventDate === latestDate)
    const latestStages = new Set(latestEntries.map((entry) => entry.item.stage))

    if (latestStages.size !== 1) {
      return {
        state: "REVIEW_REQUIRED",
        combinedScore: null,
        distinctPipelineIdentityCount: grouped.size,
        adverseIdentityCount: 0,
        latestIdentityStates: [],
        reason: "CONTRADICTORY_LATEST_STATE",
      }
    }

    const latest = latestEntries[0]
    if (!latest || !latest.normalized) {
      return {
        state: "REVIEW_REQUIRED",
        combinedScore: null,
        distinctPipelineIdentityCount: grouped.size,
        adverseIdentityCount: 0,
        latestIdentityStates: [],
        reason: "INELIGIBLE_EVENT_PRESENT",
      }
    }

    latestIdentityStates.push({
      productOrMolecule: latest.item.productOrMolecule.trim(),
      geography: latest.item.geography.trim(),
      latestEventDate: latest.item.eventDate,
      latestStage: latest.item.stage,
      normalizedScore: latest.normalized.score,
      historicalEventCount: entries.length,
    })
  }

  latestIdentityStates.sort((a, b) =>
    a.productOrMolecule.localeCompare(b.productOrMolecule)
    || a.geography.localeCompare(b.geography),
  )

  const adverseIdentityCount = latestIdentityStates.filter((item) => isAdverseStage(item.latestStage)).length

  if (adverseIdentityCount > 0) {
    return {
      state: "REVIEW_REQUIRED",
      combinedScore: null,
      distinctPipelineIdentityCount: latestIdentityStates.length,
      adverseIdentityCount,
      latestIdentityStates,
      reason: "LATEST_ADVERSE_STATE_PRESENT",
    }
  }

  const combinedScore = median(latestIdentityStates.map((item) => item.normalizedScore))

  if (combinedScore === null) {
    return {
      state: "INSUFFICIENT_EVIDENCE",
      combinedScore: null,
      distinctPipelineIdentityCount: latestIdentityStates.length,
      adverseIdentityCount: 0,
      latestIdentityStates,
      reason: "NO_ELIGIBLE_EVENTS",
    }
  }

  return {
    state: "READY",
    combinedScore,
    distinctPipelineIdentityCount: latestIdentityStates.length,
    adverseIdentityCount: 0,
    latestIdentityStates,
    reason: "COMBINED_MEDIAN_READY",
  }
}
