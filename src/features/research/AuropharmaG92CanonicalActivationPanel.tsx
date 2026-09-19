import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import { usePharmaSubprofileResolution } from "./usePharmaSubprofileResolution"

function title(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase())
    .replaceAll("_", " ")
}

export function AuropharmaG92CanonicalActivationPanel({
  securityId,
  symbol,
}: {
  readonly securityId: string
  readonly symbol: string
}) {
  const resolution = usePharmaSubprofileResolution(
    symbol.toLocaleUpperCase() === "AUROPHARMA" ? securityId : null,
  )

  if (symbol.toLocaleUpperCase() !== "AUROPHARMA") return null

  if (resolution.isLoading) {
    return <section className="pharma-persistence-package">
      <p className="muted">Loading G9.2 canonical assignment state…</p>
    </section>
  }

  if (resolution.error) {
    return <section className="pharma-persistence-package">
      <div className="notice notice-error">G9.2 canonical assignment state could not be loaded.</div>
    </section>
  }

  const resolved = resolution.data?.status === "RESOLVED"
    ? resolution.data.assignment
    : null

  const api = resolved?.secondaryExposures.find(
    (item) => item.exposureCode === "API_BULK_DRUGS"
      && item.assignmentState === "REVIEWED"
      && item.materiality === "EMERGING",
  )
  const biosimilars = resolved?.secondaryExposures.find(
    (item) => item.exposureCode === "BIOPHARMA_BIOSIMILARS"
      && item.assignmentState === "REVIEWED",
  )

  const canonicalPass = Boolean(
    resolved
      && resolved.primarySubprofileCode === "GLOBAL_GENERICS"
      && resolved.assignmentState === "REVIEWED"
      && resolved.confidence === "HIGH"
      && resolved.effectiveFrom === "2026-03-31"
      && api
      && !biosimilars,
  )

  return <section className="pharma-persistence-package" aria-labelledby="auropharma-g9-2-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">G9.2 · AUROPHARMA canonical research activation</p>
        <h3 id="auropharma-g9-2-title">Local canonical assignment pathway</h3>
        <p>G9.2 replaces the temporary G8 in-memory assignment with the normal reviewed assignment resolver in Local Supabase. Scoring, recommendation and sizing remain fail-closed.</p>
      </div>
      <span className="pharma-workspace-lock">
        {canonicalPass ? "Local canonical assignment · Resolved" : "Local persistence required"}
      </span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>Resolver state</span>
        <strong>{resolution.data?.status === "RESOLVED" ? "RESOLVED" : "NOT YET RESOLVED"}</strong>
        <small>Canonical research_subprofile assignment path</small>
      </div>
      <div>
        <span>Primary</span>
        <strong>{resolved ? PHARMA_SUBPROFILE_CONTRACTS[resolved.primarySubprofileCode].displayName : "Awaiting local persistence"}</strong>
        <small>{resolved ? `${title(resolved.assignmentState)} · ${title(resolved.confidence)} confidence` : "G9.1 candidate remains non-persisted"}</small>
      </div>
      <div>
        <span>Reviewed secondary</span>
        <strong>{api ? "API / Bulk Drugs · Emerging" : "Awaiting local persistence"}</strong>
        <small>Emerging remains outside readiness and score denominators</small>
      </div>
      <div>
        <span>Biosimilars authority</span>
        <strong>{biosimilars ? "UNEXPECTED ACTIVE ROW" : "No active reviewed row"}</strong>
        <small>Unresolved exposure must remain absent from active authority</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Canonical resolution check</strong>
        <small>Security-scoped reviewed assignment</small>
        <p>{canonicalPass ? "AUROPHARMA resolves through the ordinary PHARMA_V1 assignment repository as Global Generics Primary with API Emerging." : "Run the local-only G9.2 persistence package, then refresh this page. No production write is required."}</p>
        <span>{canonicalPass ? "Canonical local research activation: PASS" : "Canonical local research activation: PENDING"}</span>
      </article>
      <article>
        <strong>Downstream boundary</strong>
        <small>Research activation is not score activation</small>
        <p>Global Generics Primary methodology remains incomplete. G9.2 does not create a score run, recommendation run or position-sizing assessment.</p>
        <span>Score: BLOCKED · Recommendation: BLOCKED · Sizing: BLOCKED</span>
      </article>
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> this panel reads canonical local assignment state only. Production assignment persistence remains separately gated and is not authorized by G9.2 localhost validation.</p>
  </section>
}
