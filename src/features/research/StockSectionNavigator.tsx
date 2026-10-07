import { useEffect, useRef, type MouseEvent } from "react"
import "./StockSectionNavigator.css"

export type StockResearchTab = "Overview" | "Financials" | "Quality & Growth" | "Ownership" | "Valuation" | "Documents" | "Evidence"
type SectionLink = { id: string; label: string; tab?: StockResearchTab; requiresResearch?: boolean; specialist?: boolean }
const SECTIONS: readonly SectionLink[] = [
  { id: "stock-summary", label: "Summary" },
  { id: "stock-position", label: "Position" },
  { id: "stock-plan", label: "Owner plan & suggestion" },
  { id: "stock-insights", label: "Insights" },
  { id: "stock-refresh", label: "Refresh" },
  { id: "stock-workspace", label: "Overview", tab: "Overview" },
  { id: "stock-assessment", label: "Cockpit & ratings", tab: "Overview", requiresResearch: true },
  { id: "stock-readiness", label: "Readiness", tab: "Overview", requiresResearch: true },
  { id: "stock-snapshots", label: "Snapshots", tab: "Overview", requiresResearch: true },
  { id: "stock-health", label: "Research health", tab: "Overview", requiresResearch: true },
  { id: "stock-specialist", label: "Stock research", tab: "Overview", requiresResearch: true, specialist: true },
  { id: "stock-workspace", label: "Documents", tab: "Documents" },
  { id: "stock-workspace", label: "Evidence", tab: "Evidence" },
]

function jump(id: string, navigator: HTMLElement | null) {
  const target = document.getElementById(id)
  if (!target) return
  const height = navigator?.getBoundingClientRect().height ?? 0
  const inset = navigator ? Number.parseFloat(getComputedStyle(navigator).top) || 0 : 0
  const top = window.scrollY + target.getBoundingClientRect().top - height - inset - 12
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  window.history.replaceState(window.history.state, "", `#${id}`)
  target.focus({ preventScroll: true })
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "instant" : "smooth" })
}

/** Shared shell navigation only: no source refresh, accounting or methodology decisions. */
export function StockSectionNavigator({ activeTab, onTabChange, hasResearch, hasSpecialist = false }: {
  readonly activeTab: StockResearchTab
  readonly onTabChange: (tab: StockResearchTab) => void
  readonly hasSpecialist?: boolean
  readonly hasResearch: boolean
}) {
  const navigator = useRef<HTMLElement>(null)
  const pending = useRef<string | null>(null)
  useEffect(() => {
    if (pending.current) {
      jump(pending.current, navigator.current)
      pending.current = null
    }
  }, [activeTab])
  function navigate(event: MouseEvent<HTMLAnchorElement>, section: SectionLink) {
    // Preserve standard browser behavior for modified clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (section.tab && section.tab !== activeTab) {
      pending.current = section.id
      onTabChange(section.tab)
    } else {
      jump(section.id, navigator.current)
    }
  }
  return <nav ref={navigator} className="stock-section-navigator" aria-label="Stock page sections">
    <span className="stock-section-navigator-title">Stock sections</span>
    <div className="stock-section-navigator-links">
      {SECTIONS.filter((section) => (!section.requiresResearch || hasResearch) && (!section.specialist || hasSpecialist)).map((section) =>
        <a key={section.label} href={`#${section.id}`} onClick={(event) => navigate(event, section)}>{section.label}</a>)}
    </div>
    <a href="#app-top" className="stock-section-navigator-top" aria-label="Back to page top" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      window.history.replaceState(window.history.state, "", "#app-top")
      window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
    }}>↑ Top</a>
  </nav>
}
