import type { MouseEvent } from "react"
import "./DashboardSectionNavigator.css"

const SECTIONS = [
  ["dashboard-overview", "Overview"],
  ["dashboard-summary", "Summary"],
  ["dashboard-pulse", "Pulse"],
  ["dashboard-allocation", "Allocation"],
  ["dashboard-weights", "Weights"],
  ["dashboard-position-returns", "Position Returns"],
  ["dashboard-contribution", "P&L Impact"],
  ["dashboard-broker", "Broker"],
  ["dashboard-insights", "Insights"],
  ["dashboard-data-health", "Data Health"],
  ["dashboard-integrity", "Integrity"],
  ["dashboard-daily-move", "Daily Move"],
  ["dashboard-performance", "Allocation Performance"],
  ["dashboard-news", "News"],
] as const

function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id)
  if (!target) return

  event.preventDefault()
  const navigator = document.querySelector<HTMLElement>(".dashboard-section-navigator")
  const offset = (navigator?.getBoundingClientRect().height ?? 0) + 12
  const top = window.scrollY + target.getBoundingClientRect().top - offset
  window.history.replaceState(null, "", `#${id}`)
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
}

function backToTop(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  window.history.replaceState(null, "", "#app-top")
  window.scrollTo({ top: 0, behavior: "smooth" })
}

export function DashboardSectionNavigator() {
  return (
    <nav className="dashboard-section-navigator" aria-label="Dashboard sections">
      <div className="dashboard-section-navigator-copy">
        <span>Command index</span>
        <small>Jump to any dashboard block</small>
      </div>
      <div className="dashboard-section-navigator-links">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(event) => jumpToSection(event, id)}>{label}</a>)}
      </div>
      <a className="dashboard-section-navigator-top" href="#app-top" onClick={backToTop} aria-label="Back to page top and primary navigation">↑ Top</a>
    </nav>
  )
}
