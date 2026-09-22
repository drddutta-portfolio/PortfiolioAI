import { composePharmaSubprofileContract, PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { PharmaSubprofileAssignment, PharmaSubprofileCode, ResearchSubprofileExposure } from "./pharmaSubprofileAssignment"
import { latestByCode, metricLabel } from "./researchPolicy"
import type { ResearchEvidenceStatus, ResearchMetric } from "./types"

export type PharmaSecondaryOverlayMode =
  | "EVIDENCE_OVERLAY"
  | "EMERGING_WATCH"
  | "MONITOR_ONLY"
  | "BLOCKED"
  | "RECLASSIFICATION_REVIEW"

export interface PharmaWorkspaceRequirement {
  readonly metricCode: string
  readonly label: string
  readonly requirementLevel: "MANDATORY" | "IMPORTANT" | "SUPPLEMENTARY"
  readonly dimension: string
  readonly status: ResearchEvidenceStatus
}

export interface PharmaWorkspaceSecondaryExposure {
  readonly exposureCode: PharmaSubprofileCode
  readonly displayName: string
  readonly materiality: ResearchSubprofileExposure["materiality"]
  readonly confidence: ResearchSubprofileExposure["confidence"]
  readonly mode: PharmaSecondaryOverlayMode
  readonly note: string
  readonly requirements: readonly PharmaWorkspaceRequirement[]
}

export interface PharmaResearchWorkspaceModel {
  readonly primary: {
    readonly subprofileCode: PharmaSubprofileCode
    readonly displayName: string
    readonly confidence: PharmaSubprofileAssignment["confidence"]
    readonly effectiveFrom: string
    readonly requirements: readonly PharmaWorkspaceRequirement[]
    readonly verified: number
    readonly unavailable: number
    readonly reviewAttention: number
  }
  readonly secondaries: readonly PharmaWorkspaceSecondaryExposure[]
  readonly scoringState: "UNAPPROVED"
}

function activeExposure(exposure: ResearchSubprofileExposure, evaluationDate: string) {
  return exposure.assignmentState === "REVIEWED"
    && exposure.effectiveFrom !== null
    && exposure.effectiveFrom <= evaluationDate
    && (exposure.effectiveTo === null || evaluationDate < exposure.effectiveTo)
}

function workspaceMetricCodes(subprofileCode: PharmaSubprofileCode) {
  const subprofile = PHARMA_SUBPROFILE_CONTRACTS[subprofileCode]
  return [...new Set([
    ...subprofile.overrides.map((override) => override.metricCode),
    ...subprofile.additions.map((addition) => addition.metricCode),
  ])]
}

function requirementsFor(subprofileCode: PharmaSubprofileCode, metrics: readonly ResearchMetric[]): readonly PharmaWorkspaceRequirement[] {
  const contract = composePharmaSubprofileContract(subprofileCode)
  const effectiveByCode = new Map(contract.metrics.map((metric) => [metric.metricCode, metric]))
  const evidenceByCode = latestByCode(metrics)

  return workspaceMetricCodes(subprofileCode).flatMap((metricCode) => {
    const requirement = effectiveByCode.get(metricCode)
    if (!requirement || requirement.applicability === "NOT_APPLICABLE") return []
    const evidence = evidenceByCode.get(metricCode)
    return [{
      metricCode,
      label: metricLabel(metricCode),
      requirementLevel: requirement.requirementLevel,
      dimension: requirement.dimension,
      status: evidence?.status ?? "UNAVAILABLE",
    }]
  })
}

function secondaryMode(materiality: ResearchSubprofileExposure["materiality"]): PharmaSecondaryOverlayMode {
  if (materiality === "MATERIAL") return "EVIDENCE_OVERLAY"
  if (materiality === "EMERGING") return "EMERGING_WATCH"
  if (materiality === "IMMATERIAL") return "MONITOR_ONLY"
  if (materiality === "DOMINANT") return "RECLASSIFICATION_REVIEW"
  return "BLOCKED"
}

function secondaryNote(mode: PharmaSecondaryOverlayMode) {
  if (mode === "EVIDENCE_OVERLAY") return "Material exposure: activate the reviewed evidence overlay without blending a second score."
  if (mode === "EMERGING_WATCH") return "Emerging exposure: retain an explicit watchlist; do not activate a full secondary scorecard until an EMERGING-specific requirement contract is versioned."
  if (mode === "MONITOR_ONLY") return "Immaterial exposure: retain for context without activating additional research requirements."
  if (mode === "RECLASSIFICATION_REVIEW") return "Dominant exposure: primary-subprofile reclassification review is required before readiness can proceed."
  return "Materiality unresolved: fail closed until the exposure is reviewed."
}

function isReviewAttention(status: ResearchEvidenceStatus) {
  return status === "CONFLICTING" || status === "AMBIGUOUS" || status === "REVIEW_REQUIRED" || status === "STALE"
}

export function buildPharmaResearchWorkspaceModel(
  assignment: PharmaSubprofileAssignment,
  metrics: readonly ResearchMetric[],
  evaluationDate: string,
): PharmaResearchWorkspaceModel {
  if (assignment.assignmentState !== "REVIEWED" || assignment.effectiveFrom === null) throw new Error("Pharma workspace requires an active reviewed assignment")

  const primaryRequirements = requirementsFor(assignment.primarySubprofileCode, metrics)
  const secondaries = assignment.secondaryExposures
    .filter((exposure) => activeExposure(exposure, evaluationDate))
    .map((exposure): PharmaWorkspaceSecondaryExposure => {
      const mode = secondaryMode(exposure.materiality)
      return {
        exposureCode: exposure.exposureCode,
        displayName: PHARMA_SUBPROFILE_CONTRACTS[exposure.exposureCode].displayName,
        materiality: exposure.materiality,
        confidence: exposure.confidence,
        mode,
        note: secondaryNote(mode),
        requirements: mode === "EVIDENCE_OVERLAY" ? requirementsFor(exposure.exposureCode, metrics) : [],
      }
    })

  return {
    primary: {
      subprofileCode: assignment.primarySubprofileCode,
      displayName: PHARMA_SUBPROFILE_CONTRACTS[assignment.primarySubprofileCode].displayName,
      confidence: assignment.confidence,
      effectiveFrom: assignment.effectiveFrom,
      requirements: primaryRequirements,
      verified: primaryRequirements.filter((item) => item.status === "VERIFIED").length,
      unavailable: primaryRequirements.filter((item) => item.status === "UNAVAILABLE").length,
      reviewAttention: primaryRequirements.filter((item) => isReviewAttention(item.status)).length,
    },
    secondaries,
    scoringState: "UNAPPROVED",
  }
}
