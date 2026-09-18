import { useMemo } from "react"
import "./PharmaResearchWorkspacePanel.css"
import { buildTorntpharmEvidencePilotPreview } from "./pharmaEvidencePilotPreview"
import { buildPharmaBusinessModelEvidenceAcquisitionPlan, type PharmaBusinessModelEvidenceAcquisitionItem } from "./pharmaBusinessModelEvidenceAcquisitionContract"
import { buildTorntpharmPublicOfficialSourceDiscoveryPlan } from "./torntpharmPublicOfficialSourceDiscovery"
import { buildTorntpharmArtifactContentReviewPlan } from "./torntpharmArtifactContentReviewPlan"
import { buildPharmaResearchWorkspaceModel, type PharmaWorkspaceRequirement, type PharmaWorkspaceSecondaryExposure } from "./pharmaResearchWorkspaceModel"
import { usePharmaSubprofileResolution } from "./usePharmaSubprofileResolution"
import type { SecurityResearch } from "./types"

function titleCase(value: string) {
  return value.toLocaleLowerCase().replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase()).replaceAll("_", " ")
}

function statusClass(status: PharmaWorkspaceRequirement["status"]) {
  if (status === "VERIFIED") return "is-verified"
  if (status === "UNAVAILABLE") return "is-unavailable"
  if (status === "CONFLICTING" || status === "AMBIGUOUS" || status === "REVIEW_REQUIRED") return "is-attention"
  if (status === "STALE") return "is-stale"
  return "is-provisional"
}

function RequirementList({ items, empty }: { readonly items: readonly PharmaWorkspaceRequirement[]; readonly empty: string }) {
  if (!items.length) return <p className="pharma-workspace-empty">{empty}</p>
  return <div className="pharma-workspace-requirements">
    {items.map((item) => <div className="pharma-workspace-requirement" key={item.metricCode}>
      <div>
        <strong>{item.label}</strong>
        <small>{titleCase(item.dimension)} · {titleCase(item.requirementLevel)}</small>
      </div>
      <span className={`pharma-workspace-status ${statusClass(item.status)}`}>{titleCase(item.status)}</span>
    </div>)}
  </div>
}

function overlayLabel(exposure: PharmaWorkspaceSecondaryExposure) {
  if (exposure.mode === "EVIDENCE_OVERLAY") return "Evidence overlay active"
  if (exposure.mode === "EMERGING_WATCH") return "Emerging watchlist"
  if (exposure.mode === "MONITOR_ONLY") return "Monitor only"
  if (exposure.mode === "RECLASSIFICATION_REVIEW") return "Reclassification review"
  return "Blocked"
}

function SecondaryExposureCard({ exposure }: { readonly exposure: PharmaWorkspaceSecondaryExposure }) {
  return <article className={`pharma-secondary-card mode-${exposure.mode.toLocaleLowerCase()}`}>
    <div className="pharma-secondary-card-head">
      <div>
        <p className="eyebrow">Secondary exposure</p>
        <h4>{exposure.displayName}</h4>
      </div>
      <span className="pharma-materiality-pill">{titleCase(exposure.materiality)}</span>
    </div>
    <div className="pharma-overlay-meta">
      <strong>{overlayLabel(exposure)}</strong>
      <span>{titleCase(exposure.confidence)} confidence</span>
    </div>
    <p>{exposure.note}</p>
    {exposure.mode === "EVIDENCE_OVERLAY" ? <RequirementList items={exposure.requirements} empty="No overlay-specific requirements are currently defined." /> : null}
  </article>
}


function acquisitionAccessLabel(value: PharmaBusinessModelEvidenceAcquisitionItem["accessGate"]) {
  if (value === "PUBLIC_OFFICIAL_FIRST") return "Public / official first"
  if (value === "PUBLIC_OR_LICENSED") return "Public or licensed"
  return "Licensed source required"
}

