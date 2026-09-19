import { buildAuropharmaG91ActivationReadinessContract } from "./auropharmaG91ActivationReadiness"
import type { SecurityResearch } from "./types"

function stateLabel(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/(^|[_\s])\S/g, (match) => match.toLocaleUpperCase())
    .replaceAll("_", " ")
}

export function AuropharmaG91ActivationReadinessPanel({
  securityId,
  symbol,
  research,
}: {
  readonly securityId: string
  readonly symbol: string
  readonly research: SecurityResearch
}) {
  if (symbol.toLocaleUpperCase() !== "AUROPHARMA") return null

  const contract = buildAuropharmaG91ActivationReadinessContract(
    securityId,
    research.metrics,
    "2026-09-20",
  )

  const authorities = [
    {
      label: "Parent Pharma profile",
      value: contract.parentProfile.code,
      state: contract.parentProfile.state,
      detail: "Eligible research authority · no score activation implied",
    },
    {
      label: "Primary assignment",
      value: "Global Generics",
      state: contract.primaryAuthority.state,
      detail: `Effective from ${contract.primaryAuthority.effectiveFrom} · candidate only`,
    },
    {
      label: "Secondary exposure",
      value: "API / Bulk Drugs · Emerging",
      state: contract.secondaryAuthority.state,
      detail: "Research context only · excluded from readiness and score denominators",
    },
    {
      label: "Unresolved exposure",
      value: "Biopharma / Biosimilars",
      state: contract.unresolvedAuthority.state,
      detail: "No active assignment row allowed while unresolved",
    },
    {
      label: "Numeric scoring",
      value: "Global Generics Primary",
      state: contract.numericScoring.state,
      detail: "Required Primary methodology is incomplete",
    },
    {
      label: "Recommendation",
      value: "Deterministic recommendation",
      state: contract.recommendation.state,
      detail: "Blocked until approved upstream scoring exists",
    },
    {
      label: "Position sizing",
      value: "D35B sizing",
      state: contract.positionSizing.state,
      detail: "Blocked until approved upstream recommendation lineage exists",
    },
  ] as const

  return <section className="pharma-persistence-package" aria-labelledby="auropharma-g9-1-title">
    <div className="pharma-evidence-pilot-head">
      <div>
        <p className="eyebrow">G9.1 · AUROPHARMA activation-readiness & authority</p>
        <h3 id="auropharma-g9-1-title">Activation layers are independently gated</h3>
        <p>G9.1 confirms what may become canonical in G9.2 without treating research activation, scoring, recommendation and position sizing as one switch. This checkpoint writes nothing.</p>
      </div>
      <span className="pharma-workspace-lock">Approval checkpoint · No persistence</span>
    </div>

    <div className="pharma-persistence-package-summary">
      <div>
        <span>Research profile</span>
        <strong>PHARMA_V1 · Ready</strong>
        <small>Parent Pharma authority eligible</small>
      </div>
      <div>
        <span>Canonical candidate</span>
        <strong>Global Generics</strong>
        <small>Ready for activation · not yet persisted</small>
      </div>
      <div>
        <span>Readiness denominator</span>
        <strong>Primary role only</strong>
        <small>Global Generics requirements · API Emerging excluded</small>
      </div>
      <div>
        <span>Downstream activation</span>
        <strong>Blocked</strong>
        <small>Score · recommendation · sizing remain OFF</small>
      </div>
    </div>

    <div className="pharma-persistence-package-grid">
      {authorities.map((authority) => <article key={authority.label}>
        <strong>{authority.label}</strong>
        <small>{authority.value}</small>
        <p>{authority.detail}</p>
        <span>{stateLabel(authority.state)}</span>
      </article>)}
    </div>

    <div className="pharma-persistence-package-grid">
      <article>
        <strong>Role-aware readiness re-check</strong>
        <small>{contract.readinessRoleAwareness.interpretationScope}</small>
        <p>The G9.1 persistence candidate resolves readiness from company + active assignment + role. Global Generics is Primary; API Emerging contributes zero requirements to the readiness denominator.</p>
        <span>{contract.readinessRoleAwareness.primaryRequirementCount} Primary requirements · 0 Emerging requirements</span>
      </article>
      <article>
        <strong>G9.2 persistence boundary</strong>
        <small>Candidate authority only</small>
        <p>Biosimilars remains REVIEW_REQUIRED and is absent from the activation candidate. Canonical assignment persistence is reserved for G9.2 after this checkpoint is visually and locally validated.</p>
        <span>Production mutation: OFF · score execution: OFF</span>
      </article>
    </div>

    <p className="pharma-evidence-pilot-note"><strong>Boundary:</strong> G9.1 creates no assignment row, evidence row, score run, recommendation run or position-sizing assessment. It only locks the activation authority that G9.2 may exercise locally after approval.</p>
  </section>
}
