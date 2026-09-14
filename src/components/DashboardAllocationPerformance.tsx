import Decimal from "decimal.js"
import { useMemo, useRef, useState } from "react"
import type { SyntheticEvent as ReactSyntheticEvent } from "react"
import { usePortfolioEnrichment } from "../features/enrichment/usePortfolioEnrichment"
import type { SecurityEnrichment } from "../features/enrichment/types"
import { formatMoney } from "../features/portfolio/format"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { dashboardScopeLabel, positionsForDashboardScope, useDashboardScope } from "./DashboardScopeContext"
import "./DashboardAllocationPerformance.css"

type SortKey = "weight" | "return" | "pnl" | "impact" | "holdings"
type Direction = "asc" | "desc"
type GroupRow = {
  label: string
  holdings: number
  currentValue: Decimal
  totalCost: Decimal
  coveredPnl: Decimal
  accountingCovered: number
  priced: number
  weight: Decimal
  returnPct: Decimal | null
  contributionPctPoints: Decimal | null
}
type AllocationSegment = {
  label: string
  value: Decimal
  weight: Decimal
  holdings: number
  special?: "ETF" | "UNCLASSIFIED" | "OTHER"
  details?: readonly string[]
}
type HoldingDetail = {
  securityId: string
  symbol: string
  company: string
  currentValue: Decimal | null
  unrealisedPnl: Decimal | null
  returnPct: Decimal | null
}
type HoldingsPopoverState = {
  label: string
  holdings: readonly HoldingDetail[]
  x: number
  y: number
}
type MatrixBucket = "strength" | "review" | "watch" | "lowPriority"

const DONUT_COLORS = ["#2d6a4f", "#4e8f70", "#72a77e", "#9dbd8e", "#c6c88d", "#c69a5a", "#7b91a8", "#8d7d9d"] as const
const SPECIAL_COLORS: Record<NonNullable<AllocationSegment["special"]>, string> = {
  ETF: "#4f7fb8",
  UNCLASSIFIED: "#c8cec9",
  OTHER: "#a7b6ad",
}
const MARKET_CAP_COLORS: Record<string, string> = {
  "Large Cap": "#2563eb",
  "Mid Cap": "#d97706",
  "Small Cap": "#7c3aed",
  ETF: "#0891b2",
  Unclassified: "#c8cec9",
}
const HIGH_ALLOCATION_THRESHOLD = new Decimal(5)

function prettyMarketCap(value: SecurityEnrichment["marketCapCategory"] | "ETF") {
  if (value === "ETF") return "ETF"
  if (value === "LARGE_CAP") return "Large Cap"
  if (value === "MID_CAP") return "Mid Cap"
  if (value === "SMALL_CAP") return "Small Cap"
  return "Unclassified"
}

function buildGroups(positions: readonly PortfolioPosition[], enrichment: ReadonlyMap<string, SecurityEnrichment>, mode: "sector" | "marketCap") {
  const totalPriced = positions.reduce((sum, p) => sum.plus(p.currentValue ?? "0"), new Decimal(0))
  let totalCoveredCost = new Decimal(0)
  positions.forEach((p) => {
    if (p.investedAmount !== null && p.unrealisedPnl !== null) totalCoveredCost = totalCoveredCost.plus(p.investedAmount)
  })

  const groups = new Map<string, PortfolioPosition[]>()
  positions.forEach((position) => {
    const info = enrichment.get(position.securityId)
    const label = mode === "sector"
      ? position.assetClass === "ETF" ? "ETF" : info?.sector ?? "Unclassified"
      : position.assetClass === "ETF" ? "ETF" : prettyMarketCap(info?.marketCapCategory ?? null)
    const members = groups.get(label) ?? []
    members.push(position)
    groups.set(label, members)
  })

  return [...groups.entries()].map(([label, members]): GroupRow => {
    let currentValue = new Decimal(0)
    let totalCost = new Decimal(0)
    let coveredPnl = new Decimal(0)
    let accountingCovered = 0
    let priced = 0
    members.forEach((position) => {
      if (position.currentValue !== null) { currentValue = currentValue.plus(position.currentValue); priced += 1 }
      if (position.investedAmount !== null && position.unrealisedPnl !== null) {
        totalCost = totalCost.plus(position.investedAmount)
        coveredPnl = coveredPnl.plus(position.unrealisedPnl)
        accountingCovered += 1
      }
    })
    return {
      label,
      holdings: members.length,
      currentValue,
      totalCost,
      coveredPnl,
      accountingCovered,
      priced,
      weight: totalPriced.isZero() ? new Decimal(0) : currentValue.div(totalPriced).times(100),
      returnPct: totalCost.isZero() ? null : coveredPnl.div(totalCost).times(100),
      contributionPctPoints: totalCoveredCost.isZero() ? null : coveredPnl.div(totalCoveredCost).times(100),
    }
  })
}

