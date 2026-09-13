import "./DashboardSectionNavigator.css"

const SECTIONS = [
  ["dashboard-overview", "Overview"],
  ["dashboard-performance", "Performance"],
  ["dashboard-structure", "Structure"],
  ["dashboard-risk", "Risk"],
  ["dashboard-monitoring", "Monitoring"],
  ["dashboard-research", "Research"],
  ["dashboard-intelligence", "Intelligence"],
  ["dashboard-news", "News"],
] as const

export function DashboardSectionNavigator() {
  return (
    <nav className="dashboard-section-navigator" aria-label="Dashboard sections">
      <div className="dashboard-section-navigator-copy">
        <span>Command index</span>
        <small>Jump to a dashboard layer</small>
      </div>
      <div className="dashboard-section-navigator-links">
        {SECTIONS.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </div>
      <a className="dashboard-section-navigator-top" href="#dashboard-overview" aria-label="Back to dashboard overview">↑ Top</a>
    </nav>
  )
}
