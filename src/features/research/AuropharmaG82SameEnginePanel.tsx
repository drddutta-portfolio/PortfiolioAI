import { buildAuropharmaG82SameEnginePreview } from "./auropharmaG8SameEnginePreview"
import type { SecurityResearch } from "./types"

function title(value: string) {
  return value.toLocaleLowerCase()
    .replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase())
    .replaceAll("_", " ")
}

export function AuropharmaG82SameEnginePanel({
  securityId,
  symbol,
  research,
}: {
  readonly securityId: string
  readonly symbol: string
  readonly research: SecurityResearch
}) {
  if (symbol.toLocaleUpperCase() !== "AUROPHARMA") return null

  const preview = buildAuropharmaG82SameEnginePreview(
    securityId,
    research.metrics,
    "2026-09-19",
  )
  const architecture = preview.threeLayerArchitecture

  return <section className="pharma-persistence-package" aria-labelledby="auropharma-g8-2-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">G8.2 · Same-engine AUROPHARMA read-only preview</p>
        <h3 id="auropharma-g8-2-title">PHARMA_V1 three-layer research architecture</h3>
        <p>Every Pharma company composes the common Pharma core, one reviewed Primary business model, and reviewed secondary exposures. AUROPHARMA is now evaluated with that same architecture without activating or persisting a score.</p>
      </div>
      <span className="pharma-workspace-lock">Read-only · Same G7.1 adapter</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>1 · Common Pharma core</span>
        <strong>PHARMA_V1</strong>
        <small>{architecture.commonCore.verified}/{architecture.commonCore.requirementCount} common requirements verified</small>
      </div>
      <div>
        <span>2 · Primary business model</span>
        <strong>{architecture.primary.displayName}</strong>
        <small>{architecture.primary.verified}/{architecture.primary.requirements.length} Primary requirements verified</small>
      </div>
      <div>
        <span>3 · Secondary exposure</span>
        <strong>API / Bulk Drugs · Emerging</strong>
        <small>Visible research context · excluded from score/readiness denominator</small>
      </div>
      <div>
        <span>Unresolved exposure</span>
        <strong>Biopharma / Biosimilars</strong>
        <small>REVIEW REQUIRED · no comparable economic share</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Architecture scope</strong>
        <small>Common + Primary + secondary roles</small>
        <p>Raw observations remain security/company scoped. Methodology interpretation is resolved from company + active reviewed architecture + role.</p>
        <span>No TORNTPHARM evidence or role state is reused</span>
      </article>
      <article>
        <strong>Overall preview</strong>
        <small>{preview.adapterVersion}</small>
        <p>Current AUROPHARMA evidence and Global Generics methodology are insufficient for a complete numeric result. Missing methodology remains unavailable; there is no Domestic fallback or hidden reweighting.</p>
        <span>Overall Pharma score: NOT CURRENTLY COMPUTABLE</span>
      </article>
    </div>

    <div className="research-table-wrap" tabIndex={0} aria-label="AUROPHARMA G8.2 same-engine dimension preview">
      <table className="research-table">
        <thead>
          <tr>
            <th>Dimension</th>
            <th>Primary</th>
            <th>Secondary</th>
            <th>Methodology</th>
            <th>Evidence</th>
            <th>Final state</th>
          </tr>
        </thead>
        <tbody>
          {preview.rows.map((row) => <tr key={row.dimensionCode}>
            <td><strong>{title(row.dimensionCode)}</strong></td>
            <td>Global Generics</td>
            <td>API · Emerging excluded</td>
            <td>{title(row.methodologyState)}</td>
            <td>{row.primaryEvidenceVerified}/{row.primaryEvidenceTotal || "—"} verified</td>
            <td>{title(row.calculationState)}</td>
          </tr>)}
        </tbody>
      </table>
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> G8.2 reads cached AUROPHARMA evidence only. It does not refresh enrichment, write evidence, persist scores, alter recommendations or change position sizing.</p>
  </section>
}
