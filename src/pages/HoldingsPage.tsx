import Decimal from "decimal.js"
import { useMemo, useState } from "react"
import { formatMoney, formatPercent, formatQuantity } from "../features/portfolio/format"
import type { PortfolioPosition, PortfolioRole } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"

type SortKey = "symbol" | "quantity" | "investedAmount" | "currentPrice" | "currentValue" | "unrealisedPnl" | "unrealisedPnlPercent" | "portfolioWeightPercent"
type View = "OPEN" | "CLOSED"

export function HoldingsPage() {
  const { portfolio, error, isLoading } = usePortfolioView()
  const [view, setView] = useState<View>("OPEN")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<PortfolioRole | "ALL">("ALL")
  const [sector, setSector] = useState("ALL")
  const [sort, setSort] = useState<SortKey>("symbol")
  const positions = useMemo(() => {
    if (!portfolio) return []
    const source = view === "OPEN" ? portfolio.openPositions : portfolio.closedPositions
    const query = search.trim().toLocaleUpperCase()
    return source.filter((position) =>
      (!query || `${position.symbol} ${position.company}`.toLocaleUpperCase().includes(query))
      && (role === "ALL" || position.role === role)
      && (sector === "ALL" || (position.sector ?? "Unclassified") === sector))
      .sort((left, right) => compare(left, right, sort))
  }, [portfolio, role, search, sector, sort, view])
  const sectors = useMemo(() => portfolio
    ? [...new Set(portfolio.openPositions.map((position) => position.sector ?? "Unclassified"))].sort()
    : [], [portfolio])
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Loading holdings from the ledger…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Holdings could not be loaded."}</div>
  return <section className="portfolio-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Position ledger</p><h1>Holdings</h1><p>{portfolio.totals.openHoldings} open holdings, with {portfolio.totals.closedHistories} closed histories kept separately.</p></div></div>
    <div className="view-tabs" role="tablist" aria-label="Position history"><button className={view === "OPEN" ? "active" : ""} onClick={() => setView("OPEN")}>Open holdings <span>{portfolio.totals.openHoldings}</span></button><button className={view === "CLOSED" ? "active" : ""} onClick={() => setView("CLOSED")}>Closed positions <span>{portfolio.totals.closedHistories}</span></button></div>
    <section className="panel holdings-panel">
      <div className="holdings-controls"><label className="search-control"><span>Search</span><input type="search" placeholder="Ticker or company" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value as PortfolioRole | "ALL")}><option value="ALL">All roles</option><option value="CORE">Core</option><option value="SATELLITE">Satellite</option><option value="THEMATIC">Thematic</option><option value="UNCLASSIFIED">Unclassified</option></select></label><label><span>Sector</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option value="ALL">All sectors</option>{sectors.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="symbol">Ticker A–Z</option><option value="quantity">Quantity</option><option value="investedAmount">Invested amount</option><option value="currentPrice">CMP</option><option value="currentValue">Market value</option><option value="unrealisedPnl">Unrealised P&amp;L</option><option value="unrealisedPnlPercent">P&amp;L %</option><option value="portfolioWeightPercent">Portfolio weight</option></select></label></div>
      <div className="holdings-caption"><strong>{positions.length}</strong> {view === "OPEN" ? "current positions" : "historical positions"}<span>Unavailable values are never estimated.</span></div>
      <div className="table-scroll holdings-table-wrap"><table className="holdings-table"><thead><tr><th>Security</th><th>Quantity</th><th>Average cost</th><th>Invested</th><th>CMP</th><th>Market value</th><th>{view === "CLOSED" ? "Realised" : "Unrealised"}</th><th>P&amp;L %</th><th>Weight</th><th>Price evidence</th><th>Broker exposure</th><th>Classification</th></tr></thead><tbody>{positions.map((position) => <PositionRow key={position.securityId} position={position} currency={portfolio.portfolio.currency} closed={view === "CLOSED"} />)}</tbody></table></div>
      {!positions.length ? <div className="data-empty"><strong>No matching positions</strong><p>Adjust the search or filters to see more holdings.</p></div> : null}
    </section>
  </section>
}

