import { createContext, useContext, useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import type { PortfolioPosition, PortfolioRole, PortfolioViewModel } from "../features/portfolio/types"

type DashboardScopeContextValue = {
  scopeKey: string
}

const DashboardScopeContext = createContext<DashboardScopeContextValue>({ scopeKey: "ALL" })

export function DashboardScopeProvider({ children }: { children: ReactNode }) {
  const [scopeKey, setScopeKey] = useState("ALL")
  const value = useMemo(() => ({ scopeKey }), [scopeKey])

  const captureScopeChange = (event: FormEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLSelectElement)) return
    if (target.getAttribute("aria-label") !== "Portfolio scope") return
    setScopeKey(target.value)
  }

  return <DashboardScopeContext.Provider value={value}>
    <div style={{ display: "contents" }} onChangeCapture={captureScopeChange}>{children}</div>
  </DashboardScopeContext.Provider>
}

export function useDashboardScope() {
  return useContext(DashboardScopeContext)
}

export function positionsForDashboardScope(positions: readonly PortfolioPosition[], scopeKey: string) {
  if (scopeKey === "ALL") return positions
  if (scopeKey.startsWith("ROLE:")) {
    const role = scopeKey.slice(5) as PortfolioRole
    return positions.filter((position) => position.role === role)
  }
  if (scopeKey.startsWith("THEME:")) {
    const themeId = scopeKey.slice(6)
    return positions.filter((position) => position.themes.some((theme) => theme.id === themeId))
  }
  return positions
}

function title(value: string) {
  return value.toLowerCase().replace(/(^|_)([a-z])/g, (_, prefix: string, letter: string) => `${prefix ? " " : ""}${letter.toUpperCase()}`)
}

export function dashboardScopeLabel(scopeKey: string, portfolio: PortfolioViewModel) {
  if (scopeKey === "ALL") return portfolio.portfolio.name
  if (scopeKey.startsWith("ROLE:")) {
    const role = scopeKey.slice(5)
    return role === "UNCLASSIFIED" ? "Unclassified holdings" : `${title(role)} holdings`
  }
  if (scopeKey.startsWith("THEME:")) {
    const themeId = scopeKey.slice(6)
    return portfolio.themes.find((theme) => theme.id === themeId)?.name ?? "Theme"
  }
  return portfolio.portfolio.name
}
