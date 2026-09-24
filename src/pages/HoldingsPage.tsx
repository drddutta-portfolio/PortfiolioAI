import Decimal from "decimal.js"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ProgramCR10AttentionBadge } from "../components/ProgramCR10AttentionBadge"
import type { ProgramCR10AttentionView } from "../features/decision/r10ActionCenterViewModel"
import { useProgramCR10ActionCenter } from "../features/decision/useProgramCR10ActionCenter"
import { formatMoney, formatPercent, formatQuantity } from "../features/portfolio/format"
import type { PortfolioPosition, PortfolioRole } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"

type SortKey = "symbol" | "role" | "assetClass" | "quantity" | "investedAmount" | "currentPrice" | "currentValue" | "unrealisedPnl" | "unrealisedPnlPercent" | "portfolioWeightPercent"
type View = "OPEN" | "CLOSED"

export function HoldingsPage() {
  const { portfolio, error, isLoading } = usePortfolioView()
  const actionCenter = useProgramCR10ActionCenter(portfolio)
  const attentionById = useMemo(
    () => new Map((actionCenter.data?.view ?? []).map((item) => [item.securityId, item])),
    [actionCenter.data],
  )
  const [view, setView] = useState<View>("OPEN")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState<PortfolioRole | "ALL">("ALL")
  const [sector, setSector] = useState("ALL")
  const [assetClass, setAssetClass] = useState("ALL")
  const [sort, setSort] = useState<SortKey>("symbol")
  const positions = useMemo(() => {
    if (!portfolio) return []
    const source = view === "OPEN" ? portfolio.openPositions : portfolio.closedPositions
    const query = search.trim().toLocaleUpperCase()
    return source.filter((position) =>
      (!query || `${position.symbol} ${position.company}`.toLocaleUpperCase().includes(query))
      && (role === "ALL" || position.role === role)
      && (assetClass === "ALL" || (assetClass === "OTHER" ? !["EQUITY", "ETF"].includes(position.assetClass) : position.assetClass === assetClass))
      && (sector === "ALL" || (position.sector ?? "Unclassified") === sector))
      .sort((left, right) => compare(left, right, sort))
  }, [assetClass, portfolio, role, search, sector, sort, view])
  const sectors = useMemo(() => portfolio
    ? [...new Set(portfolio.openPositions.map((position) => position.sector ?? "Unclassified"))].sort()
    : [], [portfolio])
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Loading holdings from the ledger…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Holdings could not be loaded."}</div>
  return <section className="portfolio-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Position ledger</p><h1>Holdings</h1><p>{portfolio.totals.openHoldings} open holdings, with {portfolio.totals.closedHistories} closed histories kept separately.</p></div></div>
    <div className="view-tabs" role="tablist" aria-label="Position history"><button className={view === "OPEN" ? "active" : ""} onClick={() => setView("OPEN")}>Open holdings <span>{portfolio.totals.openHoldings}</span></button><button className={view === "CLOSED" ? "active" : ""} onClick={() => setView("CLOSED")}>Closed positions <span>{portfolio.totals.closedHistories}</span></button></div>
    <section className="panel holdings-panel">
      <div className="holdings-controls"><label className="search-control"><span>Search</span><input type="search" placeholder="Ticker or company" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span>Role</span><select value={role} onChange={(event) => setRole(event.target.value as PortfolioRole | "ALL")}><option value="ALL">All roles</option><option value="CORE">Core</option><option value="SATELLITE">Satellite</option><option value="THEMATIC">Thematic</option><option value="ETF">ETF role</option><option value="OTHER">Other</option><option value="UNCLASSIFIED">Unclassified</option></select></label><label><span>Asset class</span><select value={assetClass} onChange={(event) => setAssetClass(event.target.value)}><option value="ALL">All assets</option><option value="EQUITY">Stocks</option><option value="ETF">ETFs</option><option value="OTHER">Other assets</option></select></label><label><span>Sector</span><select value={sector} onChange={(event) => setSector(event.target.value)}><option value="ALL">All sectors</option>{sectors.map((value) => <option key={value}>{value}</option>)}</select></label><label><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="symbol">Ticker A–Z</option><option value="role">Portfolio role</option><option value="assetClass">Asset class</option><option value="quantity">Quantity</option><option value="investedAmount">Invested amount</option><option value="currentPrice">CMP</option><option value="currentValue">Market value</option><option value="unrealisedPnl">Unrealised P&amp;L</option><option value="unrealisedPnlPercent">P&amp;L %</option><option value="portfolioWeightPercent">Portfolio weight</option></select></label></div>
      <div className="holdings-caption"><strong>{positions.length}</strong> {view === "OPEN" ? "current positions" : "historical positions"}<span>Unavailable values are never estimated.</span></div>
      <div className="table-scroll holdings-table-wrap"><table className="holdings-table"><thead><tr><th>Security</th><th>{view === "CLOSED" ? "Disposed qty" : "Quantity"}</th><th>{view === "CLOSED" ? "Historical avg cost" : "Average cost"}</th><th>{view === "CLOSED" ? "Realised cost" : "Remaining cost"}</th><th>CMP</th><th>{view === "CLOSED" ? "Proceeds" : "Market value"}</th><th>{view === "CLOSED" ? "Realised" : "Unrealised"}</th><th>P&amp;L %</th><th>Weight</th><th>Accounting quality</th><th>Price evidence</th><th>Broker exposure</th><th>R10 Action Center</th><th>Classification</th></tr></thead><tbody>{positions.map((position) => <PositionRow key={position.securityId} position={position} currency={portfolio.portfolio.currency} closed={view === "CLOSED"} attention={view === "OPEN" ? attentionById.get(position.securityId) ?? null : null} />)}</tbody></table></div>
      {!positions.length ? <div className="data-empty"><strong>No matching positions</strong><p>Adjust the search or filters to see more holdings.</p></div> : null}
    </section>
  </section>
}

