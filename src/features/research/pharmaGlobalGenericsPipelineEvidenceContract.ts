export const PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_VERSION =
  "PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_V1_PROPOSAL" as const

export type PharmaGlobalGenericsPipelineStage =
  | "FILED_OR_SUBMITTED"
  | "TENTATIVE_APPROVAL"
  | "FINAL_APPROVAL"
  | "LAUNCHED"
  | "COMMERCIAL_TRACTION_CONFIRMED"
  | "DELAYED_OR_BLOCKED"
  | "WITHDRAWN_OR_DISCONTINUED"

export interface PharmaGlobalGenericsPipelineEvidenceItem {
  readonly productOrMolecule: string
  readonly geography: string
  readonly stage: PharmaGlobalGenericsPipelineStage
  readonly eventDate: string
  readonly sourceType: "OFFICIAL_REGULATOR" | "ISSUER" | "REVIEWED_RESEARCH"
  readonly materialityEstablished: boolean
  readonly economicRelevanceEstablished: boolean
  readonly evidenceReference: string
}

export interface PharmaGlobalGenericsPipelineEvidenceContract {
  readonly contractVersion: typeof PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE"
  readonly supportedPrimarySubprofile: "GLOBAL_GENERICS"
  readonly canonicalDimension: "BUSINESS_DURABILITY"
  readonly requirementLevel: "MANDATORY"
  readonly history: {
    readonly minimumMaterialEvents: 1
    readonly preferredMaterialEvents: 4
    readonly latestMaterialEventsRequired: true
  }
  readonly identityRequirements: {
    readonly productOrMoleculeRequired: true
    readonly geographyRequired: true
    readonly datedStageRequired: true
    readonly materialityRequired: true
    readonly economicRelevanceRequired: true
    readonly sourceTraceabilityRequired: true
  }
  readonly allowedStages: readonly PharmaGlobalGenericsPipelineStage[]
  readonly countOnlyScoringAllowed: false
  readonly approvalCountAutomaticallyPositive: false
  readonly launchCountAutomaticallyPositive: false
  readonly tentativeApprovalEquivalentToCommercialLaunch: false
  readonly delayedOrBlockedEventsRetained: true
  readonly withdrawnOrDiscontinuedEventsRetained: true
  readonly numericNormalizationState: "UNAPPROVED"
  readonly activationApproved: false
  readonly scoreExecutionEnabled: false
}

export const PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE: PharmaGlobalGenericsPipelineEvidenceContract = {
  contractVersion: PHARMA_GLOBAL_GENERICS_PIPELINE_EVIDENCE_VERSION,
  state: "PROPOSAL_ONLY",
  metricCode: "PHARMA_PIPELINE_LAUNCH_APPROVAL_EVIDENCE",
  supportedPrimarySubprofile: "GLOBAL_GENERICS",
  canonicalDimension: "BUSINESS_DURABILITY",
  requirementLevel: "MANDATORY",
  history: {
    minimumMaterialEvents: 1,
    preferredMaterialEvents: 4,
    latestMaterialEventsRequired: true,
  },
  identityRequirements: {
    productOrMoleculeRequired: true,
    geographyRequired: true,
    datedStageRequired: true,
    materialityRequired: true,
    economicRelevanceRequired: true,
    sourceTraceabilityRequired: true,
  },
  allowedStages: [
    "FILED_OR_SUBMITTED",
    "TENTATIVE_APPROVAL",
    "FINAL_APPROVAL",
    "LAUNCHED",
    "COMMERCIAL_TRACTION_CONFIRMED",
    "DELAYED_OR_BLOCKED",
    "WITHDRAWN_OR_DISCONTINUED",
  ],
  countOnlyScoringAllowed: false,
  approvalCountAutomaticallyPositive: false,
  launchCountAutomaticallyPositive: false,
  tentativeApprovalEquivalentToCommercialLaunch: false,
  delayedOrBlockedEventsRetained: true,
  withdrawnOrDiscontinuedEventsRetained: true,
  numericNormalizationState: "UNAPPROVED",
  activationApproved: false,
  scoreExecutionEnabled: false,
}

export type PharmaGlobalGenericsPipelineEvidenceReadiness =
  | "READY_FOR_NUMERIC_METHODOLOGY"
  | "INSUFFICIENT_EVIDENCE"
  | "REVIEW_REQUIRED"

export function assessGlobalGenericsPipelineEvidence(
  items: readonly PharmaGlobalGenericsPipelineEvidenceItem[],
): PharmaGlobalGenericsPipelineEvidenceReadiness {
  const material = items.filter(
    (item) =>
      item.productOrMolecule.trim().length > 0
      && item.geography.trim().length > 0
      && item.eventDate.trim().length > 0
      && item.evidenceReference.trim().length > 0
      && item.materialityEstablished
      && item.economicRelevanceEstablished,
  )

  if (!items.length || !material.length) return "INSUFFICIENT_EVIDENCE"
  if (material.length !== items.length) return "REVIEW_REQUIRED"
  return "READY_FOR_NUMERIC_METHODOLOGY"
}
