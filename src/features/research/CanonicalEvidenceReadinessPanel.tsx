import { useEffect, useState } from "react"
import { bankCurrentDisplayVeto } from "./bankCurrentDisplayVeto"
import { useBankCurrentCanonicalReplay } from "./useBankCurrentCanonicalReplay"
import { useCanonicalEvidenceReadiness, type CanonicalEvidenceReadiness } from "./useCanonicalEvidenceReadiness"

function label(value: string) {
  return value.replaceAll("_", " ")
}

/** Evidence readiness is the canonical stored contract, independent of engine/score availability. */
export function CanonicalEvidenceReadinessPanel({ portfolioId, securityId, assetClass, compact = false, evidence: selectedEvidence }: { readonly portfolioId: string; readonly securityId: string; readonly assetClass: string; readonly compact?: boolean; readonly evidence?: CanonicalEvidenceReadiness }) {
  const ownEvidence = useCanonicalEvidenceReadiness(portfolioId, securityId, assetClass, selectedEvidence === undefined)
  const evidence = selectedEvidence ?? ownEvidence
  const [currentClock, setCurrentClock] = useState(() => Date.now())
  const bankSelected = evidence.data?.snapshot.profileCode === "BANK"
  useEffect(() => {
    if (!bankSelected) return
    // Expiry is checked independently of provider data and snapshot reloads.
    const timer = window.setInterval(() => setCurrentClock(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [bankSelected])
  const clockVeto = bankSelected && evidence.data
    ? bankCurrentDisplayVeto(evidence.data.requirements, currentClock) : null
  const expiryPhase = `${evidence.data?.snapshot.snapshotId ?? "none"}:${clockVeto?.reasons.some(reason => reason.includes("FRESHNESS_EXPIRED")) ? "EXPIRED" : "BASELINE"}`
  const currentReplay = useBankCurrentCanonicalReplay(portfolioId, securityId, bankSelected, expiryPhase, !compact)
  if (!evidence.applicable) return <section className="panel"><h2>{compact ? "Research Readiness" : "Methodology evidence requirements"}</h2><p>Not applicable: equity methodology requirements do not apply to this asset class.</p></section>
  if (evidence.isLoading) return <section className="panel" role="status">Loading canonical evidence requirements…</section>
  if (evidence.error) return <section className="notice notice-error" role="alert"><strong>Canonical evidence requirements could not be loaded.</strong><p>{evidence.error}</p></section>
  if (!evidence.data) return <section className="panel"><h2>{compact ? "Research Readiness" : "Methodology evidence requirements"}</h2><p>Not ready: no canonical evidence snapshot is selected for this holding.</p></section>
  const { snapshot, requirements } = evidence.data
  const blockers = requirements.filter(item => item.applicability === "APPLICABLE" && item.evidence_state !== "FRESH")
  const bankVeto = snapshot.profileCode === "BANK" ? bankCurrentDisplayVeto(requirements, currentClock) : null
  return <section className="panel" aria-label="Canonical methodology evidence readiness">
    <h2>{compact ? "Research Readiness" : "Methodology evidence requirements"}</h2>
    <p><strong>{snapshot.profileCode === "BANK" ? `HISTORICAL ${label(snapshot.snapshotStatus)} (CURRENT NOT VERIFIED)` : label(snapshot.snapshotStatus)}</strong> · {label(snapshot.profileCode)}{snapshot.subprofileCode ? ` / ${label(snapshot.subprofileCode)}` : ""} · snapshot as of {snapshot.asOfDate}</p>
    {bankSelected && !compact ? <div className="panel" aria-label="Bank current canonical validation">
      <h3>Live Development canonical revalidation</h3>
      <p>Owner-session read-only check. Prospective evidence status is NOT persisted research READY; no provider calls, reviews or selection writes are permitted.</p>
      {currentReplay.status === "running" || currentReplay.status === "pending" ? <p>Validating current canonical requirements…</p> : null}
      {currentReplay.status === "failed" ? <p role="alert">{currentReplay.error}</p> : null}
      {currentReplay.status === "unavailable" ? <p>Current read-only validation is available only on the authorized Development banking preview.</p> : null}
      {currentReplay.result ? <div>
        <p><strong>Prospective at {currentReplay.result.evaluationAsOf}:</strong> {label(currentReplay.result.status)} ({currentReplay.result.items.filter(item => item.evidence_state !== "FRESH").length} non-FRESH requirements).</p>
        <ul>{currentReplay.result.items.filter(item => item.evidence_state !== "FRESH").slice(0, 8).map(item => <li key={item.requirement_code}>{label(item.requirement_code)}: {label(item.evidence_state)} — {label(item.reason_code)}</li>)}</ul>
        <p>Read-only hash {currentReplay.result.snapshotHash}; validator reported zero writes (independent selection readback not performed here). Historical persisted status remains {label(snapshot.snapshotStatus)}.</p>
      </div> : null}
    </div> : null}
    {bankVeto ? <div role="status"><strong>Historical BANK assessment only — current readiness not verified.</strong> A persisted READY selection is not proof of present-day readiness. Until the live canonical validator checks the effective freshness of every required item and the NIFTY_BANK benchmark, treat this stored assessment as historical, not currently READY.<p>Current display veto checked {bankVeto.checkedAt}. Blocked/unverified: {bankVeto.reasons.slice(0, 6).join("; ")}{bankVeto.reasons.length > 6 ? `; +${bankVeto.reasons.length - 6} additional requirements` : ""}.</p></div> : null}
    <p>This is the stored evidence assessment, separate from scoring-engine availability. Browsing does not refresh evidence. Source dates and freshness limits below describe the retained snapshot.</p>
    {compact ? <ul className="readiness-blockers">{blockers.slice(0, 3).map(item => <li key={item.id}><strong>{label(item.requirement_code)}</strong> — {label(item.evidence_state).toLocaleLowerCase()}: {label(item.reason_code).toLocaleLowerCase()}</li>)}{!blockers.length ? <li>{requirements.length ? "No blockers recorded in this stored snapshot." : "No requirement items retained; completeness cannot be established."}</li> : null}</ul> : null}
    <details className="readiness-detail" open={compact ? undefined : true}><summary>Complete requirements and source lineage</summary>
    {!requirements.length ? <p role="alert">Not ready: the selected snapshot has no requirement items. Evidence completeness cannot be established.</p> : <div className="research-table-wrap" tabIndex={0} aria-label="Scrollable methodology evidence requirements"><table className="research-table">
      <thead><tr><th>Requirement / history</th><th>Stored state / reason</th><th>Source / dates</th><th>Evidence and lineage</th></tr></thead>
      <tbody>{requirements.map(item => <tr key={item.id}>
        <td><strong>{label(item.requirement_code)}</strong><small>{item.required ? "Mandatory" : "Optional"} · {label(item.applicability)}</small><small>Minimum history: {item.minimum_history ?? "Unspecified"} (requirement-specific units)</small><small>Approved benchmark context: {item.benchmark_authority.length ? item.benchmark_authority.join(" · ") : "Not specified"}</small></td>
        <td><strong>{label(item.evidence_state)}</strong><small>{label(item.reason_code)}</small><small>{label(item.recommended_remediation_action)}</small></td>
        <td>{item.source_provider ?? "Source unavailable"}<small>Evidence as of {item.evidence_as_of_date ?? "Unavailable"}</small><small>Retrieved {item.retrieved_at ?? "Unavailable"}</small><small>Fresh through {item.fresh_through ?? "Unavailable"}</small><small>Freshness policy: {item.freshness_policy ? label(item.freshness_policy) : "Unspecified"}</small></td>
        <td><small>{label(item.validation_state)} · {label(item.canonical_selection_state)}</small><details><summary>Inspect retained evidence and provenance</summary><p>Selected evidence: {item.selected_evidence_id ?? "No individual selection (see selection state)"}</p><p>Raw source: {item.raw_source_record_id ?? "Unavailable"}</p><p>Candidate references: {item.candidate_evidence_ids.length ? item.candidate_evidence_ids.join(", ") : "None retained"}</p><p>Metric: {item.metric_code ?? "Requirement-specific evidence"}</p><pre>{item.normalized_value == null ? "Normalized evidence unavailable" : JSON.stringify(item.normalized_value, null, 2)}</pre></details></td>
      </tr>)}</tbody>
    </table></div>}
    </details><details><summary>Snapshot provenance</summary><p>Snapshot {snapshot.snapshotId}</p><p>{snapshot.methodologyAuthority} / {snapshot.methodologyVersion}</p><p>Assignment {snapshot.assignmentAuthority ?? "Unavailable"} / {snapshot.assignmentVersion} / {snapshot.assignmentId}</p><p>Classification {snapshot.classificationVersion}</p></details>
  </section>
}
