import { K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION } from "./k5CurrentPortfolioRoutingSnapshot"
import type { PharmaSubprofileResolution } from "./pharmaSubprofileAssignment"
import type { ProgramBScoringReadinessState } from "./programBR6Contract"
import type { SecurityScoringSnapshot } from "./scoringTypes"

export interface ProgramBR6ScoringPresentation {
  readonly securityId: string
  readonly readinessState: ProgramBScoringReadinessState
  readonly canScore: boolean
  readonly researchProfileCode: string
  readonly methodologyVersion: string | null
  readonly methodologyRole: string | null
  readonly assignmentId: string | null
  readonly assignmentVersion: string | number | null
  readonly classificationVersion: string
  readonly evidenceSnapshotIdentity: string | null
  readonly asOfDate: string | null
  readonly blockerCount: number
  readonly blockers: readonly string[]
  readonly reasonCodes: readonly string[]
  readonly scoreRunId: string | null
  readonly score: number | null
  readonly evidenceCoverage: number | null
}

function evidenceFailure(snapshot: SecurityScoringSnapshot) {
  if (snapshot.canonicalEvidenceState === "STALE") return ["STALE_REQUIRED_EVIDENCE", "CANONICAL_EVIDENCE_STALE"] as const
  if (snapshot.canonicalEvidenceState === "CONFLICTING") return ["CONFLICTING_EVIDENCE", "CANONICAL_EVIDENCE_CONFLICTING"] as const
  if (snapshot.canonicalEvidenceState === "REVIEW_REQUIRED") return ["REVIEW_REQUIRED", "CANONICAL_EVIDENCE_REVIEW_REQUIRED"] as const
  if (snapshot.canonicalEvidenceState === "MISSING") return ["INSUFFICIENT_EVIDENCE", "MANDATORY_SCORE_INPUTS_INCOMPLETE"] as const
  return null
}

export function buildProgramBR6ScoringPresentation(input: {
  readonly securityId: string
  readonly snapshot: SecurityScoringSnapshot
  readonly pharmaResolution: PharmaSubprofileResolution | null
}): ProgramBR6ScoringPresentation {
  const { snapshot } = input
  const isPharma = snapshot.profileCode === "PHARMA_V1"
  let role: string | null = isPharma ? null : snapshot.profileCode
  let assignmentId: string | null = null
  let assignmentVersion: string | number | null = null
  const blockers: string[] = []
  let readinessState: ProgramBScoringReadinessState = "INSUFFICIENT_EVIDENCE"

  if (isPharma) {
    if (input.pharmaResolution?.status === "RESOLVED") {
      role = input.pharmaResolution.assignment.primarySubprofileCode
      assignmentId = input.pharmaResolution.assignment.assignmentId ?? null
      assignmentVersion = input.pharmaResolution.assignment.assignmentVersion
      if (!assignmentId || assignmentVersion < 1) blockers.push("PHARMA_PRIMARY_ASSIGNMENT_LINEAGE_INCOMPLETE")
    } else {
      blockers.push(input.pharmaResolution?.status === "PARENT_ONLY_BLOCKED"
        ? `PHARMA_PRIMARY_${input.pharmaResolution.blocker}`
        : "PHARMA_PRIMARY_ASSIGNMENT_UNRESOLVED")
      readinessState = input.pharmaResolution?.status === "PARENT_ONLY_BLOCKED"
        && ["PROVISIONAL_ASSIGNMENT", "DISPUTED_ASSIGNMENT", "CONFLICTING_REVIEWED_ASSIGNMENTS"].includes(input.pharmaResolution.blocker)
        ? "REVIEW_REQUIRED"
        : "BLOCKED_PREREQUISITE"
    }
  }

  if (blockers.length && isPharma && role !== null) readinessState = "BLOCKED_PREREQUISITE"
  if (!blockers.length) {
    if (snapshot.methodologyState === "REVIEW_REQUIRED") {
      readinessState = "REVIEW_REQUIRED"
      blockers.push(snapshot.methodologyReasonCode ?? "CLASSIFICATION_REVIEW_REQUIRED")
    } else if (snapshot.methodologyState === "METHODOLOGY_NOT_AVAILABLE") {
      readinessState = "METHODOLOGY_NOT_AVAILABLE"
      blockers.push(snapshot.methodologyReasonCode ?? "METHODOLOGY_NOT_AVAILABLE")
    } else if (snapshot.scoringExecutionState === "PENDING_ADAPTER" || snapshot.scoringExecutionState === "BLOCKED") {
      readinessState = "BLOCKED_PREREQUISITE"
      blockers.push(snapshot.scoringExecutionReasonCode ?? "SCORING_EXECUTION_BLOCKED")
    } else {
      const evidence = evidenceFailure(snapshot)
      if (evidence) {
        readinessState = evidence[0]
        blockers.push(evidence[1])
      } else if (snapshot.previewMode || snapshot.runState !== "COMPLETE" || !snapshot.scoreRunId || snapshot.overallScore === null || !Number.isFinite(snapshot.overallScore)) {
        readinessState = "INSUFFICIENT_EVIDENCE"
        blockers.push("CANONICAL_COMPLETE_SCORE_RUN_REQUIRED")
      } else {
        readinessState = "READY"
      }
    }
  }

  const score = readinessState === "READY" ? snapshot.overallScore : null
  const scoreRunId = readinessState === "READY" ? snapshot.scoreRunId ?? null : null
  return {
    securityId: input.securityId,
    readinessState,
    canScore: readinessState === "READY",
    researchProfileCode: isPharma ? "PHARMA_V1" : snapshot.profileCode,
    methodologyVersion: snapshot.profileCode || null,
    methodologyRole: role,
    assignmentId,
    assignmentVersion,
    classificationVersion: K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_VERSION,
    evidenceSnapshotIdentity: scoreRunId ?? snapshot.asOfDate,
    asOfDate: snapshot.asOfDate,
    blockerCount: blockers.length,
    blockers,
    reasonCodes: readinessState === "READY" ? ["SCORING_READINESS_READY"] : blockers,
    scoreRunId,
    score,
    evidenceCoverage: snapshot.evidenceCoverage,
  }
}

export function programBMethodologyRoleLabel(role: string | null) {
  if (!role) return "Primary subgroup unresolved"
  const labels: Readonly<Record<string, string>> = {
    API_BULK_DRUGS: "API / Bulk Drugs",
    DOMESTIC_FORMULATIONS: "Domestic Formulations",
    GLOBAL_GENERICS: "Global Generics",
    BIOPHARMA_BIOSIMILARS: "Biopharma / Biosimilars",
    CDMO_CRAMS: "CDMO / CRAMS",
  }
  return labels[role] ?? role.replaceAll("_", " ")
}
