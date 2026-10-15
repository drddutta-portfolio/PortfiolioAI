import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { useDashboardNewsFeed } from "../features/dashboard/useDashboardEvidence"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { loadNewsRefreshStatus, saveNewsRefreshHours, isNewsRefreshHours, type NewsRefreshStatus } from "../data/newsRefreshRepository"
import { displayError } from "../lib/displayError"
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
  const portfolioId = portfolio?.portfolio.id ?? null
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [newsStatus, setNewsStatus] = useState<NewsRefreshStatus | null>(null)
  const [newsError, setNewsError] = useState<string | null>(null)
  const [savingNews, setSavingNews] = useState(false)

  useEffect(() => {
    let active = true
    if (!portfolioId) return () => { active = false }
    const refreshStatus = () => {
      void loadNewsRefreshStatus(portfolioId).then((status) => {
        if (active) { setNewsStatus(status); setNewsError(null) }
      }).catch((error: unknown) => { if (active) setNewsError(displayError(error)) })
    }
    refreshStatus()
    const timer = window.setInterval(refreshStatus, 5 * 60 * 1000)
    return () => { active = false; window.clearInterval(timer) }
  }, [portfolioId])

  async function updateNewsFrequency(value: string) {
    if (!portfolioId) return
    const hours = Number(value)
    if (!isNewsRefreshHours(hours)) return
    setSavingNews(true)
    setNewsError(null)
    try {
      await saveNewsRefreshHours(portfolioId, hours)
      setNewsStatus(await loadNewsRefreshStatus(portfolioId))
    } catch (error: unknown) {
      setNewsError(displayError(error))
    } finally { setSavingNews(false) }
  }

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
        <div className="dashboard-news-controls">
          <span className={`dashboard-live-news-status ${newsStatus?.health !== "CURRENT" ? "status-degraded" : ""}`}>
            <i /> {newsStatus?.health === "CURRENT" ? "Scheduled · NSE" : "News refresh needs attention"}
          </span>
          <label className="dashboard-news-interval">Refresh every
            <select aria-label="News refresh frequency" value={newsStatus?.intervalHours ?? 6}
              disabled={!portfolioId || !newsStatus || savingNews}
              onChange={(event) => { void updateNewsFrequency(event.target.value) }}>
              <option value={1}>1 hour</option>
              <option value={3}>3 hours</option>
              <option value={6}>6 hours</option>
              <option value={12}>12 hours</option>
            </select>
          </label>
          <small>{newsStatus?.lastRunAt ? `Last scan: ${formatPublishedAt(newsStatus.lastRunAt)} · ${newsStatus.lastRunStatus}` : "No confirmed scheduled scan"}</small>
          {newsError ? <small role="alert">Scheduler: {newsError}</small> : null}
        </div>
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
