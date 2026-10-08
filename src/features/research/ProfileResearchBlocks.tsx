import { ResearchRetainedResult } from "./ResearchRetainedResult"
import { selectSectionRequirements, type ResearchResultSection } from "./selectedResearchPresentation"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import { canonicalPharmaPrimary } from "./canonicalResearchAssignment"
import { PHARMA_SUBPROFILE_CONTRACTS } from "./pharmaSubprofileContracts"
import { useState } from "react"
import type { P7EvidenceRequirement } from "../../data/p7CurrentIntelligenceRepository"
import { metricLabel } from "./researchPolicy"
import { researchProfilePresentationState } from "./researchProfileUiContract"
import { useCanonicalEvidenceReadiness, type CanonicalEvidenceReadiness } from "./useCanonicalEvidenceReadiness"

const label = (value: string) => value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, part => part.toLocaleUpperCase())
const STATES = ["ALL", "FRESH", "STALE", "MISSING", "INSUFFICIENT", "CONFLICTING", "REVIEW_REQUIRED"] as const

function RequirementCard({ item }: { readonly item: P7EvidenceRequirement }) {
  return <article>
    <span>{item.applicability === "NOT_APPLICABLE" ? "Not applicable" : item.required ? "Mandatory research" : "Additional research"}</span>
    <h3>{item.metric_code ? metricLabel(item.metric_code) : label(item.requirement_code)}</h3>
    {item.metric_code ? <p>{label(item.requirement_code)}</p> : null}<strong>{label(item.evidence_state)}</strong><p>{label(item.reason_code)}</p>
    <small>{item.source_provider ?? "Source unavailable"} · evidence as of {item.evidence_as_of_date ?? "Unavailable"}</small>
    <ResearchRetainedResult item={item} />
    <details><summary>Retained result and source binding</summary>
      <p>Retained normalized result (including units, period and scope when supplied):</p>
      <pre>{item.normalized_value == null ? "No qualifying normalized result retained" : JSON.stringify(item.normalized_value, null, 2)}</pre>
      <p>{label(item.validation_state)} · {label(item.canonical_selection_state)}</p>
      <p>Selected evidence: {item.selected_evidence_id ?? "No individual selection retained"}</p>
      <p>Candidate evidence: {item.candidate_evidence_ids.length ? item.candidate_evidence_ids.join(", ") : "None retained"}</p>
      <p>Source reference: {item.raw_source_record_id ?? "Unavailable"}</p>
      <p>Retrieved: {item.retrieved_at ?? "Unavailable"} · fresh through: {item.fresh_through ?? "Unavailable"}</p>
      <p>History requirement: {item.minimum_history ?? "Unspecified"} (requirement-specific units)</p>
      <p>Benchmark authority: {item.benchmark_authority.length ? item.benchmark_authority.join(" · ") : "Not specified"}</p>
      <p>Freshness policy: {item.freshness_policy ? label(item.freshness_policy) : "Unspecified"}</p>
      <p>Remediation: {label(item.recommended_remediation_action)}</p>
      <p>Retained results do not by themselves establish score or recommendation readiness. Missing metadata is not inferred.</p>
    </details>
  </article>
}

