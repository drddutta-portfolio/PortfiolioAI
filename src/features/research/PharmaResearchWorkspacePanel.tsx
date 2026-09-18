import { useMemo } from "react"
import "./PharmaResearchWorkspacePanel.css"
import { buildTorntpharmEvidencePilotPreview } from "./pharmaEvidencePilotPreview"
import { buildPharmaBusinessModelEvidenceAcquisitionPlan, type PharmaBusinessModelEvidenceAcquisitionItem } from "./pharmaBusinessModelEvidenceAcquisitionContract"
import { buildTorntpharmPublicOfficialSourceDiscoveryPlan } from "./torntpharmPublicOfficialSourceDiscovery"
import { buildTorntpharmArtifactContentReviewPlan } from "./torntpharmArtifactContentReviewPlan"
import { buildTorntpharmReadOnlyContentReviewDryRun } from "./torntpharmReadOnlyContentReviewDryRun"
import { buildTorntpharmCandidateToIngestionProposal } from "./torntpharmCandidateToIngestionProposal"
import { buildTorntpharmLocalNumericIngestionPackage } from "./torntpharmLocalNumericIngestionPackage"
import { buildPharmaRegulatoryEventPersistenceProposal } from "./pharmaRegulatoryEventPersistenceProposal"
import { buildTorntpharmLocalNumericPreflightPlan } from "./torntpharmLocalNumericPreflight"
import { buildPharmaRegulatoryEventMigrationReplayPlan } from "./pharmaRegulatoryEventMigrationReplayPlan"
import { buildTorntpharmCanonicalPrerequisitePackage } from "./torntpharmCanonicalPrerequisitePackage"
import { buildTorntpharmLocalPrerequisiteMutationProposal } from "./torntpharmLocalPrerequisiteMutationProposal"
import { buildTorntpharmLocalObservationMutationProposal } from "./torntpharmLocalObservationMutationProposal"
import { buildPharmaGateGScoringMethodProposal } from "./pharmaGateGScoringMethodProposal"
import { PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL } from "./pharmaSegmentGrowthCurveProposal"
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
  const contentReviewDryRun = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmReadOnlyContentReviewDryRun() : null
  const ingestionProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmCandidateToIngestionProposal(securityId, resolution.data.assignment.assignmentVersion) : null
  const localNumericPackage = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalNumericIngestionPackage(securityId, resolution.data.assignment.assignmentVersion) : null
  const eventPersistenceProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildPharmaRegulatoryEventPersistenceProposal(securityId, resolution.data.assignment.assignmentVersion) : null
  const localNumericPreflight = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalNumericPreflightPlan(securityId, resolution.data.assignment.assignmentVersion) : null
  const eventMigrationReplay = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildPharmaRegulatoryEventMigrationReplayPlan(securityId, resolution.data.assignment.assignmentVersion) : null
  const canonicalPrerequisitePackage = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmCanonicalPrerequisitePackage() : null
  const localPrerequisiteMutationProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalPrerequisiteMutationProposal() : null
  const localObservationMutationProposal = symbol.toLocaleUpperCase() === "TORNTPHARM" ? buildTorntpharmLocalObservationMutationProposal() : null
  const gateGScoringProposal = buildPharmaGateGScoringMethodProposal(model)

  return <section className="pharma-workspace-panel" aria-labelledby="pharma-workspace-title">
    <div className="pharma-workspace-titlebar">
      <div>
        <p className="eyebrow">Sector research workspace · Pharmaceuticals</p>
        <h2 id="pharma-workspace-title">Pharmaceuticals deep research</h2>
        <p>Profile-specific evidence follows the reviewed Pharma business model. Open the detailed layers only when you need the underlying requirements, sources or review controls.</p>
      </div>
      <span className="pharma-workspace-lock">Scoring methodology not yet approved</span>
    </div>

    <div className="pharma-workspace-summary" aria-label="Pharma research model summary">
      <div><span>Primary model</span><strong>{model.primary.displayName}</strong><small>Reviewed · {titleCase(model.primary.confidence)} confidence</small></div>
      <div><span>Primary evidence</span><strong>{model.primary.verified}/{model.primary.requirements.length} verified</strong><small>{model.primary.unavailable} unavailable · {model.primary.reviewAttention} need attention</small></div>
      <div><span>Secondary exposures</span><strong>{model.secondaries.length}</strong><small>{model.secondaries.length ? model.secondaries.map((item) => `${item.displayName} · ${titleCase(item.materiality)}`).join(" · ") : "None active"}</small></div>
      <div><span>Effective from</span><strong>{model.primary.effectiveFrom}</strong><small>Reviewed assignment authority</small></div>
    </div>

    <details className="pharma-deep-layer pharma-scoring-methodology">
      <summary>
        <div><span>Gate G · Scoring methodology design</span><small>PHARMA_V1 dimensions, subprofile participation and readiness gates · no numeric curves approved</small></div>
        <b>Open details</b>
      </summary>
      <div className="pharma-deep-layer-body">
        <section className="pharma-persistence-package" aria-labelledby="pharma-gate-g-methodology-title">
          <div className="pharma-evidence-pilot-head">
            <div>
              <p className="eyebrow">Gate G · Methodology contract</p>
              <h3 id="pharma-gate-g-methodology-title">PHARMA_V1 scoring design</h3>
              <p>The scoring architecture is reviewable before any curve is approved. Primary and material business-model evidence participate inside one PHARMA_V1 score; emerging watches stay outside the denominator.</p>
            </div>
            <span className="pharma-workspace-lock">Design only · No score run</span>
          </div>
          <div className="pharma-persistence-package-summary">
            <div><span>Weighted dimensions</span><strong>{gateGScoringProposal.dimensionWeights.length}</strong><small>{gateGScoringProposal.dimensionWeights.reduce((sum, item) => sum + item.weight, 0)}% total weight</small></div>
            <div><span>Dimension gate</span><strong>{Math.round(gateGScoringProposal.dimensionMinimumScoreReadyCoverage * 100)}%</strong><small>Minimum score-ready coverage per weighted dimension</small></div>
            <div><span>Overall preview gate</span><strong>{Math.round(gateGScoringProposal.overallMinimumScoreReadyCoverage * 100)}%</strong><small>All weighted dimensions must also be score-ready</small></div>
            <div><span>Curve approval</span><strong>Pending</strong><small>No numeric Pharma score curve is approved yet</small></div>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>Primary scoring model</strong>
              <small>{gateGScoringProposal.primary.displayName}</small>
              <p>{gateGScoringProposal.primary.note}</p>
              <span>Role: PRIMARY SCORE DRIVER</span>
            </article>
            {gateGScoringProposal.overlays.map((overlay) => <article key={overlay.code}>
              <strong>{overlay.role === "MATERIAL_EVIDENCE_OVERLAY" ? "Material scoring overlay" : "Emerging scoring watch"}</strong>
              <small>{overlay.displayName}</small>
              <p>{overlay.note}</p>
              <span>{overlay.denominatorEffect === "WITHIN_DIMENSION_ONLY" ? "No second score · within-dimension evidence only" : "Excluded from score denominator"}</span>
            </article>)}
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>First proposed curve family</strong>
              <small>{PHARMA_SEGMENT_GROWTH_CURVE_PROPOSAL.proposalVersion}</small>
              <p>Segment growth uses 60% four-quarter median growth level, 25% positive-quarter consistency and 15% latest-versus-prior-three trend. The same methodology is proposed for Domestic Revenue Growth and Export / US Revenue Growth.</p>
              <span>Proposal only · Activation approved: NO</span>
            </article>
            <article>
              <strong>History & fail-closed boundary</strong>
              <small>Minimum 4 comparable reviewed quarters · preferred 8</small>
              <p>Latest period is mandatory. Rejected or scope-incompatible claims are excluded before normalization; a broken comparable series produces no score rather than a substituted value.</p>
              <span>Score execution: NO</span>
            </article>
          </div>
          <div className="pharma-persistence-package-grid">
            <article>
              <strong>Dimension weights</strong>
              <small>{gateGScoringProposal.proposalVersion}</small>
              <p>{gateGScoringProposal.dimensionWeights.map((item) => `${titleCase(item.dimensionCode)} ${item.weight}%`).join(" · ")}</p>
              <span>Existing PHARMA_V1 parent weights preserved</span>
            </article>
            <article>
              <strong>Execution boundary</strong>
              <small>Score execution remains disabled</small>
              <p>Numeric normalization curves, score-run persistence, recommendation logic and position sizing all remain outside this design checkpoint.</p>
              <span>Score run: NO · Recommendation: NO · Position sizing: NO</span>
            </article>
          </div>
        </section>
      </div>
    </details>

    <details className="pharma-deep-layer">
      <summary>
        <div><span>Business model & exposure map</span><small>Primary evidence lanes, material overlays and emerging watches</small></div>
        <b>Open details</b>
      </summary>
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
    </details>

    <details className="pharma-deep-layer pharma-evidence-operations">
      <summary>
        <div><span>Evidence operations & review controls</span><small>Ingestion dry-run, acquisition contract, source discovery, document planning and read-only review</small></div>
        <b>Open details</b>
      </summary>
      <div className="pharma-deep-layer-body">
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

    {contentReviewDryRun ? <section className="pharma-content-review-dry-run" aria-labelledby="pharma-content-review-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Read-only content review</p>
          <h3 id="pharma-content-review-title">Public document content-review dry-run</h3>
          <p>Six public/official artifacts have been inspected in read-only mode. Proposed candidates and rejected claims remain outside canonical evidence storage and no ingestion write is authorized.</p>
        </div>
        <span className="pharma-workspace-lock">Read-only · No ingestion</span>
      </div>
      <div className="pharma-content-review-summary">
        <div><span>Artifacts reviewed</span><strong>{contentReviewDryRun.summary.reviewedArtifacts}</strong><small>4 issuer quarterlies · 2 FDA regulator documents</small></div>
        <div><span>Proposed candidates</span><strong>{contentReviewDryRun.summary.proposedCandidates}</strong><small>4 US-growth observations · 2 Indrad regulator events</small></div>
        <div><span>Rejected claims</span><strong>{contentReviewDryRun.summary.rejectedClaims}</strong><small>Scope-incompatible claim kept out of candidate history</small></div>
        <div><span>Ingestion writes</span><strong>{contentReviewDryRun.summary.ingestionWrites}</strong><small>Nothing promoted to canonical evidence</small></div>
      </div>

      <div className="pharma-content-review-grid">
        {contentReviewDryRun.requirementResults.map((result) => <article key={result.metricCode}>
          <div className="pharma-source-requirement-head">
            <div>
              <strong>{result.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" ? "Export / US Revenue Growth" : "Regulatory Site Status"}</strong>
              <small>{result.proposedObservationCount} proposed observations · minimum {result.minimumRequired}</small>
            </div>
            <span>{titleCase(result.proposalState)}</span>
          </div>
          <p>{result.remainingGap}</p>
        </article>)}
      </div>

      <div className="pharma-content-review-candidates">
        {contentReviewDryRun.proposedCandidates.map((candidate) => <article key={candidate.artifactCode + candidate.observationDate + candidate.value}>
          <div>
            <strong>{candidate.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" ? "US revenue growth" : "Indrad regulator event"}</strong>
            <small>{candidate.observationDate} · {candidate.artifactCode}</small>
          </div>
          <span>{candidate.unit === "PERCENT" ? `${candidate.value}%` : titleCase(candidate.value)}</span>
          <p>{candidate.basis}</p>
          <small>{candidate.provenanceSummary}</small>
        </article>)}
      </div>

      {contentReviewDryRun.rejectedClaims.map((rejected) => <article className="pharma-content-review-rejection" key={rejected.artifactCode + rejected.claim}>
        <div><strong>Rejected from comparable series</strong><span>{rejected.claim}</span></div>
        <p>{rejected.reason}</p>
      </article>)}

      <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> proposed candidates are review outputs only. Regulatory Site Status remains partial-scope because only the Indrad warning/closeout chain has been reviewed, and no company-wide current regulatory-clearance claim is made.</p>
    </section> : null}


    {ingestionProposal ? <section className="pharma-ingestion-proposal" aria-labelledby="pharma-ingestion-proposal-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Candidate-to-ingestion proposal</p>
          <h3 id="pharma-ingestion-proposal-title">Ingestion eligibility proposal</h3>
          <p>Reviewed candidates are projected against the current canonical ingestion contracts. This section identifies schema and validator blockers only; it does not authorize or perform a write.</p>
        </div>
        <span className="pharma-workspace-lock">Proposal only · 0 writes</span>
      </div>
      <div className="pharma-ingestion-proposal-summary">
        <div><span>Reviewed candidates</span><strong>{ingestionProposal.summary.reviewedCandidates}</strong><small>{ingestionProposal.summary.numericCandidates} numeric · {ingestionProposal.summary.eventCandidates} event-state</small></div>
        <div><span>Numeric validator accepted</span><strong>{ingestionProposal.summary.validatorAccepted}</strong><small>{ingestionProposal.summary.validatorQuarantined} numeric candidates quarantined</small></div>
        <div><span>Event contract accepted</span><strong>{ingestionProposal.summary.eventContractAccepted}</strong><small>{ingestionProposal.summary.eventStorageBlocked} accepted events still blocked by missing canonical storage/write path</small></div>
        <div><span>Proposed writes</span><strong>{ingestionProposal.summary.proposedWrites}</strong><small>{ingestionProposal.summary.rejectedClaimsExcluded} rejected claim excluded · {ingestionProposal.summary.eventContractQuarantined} event-contract quarantined</small></div>
      </div>
      <div className="pharma-ingestion-proposal-items">
        {ingestionProposal.items.map((item) => <article key={item.artifactCode + item.observationDate + item.value}>
          <div className="pharma-source-requirement-head">
            <div><strong>{item.metricCode === "PHARMA_EXPORT_US_REVENUE_GROWTH" ? "Export / US Revenue Growth" : "Regulatory Site Status"}</strong><small>{item.observationDate} · {item.artifactCode} · {item.value}{item.unit === "PERCENT" ? "%" : ""}</small></div>
            <span>{titleCase(item.disposition)}</span>
          </div>
          {item.validatorIssueCodes.length ? <p><strong>Current validator:</strong> {item.validatorIssueCodes.join(" · ")}</p> : null}
          <small>{item.rationale}</small>
        </article>)}
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Decision gate:</strong> the four US-growth candidates are now structurally accepted by numeric validator V2, and both FDA events are valid under the versioned regulatory event-evidence contract. Writes remain blocked: numeric ingestion still requires separate approval, regulatory event storage/write infrastructure is not implemented, and the rejected Q4 31% claim remains excluded.</p>
    </section> : null}


    {localNumericPackage && eventPersistenceProposal ? <section className="pharma-persistence-package" aria-labelledby="pharma-persistence-package-title">
      <div className="pharma-evidence-pilot-head">
        <div>
          <p className="eyebrow">Gate F · Prepared persistence packages</p>
          <h3 id="pharma-persistence-package-title">Local write package & event-schema proposal</h3>
          <p>The next persistence artifacts are prepared for review only. Neither the numeric package nor the regulatory-event schema proposal can write or migrate anything yet.</p>
        </div>
        <span className="pharma-workspace-lock">Prepared only · 0 writes</span>
      </div>
      <div className="pharma-persistence-package-summary">
        <div><span>Numeric rows prepared</span><strong>{localNumericPackage.summary.observationRowsPrepared}</strong><small>Target: {localNumericPackage.rows[0]?.canonicalTarget ?? "fundamental_observations"}</small></div>
        <div><span>Metric registry needed</span><strong>{localNumericPackage.summary.metricDefinitionRegistrationRequired}</strong><small>{localNumericPackage.metricDefinitionProposal.code} · PERCENT</small></div>
        <div><span>Source records needed</span><strong>{localNumericPackage.summary.sourceRecordsRequired}</strong><small>Immutable issuer provenance rows required before insert</small></div>
        <div><span>Event persistence</span><strong>Proposed</strong><small>{eventPersistenceProposal.proposedTable} · not applied</small></div>
      </div>
      <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local numeric ingestion package</strong>
          <small>{localNumericPackage.packageVersion}</small>
          <p>Four validator-accepted US-growth rows are mapped to the existing canonical fundamental-observation store. Metric registration, source-record materialization, conflict preflight and separate write approval remain required.</p>
          <span>Write authorized: NO</span>
        </article>
        <article>
          <strong>Regulatory event persistence proposal</strong>
          <small>{eventPersistenceProposal.proposalVersion}</small>
          <p>Append-only site-specific event storage, held-security RLS and service-role-only mutation are proposed. FDA source registration remains inactive and rights-unverified.</p>
          <span>Schema apply authorized: NO · Event write authorized: NO</span>
        </article>
      </div>
      <p className="pharma-evidence-pilot-note"><strong>Safety:</strong> the SQL proposal lives under docs/sql, not supabase/migrations, and is not an executable migration. The local numeric package also contains no database writer.</p>
      {localNumericPreflight && eventMigrationReplay ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local numeric preflight</strong>
          <small>{localNumericPreflight.preflightVersion}</small>
          <p>{localNumericPreflight.requiredLookups.length} canonical local lookups were executed against local Supabase. After prerequisite materialization, all 4 reviewed US-growth rows resolve to immutable source records with 0 existing facts, 0 conflicts and 0 blockers.</p>
          <span>Status: EXECUTED · READY FOR SEPARATE WRITE APPROVAL · 4 INSERT CANDIDATES · 0 BLOCKED · 0 CONFLICTS</span>
        </article>
        <article>
          <strong>Regulatory migration replay</strong>
          <small>{eventMigrationReplay.planVersion}</small>
          <p>{eventMigrationReplay.assertions.length} replay assertions were exercised against local Supabase. The proposal completed and rolled back cleanly with migration history unchanged and no proposed objects left behind.</p>
          <span>Status: EXECUTED · PASS · 0 PERSISTENT CHANGES</span>
        </article>
      </div> : null}
      {canonicalPrerequisitePackage ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Canonical prerequisite package</strong>
          <small>{canonicalPrerequisitePackage.packageVersion}</small>
          <p>{canonicalPrerequisitePackage.summary.metricDefinitionsPrepared} metric-definition row and {canonicalPrerequisitePackage.summary.sourceRecordsPrepared} immutable issuer source-record envelopes are prepared. Payload hashes are intentionally deferred until a separately approved materialization step.</p>
          <span>Status: PREPARED · NOT EXECUTED · 0 WRITES</span>
        </article>
        <article>
          <strong>Prerequisite mutation boundary</strong>
          <small>{canonicalPrerequisitePackage.sourceRegistryPrecondition.sourceCode}</small>
          <p>Existing source registry must remain active, entitlement-verified and retention-rights-verified. Metric registration, SHA-256 payload hashing and source-record inserts are still separately approval-gated.</p>
          <span>Mutation authorized: NO</span>
        </article>
      </div> : null}
      {canonicalPrerequisitePackage ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Prerequisite materialization dry-run</strong>
          <small>TORNTPHARM_PREREQUISITE_MATERIALIZATION_DRY_RUN_V1</small>
          <p>One non-writing local executor is prepared to deterministically serialize the 4 canonical source payloads, compute 4 SHA-256 hashes, and print the exact metric-definition and source-record SQL that would be inserted.</p>
          <span>Status: PREPARED · NOT EXECUTED · 0 WRITES</span>
        </article>
        <article>
          <strong>Dry-run execution boundary</strong>
          <small>npm run r4n:dry-run:prerequisites</small>
          <p>The executor contains no database connection and no database writer. Its output is review material only; any local prerequisite mutation requires a later separate approval gate.</p>
          <span>Database connection: NO · Mutation authorized: NO</span>
        </article>
      </div> : null}
      {localPrerequisiteMutationProposal ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local prerequisite mutation proposal</strong>
          <small>{localPrerequisiteMutationProposal.proposalVersion}</small>
          <p>Prepared to insert at most {localPrerequisiteMutationProposal.metricDefinitionRowsMaximum} metric definition and {localPrerequisiteMutationProposal.sourceRecordRowsMaximum} immutable source records into local Supabase only. Fundamental observation writes remain zero.</p>
          <span>Status: PREPARED · NOT APPROVED · NOT EXECUTED</span>
        </article>
        <article>
          <strong>Mutation execution boundary</strong>
          <small>npm run r4n:mutate:prerequisites</small>
          <p>The runner refuses execution unless the explicit approval flag is present before database discovery, then enforces local-only DB, source-registry, conflict, idempotency and postcondition guards.</p>
          <span>Execution approved: NO · Fundamental observations: 0</span>
        </article>
      </div> : null}
      {localObservationMutationProposal ? <div className="pharma-persistence-package-grid">
        <article>
          <strong>Local evidence observation proposal</strong>
          <small>{localObservationMutationProposal.proposalVersion}</small>
          <p>Prepared to insert at most {localObservationMutationProposal.observationRowsMaximum} reviewed PHARMA_EXPORT_US_REVENUE_GROWTH observations into local Supabase only: Q1 19%, Q2 26%, Q3 19% and Q4 16%.</p>
          <span>Status: PREPARED · NOT APPROVED · NOT EXECUTED</span>
        </article>
        <article>
          <strong>Observation execution boundary</strong>
          <small>npm run r4n:mutate:observations</small>
          <p>The runner requires a separate approval flag before DB discovery and then rechecks security identity, reviewed assignment, metric contract, immutable source records, conflicts, idempotency and postconditions.</p>
          <span>Execution approved: NO · Production writes: 0</span>
        </article>
      </div> : null}


    </section> : null}

      </div>
    </details>
  </section>
}
