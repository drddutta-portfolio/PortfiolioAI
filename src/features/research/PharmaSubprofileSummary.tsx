import { canonicalPharmaPrimary } from "./canonicalResearchAssignment"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { SecurityScoringSnapshot } from "./scoringTypes"

/** Same assignment as scoring, evidence and the deep workspace; no legacy assignment read. */
export function PharmaSubprofileSummary({ snapshot, isLoading, error }: {
  readonly snapshot: SecurityScoringSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
}) {
  if (snapshot?.canonicalRoute?.profileCode !== "PHARMA" && snapshot?.profileCode !== "PHARMA_V1") return null
  if (isLoading) return <p><strong>Primary subprofile:</strong> Loading canonical assignment…</p>
  if (error) return <p><strong>Primary subprofile:</strong> Unavailable</p>
  const primary = canonicalPharmaPrimary(snapshot)
  return <p><strong>Primary subprofile:</strong> {primary ? `${PHARMA_SUBPROFILE_CONTRACTS[primary].displayName} · Canonical assignment` : "Awaiting reviewed assignment"}</p>
}
