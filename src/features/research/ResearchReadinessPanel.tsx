import { useId, type ReactNode } from "react"
import "./ResearchReadinessPanel.css"

export interface ResearchReadinessGroup {
  readonly code: string
  readonly label: string
  readonly ready: number
  readonly total: number
}

export function ResearchReadinessPanel({
  title,
  detail,
  ready,
  total,
  groups,
  detailsLabel,
  details,
  supplementary,
  children,
  itemLabel = "research contracts",
}: {
  readonly title: string
  readonly detail: string
  readonly ready: number
  readonly total: number
  readonly groups: readonly ResearchReadinessGroup[]
  readonly detailsLabel: string
  readonly details: ReactNode
  readonly supplementary?: ReactNode
  readonly children?: ReactNode
  readonly itemLabel?: string
}) {
  const headingId = useId()
  const readinessState = total > 0 && ready >= total ? "Research ready" : "Evidence incomplete"
  return <section className="research-readiness-panel pharma-readiness-panel" aria-labelledby={headingId}>
    <header>
      <div><p className="eyebrow">Research readiness</p><h2 id={headingId}>{title}</h2><p>{detail}</p></div>
      <div className="pharma-readiness-summary"><span className="pharma-readiness-state">{readinessState}</span><strong>{ready}/{total}</strong><small>{itemLabel} ready</small></div>
    </header>
    <div className="research-readiness-groups" aria-label={`${title} summary`}>
      {groups.map((group) => <article key={group.code}><span>{group.label}</span><strong>{group.ready}/{group.total} ready</strong></article>)}
    </div>
    <details className="pharma-readiness-details">
      <summary><strong>{detailsLabel}</strong><span>{total} {itemLabel}</span><b>Details</b></summary>
      {details}
    </details>
    {supplementary}
    {children}
  </section>
}
