import { useMemo } from "react"
import "./PharmaResearchWorkspacePanel.css"
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
  </section>
}
