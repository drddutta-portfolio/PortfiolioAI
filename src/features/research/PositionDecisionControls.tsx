import { useEffect, useMemo, useState } from "react"
import { loadPositionDecisionSettings, savePositionDecisionSettings, type PositionDecisionSettings, type UserPortfolioRole } from "../../data/positionDecisionRepository"
import { loadPortfolioProfileExposure, loadRecommendationHistory, loadRecommendationPolicy, recordRecommendationPreview, type PortfolioProfileExposure, type RecommendationPolicy, type RecommendationTrackingRecord, type RecommendationTransitionStatus } from "../../data/recommendationPolicyRepository"
import { displayError } from "../../lib/displayError"
import type { PortfolioRole } from "../portfolio/types"
import { buildActionBiasPreview } from "./actionRecommendation"
import { RecommendationInterpretationPanel } from "./RecommendationInterpretationPanel"
import { buildRecommendationPreview, recommendationLabel, type RecommendationPreview } from "./sectorRecommendation"
import { buildSuggestedWeightPreview, formatWeightRange } from "./weightRecommendation"
import { useSecurityScoring } from "./useSecurityScoring"
import "./PositionDecisionControls.css"
import "./PositionDecisionControlsPolish.css"

const ROLES: readonly UserPortfolioRole[] = ["CORE", "SATELLITE", "THEMATIC", "ETF", "OTHER"]

function editableRole(value: PortfolioRole): UserPortfolioRole {
  return value === "CORE" || value === "SATELLITE" || value === "THEMATIC" || value === "ETF" || value === "OTHER" ? value : "OTHER"
}
function money(value: string | null, currency: string) {
  if (!value) return "Not set"
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(parsed)
}
function percent(value: string | null) { return value ? `${value}%` : "Not set" }
function title(value: string) { return value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase()) }
function transitionLabel(value: RecommendationTransitionStatus) {
  switch (value) {
    case "CONFIRMED_UPGRADE": return "Upgrade confirmed"
    case "PENDING_UPGRADE": return "Upgrade forming"
    case "CONFIRMED_DOWNGRADE": return "Downgrade confirmed"
    case "PENDING_DOWNGRADE": return "Downgrade watch"
    case "EVIDENCE_PENDING": return "Evidence pending"
    case "STABLE": return "Stable"
    default: return "Tracking baseline"
  }
}
function transitionClass(value: RecommendationTransitionStatus) { return `transition-${value.toLocaleLowerCase().replaceAll("_", "-")}` }
function dateLabel(value: string) { return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) }
function rangeLabel(min: number | null, max: number | null) {
  if (min === null || max === null) return null
  return min === max ? `${min}%` : `${min}–${max}%`
}

