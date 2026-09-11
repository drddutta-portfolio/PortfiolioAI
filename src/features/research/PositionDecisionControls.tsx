import { useEffect, useMemo, useState } from "react"
import { loadPositionDecisionSettings, savePositionDecisionSettings, type PositionDecisionSettings, type UserPortfolioRole } from "../../data/positionDecisionRepository"
import { displayError } from "../../lib/displayError"
import type { PortfolioRole } from "../portfolio/types"
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
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState(() => ({
    portfolioRole: fallback.portfolioRole,
    targetWeight: fallback.targetWeight ?? "",
    targetPrice: "",
    stopLossPrice: "",
    investmentHorizon: fallback.investmentHorizon ?? "",
  }))

  useEffect(() => {
    let active = true
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
    }).catch((loadError: unknown) => { if (active) setError(displayError(loadError)) })
    return () => { active = false }
  }, [fallback, portfolioId, securityId])

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

  return <section className="position-controls" aria-label="Position controls">
    <div className="position-controls-heading">
      <div><span>Decision controls</span><strong>Your investment plan</strong><small>These values are user-controlled and never overwritten by PortfolioAI.</small></div>
      <button type="button" className="button button-secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel" : "Edit plan"}</button>
    </div>
    <div className="position-control-grid">
      <article><span>Target price</span><strong>{money(settings.targetPrice, currency)}</strong><small>{settings.targetPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
      <article><span>Stop loss</span><strong>{money(settings.stopLossPrice, currency)}</strong><small>{settings.stopLossPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
      <article><span>Your selected role</span><strong>{title(settings.portfolioRole)}</strong><small>Manual portfolio decision</small></article>
      <article><span>Target weight</span><strong>{percent(settings.targetWeight)}</strong><small>Portfolio allocation guide</small></article>
      <article><span>Investment horizon</span><strong>{settings.investmentHorizon || "Not set"}</strong><small>Your intended holding horizon</small></article>
      <article className="portfolioai-suggestion"><span>PortfolioAI suggestion</span><strong>Pending</strong><small>Recommendation layer will remain separate from your selected role.</small></article>
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
    <p className="position-alert-note">Target and stop-loss values are now stored in the database with alert flags so a future notification service can notify you when either level is reached.</p>
  </section>
}
