import { useMemo, useState } from "react"
import type { FormEvent, ReactNode } from "react"
import { DashboardScopeContext } from "./dashboardScope"

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
