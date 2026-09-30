import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useP7CurrentIntelligence } from "../features/decision/useP7CurrentIntelligence"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import "./P7CanonicalIntelligencePanel.css"

function pretty(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function P7CanonicalIntelligencePanel({ compact = false }: { readonly compact?: boolean }) {
  const { portfolio, isLoading: portfolioLoading, error: portfolioError } = usePortfolioView()
  const intelligence = useP7CurrentIntelligence(portfolio?.portfolio.id ?? null)
  const [filter, setFilter] = useState<"ALL" | "REVIEW_REQUIRED" | "INSUFFICIENT">("ALL")
  const positionById = useMemo(() => new Map((portfolio?.openPositions ?? []).map((position) => [position.securityId, position])), [portfolio])
  const equityRows = useMemo(() => intelligence.data.map((row) => ({ row, position: positionById.get(row.securityId) })).filter((entry) => entry.position?.assetClass !== "ETF"), [intelligence.data, positionById])
  const reviewCount = equityRows.filter(({ row }) => row.r6State === "REVIEW_REQUIRED").length
  const staleCount = equityRows.filter(({ row }) => row.r6State === "STALE_REQUIRED_EVIDENCE").length
  const insufficientCount = equityRows.filter(({ row }) => row.r6State === "INSUFFICIENT_EVIDENCE").length
  const etfCount = portfolio?.openPositions.filter((position) => position.assetClass === "ETF").length ?? 0
  const visibleRows = equityRows.filter(({ row }) => filter === "ALL" || (filter === "REVIEW_REQUIRED" ? row.r6State === "REVIEW_REQUIRED" : row.r6State !== "REVIEW_REQUIRED")).slice(0, compact ? 8 : 40)

  if (portfolioLoading || portfolioError || !portfolio) return null
  return <section className={`p7-intelligence ${compact ? "is-compact" : ""}`} aria-label="P7 canonical portfolio intelligence">
    <header className="p7-intelligence-heading">
      <div><p className="eyebrow">P7 canonical intelligence</p><h2>Decision readiness, without invented actions</h2><p>Current IC3 evidence lineage feeds the IC6 readiness boundary. R8, Meaningful Change, Movement and owner-facing action remain blocked until their prerequisites exist.</p></div>
      <span className="p7-stage-pill">P7 · IC-FINAL review</span>
    </header>

    {intelligence.isLoading ? <div className="p7-intelligence-notice">Loading canonical current evidence…</div> : null}
    {intelligence.error ? <div className="p7-intelligence-notice is-error">Canonical intelligence could not be loaded: {intelligence.error}</div> : null}

    {!intelligence.isLoading && !intelligence.error ? <>
      <div className="p7-intelligence-metrics">
        <article><span>Canonical coverage</span><strong>{equityRows.length}/239</strong><small>{etfCount} ETFs remain outside the equity methodology</small></article>
        <article><span>R6 scored</span><strong>0</strong><small>{insufficientCount} insufficient · {staleCount} stale</small></article>
        <article><span>R7 candidacy ready</span><strong>0</strong><small>All equities remain fail-closed</small></article>
        <article><span>Canonical actions</span><strong>0</strong><small>R8 + Movement are not complete</small></article>
      </div>
      <div className="p7-intelligence-boundary"><strong>No buy or sell signal has been created.</strong><span>{reviewCount} holdings require methodology/evidence review; {insufficientCount + staleCount} have insufficient or stale required evidence. Owner portfolio roles are unchanged.</span></div>

      <div className="p7-intelligence-toolbar">
        <div><strong>Current portfolio disposition</strong><span>{equityRows.length} equities · canonical snapshot lineage</span></div>
        {!compact ? <div className="p7-intelligence-filters" aria-label="Disposition filter">
          <button className={filter === "ALL" ? "is-active" : ""} onClick={() => setFilter("ALL")}>All</button>
          <button className={filter === "REVIEW_REQUIRED" ? "is-active" : ""} onClick={() => setFilter("REVIEW_REQUIRED")}>Review required</button>
          <button className={filter === "INSUFFICIENT" ? "is-active" : ""} onClick={() => setFilter("INSUFFICIENT")}>Evidence blocked</button>
        </div> : <Link to="/app/intelligence">Open full intelligence →</Link>}
      </div>
      <div className="p7-intelligence-table-wrap"><table className="p7-intelligence-table">
        <thead><tr><th>Holding</th><th>Owner role</th><th>R6</th><th>R7</th><th>R8</th><th>Movement</th><th>Action</th></tr></thead>
        <tbody>{visibleRows.map(({ row, position }) => <tr key={row.securityId}>
          <td><Link to={`/app/research/${row.securityId}`}>{position?.symbol ?? row.securityId.slice(0, 8)}</Link><small>{row.snapshot.profileCode}{row.snapshot.subprofileCode ? ` · ${row.snapshot.subprofileCode}` : ""}</small></td>
          <td><strong>{pretty(position?.role ?? "UNCLASSIFIED")}</strong><small>Owner controlled</small></td>
          <td><span className={`p7-state ${row.r6State === "REVIEW_REQUIRED" ? "review" : "blocked"}`}>{pretty(row.r6State)}</span></td>
          <td><span className="p7-state blocked">{pretty(row.r7State)}</span></td>
          <td><span className={`p7-state ${row.r8State === "REVIEW_REQUIRED" ? "review" : "blocked"}`}>{pretty(row.r8State)}</span></td>
          <td><span className={`p7-state ${row.movementState === "REVIEW_REQUIRED" ? "review" : "blocked"}`}>{pretty(row.movementState)}</span></td>
          <td><span className="p7-state blocked">Blocked</span><small>{pretty(row.actionBlocker)}</small></td>
        </tr>)}</tbody>
      </table></div>
      {!visibleRows.length ? <div className="p7-intelligence-empty">No holdings match this filter.</div> : null}
      {!compact && visibleRows.length < equityRows.filter(({ row }) => filter === "ALL" || (filter === "REVIEW_REQUIRED" ? row.r6State === "REVIEW_REQUIRED" : row.r6State !== "REVIEW_REQUIRED")).length ? <p className="p7-intelligence-footnote">Showing the first 40 holdings in this review view. The aggregate above covers the complete canonical equity universe.</p> : null}
    </> : null}
  </section>
}
