import { useEffect, useMemo, useState } from "react"
import {
  loadPositionDecisionSettings,
  savePositionDecisionSettings,
  type PositionDecisionSettings,
  type UserPortfolioRole,
} from "../../data/positionDecisionRepository"
import { displayError } from "../../lib/displayError"
import type { PortfolioRole } from "../portfolio/types"
import "./PositionDecisionControls.css"
import "./PositionDecisionControlsPolish.css"

const ROLES: readonly UserPortfolioRole[] = ["CORE", "SATELLITE", "THEMATIC", "ETF", "OTHER"]

function editableRole(value: PortfolioRole): UserPortfolioRole {
  return value === "CORE" || value === "SATELLITE" || value === "THEMATIC" || value === "ETF" || value === "OTHER"
    ? value
    : "OTHER"
}

function money(value: string | null, currency: string) {
  if (!value) return "Not set"
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return value
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(parsed)
}

function percent(value: string | null) {
  return value ? `${value}%` : "Not set"
}

function roleLabel(value: UserPortfolioRole) {
  return value.toLowerCase().replace(/(^|\s)\S/gu, (match) => match.toUpperCase())
}

export function PositionDecisionControls({
  portfolioId,
  securityId,
  currentRole,
  currentWeight = null,
  fallbackTargetWeight,
  fallbackInvestmentHorizon,
  currency,
  onSaved,
}: {
  readonly portfolioId: string
  readonly securityId: string
  readonly currentRole: PortfolioRole
  readonly currentWeight?: string | null
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
  const [draft, setDraft] = useState(() => ({
    portfolioRole: fallback.portfolioRole,
    targetWeight: fallback.targetWeight ?? "",
    targetPrice: "",
    stopLossPrice: "",
    investmentHorizon: fallback.investmentHorizon ?? "",
  }))
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    void loadPositionDecisionSettings(portfolioId, securityId)
      .then((loaded) => {
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
      })
      .catch((reason: unknown) => {
        if (active) setError(displayError(reason))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [fallback, portfolioId, securityId])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const next = await savePositionDecisionSettings(portfolioId, securityId, {
        portfolioRole: draft.portfolioRole,
        targetWeight: draft.targetWeight.trim() || null,
        targetPrice: draft.targetPrice.trim() || null,
        stopLossPrice: draft.stopLossPrice.trim() || null,
        investmentHorizon: draft.investmentHorizon.trim() || null,
        targetPriceAlertEnabled: settings.targetPriceAlertEnabled,
        stopLossAlertEnabled: settings.stopLossAlertEnabled,
      })
      setSettings(next)
      setEditing(false)
      onSaved?.()
    } catch (reason: unknown) {
      setError(displayError(reason))
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setDraft({
      portfolioRole: settings.portfolioRole,
      targetWeight: settings.targetWeight ?? "",
      targetPrice: settings.targetPrice ?? "",
      stopLossPrice: settings.stopLossPrice ?? "",
      investmentHorizon: settings.investmentHorizon ?? "",
    })
    setEditing(false)
    setError(null)
  }

  if (loading) {
    return <section className="position-decision-panel"><p className="assessment-note">Loading your position settings…</p></section>
  }

  return <section className="position-decision-panel" aria-label="Owner position settings">
    <div className="position-decision-heading">
      <div>
        <span>Your investment plan</span>
        <strong>Owner-controlled plan</strong>
        <small>These values are user-controlled and never overwritten by PortfolioAI.</small>
      </div>
      {!editing
        ? <button className="button button-secondary button-compact" type="button" onClick={() => setEditing(true)}>Edit plan</button>
        : null}
    </div>

    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}

    {!editing ? <>
      <div className="position-decision-summary">
        <article><span>Target price</span><strong>{money(settings.targetPrice, currency)}</strong><small>{settings.targetPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
        <article><span>Stop loss</span><strong>{money(settings.stopLossPrice, currency)}</strong><small>{settings.stopLossPrice ? "Saved · alert-ready" : "Not configured"}</small></article>
        <article><span>Target weight</span><strong>{percent(settings.targetWeight)}</strong><small>Portfolio allocation guide</small></article>
        <article><span>Investment horizon</span><strong>{settings.investmentHorizon ?? "Not set"}</strong><small>Your intended holding horizon</small></article>
      </div>
      <div className="position-decision-role">
        <span>Your selected role</span>
        <strong>{roleLabel(settings.portfolioRole)}</strong>
        <small>Manual portfolio decision · current weight {percent(currentWeight)}</small>
      </div>
    </> : <div className="position-decision-editor">
      <label>
        <span>Portfolio role</span>
        <select value={draft.portfolioRole} onChange={(event) => setDraft((value) => ({ ...value, portfolioRole: event.target.value as UserPortfolioRole }))}>
          {ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
        </select>
      </label>
      <label><span>Target weight (%)</span><input type="number" step="0.01" min="0" max="100" value={draft.targetWeight} onChange={(event) => setDraft((value) => ({ ...value, targetWeight: event.target.value }))} /></label>
      <label><span>Target price</span><input type="number" step="0.01" min="0" value={draft.targetPrice} onChange={(event) => setDraft((value) => ({ ...value, targetPrice: event.target.value }))} /></label>
      <label><span>Stop-loss reference</span><input type="number" step="0.01" min="0" value={draft.stopLossPrice} onChange={(event) => setDraft((value) => ({ ...value, stopLossPrice: event.target.value }))} /></label>
      <label><span>Investment horizon</span><input type="text" value={draft.investmentHorizon} onChange={(event) => setDraft((value) => ({ ...value, investmentHorizon: event.target.value }))} placeholder="e.g. 3–5 years" /></label>
      <div className="position-decision-actions">
        <button className="button button-primary" type="button" disabled={saving} onClick={() => void save()}>{saving ? "Saving…" : "Save owner settings"}</button>
        <button className="button button-secondary" type="button" disabled={saving} onClick={cancel}>Cancel</button>
      </div>
    </div>}

    <p className="assessment-note">Target and stop-loss values remain owner-controlled. PortfolioAI advisory output is displayed separately.</p>
  </section>
}
