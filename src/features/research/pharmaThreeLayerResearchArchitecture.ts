import { PHARMA_RESEARCH_PROFILE_V1 } from "./pharmaResearchProfile"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import {
  buildPharmaResearchWorkspaceModel,
  type PharmaResearchWorkspaceModel,
} from "./pharmaResearchWorkspaceModel"
import type {
  PharmaSubprofileAssignment,
  PharmaSubprofileCode,
} from "./pharmaSubprofileAssignment"
import { latestByCode } from "./researchPolicy"
import type { ResearchEvidenceStatus, ResearchMetric } from "./types"

export const PHARMA_THREE_LAYER_RESEARCH_ARCHITECTURE_VERSION =
  "PHARMA_V1_THREE_LAYER_RESEARCH_ARCHITECTURE_V1" as const

export interface PharmaUnresolvedExposure {
  readonly exposureCode: PharmaSubprofileCode
  readonly reasonCode: string
}

export interface PharmaThreeLayerResearchArchitecture {
  readonly version: typeof PHARMA_THREE_LAYER_RESEARCH_ARCHITECTURE_VERSION
  readonly commonCore: {
    readonly profileCode: "PHARMA_V1"
    readonly displayName: "Pharmaceuticals"
    readonly requirementCount: number
    readonly verified: number
    readonly unavailable: number
    readonly reviewAttention: number
  }
  readonly primary: PharmaResearchWorkspaceModel["primary"]
  readonly secondaryExposures: PharmaResearchWorkspaceModel["secondaries"]
  readonly unresolvedExposures: readonly {
    readonly exposureCode: PharmaSubprofileCode
    readonly displayName: string
    readonly reasonCode: string
  }[]
  readonly rawEvidenceScope: "SECURITY_COMPANY"
  readonly interpretationScope: "COMPANY_ACTIVE_ASSIGNMENT_ROLE"
  readonly scoreExecutionEnabled: false
}

function isReviewAttention(status: ResearchEvidenceStatus) {
  return status === "CONFLICTING"
    || status === "AMBIGUOUS"
    || status === "REVIEW_REQUIRED"
    || status === "STALE"
}

function commonCoreSummary(metrics: readonly ResearchMetric[]) {
  const evidenceByCode = latestByCode(metrics)
  const requirements = PHARMA_RESEARCH_PROFILE_V1.metrics.filter(
    (metric) => metric.applicability === "APPLICABLE",
  )
  const states = requirements.map(
    (metric) => evidenceByCode.get(metric.metricCode)?.status ?? "UNAVAILABLE",
  )
  return {
    profileCode: "PHARMA_V1" as const,
    displayName: "Pharmaceuticals" as const,
    requirementCount: requirements.length,
    verified: states.filter((state) => state === "VERIFIED").length,
    unavailable: states.filter((state) => state === "UNAVAILABLE").length,
    reviewAttention: states.filter(isReviewAttention).length,
  }
}

export function buildPharmaThreeLayerResearchArchitecture(
  assignment: PharmaSubprofileAssignment,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
  unresolvedExposures: readonly PharmaUnresolvedExposure[] = [],
): PharmaThreeLayerResearchArchitecture {
  const workspace = buildPharmaResearchWorkspaceModel(
    assignment,
    metrics,
    evaluationDate,
  )

  return {
    version: PHARMA_THREE_LAYER_RESEARCH_ARCHITECTURE_VERSION,
    commonCore: commonCoreSummary(metrics),
    primary: workspace.primary,
    secondaryExposures: workspace.secondaries,
    unresolvedExposures: unresolvedExposures.map((exposure) => ({
      exposureCode: exposure.exposureCode,
      displayName: PHARMA_SUBPROFILE_CONTRACTS[exposure.exposureCode].displayName,
      reasonCode: exposure.reasonCode,
    })),
    rawEvidenceScope: "SECURITY_COMPANY",
    interpretationScope: "COMPANY_ACTIVE_ASSIGNMENT_ROLE",
    scoreExecutionEnabled: false,
  }
}
