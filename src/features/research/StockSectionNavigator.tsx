import { useEffect, useRef, type MouseEvent } from "react"
import "./StockSectionNavigator.css"

import { STOCK_RESEARCH_SECTIONS, stockResearchSectionForHash, jumpToStockSection, type StockResearchTab, type StockSectionLink } from "./stockResearchNavigation"
export type { StockResearchTab } from "./stockResearchNavigation"

/** Shared shell navigation only: no source refresh, accounting or methodology decisions. */
export function StockSectionNavigator({ activeTab, onTabChange, hasResearch, hasSpecialist = false }: {
  readonly activeTab: StockResearchTab
  readonly onTabChange: (tab: StockResearchTab) => void
  readonly hasSpecialist?: boolean
  readonly hasResearch: boolean
}) {
  const navigator = useRef<HTMLElement>(null)
  const pending = useRef<StockSectionLink | null>(null)
  useEffect(() => {
    if (pending.current && (!pending.current.tab || pending.current.tab === activeTab)) {
      jumpToStockSection(pending.current.id, navigator.current)
      pending.current = null
    }
  }, [activeTab])
  const initialised = useRef(false)
  useEffect(() => {
    function restoreHash(event?: HashChangeEvent) {
      const section = stockResearchSectionForHash(window.location.hash) ?? (event && !window.location.hash ? stockResearchSectionForHash("#stock-workspace") : undefined)
      if (!section || (section.requiresResearch && !hasResearch) || (section.specialist && !hasSpecialist)) return
      if (section.tab && section.tab !== activeTab) {
        pending.current = section
        onTabChange(section.tab)
      } else jumpToStockSection(section.id, navigator.current)
    }
    if (!initialised.current) { initialised.current = true; restoreHash() }
    window.addEventListener("hashchange", restoreHash)
    return () => window.removeEventListener("hashchange", restoreHash)
  }, [activeTab, hasResearch, hasSpecialist, onTabChange])
  function navigate(event: MouseEvent<HTMLAnchorElement>, section: StockSectionLink) {
    // Preserve standard browser behavior for modified clicks.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    if (section.tab && section.tab !== activeTab) {
      pending.current = section
      onTabChange(section.tab)
    } else {
      jumpToStockSection(section.id, navigator.current)
    }
  }
  return <nav ref={navigator} className="stock-section-navigator" aria-label="Stock page sections">
    <span className="stock-section-navigator-title">Stock sections</span>
    <div className="stock-section-navigator-links">
      {STOCK_RESEARCH_SECTIONS.filter((section) => (!section.requiresResearch || hasResearch) && (!section.specialist || hasSpecialist)).map((section) =>
        <a key={section.label} href={`#${section.id}`} onClick={(event) => navigate(event, section)}>{section.label}</a>)}
    </div>
    <a href="#app-top" className="stock-section-navigator-top" aria-label="Back to page top" onClick={(event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      window.history.replaceState(window.history.state, "", "#app-top")
      const top = document.getElementById("app-top")
      if (top) { top.tabIndex = -1; top.focus({ preventScroll: true }) }
      window.scrollTo({ top: 0, behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })
    }}>↑ Top</a>
  </nav>
}