function buildSegments(groups: readonly GroupRow[], mode: "sector" | "marketCap"): AllocationSegment[] {
  return groups.map((row): AllocationSegment => ({
    label: row.label,
    value: row.currentValue,
    weight: row.weight,
    holdings: row.holdings,
    special: row.label === "ETF" ? "ETF" : row.label === "Unclassified" ? "UNCLASSIFIED" : undefined,
    details: mode === "sector" ? [row.label] : undefined,
  })).sort((a, b) => b.weight.comparedTo(a.weight) || a.label.localeCompare(b.label))
}

function holdingsByGroup(positions: readonly PortfolioPosition[], enrichment: ReadonlyMap<string, SecurityEnrichment>, mode: "sector" | "marketCap") {
  const groups = new Map<string, HoldingDetail[]>()
  positions.forEach((position) => {
    const info = enrichment.get(position.securityId)
    const label = mode === "sector"
      ? position.assetClass === "ETF" ? "ETF" : info?.sector ?? "Unclassified"
      : position.assetClass === "ETF" ? "ETF" : prettyMarketCap(info?.marketCapCategory ?? null)
    const list = groups.get(label) ?? []
    const cost = position.investedAmount === null ? null : new Decimal(position.investedAmount)
    const pnl = position.unrealisedPnl === null ? null : new Decimal(position.unrealisedPnl)
    list.push({
      securityId: position.securityId,
      symbol: position.symbol,
      company: position.company,
      currentValue: position.currentValue === null ? null : new Decimal(position.currentValue),
      unrealisedPnl: pnl,
      returnPct: cost && pnl && !cost.isZero() ? pnl.div(cost).times(100) : null,
    })
    groups.set(label, list)
  })
  groups.forEach((list) => list.sort((a, b) => {
    if (a.returnPct && b.returnPct) {
      const byReturn = b.returnPct.comparedTo(a.returnPct)
      if (byReturn) return byReturn
    } else if (a.returnPct) return -1
    else if (b.returnPct) return 1
    if (a.unrealisedPnl && b.unrealisedPnl) {
      const byPnl = b.unrealisedPnl.comparedTo(a.unrealisedPnl)
      if (byPnl) return byPnl
    }
    return a.symbol.localeCompare(b.symbol)
  }))
  return groups
}

function summarizeSegments(segments: readonly AllocationSegment[], minimumWeight: number | null = null) {
  const special = segments.filter((segment) => segment.special === "ETF" || segment.special === "UNCLASSIFIED")
  const regular = segments.filter((segment) => !segment.special)
  if (minimumWeight === null) return [...regular, ...special]
  const visible = regular.filter((segment) => segment.weight.greaterThanOrEqualTo(minimumWeight))
  const remainder = regular.filter((segment) => segment.weight.lessThan(minimumWeight))
  if (!remainder.length) return [...visible, ...special]
  const others = remainder.reduce((acc, segment) => ({
    label: "Other sectors",
    value: acc.value.plus(segment.value),
    weight: acc.weight.plus(segment.weight),
    holdings: acc.holdings + segment.holdings,
    special: "OTHER" as const,
    details: [...(acc.details ?? []), segment.label],
  }), { label: "Other sectors", value: new Decimal(0), weight: new Decimal(0), holdings: 0, special: "OTHER" as const, details: [] as string[] } as AllocationSegment)
  return [...visible, others, ...special]
}

