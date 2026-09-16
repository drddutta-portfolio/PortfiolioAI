export const PHARMA_SUBPROFILE_CODES = [
  "API_BULK_DRUGS",
  "DOMESTIC_FORMULATIONS",
  "GLOBAL_GENERICS",
  "BIOPHARMA_BIOSIMILARS",
  "CDMO_CRAMS",
] as const

export type PharmaSubprofileCode = typeof PHARMA_SUBPROFILE_CODES[number]
export type ResearchSubprofileAssignmentState = "PROVISIONAL" | "REVIEWED" | "DISPUTED" | "RETIRED"
export type ResearchSubprofileConfidence = "LOW" | "MEDIUM" | "HIGH"
export type ResearchSubprofileExposureMateriality = "IMMATERIAL" | "EMERGING" | "MATERIAL" | "DOMINANT" | "UNKNOWN"

const ALLOWED_ASSIGNMENT_TRANSITIONS: Readonly<Record<ResearchSubprofileAssignmentState, readonly ResearchSubprofileAssignmentState[]>> = {
  PROVISIONAL: ["REVIEWED", "DISPUTED", "RETIRED"],
  REVIEWED: ["DISPUTED", "RETIRED"],
  DISPUTED: ["RETIRED"],
  RETIRED: [],
}

export function canTransitionResearchSubprofileAssignmentState(from: ResearchSubprofileAssignmentState, to: ResearchSubprofileAssignmentState): boolean {
  return ALLOWED_ASSIGNMENT_TRANSITIONS[from].includes(to)
}

export interface ResearchSubprofileExposure {
  readonly exposureCode: PharmaSubprofileCode
  readonly materiality: ResearchSubprofileExposureMateriality
  readonly confidence: ResearchSubprofileConfidence
  readonly assignmentState: ResearchSubprofileAssignmentState
  readonly effectiveFrom: string | null
  readonly effectiveTo: string | null
  readonly sourceReference: string
  readonly reasonCode: string
  readonly reviewedBy: string | null
  readonly reviewedAt: string | null
}

export interface PharmaSubprofileAssignment {
  readonly securityId: string
  readonly profileCode: "PHARMA_V1"
  readonly primarySubprofileCode: PharmaSubprofileCode
  readonly assignmentVersion: number
  readonly assignmentState: ResearchSubprofileAssignmentState
  readonly effectiveFrom: string | null
  readonly effectiveTo: string | null
  readonly sourceReference: string
  readonly reasonCode: string
  readonly confidence: ResearchSubprofileConfidence
  readonly reviewedBy: string | null
  readonly reviewedAt: string | null
  readonly secondaryExposures: readonly ResearchSubprofileExposure[]
}

export type PharmaSubprofileResolution =
  | { readonly status: "RESOLVED"; readonly profileCode: "PHARMA_V1"; readonly assignment: PharmaSubprofileAssignment; readonly blocksReadiness: false }
  | { readonly status: "PARENT_ONLY_BLOCKED"; readonly profileCode: "PHARMA_V1"; readonly assignment: null; readonly blocksReadiness: true; readonly blocker: "MISSING_ASSIGNMENT" | "PROVISIONAL_ASSIGNMENT" | "DISPUTED_ASSIGNMENT" | "NO_ACTIVE_REVIEWED_ASSIGNMENT" | "CONFLICTING_REVIEWED_ASSIGNMENTS" }

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/u

function activeOn(assignment: PharmaSubprofileAssignment, evaluationDate: string) {
  return assignment.effectiveFrom !== null && assignment.effectiveFrom <= evaluationDate && (assignment.effectiveTo === null || evaluationDate < assignment.effectiveTo)
}

function assertValidAssignment(assignment: PharmaSubprofileAssignment) {
  if (!Number.isInteger(assignment.assignmentVersion) || assignment.assignmentVersion < 1) throw new Error("Subprofile assignment version must be a positive integer")
  if ((assignment.effectiveFrom !== null && !ISO_DATE.test(assignment.effectiveFrom)) || (assignment.effectiveTo !== null && !ISO_DATE.test(assignment.effectiveTo))) throw new Error("Subprofile assignment dates must use YYYY-MM-DD")
  if (assignment.effectiveTo !== null && (assignment.effectiveFrom === null || assignment.effectiveTo <= assignment.effectiveFrom)) throw new Error("Subprofile assignment effective interval is invalid")
  if (assignment.assignmentState === "REVIEWED" && (!assignment.reviewedBy || !assignment.reviewedAt || assignment.effectiveFrom === null)) throw new Error("Reviewed subprofile assignments require reviewer provenance and an effective date")
}

export function resolvePharmaSubprofileAssignment(assignments: readonly PharmaSubprofileAssignment[], securityId: string, evaluationDate: string): PharmaSubprofileResolution {
  if (!ISO_DATE.test(evaluationDate)) throw new Error("Evaluation date must use YYYY-MM-DD")
  for (const assignment of assignments) assertValidAssignment(assignment)

  const matching = assignments.filter((assignment) => assignment.securityId === securityId)
  if (!matching.length) return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "MISSING_ASSIGNMENT" }

  const active = matching.filter((assignment) => activeOn(assignment, evaluationDate) && assignment.assignmentState !== "RETIRED")
  if (active.some((assignment) => assignment.assignmentState === "DISPUTED")) return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "DISPUTED_ASSIGNMENT" }
  if (active.some((assignment) => assignment.assignmentState === "PROVISIONAL")) return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "PROVISIONAL_ASSIGNMENT" }
  const reviewed = active.filter((assignment) => assignment.assignmentState === "REVIEWED")
  if (reviewed.length > 1) return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "CONFLICTING_REVIEWED_ASSIGNMENTS" }
  const resolved = reviewed[0]
  if (resolved && reviewed.length === 1) return { status: "RESOLVED", profileCode: "PHARMA_V1", assignment: resolved, blocksReadiness: false }
  const undated = matching.filter((assignment) => assignment.effectiveFrom === null && assignment.assignmentState !== "RETIRED")
  if (undated.some((assignment) => assignment.assignmentState === "DISPUTED")) return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "DISPUTED_ASSIGNMENT" }
  if (undated.some((assignment) => assignment.assignmentState === "PROVISIONAL")) return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "PROVISIONAL_ASSIGNMENT" }
  return { status: "PARENT_ONLY_BLOCKED", profileCode: "PHARMA_V1", assignment: null, blocksReadiness: true, blocker: "NO_ACTIVE_REVIEWED_ASSIGNMENT" }
}
