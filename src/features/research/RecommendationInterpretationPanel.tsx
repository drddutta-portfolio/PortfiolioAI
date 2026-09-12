import { useEffect, useState } from "react"
import { generateRecommendationInterpretation, planRecommendationInterpretation, type RecommendationInterpretation, type RecommendationInterpretationPlan } from "../../data/recommendationInterpretationRepository"
import { displayError } from "../../lib/displayError"
import "./RecommendationInterpretationPanel.css"

function dateTime(value: string | null) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

export function RecommendationInterpretationPanel({ portfolioId, securityId, enabled }: {
  readonly portfolioId: string
  readonly securityId: string
  readonly enabled: boolean
}) {
  const [plan, setPlan] = useState<RecommendationInterpretationPlan | null>(null)
  const [interpretation, setInterpretation] = useState<RecommendationInterpretation | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [model, setModel] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!enabled) { setPlan(null); setInterpretation(null); setGeneratedAt(null); return () => { active = false } }
    void planRecommendationInterpretation(portfolioId, securityId).then((next) => {
      if (!active) return
      setPlan(next)
      setInterpretation(next.interpretation)
      setGeneratedAt(next.generatedAt)
      setModel(next.model)
      setError(null)
    }).catch((reason: unknown) => { if (active) setError(displayError(reason)) })
    return () => { active = false }
  }, [enabled, portfolioId, securityId])

  const generate = async () => {
    setBusy(true); setError(null)
    try {
      const result = await generateRecommendationInterpretation(portfolioId, securityId)
      setInterpretation(result.interpretation)
      setGeneratedAt(result.generatedAt)
      setModel(result.model)
      setPlan((previous) => previous ? { ...previous, cached: true, generatedAt: result.generatedAt, interpretation: result.interpretation } : previous)
    } catch (reason: unknown) {
      setError(displayError(reason))
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null

  return <section className="ai-interpretation-panel" aria-labelledby="ai-interpretation-title">
    <header className="ai-interpretation-heading">
      <div>
        <p className="eyebrow">AI interpretation layer</p>
        <h3 id="ai-interpretation-title">PortfolioAI interpretation</h3>
        <p>Explains the existing deterministic recommendation in plain English. AI cannot change the role, action bias, weight range, score or your portfolio decisions.</p>
      </div>
      {plan?.configured && !interpretation ? <button type="button" className="button button-primary" disabled={busy} onClick={() => void generate()}>{busy ? "Interpreting…" : "Generate AI interpretation"}</button> : null}
      {plan?.configured && interpretation ? <button type="button" className="button button-secondary" disabled={busy} onClick={() => void generate()}>{busy ? "Refreshing…" : "Refresh interpretation"}</button> : null}
    </header>

    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}

    {plan && !plan.configured ? <div className="ai-provider-pending">
      <strong>AI synthesis is not configured yet.</strong>
      <span>The deterministic PortfolioAI recommendation remains fully active. Once the AI provider key is added to Supabase secrets, this panel can generate an evidence-grounded explanation without changing any score or recommendation.</span>
    </div> : null}

    {plan?.configured && !interpretation ? <div className="ai-ready-state">
      <strong>Ready for interpretation</strong>
      <span>One AI request will explain the latest persisted recommendation state. This uses no Trendlyne or Angel One calls.</span>
    </div> : null}

    {interpretation ? <div className="ai-interpretation-content">
      <div className="ai-thesis">
        <span>Investment view</span>
        <h4>{interpretation.headline}</h4>
        <p>{interpretation.summary}</p>
        <small>{model ? `Model: ${model}` : "AI model recorded"}{generatedAt ? ` · Generated ${dateTime(generatedAt)}` : ""}</small>
      </div>

      <div className="ai-explanation-grid">
        <article><span>Why this role?</span><p>{interpretation.why_role}</p></article>
        <article><span>Why this action?</span><p>{interpretation.why_action}</p></article>
        <article><span>How to read the weight range</span><p>{interpretation.weight_guidance}</p></article>
      </div>

      <div className="ai-detail-grid" aria-label="Interpretation supporting detail">
        <details>
          <summary><span>What supports the thesis</span><small>{interpretation.strengths.length} points</small></summary>
          <div>{interpretation.strengths.map((item) => <article key={`${item.title}:${item.detail}`}><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div>
        </details>
        <details>
          <summary><span>What needs caution</span><small>{interpretation.cautions.length} points</small></summary>
          <div>{interpretation.cautions.map((item) => <article key={`${item.title}:${item.detail}`}><strong>{item.title}</strong><p>{item.detail}</p></article>)}</div>
        </details>
        <details>
          <summary><span>What could improve the view</span><small>{interpretation.upgrade_triggers.length} triggers</small></summary>
          <ul>{interpretation.upgrade_triggers.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
        <details>
          <summary><span>What could weaken the view</span><small>{interpretation.downgrade_triggers.length} triggers</small></summary>
          <ul>{interpretation.downgrade_triggers.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
        <details>
          <summary><span>Evidence limitations</span><small>{interpretation.evidence_limits.length} notes</small></summary>
          <ul>{interpretation.evidence_limits.map((item) => <li key={item}>{item}</li>)}</ul>
        </details>
      </div>

      <p className="ai-interpretation-disclaimer">AI explains the audited recommendation state; it does not create trades, alter holdings or override your selected role, target weight, target price or stop loss.</p>
    </div> : null}
  </section>
}