function coveragePct(value: number, total: number) {
  if (!total) return "0%"
  return `${new Decimal(value).div(total).times(100).toDecimalPlaces(value > 0 && value < total ? 1 : 0).toFixed()}%`
}

function signed(value: Decimal | null, suffix = "%") {
  if (value === null) return "—"
  const rounded = value.toDecimalPlaces(1).toFixed(1)
  return `${value.gt(0) ? "+" : ""}${rounded}${suffix}`
}

function sortRows(rows: readonly GroupRow[], key: SortKey, direction: Direction) {
  const factor = direction === "asc" ? 1 : -1
  return [...rows].sort((a, b) => {
    let result = 0
    if (key === "weight") result = a.weight.comparedTo(b.weight)
    else if (key === "return") result = (a.returnPct ?? new Decimal(-999)).comparedTo(b.returnPct ?? new Decimal(-999))
    else if (key === "pnl") result = a.coveredPnl.comparedTo(b.coveredPnl)
    else if (key === "impact") result = (a.contributionPctPoints ?? new Decimal(-999)).comparedTo(b.contributionPctPoints ?? new Decimal(-999))
    else if (key === "holdings") result = a.holdings - b.holdings
    return result * factor || a.label.localeCompare(b.label)
  })
}

function Donut({ segments, centerLabel, compact = false }: { segments: readonly AllocationSegment[]; centerLabel: string; compact?: boolean }) {
  const total = segments.reduce((sum, segment) => sum.plus(segment.value), new Decimal(0))
  if (total.isZero()) return <div className={compact ? "dap-donut compact empty" : "dap-donut empty"}><div><strong>—</strong><small>No priced data</small></div></div>
  let offset = new Decimal(0)
  const stops: string[] = []
  segments.forEach((segment, index) => {
    const start = offset
    const end = offset.plus(segment.weight)
    const color = segment.special ? SPECIAL_COLORS[segment.special] : DONUT_COLORS[index % DONUT_COLORS.length]
    stops.push(`${color} ${start.toFixed(4)}% ${end.toFixed(4)}%`)
    offset = end
  })
  return <div className={compact ? "dap-donut compact" : "dap-donut"} style={{ background: `conic-gradient(${stops.join(",")})` }}><div><strong>100%</strong><small>{centerLabel}</small></div></div>
}

function AllocationLegend({ segments, currency, compact = false }: { segments: readonly AllocationSegment[]; currency: string; compact?: boolean }) {
  return <div className={compact ? "dap-legend compact" : "dap-legend"}>{segments.map((segment, index) => <div className="dap-legend-row" key={segment.label}><i style={{ background: segment.special ? SPECIAL_COLORS[segment.special] : DONUT_COLORS[index % DONUT_COLORS.length] }} /><span><strong>{segment.label}</strong><small>{segment.holdings} holding{segment.holdings === 1 ? "" : "s"} · {formatMoney(segment.value.toFixed(), currency)}</small></span><b>{segment.weight.toDecimalPlaces(1).toFixed(1)}%</b></div>)}</div>
}

function MarketCapAllocation({ segments, currency }: { segments: readonly AllocationSegment[]; currency: string }) {
  return <section className="dap-allocation-card"><div className="dap-allocation-title"><div><h3>Market-cap allocation</h3><span>Portfolio weight by current priced value</span></div><span className="dap-coverage-badge">100% classified</span></div><div className="dap-marketcap-layout"><Donut segments={segments} centerLabel="classified" /><div className="dap-marketcap-list">{segments.map((segment) => <div className="dap-marketcap-row" key={segment.label}><i style={{ background: MARKET_CAP_COLORS[segment.label] ?? "#7b91a8" }} /><span><strong>{segment.label}</strong><small>{segment.holdings} holding{segment.holdings === 1 ? "" : "s"} · {formatMoney(segment.value.toFixed(), currency)}</small></span><b>{segment.weight.toDecimalPlaces(1).toFixed(1)}%</b></div>)}</div></div></section>
}

