/** Shared shell destinations. These identifiers never select research methodology. */
export const STOCK_RESEARCH_TABS = ["Overview", "Financials", "Quality & Growth", "Ownership", "Valuation", "Documents", "Evidence"] as const
export type StockResearchTab = typeof STOCK_RESEARCH_TABS[number]
export const STOCK_RESEARCH_TAB_TARGETS: Record<StockResearchTab, string> = {
  Overview: "stock-workspace", Financials: "stock-financials", "Quality & Growth": "stock-quality-growth",
  Ownership: "stock-ownership", Valuation: "stock-valuation", Documents: "stock-documents", Evidence: "stock-evidence",
}
export type StockSectionLink = { id: string; label: string; tab?: StockResearchTab; requiresResearch?: boolean; specialist?: boolean }
export const STOCK_RESEARCH_SECTIONS: readonly StockSectionLink[] = [
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
  ...STOCK_RESEARCH_TABS.filter(tab => tab !== "Overview").map(tab => ({ id: STOCK_RESEARCH_TAB_TARGETS[tab], label: tab, tab })),
]
export function stockResearchSectionForHash(hash: string) {
  return STOCK_RESEARCH_SECTIONS.find(section => `#${section.id}` === hash)
}
export function stockResearchTabForHash(hash: string): StockResearchTab {
  return stockResearchSectionForHash(hash)?.tab ?? "Overview"
}

export function jumpToStockSection(id: string, navigator: HTMLElement | null, focusId = id) {
  const target = document.getElementById(id)
  if (!target) return
  const height = navigator?.getBoundingClientRect().height ?? 0
  const inset = navigator ? Number.parseFloat(getComputedStyle(navigator).top) || 0 : 0
  const top = window.scrollY + target.getBoundingClientRect().top - height - inset - 12
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  window.history.replaceState(window.history.state, "", `#${id}`)
  document.getElementById(focusId)?.focus({ preventScroll: true })
  window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? "instant" : "smooth" })
}
