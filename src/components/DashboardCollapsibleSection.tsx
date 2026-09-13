import { useEffect, useState, type PropsWithChildren } from "react"
import "./DashboardCollapsibleSection.css"

interface Props extends PropsWithChildren {
  readonly storageKey: string
  readonly label: string
  readonly anchorId?: string
  readonly defaultOpen?: boolean
}

export function DashboardCollapsibleSection({ storageKey, label, anchorId, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen
    const stored = window.localStorage.getItem(`portfolioai.dashboard.section.${storageKey}`)
    return stored === null ? defaultOpen : stored === "open"
  })

  useEffect(() => {
    window.localStorage.setItem(`portfolioai.dashboard.section.${storageKey}`, open ? "open" : "closed")
  }, [open, storageKey])

  useEffect(() => {
    if (!anchorId) return
    const openFromHash = () => {
      if (window.location.hash === `#${anchorId}`) setOpen(true)
    }
    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    return () => window.removeEventListener("hashchange", openFromHash)
  }, [anchorId])

  return (
    <section className={`dashboard-collapsible ${open ? "is-open" : "is-closed"}`}>
      <button className="dashboard-collapsible-toggle" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <span>{label}</span>
        <span className="dashboard-collapsible-action">{open ? "Collapse" : "Open"} <i aria-hidden="true">⌄</i></span>
      </button>
      {open ? <div className="dashboard-collapsible-content">{children}</div> : null}
    </section>
  )
}