function PerformanceMatrix({ groups }: { groups: readonly GroupRow[] }) {
  const matrix = useMemo(() => groups.reduce<Record<MatrixBucket, GroupRow[]>>((acc, row) => {
    const bucket: MatrixBucket = row.weight.greaterThanOrEqualTo(HIGH_ALLOCATION_THRESHOLD)
      ? row.returnPct !== null && row.returnPct.greaterThanOrEqualTo(20.3) ? "strength" : "review"
      : row.returnPct !== null && row.returnPct.lessThan(0) ? "watch" : "lowPriority"
    acc[bucket].push(row)
    return acc
  }, { strength: [], review: [], watch: [], lowPriority: [] }), [groups])
  const cells: readonly { key: MatrixBucket; title: string; subtitle: string }[] = [
    { key: "strength", title: "Large & outperforming", subtitle: "High exposure with strong returns" },
    { key: "review", title: "Large & lagging", subtitle: "High exposure deserves review" },
    { key: "watch", title: "Smaller & negative", subtitle: "Watch for deterioration" },
    { key: "lowPriority", title: "Smaller & positive", subtitle: "Lower portfolio impact" },
  ]
  return <section className="dap-matrix"><div className="dap-matrix-heading"><div><p className="eyebrow">Allocation vs performance</p><h3>Where is sector exposure helping or lagging?</h3></div><div className="dap-matrix-rules"><span>Large exposure ≥ 5%</span><span>Outperforming ≥ +20.3%</span></div></div><div className="dap-matrix-grid">{cells.map((cell) => <article className={`bucket-${cell.key}`} key={cell.key}><div><strong>{cell.title}</strong><small>{cell.subtitle}</small></div>{matrix[cell.key].length ? <ul>{matrix[cell.key].sort((a,b)=>b.weight.comparedTo(a.weight)).map((row)=><li key={row.label}><span>{row.label}</span><b>{row.weight.toDecimalPlaces(1).toFixed(1)}% · {signed(row.returnPct)}</b></li>)}</ul> : <p>No sectors in this bucket.</p>}</article>)}</div></section>
}

