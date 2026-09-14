import { buildPharmaReadinessView, type PharmaReadinessDisplayState } from "./pharmaReadinessViewModel"
import type { SecurityResearch } from "./types"
import "./PharmaResearchReadinessPanel.css"

const stateLabel: Readonly<Record<PharmaReadinessDisplayState, string>> = {
  VALIDATED_SOURCE: "Source validated",
  PARTIAL: "Partial",
  PENDING: "Pending",
  OFFICIAL_SOURCE_PENDING: "Official source pending",
}

export function PharmaResearchReadinessPanel({ research }: { readonly research: SecurityResearch }) {
  const view = buildPharmaReadinessView(research)
  if (!view) return null

  return <section className="pharma-readiness-panel" aria-labelledby="pharma-readiness-title">
    <header>
      <div>
        <p className="eyebrow">Sector-specific research contract</p>
        <h2 id="pharma-readiness-title">PHARMA_V1 Research Readiness</h2>
        <p>Provider capability and canonical research readiness are shown separately. Raw discovery never becomes a score by itself.</p>
      </div>
      <div className="pharma-readiness-summary">
        <span className="pharma-readiness-state">Insufficient evidence</span>
        <strong>{view.validatedSourceDomains}/{view.mandatoryDomainCount}</strong>
        <small>core source domains validated</small>
      </div>
    </header>

    <div className="pharma-readiness-grid">
      {view.domains.map((domain) => <article key={domain.metricCode} className={`pharma-domain pharma-domain-${domain.state.toLocaleLowerCase()}`}>
        <div className="pharma-domain-head">
          <div><span>{domain.requirement}</span><h3>{domain.label}</h3></div>
          <b>{stateLabel[domain.state]}</b>
        </div>
        <p>{domain.detail}</p>
        <footer>
          <span>Canonical cached observations: <strong>{domain.canonicalObservationCount}</strong></span>
          <span>Contract minimum: <strong>{domain.minimumObservations}</strong></span>
        </footer>
      </article>)}
    </div>

    <div className="pharma-readiness-note">
      <strong>No PHARMA_V1 score is being generated yet.</strong>
      <p>{view.notice}</p>
      <small>Current blockers: {view.blockers.join(" · ")}</small>
    </div>
  </section>
}
