import type { SecurityScoringSnapshot } from "./scoringTypes"

/** Canonical assignment lineage is distinct from descriptive sector/industry labels. */
export function ResearchAssignmentSummary({ snapshot, isLoading, error }: {
  readonly snapshot: SecurityScoringSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
}) {
  const route = snapshot?.canonicalRoute
  return <details className="research-assignment-summary">
    <summary>Research assignment and classification detail</summary>
    {isLoading ? <p role="status">Loading canonical research assignment…</p> : error ? <p role="alert">Research assignment unavailable: {error}</p> : <>
      <p><strong>Research profile:</strong> {route?.profileCode ?? snapshot?.profileCode ?? "Unresolved"}</p>
      <p><strong>Research subprofile:</strong> {route?.subprofileCode ?? "No subprofile supplied by the selected assignment"}</p>
      <p><strong>Assignment state:</strong> {snapshot?.routeState?.replaceAll("_", " ") ?? "Canonical lineage unavailable"}</p>
      {route ? <>
        <p>Methodology: {route.methodologyAuthority} / {route.methodologyVersion}</p>
        <p>Assignment: {route.assignmentAuthority ?? "Authority unavailable"} / {route.assignmentVersion} / {route.assignmentId}</p>
        <p>Selected snapshot: {route.snapshotId} · as of {route.asOfDate}</p>
      </> : <p>No canonical assignment lineage supplied. Classification cannot substitute for an approved research assignment.</p>}
    </>}
    <p><strong>Macro-economic sector / basic industry / sub-sector / group:</strong> Unavailable in the current shared classification projection.</p>
    <p>Sector and industry are shown above. Research profiles and subprofiles describe methodology; they are not substitute classification labels.</p>
  </details>
}
