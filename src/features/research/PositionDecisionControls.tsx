import { useEffect, useMemo, useState } from "react"
import { loadPositionDecisionSettings, savePositionDecisionSettings, type PositionDecisionSettings, type UserPortfolioRole } from "../../data/positionDecisionRepository"
import { loadRecommendationHistory, loadRecommendationPolicy, recordRecommendationPreview, type RecommendationPolicy, type RecommendationTrackingRecord, type RecommendationTransitionStatus } from "../../data/recommendationPolicyRepository"
import { displayError } from "../../lib/displayError"
import type { PortfolioRole } from "../portfolio/types"
import { buildRecommendationPreview, recommendationLabel, type RecommendationPreview } from "./sectorRecommendation"
import { useSecurityScoring } from "./useSecurityScoring"
import "./PositionDecisionControls.css"

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

export function PositionDecisionControls({
  portfolioId,
  securityId,
  currentRole,
  fallbackTargetWeight,
  fallbackInvestmentHorizon,
  currency,
  onSaved,
}: {
  readonly portfolioId: string
  readonly securityId: string
  readonly currentRole: PortfolioRole
  readonly fallbackTargetWeight: string | null
  readonly fallbackInvestmentHorizon: string | null
  readonly currency: string
  readonly onSaved?: () => void
}) {
  const fallback = useMemo<PositionDecisionSettings>(() => ({
    id: null,
    portfolioRole: editableRole(currentRole),
    targetWeight: fallbackTargetWeight,
    targetPrice: null,
    stopLossPrice: null,
    investmentHorizon: fallbackInvestmentHorizon,
    targetPriceAlertEnabled: true,
    stopLossAlertEnabled: true,
    updatedAt: null,
  }), [currentRole, fallbackInvestmentHorizon, fallbackTargetWeight])
  const [settings, setSettings] = useState<PositionDecisionSettings>(fallback)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scoring = useSecurityScoring(securityId, null, null)
  const [recommendationPolicy, setRecommendationPolicy] = useState<RecommendationPolicy | null>(null)
  const [recommendation, setRecommendation] = useState<RecommendationPreview | null>(null)
  const [tracking, setTracking] = useState<RecommendationTrackingRecord | null>(null)
  const [history, setHistory] = useState<readonly RecommendationTrackingRecord[]>([])
  const [draft, setDraft] = useState(() => ({
    portfolioRole: fallback.portfolioRole,
    targetWeight: fallback.targetWeight ?? "",
    targetPrice: "",
    stopLossPrice: "",
    investmentHorizon: fallback.investmentHorizon ?? "",
  }))

  useEffect(() => {
    let active = true
    setSettingsLoaded(false)
    void loadPositionDecisionSettings(portfolioId, securityId).then((loaded) => {
      if (!active) return
      const next = loaded ?? fallback
      setSettings(next)
      setDraft({
        portfolioRole: next.portfolioRole,
        targetWeight: next.targetWeight ?? "",
        targetPrice: next.targetPrice ?? "",
        stopLossPrice: next.stopLossPrice ?? "",
        investmentHorizon: next.investmentHorizon ?? "",
      })
      setSettingsLoaded(true)
    }).catch((loadError: unknown) => { if (active) { setError(displayError(loadError)); setSettingsLoaded(true) } })
    return () => { active = false }
  }, [fallback, portfolioId, securityId])

  useEffect(() => {
    let active = true
    const profileCode = scoring.data?.profileCode
    if (!profileCode) {
      setRecommendationPolicy(null)
      setRecommendation(null)
      return () => { active = false }
    }
    void loadRecommendationPolicy(profileCode).then((policy) => {
      if (!active) return
      setRecommendationPolicy(policy)
    }).catch(() => { if (active) setRecommendationPolicy(null) })
    return () => { active = false }
  }, [scoring.data?.profileCode])

  useEffect(() => {
    if (!scoring.data || !recommendationPolicy) {
      setRecommendation(null)
      return
    }
    setRecommendation(buildRecommendationPreview(scoring.data, recommendationPolicy))
  }, [recommendationPolicy, scoring.data])

  useEffect(() => {
    let active = true
    if (!settingsLoaded || !scoring.data || !recommendationPolicy || !recommendation || recommendation.suggestedRole === "INSUFFICIENT") {
      return () => { active = false }
    }
    const evaluationKey = JSON.stringify({
      profile: scoring.data.profileCode,
      policy: recommendationPolicy.policyVersion,
      asOf: scoring.data.asOfDate,
      overall: recommendation.overallScore,
      ready: recommendation.scoreReadyCoverage,
      confidence: scoring.data.evidenceConfidence,
      dimensions: scoring.data.dimensions.map((dimension) => ({
        code: dimension.dimensionCode,
        score: dimension.rawScore,
        ready: dimension.scoreReadyCoverage,
        signals: dimension.signals?.map((signal) => [signal.inputCode, signal.value, signal.normalizedScore]) ?? [],
      })),
    })
    void recordRecommendationPreview({
      portfolioId,
      securityId,
      profileCode: scoring.data.profileCode,
      policyVersion: recommendationPolicy.policyVersion,
      evaluationKey,
      overallScore: recommendation.overallScore,
      scoreReadyCoverage: recommendation.scoreReadyCoverage,
      evidenceConfidence: scoring.data.evidenceConfidence,
      suggestedRole: recommendation.suggestedRole,
      currentUserRole: settings.portfolioRole,
      currentWeight: null,
      rationale: { reason: recommendation.reason, cautions: recommendation.cautions, sectorProfile: recommendation.sectorProfile },
    }).then(async (record) => {
      if (!active) return
      setTracking(record)
      const rows = await loadRecommendationHistory(portfolioId, securityId)
      if (active) setHistory(rows)
    }).catch(() => { if (active) setTracking(null) })
    return () => { active = false }
  }, [portfolioId, recommendation, recommendationPolicy, scoring.data, securityId, settings.portfolioRole, settingsLoaded])

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const saved = await savePositionDecisionSettings(portfolioId, securityId, {
        portfolioRole: draft.portfolioRole,
        targetWeight: draft.targetWeight.trim() || null,
        targetPrice: draft.targetPrice.trim() || null,
        stopLossPrice: draft.stopLossPrice.trim() || null,
        investmentHorizon: draft.investmentHorizon.trim() || null,
        targetPriceAlertEnabled: settings.targetPriceAlertEnabled,
        stopLossAlertEnabled: settings.stopLossAlertEnabled,
      })
      setSettings(saved)
      setEditing(false)
      onSaved?.()
    } catch (saveError: unknown) {
      setError(displayError(saveError))
    } finally {
      setSaving(false)
    }
  }

  const suggestionDetail = recommendation
    ? `${recommendation.sectorProfile} · ${recommendation.policyStatus.toLocaleLowerCase()} policy`
    : scoring.isLoading ? "Evaluating sector-specific profile…" : "No validated sector-specific recommendation policy yet."
  const confirmationTarget = tracking?.changeSignal === "DOWNGRADE"
    ? recommendationPolicy?.persistenceRules.downgradeConfirmations
    : recommendationPolicy?.persistenceRules.upgradeConfirmations ?? 2

  return <section className="position-controls" aria-label="Position controls">
    <div className="position-controls-heading">
      <div>
        <span>Decision controls</span>
        <strong>Your saved investment plan and PortfolioAI advisory</strong>
        <small>Your plan remains user-controlled. PortfolioAI recommendations are sector-aware, read-only and never overwrite your decisions.</small>
      </div>
      <button type="button" className="button button-secondary position-edit-button" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel" : "Edit plan"}</button>
    </div>

    <div className="decision-workspace">
      <section className="user-plan-panel" aria-labelledby="user-plan-title">
        <header className="decision-panel-heading">
          <span className="decision-panel-icon" aria-hidden="true">◎</span>
          <div><h3 id="user-plan-title">Your investment plan</h3><p>These values are user-controlled and never overwritten by PortfolioAI.</p></div>
        </header>
        <div className="user-plan-grid">
          <article><span>Target price</span><strong>{money(settings.targetPrice, currency)}</strong><small>{settings.targetPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
          <article><span>Stop loss</span><strong>{money(settings.stopLossPrice, currency)}</strong><small>{settings.stopLossPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
          <article><span>Your selected role</span><strong>{title(settings.portfolioRole)}</strong><small>Manual portfolio decision</small></article>
          <article><span>Target weight</span><strong>{percent(settings.targetWeight)}</strong><small>Portfolio allocation guide</small></article>
          <article><span>Investment horizon</span><strong>{settings.investmentHorizon || "Not set"}</strong><small>Your intended holding horizon</small></article>
        </div>
      </section>

      <section className="portfolioai-advisory" aria-labelledby="portfolioai-advisory-title">
        <header className="advisory-heading">
          <div className="advisory-title-wrap"><span className="decision-panel-icon advisory-icon" aria-hidden="true">✦</span><div><h3 id="portfolioai-advisory-title">PortfolioAI suggestion</h3><p>Sector-aware research recommendation preview.</p></div></div>
          {tracking ? <span className={`recommendation-transition ${transitionClass(tracking.transitionStatus)}`}>{transitionLabel(tracking.transitionStatus)}</span> : null}
        </header>

        <div className="advisory-primary">
          <strong>{recommendation ? recommendationLabel(recommendation.suggestedRole) : "Pending"}</strong>
          <small>{suggestionDetail}</small>
          {recommendation?.cautions.length ? <div className="advisory-cautions" aria-label="Recommendation cautions">{recommendation.cautions.map((caution) => <span key={caution}>{caution}</span>)}</div> : null}
        </div>

        {tracking ? <div className="advisory-tracking-summary">
          <div><span>Tracking status</span><strong>{tracking.persistenceCount} consecutive qualifying evaluation{tracking.persistenceCount === 1 ? "" : "s"} recorded</strong><small>Role changes require {confirmationTarget} confirmations.</small></div>
          <span aria-hidden="true">›</span>
        </div> : null}

        <div className="advisory-footer">
          <div><strong>Read-only pilot · does not change your role</strong><small>This is a research preview. Your selected role, holdings, target weight, target price and stop loss remain under your control.</small></div>
          {history.length ? <details className="recommendation-history"><summary>Tracking history</summary><div>{history.map((item) => <div key={item.id}><span className={`history-dot ${transitionClass(item.transitionStatus)}`} aria-hidden="true" /><span>{recommendationLabel(item.suggestedRole as RecommendationPreview["suggestedRole"])}</span><small>{transitionLabel(item.transitionStatus)} · {dateLabel(item.createdAt)}</small></div>)}</div></details> : null}
        </div>
      </section>
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
