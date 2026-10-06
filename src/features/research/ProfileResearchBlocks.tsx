import { useCanonicalEvidenceReadiness } from "./useCanonicalEvidenceReadiness"

const label = (value: string) => value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, part => part.toLocaleUpperCase())

/** The selected contract supplies stock-specific blocks; classification never invents a route. */
export function ProfileResearchBlocks({ portfolioId, securityId, assetClass, onViewEvidence }: {
  readonly portfolioId: string; readonly securityId: string; readonly assetClass: string; readonly onViewEvidence: () => void
}) {
  const evidence = useCanonicalEvidenceReadiness(portfolioId, securityId, assetClass)
  const data = evidence.data
  const applicable = data?.requirements.filter(item => item.applicability === "APPLICABLE").sort((a, b) => Number(b.required) - Number(a.required)) ?? []
  return <section className="panel profile-research-extension" aria-label="Stock-specific research">
    <p className="eyebrow">Stock-specific research</p>
    <h2>{data ? `${label(data.snapshot.profileCode)}${data.snapshot.subprofileCode ? ` / ${label(data.snapshot.subprofileCode)}` : ""}` : "Research profile"} workspace</h2>
    <p>Approved business-model requirements and retained results for this stock. Classification and research assignment remain separate.</p>
    {evidence.error ? <p role="alert">{evidence.error}</p> : evidence.isLoading ? <p role="status">Loading the selected research contract…</p> : !data ? <p>{evidence.applicable ? "No selected profile evidence snapshot. Applicability is unresolved." : "Equity research is not applicable to this asset class."}</p> : <>
      <p className="assessment-note">{data.snapshot.methodologyAuthority} · {data.snapshot.methodologyVersion} · stored snapshot {data.snapshot.asOfDate}</p>
      <div className="profile-requirement-grid">{applicable.slice(0, 6).map(item => <article key={item.id}>
        <span>{item.required ? "Mandatory research" : "Additional research"}</span><h3>{label(item.requirement_code)}</h3>
        <strong>{label(item.evidence_state)}</strong><p>{label(item.reason_code)}</p>
        <small>{item.source_provider ?? "Source unavailable"} · {item.evidence_as_of_date ?? "Evidence date unavailable"}</small>
        <details><summary>Retained result and source binding</summary><p>{item.metric_code ?? "Document / history requirement"}</p><p>{label(item.validation_state)} · {label(item.canonical_selection_state)}</p><pre>{item.normalized_value == null ? "No qualifying normalized result retained" : JSON.stringify(item.normalized_value, null, 2)}</pre><p>Source reference: {item.raw_source_record_id ?? "Unavailable"}</p></details>
      </article>)}</div>
      {!applicable.length ? <p>No applicable requirement items retained; research completeness is unproven.</p> : null}
    </>}
    <button type="button" className="button button-secondary" onClick={onViewEvidence}>View complete profile evidence</button>
  </section>
}