/** Every selected immutable requirement is accessible, without stock/sector routing or fabricated research. */
export function ProfileResearchBlocks({ portfolioId, securityId, assetClass, onViewEvidence, evidence: selectedEvidence, section = "Overview", industry, sector, snapshot }: {
  readonly portfolioId: string; readonly securityId: string; readonly assetClass: string; readonly onViewEvidence: () => void; readonly evidence?: CanonicalEvidenceReadiness; readonly section?: ResearchResultSection; readonly industry?: string | null; readonly sector?: string | null; readonly snapshot?: SecurityScoringSnapshot | null
}) {
  const ownEvidence = useCanonicalEvidenceReadiness(portfolioId, securityId, assetClass, selectedEvidence === undefined)
  const evidence = selectedEvidence ?? ownEvidence
  const [query, setQuery] = useState("")
  const [state, setState] = useState<string>("ALL")
  const data = evidence.isLoading || evidence.error ? null : evidence.data
  const primary = canonicalPharmaPrimary(snapshot ?? null)
  const scoped = data ? selectSectionRequirements(data.requirements, data.snapshot.profileCode, section) : []
  const itemMismatch = data?.requirements.some(item => item.snapshot_id !== data.snapshot.snapshotId) ?? false
  const applicable = scoped.filter(item => item.applicability === "APPLICABLE").sort((a, b) => Number(b.required) - Number(a.required) || a.requirement_code.localeCompare(b.requirement_code)) ?? []
  const excluded = scoped.filter(item => item.applicability === "NOT_APPLICABLE") ?? []
  const search = query.trim().toLocaleLowerCase()
  const filtered = applicable.filter(item => (state === "ALL" || item.evidence_state === state) && (!search || [item.requirement_code, item.metric_code, item.reason_code, item.source_provider].join(" ").toLocaleLowerCase().includes(search)))
  const filtering = Boolean(search) || state !== "ALL"
  const visible = filtering ? filtered : filtered.slice(0, 6)
  const remaining = filtering ? [] : filtered.slice(6)
  const presentation = researchProfilePresentationState(data?.snapshot.profileCode)
  return <section className="panel profile-research-extension" aria-label={section === "Overview" ? "Stock-specific research" : `${section} selected contract results`}>
    <p className="eyebrow">Stock-specific research</p>
    <h2>{data ? `${label(data.snapshot.profileCode)}${data.snapshot.subprofileCode ? ` / ${label(data.snapshot.subprofileCode)}` : ""}` : "Research profile"} workspace</h2>
    <p>Approved business-model requirements and retained results for this stock. Classification and research assignment remain separate.</p>
    {!evidence.applicable ? <p>Equity research is not applicable to this asset class.</p> : evidence.error ? <p role="alert">{evidence.error}</p> : evidence.isLoading ? <p role="status">Loading the selected research contract…</p> : !data ? <p>No selected profile evidence snapshot. Applicability is unresolved.</p> : itemMismatch ? <p role="alert">Retained item snapshot mismatch. Result display is blocked; no cross-snapshot evidence is shown.</p> : <>
      <section className="selected-research-framework" aria-label="Selected research framework">
        <h3>Research framework</h3>
        <p><strong>Industry:</strong> {industry ?? "Unavailable"} · <strong>Basic Industry:</strong> Unavailable · <strong>Sector context:</strong> {sector ?? "Unavailable"}</p>
        <p><strong>Applied methodology:</strong> {label(data.snapshot.profileCode)} · <strong>Primary subprofile:</strong> {snapshot && snapshot.routeState !== "RESOLVED" ? "Awaiting reviewed assignment" : primary ? PHARMA_SUBPROFILE_CONTRACTS[primary].displayName : data.snapshot.subprofileCode ? label(data.snapshot.subprofileCode) : "Not supplied"}</p>
        <p><strong>Assignment state:</strong> {snapshot?.routeState ? label(snapshot.routeState) : "Canonical snapshot retained; route verification not supplied"} · <strong>Assessment engine:</strong> {snapshot?.engineState ? label(snapshot.engineState) : "Unavailable"}</p>
        <p>Framework presentation does not verify classification, evidence completeness or an investment recommendation. Secondary exposure review metadata is not supplied.</p>
      </section>
      {section !== "Overview" ? <p>{section} displays exact requirements mapped by the canonical IC1 contract. Items without a registered dimension remain accessible in Overview and complete Evidence.</p> : null}
      <p className="assessment-note">{data.snapshot.methodologyAuthority} · {data.snapshot.methodologyVersion} · stored snapshot {data.snapshot.asOfDate} · {label(data.snapshot.snapshotStatus)}</p>
      <p>{presentation === "SPECIALIST" ? "Specialist presentation is available for this profile; stored evidence states still govern readiness." : presentation === "CONTRACT_RESULTS_ONLY" ? "Specialist snapshot presentation is not registered for this profile. Its selected contract requirements and retained results remain available below; no general or bank methodology is substituted." : "Research profile is unresolved. Retained snapshot items do not establish an approved methodology."}</p>
      <details><summary>Selected contract and assignment lineage</summary>
        <p>Profile: {data.snapshot.profileCode} · subprofile: {data.snapshot.subprofileCode ?? "Not supplied"}</p>
        <p>Methodology role: {data.snapshot.methodologyRole}</p>
        <p>Assignment: {data.snapshot.assignmentAuthority ?? "Authority unavailable"} / {data.snapshot.assignmentVersion} / {data.snapshot.assignmentId}</p>
        <p>Classification version: {data.snapshot.classificationVersion} · snapshot: {data.snapshot.snapshotId}</p>
      </details>
      <p>{applicable.length} applicable retained requirements · {excluded.length} not applicable. These are item counts, not validated coverage or readiness percentages.</p>
      <div className="profile-research-filters">
        <label>Find profile research<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Requirement, metric or source" /></label>
        <label>Stored evidence state<select value={state} onChange={event => setState(event.target.value)}>{STATES.map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
      </div>
      <div className="profile-requirement-grid">{visible.map(item => <RequirementCard key={item.id} item={item} />)}</div>
      {remaining.length ? <details className="profile-research-remaining"><summary>All remaining applicable research ({remaining.length})</summary><div className="profile-requirement-grid">{remaining.map(item => <RequirementCard key={item.id} item={item} />)}</div></details> : null}
      {!applicable.length ? <p>No applicable requirement items retained; research completeness is unproven.</p> : !filtered.length ? <p>No applicable requirements match these filters.</p> : null}
      {excluded.length ? <details><summary>Not-applicable requirements ({excluded.length})</summary><p>Explicit contract exclusions are not missing evidence.</p><div className="profile-requirement-grid">{excluded.map(item => <RequirementCard key={item.id} item={item} />)}</div></details> : null}
    </>}
    <button type="button" className="button button-secondary" onClick={onViewEvidence}>View complete profile evidence</button>
  </section>
}
