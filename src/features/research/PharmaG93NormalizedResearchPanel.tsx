import { useMemo } from "react"
import { buildPharmaG93NormalizedResearchModel } from "./pharmaG93NormalizedResearch"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import { usePharmaSubprofileResolution } from "./usePharmaSubprofileResolution"
import type { SecurityResearch } from "./types"

function title(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase())
    .replaceAll("_", " ")
}

function stateLabel(value: string) {
  return value === "NOT_ENGAGED" ? "NOT ENGAGED" : title(value)
}

export function PharmaG93NormalizedResearchPanel({
  securityId,
  symbol,
  research,
}: {
  readonly securityId: string
  readonly symbol: string
  readonly research: SecurityResearch
}) {
  const resolution = usePharmaSubprofileResolution(securityId)
  const evaluationDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  if (resolution.isLoading) {
    return <section className="pharma-persistence-package">
      <p className="muted">Loading normalized PHARMA_V1 architecture…</p>
    </section>
  }

  if (resolution.error) {
    return <section className="pharma-persistence-package">
      <div className="notice notice-error">Normalized PHARMA_V1 architecture could not be loaded.</div>
    </section>
  }

  if (!resolution.data || resolution.data.status !== "RESOLVED") {
    return <section className="pharma-persistence-package">
      <div className="notice notice-error">A reviewed canonical Pharma assignment is required for G9.3 normalization.</div>
    </section>
  }

  const model = buildPharmaG93NormalizedResearchModel(
    symbol,
    resolution.data.assignment,
    research.metrics,
    evaluationDate,
  )
  const architecture = model.architecture
  const material = architecture.secondaryExposures.filter(
    (item) => item.mode === "EVIDENCE_OVERLAY",
  )
  const emerging = architecture.secondaryExposures.filter(
    (item) => item.mode === "EMERGING_WATCH",
  )

  return <section className="pharma-persistence-package" aria-labelledby={`pharma-g9-3-normalized-${symbol}`}>
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">G9.3 · Reciprocal PHARMA_V1 normalization</p>
        <h3 id={`pharma-g9-3-normalized-${symbol}`}>Shared Pharma architecture · {symbol.toLocaleUpperCase()}</h3>
        <p>Both Pharma reference companies now use the same permanent research grammar: common Pharma core, one reviewed Primary model, reviewed secondary roles, shared methodology, evidence/readiness and fail-closed scoring state.</p>
      </div>
      <span className="pharma-workspace-lock">Shared architecture · Company-specific roles</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>1 · Common Pharma core</span>
        <strong>PHARMA_V1</strong>
        <small>{architecture.commonCore.verified}/{architecture.commonCore.requirementCount} common requirements verified</small>
      </div>
      <div>
        <span>2 · Primary model</span>
        <strong>{architecture.primary.displayName}</strong>
        <small>Reviewed · {title(architecture.primary.confidence)} confidence</small>
      </div>
      <div>
        <span>3 · Material Overlay</span>
        <strong>{material.length ? material.map((item) => item.displayName).join(" · ") : "None reviewed"}</strong>
        <small>{model.materialOverlayState === "NOT_ENGAGED" ? "Shared overlay contract is NOT ENGAGED" : "Within-dimension evidence role only"}</small>
      </div>
      <div>
        <span>Emerging Watch</span>
        <strong>{emerging.length ? emerging.map((item) => item.displayName).join(" · ") : "None reviewed"}</strong>
        <small>Visible research context · excluded from readiness/score denominator</small>
      </div>
    </div>

    {architecture.unresolvedExposures.length ? <div className="pharma-persistence-package-grid">
      {architecture.unresolvedExposures.map((item) => <article key={item.exposureCode}>
        <strong>Unresolved exposure</strong>
        <small>{item.displayName}</small>
        <p>{title(item.reasonCode)}</p>
        <span>REVIEW REQUIRED · excluded from active authority</span>
      </article>)}
    </div> : null}

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Evidence scope</strong>
        <small>{architecture.rawEvidenceScope}</small>
        <p>Raw observations remain security/company scoped and cannot satisfy another company's research requirements.</p>
        <span>Company isolation: REQUIRED</span>
      </article>
      <article>
        <strong>Interpretation scope</strong>
        <small>{architecture.interpretationScope}</small>
        <p>The same subprofile can legitimately act as TORNTPHARM Material Overlay and AUROPHARMA Primary because interpretation is resolved from company + active assignment + role.</p>
        <span>Role-aware interpretation: ACTIVE</span>
      </article>
    </div>

    <details className="pharma-deep-layer pharma-scoring-methodology">
      <summary>
        <div>
          <span>Shared PHARMA_V1 methodology · Gate G / G1 / G2 / G3 / G4 / G7</span>
          <small>Same contracts · current company role determines engagement</small>
        </div>
        <b>Open details</b>
      </summary>

      <div className="pharma-deep-layer-body">
        <div className="pharma-persistence-package-grid">
          {model.methodology.map((item) => <article
            key={item.code}
            data-methodology-state={item.state}
            className={item.state === "NOT_ENGAGED" ? "pharma-methodology-not-engaged" : undefined}
          >
            <strong>{item.title}</strong>
            <small>{item.contractVersion}</small>
            <p>{item.note}</p>
            <span>{stateLabel(item.state)}</span>
          </article>)}
        </div>
      </div>
    </details>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Primary research requirements</strong>
        <small>{architecture.primary.displayName}</small>
        <p>{architecture.primary.verified}/{architecture.primary.requirements.length} Primary-specific requirements are currently verified in cached evidence.</p>
        <span>{architecture.primary.unavailable} unavailable · {architecture.primary.reviewAttention} need review attention</span>
      </article>
      <article>
        <strong>Downstream safety</strong>
        <small>Research normalization only</small>
        <p>G9.3 does not activate numeric score execution, recommendation persistence or position sizing.</p>
        <span>Score: OFF · Recommendation: OFF · Sizing: OFF</span>
      </article>
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Normalization boundary:</strong> shared presentation does not copy company evidence. {PHARMA_SUBPROFILE_CONTRACTS[architecture.primary.subprofileCode].displayName} remains the active Primary contract for this security only.</p>
  </section>
}
