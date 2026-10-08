import { researchProfileDisplayName } from "./researchProfileUiContract"
import { canonicalPharmaPrimary } from "./canonicalResearchAssignment"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import type { SecurityScoringSnapshot } from "./scoringTypes"

/** Presentation only: descriptive classification never selects a methodology. */
export function StockResearchClassification({ industry, sector, snapshot, isLoading, error }: {
  readonly industry: string | null | undefined
  readonly sector: string | null | undefined
  readonly snapshot: SecurityScoringSnapshot | null
  readonly isLoading: boolean
  readonly error: string | null
}) {
  const primary = canonicalPharmaPrimary(snapshot)
  const code = snapshot?.routeState === "RESOLVED" ? snapshot.canonicalRoute?.subprofileCode : null
  const subprofile = isLoading ? "Loading canonical assignment…" : error ? "Unavailable" : primary
    ? PHARMA_SUBPROFILE_CONTRACTS[primary].displayName
    : code ? code.replaceAll("_", " ") : snapshot?.canonicalRoute?.profileCode === "PHARMA"
      ? "Awaiting reviewed assignment" : "Not supplied by the selected assignment"
  return <section className="stock-research-classification" aria-label="Industry and research assignment">
    <p className="stock-primary-industry"><strong>Industry:</strong> {industry ?? "Awaiting classification"}</p>
    <p><strong>Basic Industry:</strong> Unavailable in the shared classification projection</p>
    <p><strong>Sector context:</strong> {sector ?? "Awaiting classification"}</p>
    <p><strong>Methodology / profile:</strong> {isLoading ? "Loading…" : error || !snapshot ? "Unavailable" : researchProfileDisplayName(snapshot)}</p>
    <p><strong>Primary subprofile:</strong> {subprofile}</p>
    <p><strong>Classification verification:</strong> Unavailable</p>
    <p><strong>Research assignment:</strong> {isLoading ? "Loading…" : error ? "Unavailable" : snapshot?.routeState?.replaceAll("_", " ") ?? "Canonical lineage unavailable"}</p>
    <p><strong>Evidence state:</strong> {isLoading ? "Loading…" : error ? "Unavailable" : snapshot?.canonicalEvidenceState?.replaceAll("_", " ") ?? "Unavailable"}</p>
    <p><strong>Assessment engine:</strong> {isLoading ? "Loading…" : error ? "Unavailable" : snapshot?.engineState?.replaceAll("_", " ") ?? "Unavailable"}</p>
  </section>
}
