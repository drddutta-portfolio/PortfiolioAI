export function CanonicalPharmaScoringBoundaryPanel() {
  return <section className="panel pharma-scoring-boundary" aria-labelledby="canonical-pharma-scoring-boundary-title">
    <div className="section-heading">
      <div>
        <p className="eyebrow">Numeric scoring boundary</p>
        <h2 id="canonical-pharma-scoring-boundary-title">PHARMA_V1 research active · numeric score not currently computable</h2>
        <p>The canonical Pharma research profile is active, but the approved Primary methodology is incomplete. General Research scoring is not used as a substitute.</p>
      </div>
      <span className="pharma-workspace-lock">Fail-closed · No fallback score</span>
    </div>
    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Research authority</strong>
        <small>PHARMA_V1 · canonical reviewed assignment</small>
        <p>Research presentation, readiness, evidence workspaces and refresh planning use the Pharma profile contract.</p>
        <span>ACTIVE</span>
      </article>
      <article>
        <strong>Numeric scoring authority</strong>
        <small>Approved subprofile methodology required</small>
        <p>No General Research score, recommendation or position-sizing output is substituted while Pharma scoring remains incomplete.</p>
        <span>NOT CURRENTLY COMPUTABLE</span>
      </article>
    </div>
  </section>
}
