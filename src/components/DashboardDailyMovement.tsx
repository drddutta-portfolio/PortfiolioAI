import Decimal from "decimal.js"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { formatMoney } from "../features/portfolio/format"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { supabase } from "../lib/supabase"
import { dashboardScopeLabel, positionsForDashboardScope, useDashboardScope } from "./DashboardScopeContext"
import "./DashboardDailyMovement.css"

type DailyPriceRow = {
  security_id: string
  price: string
  previous_close: string | null
  price_timestamp: string | null
  retrieved_at: string
  market_session_status: string
}

type MovementRow = {
  securityId: string
  symbol: string
  company: string
  quantity: Decimal
  currentPrice: Decimal
  previousClose: Decimal
  dayChange: Decimal
  dayReturn: Decimal
  dayPnl: Decimal
  currentValue: Decimal
}

function signedPercent(value: Decimal | null) {
  if (!value) return "—"
  const text = value.toDecimalPlaces(2).toFixed(2)
  return `${value.gt(0) ? "+" : ""}${text}%`
}

function signedMoney(value: Decimal | null) {
  if (!value) return "—"
  const formatted = formatMoney(value.abs().toFixed())
  return `${value.gt(0) ? "+" : value.lt(0) ? "−" : ""}${formatted}`
}

function tone(value: Decimal | null) {
  if (!value || value.isZero()) return "neutral"
  return value.gt(0) ? "positive" : "negative"
}

