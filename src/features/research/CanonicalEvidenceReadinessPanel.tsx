import { useCanonicalEvidenceReadiness } from "./useCanonicalEvidenceReadiness"

function label(value: string) {
  return value.replaceAll("_", " ")
}

/** Evidence readiness is the canonical stored contract, independent of engine/score availability. */
export function CanonicalEvidenceReadinessPanel({ portfolioId, securityId, assetClass }: { readonly portfolioId: string; readonly securityId: string; readonly assetClass: string }) {
  const evidence = useCanonicalEvidenceReadiness(portfolioId, securityId, assetClass)
  if (!evidence.applicable) return <section className="panel"><h2>Methodology evidence requirements</h2><p>Not applicable: equity methodology requirements do not apply to this asset class.</p></section>
  if (evidence.isLoading) return <section className="panel" role="status">Loading canonical evidence requirements…</section>
  if (evidence.error) return <section className="notice notice-error" role="alert"><strong>Canonical evidence requirements could not be loaded.</strong><p>{evidence.error}</p></section>
  if (!evidence.data) return <section className="panel"><h2>Methodology evidence requirements</h2><p>Not ready: no canonical evidence snapshot is selected for this holding.</p></section>
  const { snapshot, requirements } = evidence.data
  return <section className="panel" aria-label="Canonical methodology evidence readiness">
    <h2>Methodology evidence requirements</h2>
    <p><strong>{label(snapshot.snapshotStatus)}</strong> · {label(snapshot.profileCode)}{snapshot.subprofileCode ? ` / ${label(snapshot.subprofileCode)}` : ""} · snapshot as of {snapshot.asOfDate}</p>
    <p>This is the stored evidence assessment, separate from scoring-engine availability. Browsing does not refresh evidence. Source dates and freshness limits below describe the retained snapshot.</p>
    {!requirements.length ? <p role="alert">Not ready: the selected snapshot has no requirement items. Evidence completeness cannot be established.</p> : <div className="research-table-wrap" tabIndex={0} aria-label="Scrollable methodology evidence requirements"><table className="research-table">
      <thead><tr><th>Requirement / history</th><th>Stored state / reason</th><th>Source / dates</th><th>Evidence and lineage</th></tr></thead>
      <tbody>{requirements.map(item => <tr key={item.id}>
        <td><strong>{label(item.requirement_code)}</strong><small>{item.required ? "Mandatory" : "Optional"} · {label(item.applicability)}</small><small>Minimum history: {item.minimum_history ?? "Unspecified"} (requirement-specific units)</small><small>Approved benchmark context: {item.benchmark_authority.length ? item.benchmark_authority.join(" · ") : "Not specified"}</small></td>
        <td><strong>{label(item.evidence_state)}</strong><small>{label(item.reason_code)}</small><small>{label(item.recommended_remediation_action)}</small></td>
        <td>{item.source_provider ?? "Source unavailable"}<small>Evidence as of {item.evidence_as_of_date ?? "Unavailable"}</small><small>Retrieved {item.retrieved_at ?? "Unavailable"}</small><small>Fresh through {item.fresh_through ?? "Unavailable"}</small><small>Freshness policy: {item.freshness_policy ? label(item.freshness_policy) : "Unspecified"}</small></td>
        <td><small>{label(item.validation_state)} · {label(item.canonical_selection_state)}</small><details><summary>Inspect retained evidence and provenance</summary><p>Selected evidence: {item.selected_evidence_id ?? "No individual selection (see selection state)"}</p><p>Raw source: {item.raw_source_record_id ?? "Unavailable"}</p><p>Candidate references: {item.candidate_evidence_ids.length ? item.candidate_evidence_ids.join(", ") : "None retained"}</p><p>Metric: {item.metric_code ?? "Requirement-specific evidence"}</p><pre>{item.normalized_value == null ? "Normalized evidence unavailable" : JSON.stringify(item.normalized_value, null, 2)}</pre></details></td>
      </tr>)}</tbody>
    </table></div>}
    <details><summary>Snapshot provenance</summary><p>Snapshot {snapshot.snapshotId}</p><p>{snapshot.methodologyAuthority} / {snapshot.methodologyVersion}</p><p>Assignment {snapshot.assignmentAuthority ?? "Unavailable"} / {snapshot.assignmentVersion} / {snapshot.assignmentId}</p><p>Classification {snapshot.classificationVersion}</p></details>
  </section>
}