function GroupTable({ title, rows, empty, groupHoldings }: { title: string; rows: readonly GroupRow[]; empty: string; groupHoldings?: ReadonlyMap<string, readonly HoldingDetail[]> }) {
  const [sortKey, setSortKey] = useState<SortKey>("weight")
  const [direction, setDirection] = useState<Direction>("desc")
  const [popover, setPopover] = useState<HoldingsPopoverState | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sorted = useMemo(() => sortRows(rows, sortKey, direction), [rows, sortKey, direction])
  const choose = (key: SortKey) => { if (key === sortKey) setDirection((value) => value === "desc" ? "asc" : "desc"); else { setSortKey(key); setDirection("desc") } }
  const cancelClose = () => { if (closeTimer.current) clearTimeout(closeTimer.current); closeTimer.current = null }
  const closeSoon = () => { cancelClose(); closeTimer.current = setTimeout(() => setPopover(null), 140) }
  const openHoldings = (event: ReactSyntheticEvent<HTMLElement>, row: GroupRow) => {
    const holdings = groupHoldings?.get(row.label)
    if (!holdings?.length) return
    cancelClose()
    const rect = event.currentTarget.getBoundingClientRect()
    const width = 430
    const height = 330
    const x = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))
    let y = rect.bottom + 6
    if (y + height > window.innerHeight - 12) y = Math.max(12, rect.top - height - 6)
    setPopover({ label: row.label, holdings, x, y })
  }
  if (!rows.length) return <section className="dap-table-card"><h3>{title}</h3><div className="dap-empty">{empty}</div></section>
  return <section className="dap-table-card">
    <div className="dap-table-heading"><h3>{title}</h3><span>{rows.length} classified groups</span></div>
    <div className="dap-table-scroll"><table><thead><tr><th>Group</th><th><button onClick={() => choose("holdings")}>Holdings</button></th><th><button onClick={() => choose("weight")}>Weight</button></th><th>Invested</th><th>Current value</th><th><button onClick={() => choose("pnl")}>Unrealised P&amp;L</button></th><th><button onClick={() => choose("return")}>Return</button></th><th><button onClick={() => choose("impact")}>Return contribution</button></th></tr></thead><tbody>{sorted.map((row) => {
      const interactive = Boolean(groupHoldings?.get(row.label)?.length)
      return <tr key={row.label}><td>{interactive ? <button className="dap-group-trigger" type="button" aria-haspopup="dialog" onMouseEnter={(event) => openHoldings(event, row)} onMouseLeave={closeSoon} onFocus={(event) => openHoldings(event, row)} onBlur={closeSoon} onClick={(event) => openHoldings(event, row)}>{row.label}</button> : <strong>{row.label}</strong>}<small>{row.priced}/{row.holdings} priced · {row.accountingCovered}/{row.holdings} accounting covered</small></td><td>{interactive ? <button className="dap-holdings-trigger" type="button" aria-label={`Show ${row.holdings} holdings in ${row.label}`} onMouseEnter={(event) => openHoldings(event, row)} onMouseLeave={closeSoon} onFocus={(event) => openHoldings(event, row)} onBlur={closeSoon} onClick={(event) => openHoldings(event, row)}>{row.holdings}</button> : row.holdings}</td><td>{row.weight.toDecimalPlaces(1).toFixed(1)}%</td><td>{formatMoney(row.accountingCovered ? row.totalCost.toFixed() : null)}</td><td>{formatMoney(row.priced ? row.currentValue.toFixed() : null)}</td><td className={row.coveredPnl.gt(0) ? "is-positive" : row.coveredPnl.lt(0) ? "is-negative" : ""}>{row.accountingCovered ? formatMoney(row.coveredPnl.toFixed()) : "—"}</td><td className={row.returnPct?.gt(0) ? "is-positive" : row.returnPct?.lt(0) ? "is-negative" : ""}>{signed(row.returnPct)}</td><td className={row.contributionPctPoints?.gt(0) ? "is-positive" : row.contributionPctPoints?.lt(0) ? "is-negative" : ""}>{signed(row.contributionPctPoints, " pp")}</td></tr>
    })}</tbody></table></div>
    {popover ? <div className="dap-holdings-popover" role="dialog" aria-label={`${popover.label} holdings`} style={{ left: popover.x, top: popover.y }} onMouseEnter={cancelClose} onMouseLeave={closeSoon}><div className="dap-holdings-popover-head"><div><strong>{popover.label}</strong><span>{popover.holdings.length} holdings · return descending</span></div><button type="button" aria-label="Close holdings popover" onClick={() => setPopover(null)}>×</button></div><div className="dap-holdings-popover-scroll"><table><thead><tr><th>Stock</th><th>Return</th><th>P&amp;L</th><th>Current value</th></tr></thead><tbody>{popover.holdings.map((holding) => <tr key={holding.securityId}><td><b>{holding.symbol}</b><small>{holding.company}</small></td><td className={holding.returnPct?.gt(0) ? "is-positive" : holding.returnPct?.lt(0) ? "is-negative" : ""}>{signed(holding.returnPct)}</td><td className={holding.unrealisedPnl?.gt(0) ? "is-positive" : holding.unrealisedPnl?.lt(0) ? "is-negative" : ""}>{holding.unrealisedPnl === null ? "—" : formatMoney(holding.unrealisedPnl.toFixed())}</td><td>{holding.currentValue === null ? "—" : formatMoney(holding.currentValue.toFixed())}</td></tr>)}</tbody></table></div></div> : null}
  </section>
}

