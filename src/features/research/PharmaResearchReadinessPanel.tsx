import { buildPharmaCanonicalHistoryView } from "./pharmaCanonicalHistoryView"
import { buildPharmaReadinessSummaryGroups, buildPharmaReadinessView, type PharmaReadinessDisplayState } from "./pharmaReadinessViewModel"
import { ResearchReadinessPanel } from "./ResearchReadinessPanel"
import type { SecurityResearch } from "./types"
import "./PharmaResearchReadinessPanel.css"

const stateLabel: Readonly<Record<PharmaReadinessDisplayState, string>> = {
  NORMALIZATION_READY: "Normalization ready",
  VALIDATED_SOURCE: "Source validated",
  PARTIAL: "Partial",
  PENDING: "Pending",
  OFFICIAL_SOURCE_PENDING: "Official source pending",
}

const dateLabel = (value: string) => new Date(`${value}T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "UTC" })
const numberLabel = (value: string) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(value))

export function PharmaResearchReadinessPanel({ research }: { readonly research: SecurityResearch }) {
  const view = buildPharmaReadinessView(research)
  const history = buildPharmaCanonicalHistoryView(research)
  if (!view || !history) return null

  const ready = view.validatedSourceDomains + view.normalizationReadyDomains
  const details = <><div className="pharma-readiness-grid">
        {view.domains.map((domain) => <article key={domain.metricCode} className={`pharma-domain pharma-domain-${domain.state.toLocaleLowerCase()}`}>
          <div className="pharma-domain-head">
            <div><span>{domain.requirement}{domain.applicability === "CONDITIONAL" ? ` · Conditional${domain.conditionCode ? ` · ${domain.conditionCode}` : ""}` : ""}</span><h3>{domain.label}</h3></div>
            <b>{stateLabel[domain.state]}</b>
          </div>
          <p>{domain.detail}</p>
          <footer>
            <span>{domain.observationCountLabel}: <strong>{domain.canonicalObservationCount}</strong></span>
            <span>Minimum / preferred: <strong>{domain.minimumObservations} / {domain.preferredObservations}</strong></span>
          </footer>
        </article>)}
      </div><div className="pharma-readiness-note">
        <strong>No PHARMA_V1 score is being generated yet.</strong>
        <p>{view.notice}</p>
        <small>Normalization contract: {view.normalizationVersion} · Current mandatory blockers: {view.blockers.join(" · ") || "None"}</small>
      </div></>

  return <ResearchReadinessPanel
    title="Pharmaceuticals Research Readiness"
    detail="A compact view of Pharma evidence coverage. Evidence and score readiness remain separate."
    ready={ready}
    total={view.totalDomainCount}
    groups={buildPharmaReadinessSummaryGroups(view)}
    detailsLabel="View all Pharmaceuticals research contracts"
    details={details}
  >
    <details className="pharma-canonical-history" aria-label="Canonical Pharma history">
      <summary className="pharma-history-head">
        <div>
          <p className="eyebrow">Canonical Pharma financial history</p>
          <h3>Reviewed canonical evidence</h3>
        </div>
        <span>{history.annualCfo.length + history.annualRevenue.length + history.quarterlyOperatingRevenue.length + history.quarterlyOperatingProfit.length} reviewed raw observations · View history</span>
      </summary>
      <div className="pharma-history-summary-grid">
        <article><strong>{history.annualRevenue.length}</strong><span>annual operating revenue periods</span></article>
        <article><strong>{history.annualCfo.length}</strong><span>annual CFO periods</span></article>
        <article><strong>{history.quarterlyOperatingRevenue.length}</strong><span>quarterly revenue periods</span></article>
        <article><strong>{history.quarterlyOperatingProfit.length}</strong><span>quarterly operating-profit periods</span></article>
        <article><strong>{history.quarterlyOpm.length}</strong><span>matched derived OPM periods</span></article>
      </div>

      {history.quarterlyOpm.length ? <div className="pharma-history-table-wrap">
        <h4>Quarterly operating margin · PortfolioAI derived</h4>
        <table className="pharma-history-table">
          <thead><tr><th>Quarter ended</th><th>Operating revenue</th><th>Operating profit</th><th>OPM</th></tr></thead>
          <tbody>{[...history.quarterlyOpm].reverse().map((point) => <tr key={point.periodEnd}>
            <td>{dateLabel(point.periodEnd)}</td><td>₹{numberLabel(point.operatingRevenue)} Cr</td><td>₹{numberLabel(point.operatingProfit)} Cr</td><td>{numberLabel(point.marginPercent)}%</td>
          </tr>)}</tbody>
        </table>
      </div> : null}

      {history.annualCfo.length ? <div className="pharma-history-table-wrap">
        <h4>Annual cash flow from operations</h4>
        <table className="pharma-history-table">
          <thead><tr><th>Year ended</th><th>CFO</th></tr></thead>
          <tbody>{[...history.annualCfo].reverse().map((point) => <tr key={point.periodEnd}><td>{dateLabel(point.periodEnd)}</td><td>₹{numberLabel(point.value)} Cr</td></tr>)}</tbody>
        </table>
      </div> : null}

      <p className="pharma-history-caution"><strong>Why this still does not create a score:</strong> canonical history can improve evidence coverage without satisfying every PHARMA_V1 scoring gate. Missing, conditional, event-based and market evidence remain explicitly visible instead of being inferred.</p>
    </details>

  </ResearchReadinessPanel>
}