function acquisitionMethodLabel(value: PharmaBusinessModelEvidenceAcquisitionItem["acquisitionMethod"]) {
  if (value === "DOCUMENT_EXTRACTION") return "Document extraction"
  if (value === "EVENT_REVIEW") return "Event review"
  if (value === "DERIVED_FROM_DISCLOSED_INPUTS") return "Derived from disclosed inputs"
  if (value === "LICENSED_DATA_REVIEW") return "Licensed data review"
  return "Composite review"
}

function AcquisitionRequirementList({ items }: { readonly items: readonly PharmaBusinessModelEvidenceAcquisitionItem[] }) {
  return <div className="pharma-acquisition-list">
    {items.map((item) => <article className="pharma-acquisition-item" key={item.metricCode}>
      <div className="pharma-acquisition-item-head">
        <div>
          <strong>{item.label}</strong>
          <small>{titleCase(item.requirementLevel)} · minimum {item.minimumObservations} / preferred {item.preferredObservations} {titleCase(item.historyUnit).toLocaleLowerCase()}</small>
        </div>
        <span>{acquisitionAccessLabel(item.accessGate)}</span>
      </div>
      <div className="pharma-acquisition-item-meta">
        <span>{acquisitionMethodLabel(item.acquisitionMethod)}</span>
        <span>{item.sourceLanes.map(titleCase).join(" · ")}</span>
      </div>
      <p>{item.evidenceShape}</p>
      <small className="pharma-acquisition-fail-closed"><strong>Fail closed:</strong> {item.failClosedRule}</small>
    </article>)}
  </div>
}

