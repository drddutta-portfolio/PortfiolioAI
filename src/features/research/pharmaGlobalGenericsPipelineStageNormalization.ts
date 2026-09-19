import type {
  PharmaGlobalGenericsPipelineEvidenceItem,
  PharmaGlobalGenericsPipelineStage,
} from "./pharmaGlobalGenericsPipelineEvidenceContract"

export const PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_VERSION =
  "PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_V1_PROPOSAL" as const

export interface PharmaGlobalGenericsPipelineStageScore {
  readonly stage: PharmaGlobalGenericsPipelineStage
  readonly score: 0 | 20 | 40 | 55 | 70 | 85 | 100
  readonly interpretation: string
}

export interface PharmaGlobalGenericsPipelineStageNormalizationContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "BUSINESS_DURABILITY"
  readonly stageScores: readonly PharmaGlobalGenericsPipelineStageScore[]
  readonly eligibility: {
    readonly materialityEstablishedRequired: true
    readonly economicRelevanceEstablishedRequired: true
    readonly sourceTraceabilityRequired: true
    readonly unidentifiedEventProducesScore: false
  }
  readonly materialityTreatment: {
    readonly actsAsEligibilityGateOnly: true
    readonly numericMaterialityMultiplierApproved: false
    readonly inferredMaterialityAllowed: false
  }
  readonly aggregationBoundary: {
    readonly eventCountBonusAllowed: false
    readonly simpleAverageAcrossEventsApproved: false
    readonly medianAcrossEventsApproved: false
    readonly recencyWeightingApproved: false
    readonly adverseEventOffsetByUnrelatedSuccessAllowed: false
    readonly combinedPipelineScoreReady: false
  }
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION:
  PharmaGlobalGenericsPipelineStageNormalizationContract = {
    contractVersion: PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION_VERSION,
    state: "PROPOSAL_ONLY",
    metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
    supportedPrimarySubprofile: "GLOBAL_GENERICS",
    canonicalDimension: "BUSINESS_DURABILITY",
    stageScores: [
      {
        stage: "FILED_OR_SUBMITTED",
        score: 40,
        interpretation: "Pipeline optionality exists, but regulatory approval and commercial outcome remain unproven.",
      },
      {
        stage: "TENTATIVE_APPROVAL",
        score: 55,
        interpretation: "Regulatory progress is meaningful, but final approval and commercial realization remain unresolved.",
      },
      {
        stage: "FINAL_APPROVAL",
        score: 70,
        interpretation: "Regulatory approval is established, but launch execution and commercial traction remain unproven.",
      },
      {
        stage: "LAUNCHED",
        score: 85,
        interpretation: "Commercial launch is established, but durable market traction remains to be demonstrated.",
      },
      {
        stage: "COMMERCIAL_TRACTION_CONFIRMED",
        score: 100,
        interpretation: "Material launch has progressed to evidenced commercial traction.",
      },
      {
        stage: "DELAYED_OR_BLOCKED",
        score: 20,
        interpretation: "Material pipeline value is impaired or deferred by an unresolved blocking condition.",
      },
      {
        stage: "WITHDRAWN_OR_DISCONTINUED",
        score: 0,
        interpretation: "The material pipeline opportunity is no longer progressing under the reviewed evidence set.",
      },
    ],
    eligibility: {
      materialityEstablishedRequired: true,
      economicRelevanceEstablishedRequired: true,
      sourceTraceabilityRequired: true,
      unidentifiedEventProducesScore: false,
    },
    materialityTreatment: {
      actsAsEligibilityGateOnly: true,
      numericMaterialityMultiplierApproved: false,
      inferredMaterialityAllowed: false,
    },
    aggregationBoundary: {
      eventCountBonusAllowed: false,
      simpleAverageAcrossEventsApproved: false,
      medianAcrossEventsApproved: false,
      recencyWeightingApproved: false,
      adverseEventOffsetByUnrelatedSuccessAllowed: false,
      combinedPipelineScoreReady: false,
    },
    activationApproved: false,
    scoreExecutionEnabled: false,
  }

export interface PharmaGlobalGenericsPipelineStageNormalizationResult {
  readonly stage: PharmaGlobalGenericsPipelineStage
  readonly score: number
  readonly interpretation: string
}

export function normalizeGlobalGenericsPipelineEvent(
  item: PharmaGlobalGenericsPipelineEvidenceItem,
): PharmaGlobalGenericsPipelineStageNormalizationResult | null {
  if (
    !item.productOrMolecule.trim()
    || !item.geography.trim()
    || !item.eventDate.trim()
    || !item.evidenceReference.trim()
    || !item.materialityEstablished
    || !item.economicRelevanceEstablished
  ) {
    return null
  }

  const stage = PHARMA_GLOBAL_GENERICS_PIPELINE_STAGE_NORMALIZATION.stageScores.find(
    (entry) => entry.stage === item.stage,
  )
  if (!stage) return null

  return {
    stage: stage.stage,
    score: stage.score,
    interpretation: stage.interpretation,
  }
}