function decimalSort(value: string | null) { return value === null ? null : new Decimal(value) }
function compare(left: PortfolioPosition, right: PortfolioPosition, sort: SortKey) {
  if (sort === "symbol") return left.symbol.localeCompare(right.symbol)
  if (sort === "role" || sort === "assetClass") return left[sort].localeCompare(right[sort]) || left.symbol.localeCompare(right.symbol)
  const leftValue = decimalSort(left[sort]); const rightValue = decimalSort(right[sort])
  if (!leftValue && !rightValue) return left.symbol.localeCompare(right.symbol)
  if (!leftValue) return 1
  if (!rightValue) return -1
  return rightValue.comparedTo(leftValue) || left.symbol.localeCompare(right.symbol)
}

function PositionRow({ position, currency, closed, attention }: { readonly position: PortfolioPosition; readonly currency: string; readonly closed: boolean; readonly attention: ProgramCR10AttentionView | null }) {
  const missingPrice = "No verified provider mapping and cached price are available."
  const unrealisedReason = position.hasMissingPrices
    ? position.costBasisReason
      ? "A trusted cached price and deterministic cost basis are both required."
      : "A trusted cached price is required."
    : position.costBasisReason
  const snapshot = position.snapshotEvidence
  const basisLabel = position.accountingBasis === "FIFO" ? "FIFO basis" : position.accountingBasis === "AVERAGE_COST" ? "Average-cost basis" : "Unresolved basis"
  const realisedLabel = position.chargesComplete ? basisLabel : `Gross / ${basisLabel}`
  return <tr><td><div className="security-cell"><strong>{position.symbol}</strong><span>{position.company}</span><small><span className={`asset-badge asset-${position.assetClass.toLowerCase()}`}>{position.assetClass}</span> {position.exchange}{position.series ? ` · ${position.series}` : ""}</small></div></td><td className="numeric-cell">{formatQuantity(closed ? position.totalQuantitySold : position.quantity)}<small>{closed ? `Current qty ${formatQuantity(position.quantity)} · acquired ${formatQuantity(position.totalQuantityAcquired)}` : `${position.transactionCount} transactions`}</small></td><td className="numeric-cell"><AccountingValue basis={basisLabel} label="Imported Avg Cost" value={formatMoney(position.averageCost, currency)} reason={position.costBasisReason} snapshotValue={closed ? null : snapshot?.averageCost ?? null} snapshot={snapshot} currency={currency} /></td><td className="numeric-cell"><AccountingValue basis={basisLabel} label="Imported Remaining Cost" value={formatMoney(closed ? position.realisedCostBasis : position.investedAmount, currency)} reason={position.costBasisReason} snapshotValue={closed ? null : snapshot?.investedValue ?? null} snapshot={snapshot} currency={currency} />{closed ? <small>Remaining cost {formatMoney("0", currency)}</small> : null}</td><td className="numeric-cell"><Value value={closed ? "Closed" : formatMoney(position.currentPrice, currency)} reason={closed ? null : missingPrice} />{closed ? <small>Current value {formatMoney("0", currency)}</small> : null}{!closed && snapshot?.currentPrice ? <small className="snapshot-evidence">Imported snapshot CMP {formatMoney(snapshot.currentPrice, currency)}</small> : null}</td><td className="numeric-cell"><Value value={closed ? formatMoney(position.realisedProceeds, currency) : formatMoney(position.currentValue, currency)} reason={closed ? position.realisedPnlReason : missingPrice} />{!closed && snapshot?.currentValue ? <small className="snapshot-evidence">Imported snapshot value {formatMoney(snapshot.currentValue, currency)}</small> : null}</td><td className="numeric-cell"><Value value={closed ? formatMoney(position.realisedPnl, currency) : formatMoney(position.unrealisedPnl, currency)} reason={closed ? position.realisedPnlReason : unrealisedReason} suffix={closed ? realisedLabel : basisLabel} />{snapshot?.realisedPnl ? <small className="snapshot-evidence">Imported Realised P&amp;L {formatMoney(snapshot.realisedPnl, currency)}</small> : null}{!closed && snapshot?.unrealisedPnl ? <small className="snapshot-evidence">Imported Snapshot P&amp;L {formatMoney(snapshot.unrealisedPnl, currency)}</small> : null}</td><td className="numeric-cell"><Value value={closed ? (position.realisedCostBasis && new Decimal(position.realisedCostBasis).gt(0) ? formatPercent(new Decimal(position.realisedPnl ?? "0").div(position.realisedCostBasis).times(100).toFixed()) : "Unavailable") : formatPercent(position.unrealisedPnlPercent)} reason={unrealisedReason} />{!closed && snapshot?.unrealisedPnlPercent ? <small className="snapshot-evidence">Imported Snapshot Return {formatPercent(snapshot.unrealisedPnlPercent)}</small> : null}</td><td className="numeric-cell"><Value value={closed ? "—" : formatPercent(position.portfolioWeightPercent)} reason="Weight is calculated within the priced subset when coverage is incomplete." /></td><td><span className={position.accountingBasis === "UNRESOLVED" ? "price-status stale" : "price-status fresh"} title={position.accountingReason ?? undefined}>{position.accountingBasis.replaceAll("_", " ")}</span><small>P/L basis: {position.chargesComplete ? "NET — charges complete" : "GROSS — charges incomplete"}</small><small>Chronology: {position.accountingBasis === "AVERAGE_COST" ? "Incomplete — FIFO unavailable" : position.accountingBasis === "FIFO" ? "Complete — FIFO" : "Needs review"}</small>{snapshot ? <small className="evidence-source" title={`${snapshot.sourceLabel} · ${snapshot.originalSheetName} row ${snapshot.originalRowNumber}${snapshot.containsFormulaResults ? " · includes cached formula results" : ""}`}>Imported snapshot evidence retained</small> : null}</td><td><PriceEvidence position={position} closed={closed} /></td><td>{position.brokerExposure ? <div className="broker-list">{position.brokerExposure.map((exposure) => <span key={exposure.broker}><span>{exposure.broker}</span><strong>{formatQuantity(exposure.quantity)} <small>shares</small></strong></span>)}</div> : <span className="unavailable" title="One or more transactions have no broker attribution.">Unavailable</span>}</td><td>{closed ? <span className="muted-cell">Not applicable</span> : <ProgramCR10AttentionBadge attention={attention} compact />}</td><td><span className={`role-badge role-${position.role.toLowerCase()}`}>{position.role === "UNCLASSIFIED" ? "Unclassified" : position.role[0] + position.role.slice(1).toLowerCase()}</span><small className="sector-label">{position.sector ?? "Sector unavailable"}{position.industry ? ` · ${position.industry}` : " · Industry unavailable"}</small>{position.themes.length ? <small>{position.themes.map((theme) => theme.name).join(", ")}</small> : null}{!closed ? <Link className="table-action" to={`/app/structure?security=${position.securityId}`}>Manage</Link> : null}</td></tr>
}

function AccountingValue({ basis, label, value, reason, snapshotValue, snapshot, currency }: { readonly basis: string; readonly label: string; readonly value: string; readonly reason: string | null; readonly snapshotValue: string | null; readonly snapshot: PortfolioPosition["snapshotEvidence"]; readonly currency: string }) {
  return <><small className="fifo-label">{basis}</small><Value value={value} reason={reason} />{snapshotValue && snapshot ? <small className="snapshot-evidence" title={`${snapshot.sourceLabel}; reconciliation evidence only, not PortfolioAI accounting.`}>{label}: {formatMoney(snapshotValue, currency)}</small> : null}</>
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