export function PositionDecisionControls({
  portfolioId,
  securityId,
  currentRole,
  currentWeight,
  fallbackTargetWeight,
  fallbackInvestmentHorizon,
  currency,
  onSaved,
  canonicalResearchProfileCode,
}: {
  readonly portfolioId: string
  readonly securityId: string
  readonly currentRole: PortfolioRole
  readonly currentWeight?: string | null
  readonly fallbackTargetWeight: string | null
  readonly fallbackInvestmentHorizon: string | null
  readonly currency: string
  readonly onSaved?: () => void
  readonly canonicalResearchProfileCode?: string | null
}) {
  const fallback = useMemo<PositionDecisionSettings>(() => ({
    id: null, portfolioRole: editableRole(currentRole), targetWeight: fallbackTargetWeight, targetPrice: null, stopLossPrice: null,
    investmentHorizon: fallbackInvestmentHorizon, targetPriceAlertEnabled: true, stopLossAlertEnabled: true, updatedAt: null,
  }), [currentRole, fallbackInvestmentHorizon, fallbackTargetWeight])
  const [settings, setSettings] = useState<PositionDecisionSettings>(fallback)
  const [settingsLoadedSecurityId, setSettingsLoadedSecurityId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scoring = useSecurityScoring(securityId, null, null)
  const [recommendationPolicyState, setRecommendationPolicyState] = useState<{ readonly profileCode: string; readonly policy: RecommendationPolicy | null } | null>(null)
  const [profileExposureState, setProfileExposureState] = useState<{ readonly key: string; readonly exposure: PortfolioProfileExposure | null } | null>(null)
  const [tracking, setTracking] = useState<RecommendationTrackingRecord | null>(null)
  const [history, setHistory] = useState<readonly RecommendationTrackingRecord[]>([])
  const [draft, setDraft] = useState(() => ({ portfolioRole: fallback.portfolioRole, targetWeight: fallback.targetWeight ?? "", targetPrice: "", stopLossPrice: "", investmentHorizon: fallback.investmentHorizon ?? "" }))

  useEffect(() => {
    let active = true
    void loadPositionDecisionSettings(portfolioId, securityId).then((loaded) => {
      if (!active) return
      const next = loaded ?? fallback
      setSettings(next)
      setDraft({ portfolioRole: next.portfolioRole, targetWeight: next.targetWeight ?? "", targetPrice: next.targetPrice ?? "", stopLossPrice: next.stopLossPrice ?? "", investmentHorizon: next.investmentHorizon ?? "" })
      setSettingsLoadedSecurityId(securityId)
    }).catch((loadError: unknown) => { if (active) { setError(displayError(loadError)); setSettingsLoadedSecurityId(securityId) } })
    return () => { active = false }
  }, [fallback, portfolioId, securityId])

  useEffect(() => {
    let active = true
    const profileCode = scoring.data?.profileCode
    if (!profileCode) return () => { active = false }
    void loadRecommendationPolicy(profileCode).then((policy) => { if (active) setRecommendationPolicyState({ profileCode, policy }) }).catch(() => { if (active) setRecommendationPolicyState({ profileCode, policy: null }) })
    return () => { active = false }
  }, [scoring.data?.profileCode])

  useEffect(() => {
    let active = true
    const profileCode = scoring.data?.profileCode
    if (!profileCode) return () => { active = false }
    const key = `${portfolioId}:${securityId}:${profileCode}`
    void loadPortfolioProfileExposure(portfolioId, securityId, profileCode).then((exposure) => { if (active) setProfileExposureState({ key, exposure }) }).catch(() => { if (active) setProfileExposureState({ key, exposure: null }) })
    return () => { active = false }
  }, [portfolioId, scoring.data?.profileCode, securityId])

  useEffect(() => {
    let active = true
    void loadRecommendationHistory(portfolioId, securityId).then((rows) => { if (!active) return; setHistory(rows); if (rows.length) setTracking(rows[0] ?? null) }).catch(() => { /* optional */ })
    return () => { active = false }
  }, [portfolioId, securityId])

  const currentProfileCode = scoring.data?.profileCode ?? null
  const scoringAuthorityMatchesResearch = !canonicalResearchProfileCode || currentProfileCode === canonicalResearchProfileCode
  const recommendationPolicy = scoringAuthorityMatchesResearch && recommendationPolicyState?.profileCode === currentProfileCode ? recommendationPolicyState.policy : null
  const exposureKey = currentProfileCode ? `${portfolioId}:${securityId}:${currentProfileCode}` : null
  const profileExposure = profileExposureState?.key === exposureKey ? profileExposureState.exposure : null
  const recommendation = useMemo(() => scoringAuthorityMatchesResearch && scoring.data && recommendationPolicy ? buildRecommendationPreview(scoring.data, recommendationPolicy) : null, [recommendationPolicy, scoring.data, scoringAuthorityMatchesResearch])
  const settingsLoaded = settingsLoadedSecurityId === securityId

  const fallbackCurrentWeight = currentWeight == null ? null : Number(currentWeight)
  const safeFallbackCurrentWeight = fallbackCurrentWeight !== null && Number.isFinite(fallbackCurrentWeight) ? fallbackCurrentWeight : null
  const effectiveCurrentWeight = profileExposure?.currentWeight ?? safeFallbackCurrentWeight
  const weightPreview = useMemo(() => {
    if (!scoring.data || !recommendationPolicy || !recommendation) return null
    return buildSuggestedWeightPreview({ recommendation, snapshot: scoring.data, policy: recommendationPolicy, currentWeight: effectiveCurrentWeight, userTargetWeight: settings.targetWeight, exposure: profileExposure })
  }, [effectiveCurrentWeight, profileExposure, recommendation, recommendationPolicy, scoring.data, settings.targetWeight])
  const actionPreview = useMemo(() => recommendation ? buildActionBiasPreview({ recommendation, weight: weightPreview, tracking }) : null, [recommendation, tracking, weightPreview])

  useEffect(() => {
    let active = true
    if (!settingsLoaded || !scoringAuthorityMatchesResearch || !scoring.data || !recommendationPolicy || !recommendation || !actionPreview || recommendation.suggestedRole === "INSUFFICIENT") return () => { active = false }
    const evaluationKey = JSON.stringify({
      profile: scoring.data.profileCode, policy: recommendationPolicy.policyVersion, asOf: scoring.data.asOfDate, overall: recommendation.overallScore,
      ready: recommendation.scoreReadyCoverage, confidence: scoring.data.evidenceConfidence,
      dimensions: scoring.data.dimensions.map((dimension) => ({ code: dimension.dimensionCode, score: dimension.rawScore, ready: dimension.scoreReadyCoverage, signals: dimension.signals?.map((signal) => [signal.inputCode, signal.value, signal.normalizedScore]) ?? [] })),
    })
    void recordRecommendationPreview({
      portfolioId, securityId, profileCode: scoring.data.profileCode, policyVersion: recommendationPolicy.policyVersion, evaluationKey,
      overallScore: recommendation.overallScore, scoreReadyCoverage: recommendation.scoreReadyCoverage, evidenceConfidence: scoring.data.evidenceConfidence,
      suggestedRole: recommendation.suggestedRole, actionBias: actionPreview.actionBias, currentUserRole: settings.portfolioRole, currentWeight: effectiveCurrentWeight,
      suggestedWeightMin: weightPreview?.min ?? null, suggestedWeightMax: weightPreview?.max ?? null,
      rationale: {
        reason: recommendation.reason,
        cautions: recommendation.cautions,
        sectorProfile: recommendation.sectorProfile,
        actionHeadline: actionPreview.headline,
        actionReasons: actionPreview.reasons,
        weightReasons: weightPreview?.reasons ?? [],
        dimensions: scoring.data.dimensions.map((dimension) => ({
          code: dimension.dimensionCode,
          score: dimension.rawScore,
          evidenceCoverage: dimension.evidenceCoverage,
          scoreReadyCoverage: dimension.scoreReadyCoverage,
          confidence: dimension.confidence,
          heatState: dimension.heatState,
        })),
      },
    }).then(async (record) => {
      if (!active) return
      setTracking((previous) => previous && previous.id === record.id && previous.transitionStatus === record.transitionStatus && previous.persistenceCount === record.persistenceCount && previous.actionBias === record.actionBias && previous.suggestedWeightMin === record.suggestedWeightMin && previous.suggestedWeightMax === record.suggestedWeightMax ? previous : record)
      const rows = await loadRecommendationHistory(portfolioId, securityId)
      if (active) setHistory(rows)
    }).catch(() => { /* preserve previous tracking/history */ })
    return () => { active = false }
  }, [actionPreview, effectiveCurrentWeight, portfolioId, recommendation, recommendationPolicy, scoring.data, scoringAuthorityMatchesResearch, securityId, settings.portfolioRole, settingsLoaded, weightPreview])

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const saved = await savePositionDecisionSettings(portfolioId, securityId, {
        portfolioRole: draft.portfolioRole, targetWeight: draft.targetWeight.trim() || null, targetPrice: draft.targetPrice.trim() || null,
        stopLossPrice: draft.stopLossPrice.trim() || null, investmentHorizon: draft.investmentHorizon.trim() || null,
        targetPriceAlertEnabled: settings.targetPriceAlertEnabled, stopLossAlertEnabled: settings.stopLossAlertEnabled,
      })
      setSettings(saved); setEditing(false); onSaved?.()
    } catch (saveError: unknown) { setError(displayError(saveError)) } finally { setSaving(false) }
  }

  const suggestionDetail = !scoringAuthorityMatchesResearch && canonicalResearchProfileCode
    ? `${canonicalResearchProfileCode} research active · numeric scoring not currently computable`
    : recommendation ? `${recommendation.sectorProfile} · ${recommendation.policyStatus.toLocaleLowerCase()} policy` : scoring.isLoading ? "Evaluating sector-specific profile…" : recommendationPolicy ? "Recommendation evidence is being evaluated." : "Recommendation methodology is not yet available for this research profile."
  const confirmationTarget = tracking?.changeSignal === "DOWNGRADE" ? recommendationPolicy?.persistenceRules.downgradeConfirmations : recommendationPolicy?.persistenceRules.upgradeConfirmations ?? 2
  const primaryCaution = recommendation?.cautions[0] ?? null
  const evidenceConfidenceValue = scoring.data?.evidenceConfidence
  const evidenceConfidence = typeof evidenceConfidenceValue === "number" && Number.isFinite(evidenceConfidenceValue) ? `${Math.round(evidenceConfidenceValue)}%` : "Pending"
  const recommendationUnavailable = !recommendation && !scoring.isLoading
  const unavailableProfile = !scoringAuthorityMatchesResearch && canonicalResearchProfileCode
    ? `${canonicalResearchProfileCode} canonical research profile`
    : scoring.data?.profileName ?? "this research profile"

  return <section className="position-controls" aria-label="Position controls">
    <div className="research-decision-layout">
      <div className="research-decision-main">
        <div className="position-controls-heading"><div><span>Decision controls</span><strong>Decision Workspace</strong><small>Your saved investment plan and PortfolioAI advisory stay separate. PortfolioAI is read-only and never overwrites your decisions.</small></div><button type="button" className="button button-secondary position-edit-button" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel" : "Edit plan"}</button></div>

        <div className="decision-workspace">
          <section className="user-plan-panel" aria-labelledby="user-plan-title">
            <header className="decision-panel-heading"><span className="decision-panel-icon" aria-hidden="true">◎</span><div><h3 id="user-plan-title">Your investment plan</h3><p>These values are user-controlled and never overwritten by PortfolioAI.</p></div></header>
            <div className="user-plan-grid">
              <article><span>Target price</span><strong>{money(settings.targetPrice, currency)}</strong><small>{settings.targetPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
              <article><span>Stop loss</span><strong>{money(settings.stopLossPrice, currency)}</strong><small>{settings.stopLossPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
              <article><span>Your selected role</span><strong>{title(settings.portfolioRole)}</strong><small>Manual portfolio decision</small></article>
              <article><span>Target weight</span><strong>{percent(settings.targetWeight)}</strong><small>Portfolio allocation guide</small></article>
              <article><span>Investment horizon</span><strong>{settings.investmentHorizon || "Not set"}</strong><small>Your intended holding horizon</small></article>
            </div>
          </section>

          <section className="portfolioai-advisory" aria-labelledby="portfolioai-advisory-title">
            <header className="advisory-heading"><div className="advisory-title-wrap"><span className="decision-panel-icon advisory-icon" aria-hidden="true">✦</span><div><h3 id="portfolioai-advisory-title">PortfolioAI suggestion</h3><p>Sector-aware research recommendation preview.</p></div></div>{tracking ? <span className={`recommendation-transition ${transitionClass(tracking.transitionStatus)}`}>{transitionLabel(tracking.transitionStatus)}</span> : recommendationUnavailable ? <span className="recommendation-transition transition-evidence-pending">Not ready</span> : null}</header>
            <div className="advisory-primary"><strong>{recommendation ? recommendationLabel(recommendation.suggestedRole) : recommendationUnavailable ? "Recommendation pending" : "Evaluating…"}</strong><small>{recommendationUnavailable ? `${unavailableProfile} · Awaiting validated profile-specific recommendation.` : suggestionDetail}</small>{recommendation?.cautions.length ? <div className="advisory-cautions" aria-label="Recommendation cautions">{recommendation.cautions.map((caution) => <span key={caution}>{caution}</span>)}</div> : null}</div>

            {actionPreview ? <section className={`action-bias action-${actionPreview.tone.toLocaleLowerCase()}`} aria-label="PortfolioAI action bias">
              <div className="action-bias-main"><span>Action bias</span><strong>{actionPreview.label}</strong><small>{actionPreview.headline}</small></div>
              <details><summary>Why this action?</summary><ul>{actionPreview.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>
            </section> : recommendationUnavailable ? <section className="action-bias action-neutral" aria-label="PortfolioAI action bias"><div className="action-bias-main"><span>Action bias</span><strong>Pending</strong><small>Awaiting approved recommendation methodology and score-ready evidence.</small></div><details><summary>Why unavailable?</summary><ul><li>No action is inferred until a validated recommendation is available.</li></ul></details></section> : null}

            {weightPreview ? <section className={`weight-preview weight-${weightPreview.position.toLocaleLowerCase().replaceAll("_", "-")}`} aria-label="PortfolioAI suggested weight range">
              <div className="weight-preview-main"><span>Suggested weight range</span><strong>{formatWeightRange(weightPreview)}</strong><small>{weightPreview.label}</small></div>
              <div className="weight-preview-context"><span><b>Current</b>{weightPreview.currentWeight === null ? "Unavailable" : `${weightPreview.currentWeight.toFixed(2)}%`}</span><span><b>Your target</b>{weightPreview.userTargetWeight === null ? "Not set" : `${weightPreview.userTargetWeight}%`}</span>{weightPreview.profileExposure !== null ? <span><b>Known {recommendation?.sectorProfile ?? "profile"} exposure</b>{weightPreview.profileExposure.toFixed(2)}%</span> : <span><b>Portfolio context</b>Classification coverage pending</span>}</div>
              <details className="weight-rationale"><summary>Why this range?</summary><ul>{weightPreview.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul></details>
            </section> : recommendationUnavailable ? <section className="weight-preview weight-unavailable" aria-label="PortfolioAI suggested weight range"><div className="weight-preview-main"><span>Suggested weight range</span><strong>Not available</strong><small>Awaiting approved allocation policy</small></div><div className="weight-preview-context"><span><b>Current</b>{effectiveCurrentWeight === null ? "Unavailable" : `${effectiveCurrentWeight.toFixed(2)}%`}</span><span><b>Your target</b>{settings.targetWeight === null ? "Not set" : `${settings.targetWeight}%`}</span><span><b>Portfolio context</b>{currentRole === "UNCLASSIFIED" ? "Unclassified" : title(settings.portfolioRole)}</span></div><details className="weight-rationale"><summary>Why unavailable?</summary><ul><li>No suggested range is produced until an approved allocation policy is available.</li></ul></details></section> : null}

            {tracking ? <div className="advisory-tracking-summary"><div><span>Tracking status</span><strong>{tracking.persistenceCount} consecutive qualifying evaluation{tracking.persistenceCount === 1 ? "" : "s"} recorded</strong><small>Role changes require {confirmationTarget} confirmations.</small></div><span aria-hidden="true">›</span></div> : null}
            <div className="advisory-footer"><div><strong>Read-only pilot · does not change your role or weight</strong><small>This is a research preview. Your selected role, holdings, target weight, target price and stop loss remain under your control.</small></div>{history.length ? <details className="recommendation-history"><summary>Tracking history</summary><div>{history.map((item) => <div key={item.id}><span className={`history-dot ${transitionClass(item.transitionStatus)}`} aria-hidden="true" /><span>{recommendationLabel(item.suggestedRole as RecommendationPreview["suggestedRole"])}</span><small>{item.actionBias ? `${title(item.actionBias)} · ` : ""}{rangeLabel(item.suggestedWeightMin, item.suggestedWeightMax) ? `${rangeLabel(item.suggestedWeightMin, item.suggestedWeightMax)} · ` : ""}{transitionLabel(item.transitionStatus)} · {dateLabel(item.createdAt)}</small></div>)}</div></details> : <span className="tracking-history-empty">Tracking history will appear after the first qualifying evaluation.</span>}</div>
          </section>
        </div>

        <RecommendationInterpretationPanel portfolioId={portfolioId} securityId={securityId} enabled={Boolean(tracking && recommendation && recommendation.suggestedRole !== "INSUFFICIENT")} />
      </div>

      <aside className={`key-insights-panel${recommendationUnavailable ? " key-insights-unavailable" : ""}`} aria-labelledby="key-insights-title">
        <header><span className="key-insights-icon" aria-hidden="true">▥</span><div><h3 id="key-insights-title">Key Insights</h3><p>Quick view of the most important research signals.</p></div></header>
        <div className="key-insight-list">
          <article><span className="key-insight-badge" aria-hidden="true">☆</span><div><small>Role</small><strong>{recommendation ? recommendationLabel(recommendation.suggestedRole) : "Not yet available"}</strong><p>{recommendation ? suggestionDetail : `Awaiting ${unavailableProfile} recommendation.`}</p></div></article>
          <article><span className="key-insight-badge" aria-hidden="true">◎</span><div><small>Action bias</small><strong>{actionPreview?.label ?? "Not yet available"}</strong><p>{actionPreview?.headline ?? "Awaiting recommendation policy."}</p></div></article>
          <article><span className="key-insight-badge" aria-hidden="true">◔</span><div><small>Suggested weight range</small><strong>{weightPreview ? formatWeightRange(weightPreview) : "Not yet available"}</strong><p>{weightPreview?.label ?? "Awaiting allocation policy."}</p></div></article>
          <article className={primaryCaution ? "key-insight-caution" : undefined}><span className="key-insight-badge" aria-hidden="true">↗</span><div><small>Primary caution</small><strong>{primaryCaution ? "Watch" : "No validated caution"}</strong><p>{primaryCaution ?? "No recommendation caution is available yet."}</p></div></article>
          <article><span className="key-insight-badge" aria-hidden="true">✓</span><div><small>Tracking status</small><strong>{tracking ? `${tracking.persistenceCount} qualifying evaluation${tracking.persistenceCount === 1 ? "" : "s"}` : "Not started"}</strong><p>{tracking ? `Role changes require ${confirmationTarget} confirmations.` : "Begins after a qualifying evaluation."}</p></div></article>
          <article><span className="key-insight-badge" aria-hidden="true">▤</span><div><small>Evidence confidence</small><strong>{evidenceConfidence}</strong><p>Confidence is reported from the current deterministic scoring snapshot.</p></div></article>
        </div>
        <div className="key-insights-readonly"><strong>Read-only advisory</strong><p>Your selected role, holdings, target weight, target price and stop loss remain under your control.</p>{history.length ? <details className="recommendation-history key-insights-history"><summary>Tracking history</summary><div>{history.map((item) => <div key={item.id}><span className={`history-dot ${transitionClass(item.transitionStatus)}`} aria-hidden="true" /><span>{recommendationLabel(item.suggestedRole as RecommendationPreview["suggestedRole"])}</span><small>{item.actionBias ? `${title(item.actionBias)} · ` : ""}{rangeLabel(item.suggestedWeightMin, item.suggestedWeightMax) ? `${rangeLabel(item.suggestedWeightMin, item.suggestedWeightMax)} · ` : ""}{transitionLabel(item.transitionStatus)} · {dateLabel(item.createdAt)}</small></div>)}</div></details> : null}</div>
      </aside>
    </div>

    {editing ? <div className="position-control-editor">
      <label><span>Target price</span><input inputMode="decimal" type="number" min="0" step="0.01" value={draft.targetPrice} onChange={(event) => setDraft((value) => ({ ...value, targetPrice: event.target.value }))} placeholder="e.g. 900" /></label>
      <label><span>Stop loss</span><input inputMode="decimal" type="number" min="0" step="0.01" value={draft.stopLossPrice} onChange={(event) => setDraft((value) => ({ ...value, stopLossPrice: event.target.value }))} placeholder="e.g. 620" /></label>
      <label><span>Portfolio role</span><select value={draft.portfolioRole} onChange={(event) => setDraft((value) => ({ ...value, portfolioRole: event.target.value as UserPortfolioRole }))}>{ROLES.map((role) => <option key={role} value={role}>{title(role)}</option>)}</select></label>
      <label><span>Target weight %</span><input inputMode="decimal" type="number" min="0" max="100" step="0.01" value={draft.targetWeight} onChange={(event) => setDraft((value) => ({ ...value, targetWeight: event.target.value }))} placeholder="e.g. 3" /></label>
      <label className="horizon-field"><span>Investment horizon</span><input type="text" value={draft.investmentHorizon} onChange={(event) => setDraft((value) => ({ ...value, investmentHorizon: event.target.value }))} placeholder="e.g. 12–18 months" /></label>
      <button type="button" className="button button-primary" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save plan"}</button>
    </div> : null}
    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
    <p className="position-alert-note">Target and stop-loss values are stored in the database with alert flags so a future notification service can notify you when either level is reached.</p>
  </section>
}
