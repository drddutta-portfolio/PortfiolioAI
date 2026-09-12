import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { companyLogoPublicUrl } from "../../data/companyProfileRepository"
import { useCompanyProfile } from "./useCompanyProfile"
import "./CompanyAboutPanel.css"

type ScrollThumb = {
  readonly visible: boolean
  readonly height: number
  readonly top: number
}

export function CompanyAboutPanel({ portfolioId, securityId, symbol, companyName }: {
  readonly portfolioId: string
  readonly securityId: string
  readonly symbol: string
  readonly companyName: string
}) {
  const profile = useCompanyProfile(portfolioId, securityId)
  const logoUrl = companyLogoPublicUrl(profile.data?.logoStoragePath ?? null)
  const initial = (symbol.trim()[0] ?? companyName.trim()[0] ?? "?").toLocaleUpperCase()
  const scrollRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null)
  const [thumb, setThumb] = useState<ScrollThumb>({ visible: false, height: 28, top: 0 })

  const updateThumb = useCallback(() => {
    const element = scrollRef.current
    if (!element) return
    const { clientHeight, scrollHeight, scrollTop } = element
    if (scrollHeight <= clientHeight + 1) {
      setThumb({ visible: false, height: clientHeight, top: 0 })
      return
    }
    const height = Math.max(24, (clientHeight / scrollHeight) * clientHeight)
    const travel = Math.max(1, clientHeight - height)
    const scrollTravel = Math.max(1, scrollHeight - clientHeight)
    setThumb({ visible: true, height, top: (scrollTop / scrollTravel) * travel })
  }, [])

  useEffect(() => {
    updateThumb()
    const element = scrollRef.current
    if (!element) return
    const observer = new ResizeObserver(updateThumb)
    observer.observe(element)
    const content = element.firstElementChild
    if (content) observer.observe(content)
    return () => observer.disconnect()
  }, [profile.data?.aboutSummary, profile.isLoading, updateThumb])

  const onThumbPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const element = scrollRef.current
    if (!element) return
    dragRef.current = { startY: event.clientY, startScrollTop: element.scrollTop }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const onThumbPointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const element = scrollRef.current
    const drag = dragRef.current
    if (!element || !drag || !thumb.visible) return
    const travel = Math.max(1, element.clientHeight - thumb.height)
    const scrollTravel = Math.max(1, element.scrollHeight - element.clientHeight)
    element.scrollTop = drag.startScrollTop + ((event.clientY - drag.startY) / travel) * scrollTravel
  }

  const stopThumbDrag = () => { dragRef.current = null }

  const onTrackPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest(".company-about-scroll-thumb")) return
    const element = scrollRef.current
    if (!element || !thumb.visible) return
    const rect = event.currentTarget.getBoundingClientRect()
    const desiredTop = Math.min(Math.max(0, event.clientY - rect.top - thumb.height / 2), Math.max(0, rect.height - thumb.height))
    const ratio = desiredTop / Math.max(1, rect.height - thumb.height)
    element.scrollTop = ratio * Math.max(0, element.scrollHeight - element.clientHeight)
  }

  return <section className="company-about-panel" aria-labelledby="company-about-title">
    <header className="company-about-header">
      <div className="company-about-heading">
        <div className="company-logo-shell" aria-hidden="true">
          {logoUrl ? <img src={logoUrl} alt="" loading="lazy" /> : <span>{initial}</span>}
        </div>
        <div>
          <p className="eyebrow" id="company-about-title">About the company</p>
          <strong>{companyName}</strong>
        </div>
      </div>
      <span className="about-source">{profile.data?.aboutSummary ? "Cached company profile" : "Profile not cached"}</span>
    </header>

    <div className="company-about-scroll-shell">
      <div ref={scrollRef} className="company-about-scroll" tabIndex={0} onScroll={updateThumb}>
        {profile.isLoading ? <p className="company-about-muted">Loading cached company profile…</p> : profile.data?.aboutSummary ? <p>{profile.data.aboutSummary}</p> : <p className="company-about-muted">No cached company description is available yet. Fetch it once to store a normalized About summary and, when available, the company logo.</p>}
      </div>
      <div className={`company-about-scroll-track${thumb.visible ? " is-visible" : ""}`} aria-hidden={!thumb.visible} onPointerDown={onTrackPointerDown}>
        {thumb.visible ? <button
          type="button"
          className="company-about-scroll-thumb"
          tabIndex={-1}
          aria-label="Scroll company description"
          style={{ height: `${thumb.height}px`, transform: `translateY(${thumb.top}px)` }}
          onPointerDown={onThumbPointerDown}
          onPointerMove={onThumbPointerMove}
          onPointerUp={stopThumbDrag}
          onPointerCancel={stopThumbDrag}
        /> : null}
      </div>
    </div>

    {!profile.data?.aboutSummary || profile.error ? <footer className="company-about-actions">
      {profile.data?.companyWebsiteUrl ? <a href={profile.data.companyWebsiteUrl} target="_blank" rel="noreferrer">Official website ↗</a> : <span />}
      {!profile.isLoading && !profile.data?.aboutSummary ? <button type="button" className="button button-secondary company-profile-fetch" onClick={() => void profile.discover()} disabled={profile.isDiscovering}>{profile.isDiscovering ? "Fetching…" : "Fetch company profile once"}</button> : null}
      {profile.error ? <small role="alert" className="company-about-error">{profile.error}</small> : null}
    </footer> : null}
  </section>
}