export function PharmaResearchWorkspacePanel({ securityId, symbol, research }: { readonly securityId: string; readonly symbol: string; readonly research: SecurityResearch }) {
  const resolution = usePharmaSubprofileResolution(securityId)
  const evaluationDate = useMemo(() => new Date().toISOString().slice(0, 10), [])

  if (resolution.isLoading) return <section className="pharma-workspace-panel"><p className="muted">Loading reviewed Pharma business model…</p></section>
  if (resolution.error) return <section className="pharma-workspace-panel"><div className="notice notice-error">Reviewed Pharma business model could not be loaded.</div></section>
  if (!resolution.data || resolution.data.status !== "RESOLVED") {
    return <section className="pharma-workspace-panel pharma-workspace-blocked">
      <div>
        <p className="eyebrow">Pharma research model</p>
        <h2>Subprofile review required</h2>
        <p>Profile-driven evidence lanes remain blocked until one active reviewed Pharma subprofile assignment is available.</p>
      </div>
    </section>
  }

  const model = buildPharmaResearchWorkspaceModel(resolution.data.assignment, research.metrics, evaluationDate)
  const evidencePilot = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmEvidencePilotPreview(securityId, model) : null
  const acquisitionPlan = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildPharmaBusinessModelEvidenceAcquisitionPlan(model) : null
  const publicSourceDiscovery = acquisitionPlan ? buildTorntpharmPublicOfficialSourceDiscoveryPlan(acquisitionPlan) : null
  const artifactReviewPlan = acquisitionPlan && publicSourceDiscovery ? buildTorntpharmArtifactContentReviewPlan(acquisitionPlan, publicSourceDiscovery) : null

  return <section className="pharma-workspace-panel" aria-labelledby="pharma-workspace-title">
    <div className="pharma-workspace-titlebar">
      <div>
        <p className="eyebrow">Gate F · Profile-driven research</p>
        <h2 id="pharma-workspace-title">Business model research map</h2>
        <p>The visible evidence lanes now follow the reviewed Pharma business model. Missing evidence stays unavailable and secondary exposures do not blend into another score.</p>
      </div>
      <span className="pharma-workspace-lock">Scoring methodology not yet approved</span>
    </div>

    <div className="pharma-workspace-summary" aria-label="Pharma research model summary">
      <div><span>Primary model</span><strong>{model.primary.displayName}</strong><small>Reviewed · {titleCase(model.primary.confidence)} confidence</small></div>
      <div><span>Primary evidence</span><strong>{model.primary.verified}/{model.primary.requirements.length} verified</strong><small>{model.primary.unavailable} unavailable · {model.primary.reviewAttention} need attention</small></div>
      <div><span>Secondary exposures</span><strong>{model.secondaries.length}</strong><small>{model.secondaries.length ? model.secondaries.map((item) => `${item.displayName} · ${titleCase(item.materiality)}`).join(" · ") : "None active"}</small></div>
      <div><span>Effective from</span><strong>{model.primary.effectiveFrom}</strong><small>Reviewed assignment authority</small></div>
    </div>

    <div className="pharma-workspace-grid">
      <article className="pharma-primary-card">
        <div className="pharma-primary-card-head">
          <div>
            <p className="eyebrow">Primary evidence lanes</p>
            <h3>{model.primary.displayName}</h3>
          </div>
          <span className="pharma-primary-pill">Primary · Reviewed</span>
        </div>
        <p className="pharma-workspace-intro">These are the business-model-specific requirements added or strengthened by the reviewed primary subprofile. They remain evidence requirements only; Gate G will define any future scoring curves.</p>
        <RequirementList items={model.primary.requirements} empty="No business-model-specific requirements are defined for this subprofile." />
      </article>

      <aside className="pharma-secondary-stack" aria-label="Reviewed secondary exposure overlays">
        <div className="pharma-secondary-heading">
          <p className="eyebrow">Secondary exposure overlays</p>
          <h3>What changes because of the reviewed exposures</h3>
        </div>
        {model.secondaries.length ? model.secondaries.map((exposure) => <SecondaryExposureCard key={exposure.exposureCode} exposure={exposure} />) : <p className="pharma-workspace-empty">No active reviewed secondary exposures.</p>}
      </aside>
    </div>

    {evidencePilot ? <section className="pharma-evidence-pilot" aria-labelledby="pharma-evidence-pilot-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Official evidence pilot</p>
          <h3 id="pharma-evidence-pilot-title">Evidence ingestion dry-run</h3>
          <p>Validated candidate observations are projected against the reviewed business-model requirements before any database write. Canonical financial-history evidence does not automatically satisfy subprofile-specific evidence contracts.</p>
        </div>
        <span className="pharma-workspace-lock">Dry-run · No write</span>
      </div>
      <div className="pharma-evidence-pilot-summary">
        <div><span>Candidate observations</span><strong>{evidencePilot.candidateCount}</strong><small>{evidencePilot.acceptedCount} validation-ready</small></div>
        <div><span>Direct official</span><strong>{evidencePilot.directOfficialCount}</strong><small>Issuer / official lineage</small></div>
        <div><span>PortfolioAI derived</span><strong>{evidencePilot.derivedCount}</strong><small>Formula + direct-input lineage required</small></div>
        <div><span>Quarantined</span><strong>{evidencePilot.quarantinedCount}</strong><small>Must be zero before an ingestion proposal</small></div>
      </div>
      <div className="pharma-evidence-impact">
        <div>
          <span>Projected subprofile completeness</span>
          <strong>{evidencePilot.countedRequirementReady}/{evidencePilot.countedRequirementTotal}</strong>
          <small>would meet minimum observation requirements from this manifest alone</small>
        </div>
        <div className="pharma-evidence-scope-list">
          {evidencePilot.scopes.map((scope) => <span key={scope.label}><strong>{scope.label}</strong>{scope.ready}/{scope.total} projected</span>)}
        </div>
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Interpretation:</strong> this 42-row pilot is currently useful for canonical financial-history evidence, but it does not directly fulfill the 14 counted Domestic Formulations + Global Generics business-model requirements. Those requirements need their own approved evidence contracts and source observations.</p>
    </section> : null}
    {acquisitionPlan ? <section className="pharma-acquisition-plan" aria-labelledby="pharma-acquisition-plan-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Business-model evidence contract</p>
          <h3 id="pharma-acquisition-plan-title">Evidence acquisition plan</h3>
          <p>The 14 unmet requirements now have explicit source, history, acquisition and fail-closed contracts. This is a planning manifest only: it does not fetch a source, call a licensed provider, or authorize ingestion.</p>
        </div>
        <span className="pharma-workspace-lock">Planned · No ingestion</span>
      </div>
      <div className="pharma-acquisition-summary">
        <div><span>Planned requirements</span><strong>{acquisitionPlan.summary.total}</strong><small>{acquisitionPlan.summary.mandatory} mandatory · {acquisitionPlan.summary.important} important · {acquisitionPlan.summary.supplementary} supplementary</small></div>
        <div><span>Public / official first</span><strong>{acquisitionPlan.summary.publicOfficialFirst}</strong><small>No paid provider required as the first acquisition lane</small></div>
        <div><span>Licensed-source gates</span><strong>{acquisitionPlan.summary.licensedRequired + acquisitionPlan.summary.publicOrLicensed}</strong><small>{acquisitionPlan.summary.licensedRequired} required · {acquisitionPlan.summary.publicOrLicensed} optional fallback</small></div>
        <div><span>Controlled derivations</span><strong>{acquisitionPlan.summary.derivedFromDisclosedInputs}</strong><small>Only from explicitly disclosed compatible inputs</small></div>
      </div>
      <div className="pharma-acquisition-grid">
        <section>
          <div className="pharma-secondary-heading"><p className="eyebrow">Primary model</p><h3>Domestic Formulations · 8 requirements</h3></div>
          <AcquisitionRequirementList items={acquisitionPlan.items.filter((item) => item.scope === "PRIMARY_MODEL")} />
        </section>
        <section>
          <div className="pharma-secondary-heading"><p className="eyebrow">Material overlay</p><h3>Global Generics · 6 requirements</h3></div>
          <AcquisitionRequirementList items={acquisitionPlan.items.filter((item) => item.scope === "MATERIAL_OVERLAY")} />
        </section>
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Access boundary:</strong> Brand & Therapy Leadership requires an approved licensed market source. Chronic / Acute Mix may use issuer disclosure first and an approved licensed source only if needed. No licensed-source call is authorized by this contract.</p>
    </section> : null}

    {publicSourceDiscovery ? <section className="pharma-source-discovery" aria-labelledby="pharma-source-discovery-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Public / official discovery</p>
          <h3 id="pharma-source-discovery-title">Public / official source discovery</h3>
          <p>Candidate issuer, listed-company and regulator artifacts are mapped to the 12 public/official-first requirements. Discovery is not evidence review: every requirement remains NOT REVIEWED until source content and history are examined.</p>
        </div>
        <span className="pharma-workspace-lock">Discovery only · No fetch</span>
      </div>
      <div className="pharma-source-discovery-summary">
        <div><span>Requirements in scope</span><strong>{publicSourceDiscovery.summary.scopedRequirements}</strong><small>{publicSourceDiscovery.summary.mappedRequirements} mapped to candidate sources</small></div>
        <div><span>Official artifacts</span><strong>{publicSourceDiscovery.summary.discoveredArtifacts}</strong><small>{publicSourceDiscovery.summary.issuerArtifacts} issuer/listed-company · {publicSourceDiscovery.summary.regulatorArtifacts} regulator</small></div>
        <div><span>Source hubs</span><strong>{publicSourceDiscovery.summary.sourceHubs}</strong><small>Used to enumerate history in the next review step</small></div>
        <div><span>Evidence reviewed</span><strong>0</strong><small>Discovery does not promote evidence state</small></div>
      </div>
      <div className="pharma-source-artifacts">
        {publicSourceDiscovery.artifacts.map((artifact) => <article key={artifact.code}>
          <div><strong>{artifact.title}</strong><small>{titleCase(artifact.sourceLane)} · {titleCase(artifact.kind)}</small></div>
          <span>{artifact.periodOrDate}</span>
        </article>)}
      </div>
      <div className="pharma-source-requirements">
        {publicSourceDiscovery.requirements.map((item) => <article key={item.metricCode}>
          <div className="pharma-source-requirement-head">
            <div><strong>{item.label}</strong><small>{item.scopeLabel} · {titleCase(item.requirementLevel)} · minimum {item.minimumObservations} / preferred {item.preferredObservations} {titleCase(item.historyUnit).toLocaleLowerCase()}</small></div>
            <span>Candidate source found</span>
          </div>
          <p>{item.candidateArtifactCodes.join(" · ")}</p>
          <small><strong>Gap:</strong> {item.gap}</small>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> Brand & Therapy Leadership and Chronic / Acute Mix are intentionally excluded from this 12-row public/official-first dry run because their licensed-source gates remain separately controlled.</p>
    </section> : null}

    {artifactReviewPlan ? <section className="pharma-artifact-review-plan" aria-labelledby="pharma-artifact-review-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Artifact-level review planning</p>
          <h3 id="pharma-artifact-review-title">Exact document review plan</h3>
          <p>Exact annual, quarterly, regulator and exchange documents are lined up for content review. Planning coverage is kept separate from reviewed evidence: no document has been reviewed into an evidence state yet.</p>
        </div>
        <span className="pharma-workspace-lock">Planning only · 0 reviewed</span>
      </div>
      <div className="pharma-artifact-review-summary">
        <div><span>Exact artifacts planned</span><strong>{artifactReviewPlan.summary.exactArtifactsPlanned}</strong><small>{artifactReviewPlan.summary.annualReports} annual · {artifactReviewPlan.summary.quarterlyReleases} quarterly · {artifactReviewPlan.summary.regulatorDocuments} regulator · {artifactReviewPlan.summary.exchangeFilings} exchange</small></div>
        <div><span>Requirements planned</span><strong>{artifactReviewPlan.summary.requirementsPlanned}</strong><small>{artifactReviewPlan.summary.minimumPlanningCovered} cover minimum planning horizon</small></div>
        <div><span>Preferred horizon covered</span><strong>{artifactReviewPlan.summary.preferredPlanningCovered}</strong><small>Candidate-document planning only</small></div>
        <div><span>Evidence reviewed</span><strong>{artifactReviewPlan.summary.evidenceReviewed}</strong><small>All rows remain NOT REVIEWED</small></div>
      </div>
      <div className="pharma-artifact-targets">
        {artifactReviewPlan.artifacts.map((artifact) => <article key={artifact.code}>
          <div><strong>{artifact.title}</strong><small>{titleCase(artifact.documentType)}</small></div>
          <span>{artifact.period}</span>
        </article>)}
      </div>
      <div className="pharma-artifact-requirements">
        {artifactReviewPlan.requirements.map((item) => <article key={item.metricCode}>
          <div className="pharma-source-requirement-head">
            <div>
              <strong>{item.label}</strong>
              <small>{item.scopeLabel} · minimum {item.minimumObservations} / preferred {item.preferredObservations} {titleCase(item.historyUnit).toLocaleLowerCase()}</small>
            </div>
            <span>{item.evidenceState.replaceAll("_", " ")}</span>
          </div>
          <div className="pharma-artifact-gap-grid">
            <span><strong>{item.planningCoverageCount}</strong> candidate docs</span>
            <span><strong>{item.minimumPlanningGap}</strong> minimum planning gap</span>
            <span><strong>{item.preferredPlanningGap}</strong> preferred planning gap</span>
            <span><strong>{item.minimumReviewedEvidenceGap}</strong> reviewed-evidence gap</span>
          </div>
          <p>{item.artifactReviews.map((review) => `${review.artifactCode} · ${review.relevance === "LIKELY_RELEVANT" ? "Likely" : "Possible"}`).join(" | ")}</p>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Interpretation:</strong> 12/12 public/official-first requirements now have enough exact candidate documents to cover their minimum planning horizon, but that does not satisfy any evidence requirement. Content review, compatibility checks and freshness review remain outstanding for every row.</p>
    </section> : null}

  </section>
}
