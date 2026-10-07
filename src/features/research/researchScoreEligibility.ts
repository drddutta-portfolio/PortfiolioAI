import type { ProgramBR6ScoringPresentation } from "./programBR6Presentation"
import type { SecurityScoringSnapshot } from "./scoringTypes"

/** Display eligibility only: never calculates, reconstructs or persists a score. */
export function isQualifiedResearchScore(snapshot: SecurityScoringSnapshot | null, isLoading: boolean, error: string | null, programB: ProgramBR6ScoringPresentation | null = null): boolean {
  return Boolean(snapshot && !isLoading && !error
    && snapshot.runState === "COMPLETE" && snapshot.scoreRunId
    && snapshot.overallScore !== null && Number.isFinite(snapshot.overallScore)
    && !snapshot.previewMode
    && (!snapshot.routeState || snapshot.routeState === "RESOLVED")
    && (!snapshot.methodologyState || snapshot.methodologyState === "AVAILABLE")
    && (!snapshot.scoringExecutionState || snapshot.scoringExecutionState === "AVAILABLE")
    && (!snapshot.engineState || snapshot.engineState === "AVAILABLE")
    && (!snapshot.canonicalEvidenceState || snapshot.canonicalEvidenceState === "FRESH")
    && (!programB || programB.canScore))
}