export function DashboardAllocationPerformance() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const { scopeKey } = useDashboardScope()
  const enrichment = usePortfolioEnrichment(portfolio?.openPositions.map((p) => p.securityId) ?? [])
  if (isLoading || error || !portfolio) return null

  const positions = positionsForDashboardScope(portfolio.openPositions, scopeKey)
  const scopeLabel = dashboardScopeLabel(scopeKey, portfolio)
  const equityPositions = positions.filter((p) => p.assetClass !== "ETF")
  const sectorGroups = buildGroups(positions, enrichment.bySecurityId, "sector")
  const marketCapGroups = buildGroups(positions, enrichment.bySecurityId, "marketCap")
  const sectorSegments = summarizeSegments(buildSegments(sectorGroups, "sector"), 1.5)
  const marketCapSegments = buildSegments(marketCapGroups, "marketCap")
  const sectorHoldings = holdingsByGroup(positions, enrichment.bySecurityId, "sector")
  const marketCapHoldings = holdingsByGroup(positions, enrichment.bySecurityId, "marketCap")
  const sectorClassified = equityPositions.filter((p) => Boolean(enrichment.bySecurityId.get(p.securityId)?.sector)).length
  const marketCapClassified = equityPositions.filter((p) => Boolean(enrichment.bySecurityId.get(p.securityId)?.marketCapCategory)).length
  const etfs = positions.filter((p) => p.assetClass === "ETF").length

  return <section className="dashboard-allocation-performance" aria-label="Sector and market-cap performance">
    <div className="dap-heading"><div><p className="eyebrow">Allocation & performance</p><h2>Sector and market-cap performance</h2><p>Classification-backed allocation and supported return aggregation for the selected Dashboard scope. Missing classifications are excluded rather than guessed.</p></div><span>{scopeLabel}</span></div>

    <div className="dap-classification-strip">
      <article><small>Sector classification</small><strong>{coveragePct(sectorClassified, equityPositions.length)}</strong><span>{sectorClassified}/{equityPositions.length} scoped non-ETF holdings classified</span></article>
      <article><small>Market-cap classification</small><strong>{coveragePct(marketCapClassified, equityPositions.length)}</strong><span>{marketCapClassified}/{equityPositions.length} scoped non-ETF holdings classified</span></article>
      <article><small>ETF bucket</small><strong>{etfs}</strong><span>ETFs in the selected scope are shown separately from equity market-cap categories</span></article>
      <article><small>Scoped holdings</small><strong>{positions.length}</strong><span>{scopeLabel}</span></article>
    </div>

    <div className="dap-allocation-grid">
      <section className="dap-allocation-card"><div className="dap-allocation-title"><div><h3>Sector allocation</h3><span>Portfolio weight by current priced value</span></div><span className="dap-coverage-badge">{coveragePct(sectorClassified, equityPositions.length)} classified</span></div><div className="dap-sector-layout"><div><AllocationLegend segments={sectorSegments} currency={portfolio.portfolio.currency} /></div><Donut segments={sectorSegments} centerLabel="classified" compact /></div></section>
      <MarketCapAllocation segments={marketCapSegments} currency={portfolio.portfolio.currency} />
    </div>

    <div className="dap-performance-grid">
      <GroupTable title="Sector performance" rows={sectorGroups} empty="No classified sector holdings are available in this scope." groupHoldings={sectorHoldings} />
      <GroupTable title="Market-cap performance" rows={marketCapGroups} empty="No classified market-cap holdings are available in this scope." groupHoldings={marketCapHoldings} />
    </div>

    <PerformanceMatrix groups={sectorGroups.filter((row) => row.label !== "ETF" && row.label !== "Unclassified")} />
    <p className="dap-method">Returns use deterministic unrealised P&amp;L only where PortfolioAI accounting is supported. Allocation uses current priced value. Return contribution is covered group P&amp;L divided by the covered cost basis of the selected scope, so unsupported histories are excluded rather than estimated.</p>
  </section>
}