function decimalSort(value: string | null) { return value === null ? null : new Decimal(value) }
function compare(left: PortfolioPosition, right: PortfolioPosition, sort: SortKey) {
  if (sort === "symbol") return left.symbol.localeCompare(right.symbol)
  const leftValue = decimalSort(left[sort]); const rightValue = decimalSort(right[sort])
  if (!leftValue && !rightValue) return left.symbol.localeCompare(right.symbol)
  if (!leftValue) return 1
  if (!rightValue) return -1
  return rightValue.comparedTo(leftValue) || left.symbol.localeCompare(right.symbol)
}

function PositionRow({ position, currency, closed }: { readonly position: PortfolioPosition; readonly currency: string; readonly closed: boolean }) {
  const missingPrice = "No verified provider mapping and cached price are available."
  const unrealisedReason = position.hasMissingPrices
    ? position.costBasisReason
      ? "A trusted cached price and deterministic cost basis are both required."
      : "A trusted cached price is required."
    : position.costBasisReason
  return <tr><td><div className="security-cell"><strong>{position.symbol}</strong><span>{position.company}</span></div></td><td className="numeric-cell">{formatQuantity(position.quantity)}<small>{position.transactionCount} transactions</small></td><td className="numeric-cell"><Value value={formatMoney(position.averageCost, currency)} reason={position.costBasisReason} /></td><td className="numeric-cell"><Value value={formatMoney(position.investedAmount, currency)} reason={position.costBasisReason} /></td><td className="numeric-cell"><Value value={closed ? "Closed" : formatMoney(position.currentPrice, currency)} reason={closed ? null : missingPrice} /></td><td className="numeric-cell"><Value value={closed ? "Closed" : formatMoney(position.currentValue, currency)} reason={closed ? null : missingPrice} /></td><td className="numeric-cell"><Value value={closed ? formatMoney(position.realisedPnl, currency) : formatMoney(position.unrealisedPnl, currency)} reason={closed ? position.realisedPnlReason : unrealisedReason} /></td><td className="numeric-cell"><Value value={closed ? "—" : formatPercent(position.unrealisedPnlPercent)} reason={unrealisedReason} /></td><td className="numeric-cell"><Value value={closed ? "—" : formatPercent(position.portfolioWeightPercent)} reason="Portfolio weight requires complete price coverage." /></td><td><PriceEvidence position={position} closed={closed} /></td><td>{position.brokerExposure ? <div className="broker-list">{position.brokerExposure.map((exposure) => <span key={exposure.broker}><span>{exposure.broker}</span><strong>{formatQuantity(exposure.quantity)} <small>shares</small></strong></span>)}</div> : <span className="unavailable" title="One or more transactions have no broker attribution.">Unavailable</span>}</td><td><span className={`role-badge role-${position.role.toLowerCase()}`}>{position.role === "UNCLASSIFIED" ? "Unclassified" : position.role[0] + position.role.slice(1).toLowerCase()}</span><small className="sector-label">{position.sector ?? "Sector unavailable"}</small></td></tr>
}

function PriceEvidence({ position, closed }: { readonly position: PortfolioPosition; readonly closed: boolean }) {
  if (closed) return <span className="muted-cell">Not applicable</span>
  if (position.currentPrice === null || !position.priceRetrievedAt) return <span className="unavailable" title="No verified market price is cached.">Unavailable</span>
  const formatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" })
  const providerTimestamp = position.priceTimestamp ? formatter.format(new Date(position.priceTimestamp)) : "Provider time unavailable"
  const retrievedTimestamp = formatter.format(new Date(position.priceRetrievedAt))
  return <div className="price-evidence"><span className={position.isPriceStale ? "price-status stale" : "price-status fresh"}>{position.isPriceStale ? "Stale" : "Fresh"}</span><small>Price {providerTimestamp}</small><small>Cached {retrievedTimestamp}</small><small>{position.priceProvider} · {position.priceSessionStatus === "UNKNOWN" ? "Session unknown" : position.priceSessionStatus}</small></div>
}

function Value({ value, reason, suffix }: { readonly value: string; readonly reason: string | null; readonly suffix?: string }) {
  const unavailable = value === "Unavailable"
  return <>{unavailable ? <span className="unavailable" title={reason ?? undefined}>Unavailable</span> : <strong>{value}</strong>}{suffix && suffix !== "Unavailable" ? <small>{suffix}</small> : null}</>
}
