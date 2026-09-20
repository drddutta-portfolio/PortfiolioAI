import type { SuggestedRole } from "./sectorRecommendation"

export interface ReadOnlyResearchRecommendationAddon {
  readonly contractVersion: string
  readonly profileCode: string
  readonly profileLabel: string
  readonly suggestedRole: SuggestedRole
  readonly roleLabel: string
  readonly state: "READY" | "INSUFFICIENT"
  readonly statusLabel: string
  readonly detail: string
  readonly cautions: readonly string[]
  readonly overallScore: number | null
  readonly policyVersion: string
  readonly actionUnavailableReason: string
  readonly weightUnavailableReason: string
  readonly trackingUnavailableReason: string
  readonly persistenceEnabled: false
  readonly actionBiasEnabled: false
  readonly weightGuidanceEnabled: false
  readonly aiInterpretationEnabled: false
}

export interface ResearchRecommendationAddonState {
  readonly enabled: boolean
  readonly isLoading: boolean
  readonly data: ReadOnlyResearchRecommendationAddon | null
}