export function DashboardDailyMovement() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const { scopeKey } = useDashboardScope()
  const [prices, setPrices] = useState<DailyPriceRow[]>([])
  const [loadState, setLoadState] = useState<"LOADING" | "READY" | "ERROR">("LOADING")

  useEffect(() => {
    if (!portfolio?.openPositions.length) return
    let cancelled = false
    const ids = portfolio.openPositions.map((position) => position.securityId)
    async function load() {
      setLoadState("LOADING")
      const { data, error: queryError } = await supabase
        .from("market_price_latest")
        .select("security_id,price,previous_close,price_timestamp,retrieved_at,market_session_status")
        .eq("provider_code", "ANGEL_ONE")
        .in("security_id", ids)
      if (cancelled) return
      if (queryError) {
        setPrices([])
        setLoadState("ERROR")
        return
      }
      setPrices((data ?? []) as DailyPriceRow[])
      setLoadState("READY")
    }
    void load()
    return () => { cancelled = true }
  }, [portfolio])

  const model = useMemo(() => {
    if (!portfolio) return null
    const scoped = positionsForDashboardScope(portfolio.openPositions, scopeKey)
    const bySecurity = new Map(prices.map((row) => [row.security_id, row]))
    const rows: MovementRow[] = []
    scoped.forEach((position) => {
      const cached = bySecurity.get(position.securityId)
      if (!cached?.previous_close || position.currentPrice === null) return
      const previousClose = new Decimal(cached.previous_close)
      const currentPrice = new Decimal(position.currentPrice)
      const quantity = new Decimal(position.quantity)
      if (previousClose.lte(0) || quantity.isZero()) return
      const dayChange = currentPrice.minus(previousClose)
      const dayReturn = dayChange.div(previousClose).times(100)
      const dayPnl = dayChange.times(quantity)
      rows.push({
        securityId: position.securityId,
        symbol: position.symbol,
        company: position.company,
        quantity,
        currentPrice,
        previousClose,
        dayChange,
        dayReturn,
        dayPnl,
        currentValue: currentPrice.times(quantity),
      })
    })
    const totalPnl = rows.reduce((sum, row) => sum.plus(row.dayPnl), new Decimal(0))
    const previousValue = rows.reduce((sum, row) => sum.plus(row.previousClose.times(row.quantity)), new Decimal(0))
    const dayReturn = previousValue.gt(0) ? totalPnl.div(previousValue).times(100) : null
    const contributors = [...rows].sort((a, b) => b.dayPnl.comparedTo(a.dayPnl)).slice(0, 5)
    const detractors = [...rows].sort((a, b) => a.dayPnl.comparedTo(b.dayPnl)).slice(0, 5)
    const status = prices.some((row) => row.market_session_status === "OPEN" || row.market_session_status === "PRE_OPEN") ? "LIVE" : "LATEST_SESSION"
    return {
      scoped,
      rows,
      totalPnl,
      dayReturn,
      contributors,
      detractors,
      advancers: rows.filter((row) => row.dayChange.gt(0)).length,
      decliners: rows.filter((row) => row.dayChange.lt(0)).length,
      unchanged: rows.filter((row) => row.dayChange.isZero()).length,
      status,
      scopeLabel: dashboardScopeLabel(scopeKey, portfolio),
    }
  }, [portfolio, prices, scopeKey])

  if (isLoading || error || !portfolio || !model) return null

  const sessionLabel = model.status === "LIVE" ? "Today" : "Latest session"
  const best = model.contributors[0] ?? null
  const worst = model.detractors[0] ?? null

  return <section className="dashboard-daily-movement" aria-label="Daily portfolio movement">
    <div className="ddm-heading">
      <div>
        <p className="eyebrow">Daily movement</p>
        <h2>{sessionLabel} — what is moving the portfolio?</h2>
        <p>Price move versus the provider's previous close. Read-only and calculated only where both current price and previous-close evidence exist.</p>
      </div>
      <span>{model.scopeLabel}</span>
    </div>

    {loadState === "ERROR" ? <div className="ddm-notice">Daily movement evidence could not be read from the cached market-data layer.</div> : null}

    <div className="ddm-summary-grid">
      <article className={tone(model.totalPnl)}><small>{sessionLabel} P&amp;L</small><strong>{signedMoney(model.totalPnl)}</strong><span>{signedPercent(model.dayReturn)}</span></article>
      <article><small>Movement coverage</small><strong>{model.rows.length}/{model.scoped.length}</strong><span>scoped holdings with previous close</span></article>
      <article><small>Market breadth</small><strong>{model.advancers} ↑ · {model.decliners} ↓</strong><span>{model.unchanged} unchanged</span></article>
      <article className={best ? tone(best.dayPnl) : "neutral"}><small>Largest positive impact</small><strong>{best?.symbol ?? "—"}</strong><span>{best ? `${signedMoney(best.dayPnl)} · ${signedPercent(best.dayReturn)}` : "Unavailable"}</span></article>
      <article className={worst ? tone(worst.dayPnl) : "neutral"}><small>Largest negative impact</small><strong>{worst?.symbol ?? "—"}</strong><span>{worst ? `${signedMoney(worst.dayPnl)} · ${signedPercent(worst.dayReturn)}` : "Unavailable"}</span></article>
    </div>

    <div className="ddm-movers-grid">
      <MovementList title="Top contributors" rows={model.contributors} />
      <MovementList title="Top detractors" rows={model.detractors} />
    </div>

    <p className="ddm-method">Daily P&amp;L = (current cached price − previous close) × current quantity. It is a market-movement measure, not realised P&amp;L and not the same as total unrealised return.</p>
  </section>
}

function MovementList({ title, rows }: { title: string; rows: readonly MovementRow[] }) {
  return <section className="ddm-list-card">
    <div className="ddm-list-heading"><h3>{title}</h3><span>Daily impact</span></div>
    {rows.length ? rows.map((row) => <article key={row.securityId}>
      <div><Link to={`/app/research/${row.securityId}`}>{row.symbol}</Link><span>{row.company}</span></div>
      <div className={tone(row.dayReturn)}><strong>{signedPercent(row.dayReturn)}</strong><span>price move</span></div>
      <div className={tone(row.dayPnl)}><strong>{signedMoney(row.dayPnl)}</strong><span>portfolio impact</span></div>
    </article>) : <div className="ddm-empty">No supported daily movement is available for this scope.</div>}
  </section>
}
