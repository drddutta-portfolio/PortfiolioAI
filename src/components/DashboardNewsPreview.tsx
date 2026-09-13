import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"
import "./DashboardNewsPreview.css"

type NewsFeedRow = {
  news_item_id: string
  security_id: string
  symbol: string
  company_name: string
  headline: string
  category: string
  importance_state: string
  tone_state: string
  published_at: string | null
  source_name: string
  source_url: string
}

type RpcResult = {
  data: unknown
  error: { message: string } | null
}

type NewsRpcClient = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<RpcResult>
}

const newsRpc = supabase as unknown as NewsRpcClient
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
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const [rows, setRows] = useState<NewsFeedRow[]>([])
  const [state, setState] = useState<"LOADING" | "READY" | "EMPTY" | "ERROR">("LOADING")
  const [error, setError] = useState<string | null>(null)

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

  useEffect(() => {
    let cancelled = false
    async function load() {
      setState("LOADING")
      setError(null)
      const { data: portfolios, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)

      if (cancelled) return
      if (portfolioError || !portfolios?.[0]?.id) {
        setError(portfolioError?.message ?? "Portfolio could not be resolved.")
        setState("ERROR")
        return
      }

      const result = await newsRpc.rpc("get_portfolio_news_feed_v2", {
        p_portfolio_id: portfolios[0].id,
        p_security_ids: null,
        p_limit: DASHBOARD_NEWS_LIMIT,
        p_before: null,
      })
      if (cancelled) return
      if (result.error) {
        setError(result.error.message)
        setState("ERROR")
        return
      }

      const news = Array.isArray(result.data) ? result.data as NewsFeedRow[] : []
      setRows(news)
      setState(news.length ? "READY" : "EMPTY")
    }

    void load()
    return () => { cancelled = true }
  }, [])

  if (!target) return null

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
      {state === "ERROR" ? <div className="dashboard-live-news-empty"><strong>News could not be loaded.</strong><span>{error ?? "Unknown error"}</span></div> : null}
      {state === "EMPTY" ? <div className="dashboard-live-news-empty"><strong>No captured announcements yet.</strong><span>The panel will populate automatically when matched NSE news is ingested.</span></div> : null}

      {state === "READY" ? <div className="dashboard-live-news-list" role="feed" aria-label="Latest portfolio news">
        {rows.map((row) => {
          const rowTone = toneClass(row.tone_state)
          return <article className={`dashboard-live-news-row tone-${rowTone}`} key={row.news_item_id}>
            <div className="dashboard-live-news-company">
              <Link to={`/app/research/${row.security_id}`}>{row.symbol}</Link>
              <span>{row.company_name}</span>
            </div>
            <div className="dashboard-live-news-copy">
              <a href={row.source_url} target="_blank" rel="noreferrer">{row.headline}</a>
              <div className="dashboard-live-news-meta">
                <span>{formatPublishedAt(row.published_at)}</span>
                <span>{row.source_name || "NSE"}</span>
                <span>{prettify(row.category || "UNCLASSIFIED")}</span>
              </div>
            </div>
            <div className="dashboard-live-news-badges">
              <span className={`news-importance ${importanceClass(row.importance_state)}`}>{prettify(row.importance_state || "UNCLASSIFIED")}</span>
              <span className={`news-tone ${rowTone}`}>{prettify(row.tone_state || "UNCLASSIFIED")}</span>
            </div>
          </article>
        })}
      </div> : null}

      <div className="dashboard-live-news-footer">
        <span>Latest {Math.min(rows.length, DASHBOARD_NEWS_LIMIT)} captured announcements · scroll to browse more.</span>
        <Link to="/app/research">Open research coverage →</Link>
      </div>
    </div>,
    target,
  )
}
