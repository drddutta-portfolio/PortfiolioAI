import {
  resolvePharmaSubprofileAssignment,
  type PharmaSubprofileAssignment,
} from "./pharmaSubprofileAssignment"

export const PHARMA_DOMESTIC_PEER_COHORT_BUILDER_VERSION =
  "PHARMA_DOMESTIC_PEER_COHORT_BUILDER_V1_PROPOSAL" as const

export interface PharmaDomesticPeerCandidate {
  readonly securityId: string
  readonly isActiveSecurity: boolean
  readonly assignments: readonly PharmaSubprofileAssignment[]
}

export interface PharmaDomesticPeerCohortResult {
  readonly version: typeof PHARMA_DOMESTIC_PEER_COHORT_BUILDER_VERSION
  readonly state: "PROPOSAL_ONLY"
  readonly evaluationDate: string
  readonly targetSecurityId: string
  readonly eligiblePeerSecurityIds: readonly string[]
  readonly excluded: readonly {
    readonly securityId: string
    readonly reason:
      | "TARGET_SECURITY"
      | "INACTIVE_SECURITY"
      | "SUBPROFILE_UNRESOLVED"
      | "PRIMARY_MISMATCH"
  }[]
  readonly minimumPeerCountState: "UNAPPROVED"
  readonly cohortScoreReady: false
  readonly scoreExecutionEnabled: false
}

export function buildDomesticFormulationsPeerCohort(
  targetSecurityId: string,
  evaluationDate: string,
  candidates: readonly PharmaDomesticPeerCandidate[],
): PharmaDomesticPeerCohortResult {
  const eligiblePeerSecurityIds: string[] = []
  const excluded: PharmaDomesticPeerCohortResult["excluded"][number][] = []

  for (const candidate of candidates) {
    if (candidate.securityId === targetSecurityId) {
      excluded.push({ securityId: candidate.securityId, reason: "TARGET_SECURITY" })
      continue
    }

    if (!candidate.isActiveSecurity) {
      excluded.push({ securityId: candidate.securityId, reason: "INACTIVE_SECURITY" })
      continue
    }

    const resolution = resolvePharmaSubprofileAssignment(
      candidate.assignments,
      candidate.securityId,
      evaluationDate,
    )

    if (resolution.status !== "RESOLVED") {
      excluded.push({ securityId: candidate.securityId, reason: "SUBPROFILE_UNRESOLVED" })
      continue
    }

    if (resolution.assignment.primarySubprofileCode !== "DOMESTIC_FORMULATIONS") {
      excluded.push({ securityId: candidate.securityId, reason: "PRIMARY_MISMATCH" })
      continue
    }

    eligiblePeerSecurityIds.push(candidate.securityId)
  }

  return {
    version: PHARMA_DOMESTIC_PEER_COHORT_BUILDER_VERSION,
    state: "PROPOSAL_ONLY",
    evaluationDate,
    targetSecurityId,
    eligiblePeerSecurityIds,
    excluded,
    minimumPeerCountState: "UNAPPROVED",
    cohortScoreReady: false,
    scoreExecutionEnabled: false,
  }
}
