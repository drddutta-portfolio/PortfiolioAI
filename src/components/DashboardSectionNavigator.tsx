import type { MouseEvent } from "react"
import "./DashboardSectionNavigator.css"

const SECTIONS = [
  ["dashboard-overview", "Overview"],
  ["dashboard-daily-move", "Daily Move"],
  ["dashboard-performance", "Performance"],
  ["dashboard-structure", "Structure"],
  ["dashboard-risk", "Risk"],
  ["dashboard-monitoring", "Monitoring"],
  ["dashboard-research", "Research"],
  ["dashboard-intelligence", "Intelligence"],
  ["dashboard-news", "News"],
] as const

function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  if (id !== "dashboard-news") return

  const newsPanel = document.querySelector<HTMLElement>(".dashboard-news-section")
  if (!newsPanel) return

  event.preventDefault()
  const navigator = document.querySelector<HTMLElement>(".dashboard-section-navigator")
  const offset = (navigator?.getBoundingClientRect().height ?? 0) + 12
  const top = window.scrollY + newsPanel.getBoundingClientRect().top - offset
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
}

export function DashboardSectionNavigator() {
  return (
    <nav className="dashboard-section-navigator" aria-label="Dashboard sections">
      <div className="dashboard-section-navigator-copy">
        <span>Command index</span>
        <small>Jump to a dashboard layer</small>
      </div>
      <div className="dashboard-section-navigator-links">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`} onClick={(event) => jumpToSection(event, id)}>{label}</a>)}
      </div>
      <a className="dashboard-section-navigator-top" href="#dashboard-overview" aria-label="Back to dashboard overview">↑ Top</a>
    </nav>
  )
}
