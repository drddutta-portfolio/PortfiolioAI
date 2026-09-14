import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { useDashboardNewsFeed } from "../features/dashboard/useDashboardEvidence"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import "./DashboardNewsPreview.css"

const DASHBOARD_NEWS_LIMIT = 50

function prettify(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatPublishedAt(value: string | null) {
  if (!value) return "Time unavailable"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Time unavailable"
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

function toneClass(value: string) {
  const normalized = value.toUpperCase()
  if (normalized === "POSITIVE") return "positive"
  if (normalized === "NEGATIVE") return "negative"
  if (normalized === "NEUTRAL") return "neutral"
  return "unclassified"
}

function importanceClass(value: string) {
  const normalized = value.toUpperCase()
  if (normalized === "IMPORTANT" || normalized === "HIGH") return "important"
  if (normalized === "NOTABLE" || normalized === "MEDIUM") return "notable"
  return "routine"
}

export function DashboardNewsPreview() {
  const { portfolio } = usePortfolioView()
  const feed = useDashboardNewsFeed(portfolio?.portfolio.id ?? null, DASHBOARD_NEWS_LIMIT)
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const findTarget = () => {
      const node = document.querySelector<HTMLElement>(".dashboard-news-section")
      if (node) setTarget(node)
    }
    findTarget()
    const observer = new MutationObserver(findTarget)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  if (!target) return null

  const state = feed.isLoading ? "LOADING" : feed.error ? "ERROR" : feed.data.length ? "READY" : "EMPTY"

  return createPortal(
    <div className="dashboard-live-news" aria-live="polite">
      <div className="dashboard-live-news-heading">
        <div>
          <p className="eyebrow">Important portfolio news</p>
          <h2>News intelligence</h2>
          <p>Latest official NSE announcements matched to your current holdings. Read-only; refreshed by the automated news pipeline.</p>
        </div>
        <span className="dashboard-live-news-status"><i /> Live · NSE</span>
      </div>

      {state === "LOADING" ? <div className="dashboard-live-news-empty">Loading latest portfolio announcements…</div> : null}
      {state === "ERROR" ? <div className="dashboard-live-news-empty"><strong>News could not be loaded.</strong><span>{feed.error ?? "Unknown error"}</span></div> : null}
      {state === "EMPTY" ? <div className="dashboard-live-news-empty"><strong>No captured announcements yet.</strong><span>The panel will populate automatically when matched NSE news is ingested.</span></div> : null}

      {state === "READY" ? <div className="dashboard-live-news-list" role="feed" aria-label="Latest portfolio news">
        {feed.data.map((row) => {
          const rowTone = toneClass(row.toneState)
          return <article className={`dashboard-live-news-row tone-${rowTone}`} key={row.newsItemId}>
            <div className="dashboard-live-news-company">
              <Link to={`/app/research/${row.securityId}`}>{row.symbol}</Link>
              <span>{row.companyName}</span>
            </div>
            <div className="dashboard-live-news-copy">
              <a href={row.sourceUrl} target="_blank" rel="noreferrer">{row.headline}</a>
              <div className="dashboard-live-news-meta">
                <span>{formatPublishedAt(row.publishedAt)}</span>
                <span>{row.sourceName || "NSE"}</span>
                <span>{prettify(row.category || "UNCLASSIFIED")}</span>
              </div>
            </div>
            <div className="dashboard-live-news-badges">
              <span className={`news-importance ${importanceClass(row.importanceState)}`}>{prettify(row.importanceState || "UNCLASSIFIED")}</span>
              <span className={`news-tone ${rowTone}`}>{prettify(row.toneState || "UNCLASSIFIED")}</span>
            </div>
          </article>
        })}
      </div> : null}

      <div className="dashboard-live-news-footer">
        <span>Latest {Math.min(feed.data.length, DASHBOARD_NEWS_LIMIT)} captured announcements · scroll to browse more.</span>
        <Link to="/app/research">Open research coverage →</Link>
      </div>
    </div>,
    target,
  )
}
