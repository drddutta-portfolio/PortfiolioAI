import Decimal from "decimal.js"
import { useMemo, useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import { formatMoney } from "../features/portfolio/format"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { usePortfolioEnrichment } from "../features/enrichment/usePortfolioEnrichment"
import type { SecurityEnrichment } from "../features/enrichment/types"
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

  const groups = new Map<string, { positions: PortfolioPosition[] }>()
  positions.forEach((position) => {
    const e = enrichment.get(position.securityId)
    let label: string | null = null
    if (mode === "sector") label = e?.sector?.trim() || null
    else if (position.assetClass === "ETF") label = "ETF"
    else if (e?.marketCapCategory && ["LARGE_CAP", "MID_CAP", "SMALL_CAP"].includes(e.marketCapCategory)) label = prettyMarketCap(e.marketCapCategory)
    if (!label) return
    const current = groups.get(label) ?? { positions: [] }
    current.positions.push(position)
    groups.set(label, current)
  })

  return [...groups.entries()].map(([label, group]) => {
    let currentValue = new Decimal(0)
    let totalCost = new Decimal(0)
    let coveredPnl = new Decimal(0)
    let accountingCovered = 0
    let priced = 0
    group.positions.forEach((position) => {
      if (position.currentValue !== null) { currentValue = currentValue.plus(position.currentValue); priced += 1 }
      if (position.investedAmount !== null && position.unrealisedPnl !== null) {
        totalCost = totalCost.plus(position.investedAmount)
        coveredPnl = coveredPnl.plus(position.unrealisedPnl)
        accountingCovered += 1
      }
    })
    return {
      label,
      holdings: group.positions.length,
      currentValue,
      totalCost,
      coveredPnl,
      accountingCovered,
      priced,
      weight: totalPriced.isZero() ? new Decimal(0) : currentValue.div(totalPriced).times(100),
      returnPct: accountingCovered && !totalCost.isZero() ? coveredPnl.div(totalCost).times(100) : null,
      contributionPctPoints: accountingCovered && !totalCoveredCost.isZero() ? coveredPnl.div(totalCoveredCost).times(100) : null,
    } satisfies GroupRow
  })
}

function buildAllocationSegments(positions: readonly PortfolioPosition[], enrichment: ReadonlyMap<string, SecurityEnrichment>, mode: "sector" | "marketCap") {
  const totalPriced = positions.reduce((sum, position) => sum.plus(position.currentValue ?? "0"), new Decimal(0))
  if (totalPriced.isZero()) return []
  const buckets = new Map<string, { value: Decimal; holdings: number; special?: AllocationSegment["special"] }>()
  positions.forEach((position) => {
    if (position.currentValue === null) return
    const stored = enrichment.get(position.securityId)
    let label = "Unclassified"
    let special: AllocationSegment["special"] = "UNCLASSIFIED"
    if (position.assetClass === "ETF") {
      label = "ETF"
      special = "ETF"
    } else if (mode === "sector" && stored?.sector?.trim()) {
      label = stored.sector.trim()
      special = undefined
    } else if (mode === "marketCap" && stored?.marketCapCategory && ["LARGE_CAP", "MID_CAP", "SMALL_CAP"].includes(stored.marketCapCategory)) {
      label = prettyMarketCap(stored.marketCapCategory)
      special = undefined
    }
    const current = buckets.get(label) ?? { value: new Decimal(0), holdings: 0, special }
    current.value = current.value.plus(position.currentValue)
    current.holdings += 1
    buckets.set(label, current)
  })
  return [...buckets.entries()].map(([label, bucket]) => ({
    label,
    value: bucket.value,
    holdings: bucket.holdings,
    special: bucket.special,
    weight: bucket.value.div(totalPriced).times(100),
  } satisfies AllocationSegment)).sort((a, b) => b.value.comparedTo(a.value))
}

function buildGroupHoldings(positions: readonly PortfolioPosition[], enrichment: ReadonlyMap<string, SecurityEnrichment>, mode: "sector" | "marketCap") {
  const groups = new Map<string, HoldingDetail[]>()
  positions.forEach((position) => {
    const stored = enrichment.get(position.securityId)
    let label: string | null = null
    if (mode === "sector") label = stored?.sector?.trim() || null
    else if (position.assetClass === "ETF") label = "ETF"
    else if (stored?.marketCapCategory && ["LARGE_CAP", "MID_CAP", "SMALL_CAP"].includes(stored.marketCapCategory)) label = prettyMarketCap(stored.marketCapCategory)
    if (!label) return

    const invested = position.investedAmount === null ? null : new Decimal(position.investedAmount)
    const pnl = position.unrealisedPnl === null ? null : new Decimal(position.unrealisedPnl)
    const returnPct = invested && pnl && !invested.isZero() ? pnl.div(invested).times(100) : null
    const row: HoldingDetail = {
      securityId: position.securityId,
      symbol: position.symbol,
      company: position.company,
      currentValue: position.currentValue === null ? null : new Decimal(position.currentValue),
      unrealisedPnl: pnl,
      returnPct,
    }
    const current = groups.get(label) ?? []
    current.push(row)
    groups.set(label, current)
  })

  groups.forEach((holdings) => holdings.sort((a, b) => {
    if (a.returnPct === null && b.returnPct !== null) return 1
    if (a.returnPct !== null && b.returnPct === null) return -1
    if (a.returnPct !== null && b.returnPct !== null) {
      const byReturn = b.returnPct.comparedTo(a.returnPct)
      if (byReturn) return byReturn
    }
    if (a.unrealisedPnl === null && b.unrealisedPnl !== null) return 1
    if (a.unrealisedPnl !== null && b.unrealisedPnl === null) return -1
    if (a.unrealisedPnl !== null && b.unrealisedPnl !== null) {
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
    details: [...acc.details, segment.label],
  }), { label: "Other sectors", value: new Decimal(0), weight: new Decimal(0), holdings: 0, special: "OTHER" as const, details: [] as string[] })
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
  const multiplier = direction === "asc" ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = key === "weight" ? a.weight : key === "return" ? a.returnPct : key === "pnl" ? a.coveredPnl : key === "impact" ? a.contributionPctPoints : new Decimal(a.holdings)
    const bv = key === "weight" ? b.weight : key === "return" ? b.returnPct : key === "pnl" ? b.coveredPnl : key === "impact" ? b.contributionPctPoints : new Decimal(b.holdings)
    if (av === null && bv === null) return a.label.localeCompare(b.label)
    if (av === null) return 1
    if (bv === null) return -1
    return av.comparedTo(bv) * multiplier || a.label.localeCompare(b.label)
  })
}

function allocationColor(title: string, segment: AllocationSegment, index: number) {
  if (title === "Market-cap allocation") return MARKET_CAP_COLORS[segment.label] ?? "#64748b"
  return segment.special ? SPECIAL_COLORS[segment.special] : DONUT_COLORS[index % DONUT_COLORS.length]
}

function AllocationDonut({ title, segments, classifiedCoverage, empty }: { title: string; segments: readonly AllocationSegment[]; classifiedCoverage: string; empty: string }) {
  const display = summarizeSegments(segments, title === "Sector allocation" ? 1.5 : null)
  const [tooltip, setTooltip] = useState<{ segment: AllocationSegment; x: number; y: number } | null>(null)
  if (!display.length) return <section className="dap-chart-card"><div className="dap-chart-heading"><div><h3>{title}</h3><p>Portfolio weight by current priced value</p></div><span>{classifiedCoverage} classified</span></div><div className="dap-chart-empty">{empty}</div></section>

  let cursor = 0
  const arcs = display.map((segment, index) => {
    const start = cursor
    const weight = segment.weight.toNumber()
    cursor += weight
    return { segment, index, start, weight, color: allocationColor(title, segment, index) }
  })
  const showTooltip = (event: ReactMouseEvent<SVGCircleElement>, segment: AllocationSegment) => {
    const svg = event.currentTarget.ownerSVGElement
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const x = Math.max(8, Math.min(event.clientX - rect.left + 12, rect.width - 178))
    const y = Math.max(8, Math.min(event.clientY - rect.top + 12, rect.height - 104))
    setTooltip({ segment, x, y })
  }

  return <section className="dap-chart-card">
    <div className="dap-chart-heading"><div><h3>{title}</h3><p>Portfolio weight by current priced value</p></div><span>{classifiedCoverage} classified</span></div>
    <div className="dap-chart-layout">
      <div className="dap-donut-wrap">
        <svg className="dap-donut-svg" viewBox="0 0 100 100" role="img" aria-label={`${title}: ${classifiedCoverage} classified`} onMouseLeave={() => setTooltip(null)}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#edf2ef" strokeWidth="18" />
          {arcs.map(({ segment, index, start, weight, color }) => <circle
            key={`${segment.label}-${index}`}
            className="dap-donut-arc"
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="18"
            pathLength="100"
            strokeDasharray={`${weight} ${Math.max(0, 100 - weight)}`}
            strokeDashoffset={-start}
            transform="rotate(-90 50 50)"
            tabIndex={0}
            aria-label={`${segment.label}, ${segment.holdings} holdings, ${segment.weight.toDecimalPlaces(1).toFixed(1)} percent, ${formatMoney(segment.value.toFixed())}`}
            onMouseEnter={(event) => showTooltip(event, segment)}
            onMouseMove={(event) => showTooltip(event, segment)}
            onFocus={() => setTooltip({ segment, x: 12, y: 12 })}
            onBlur={() => setTooltip(null)}
          />)}
        </svg>
        <div className="dap-donut-center"><strong>{classifiedCoverage}</strong><span>classified</span></div>
        {tooltip ? <div className="dap-donut-tooltip" style={{ left: tooltip.x, top: tooltip.y }} role="tooltip">
          <strong>{tooltip.segment.label}</strong>
          <span>{tooltip.segment.holdings} holding{tooltip.segment.holdings === 1 ? "" : "s"}</span>
          <span>{formatMoney(tooltip.segment.value.toFixed())}</span>
          <b>{tooltip.segment.weight.toDecimalPlaces(1).toFixed(1)}% of priced portfolio</b>
          {tooltip.segment.details?.length ? <small>Includes: {tooltip.segment.details.slice(0, 8).join(", ")}{tooltip.segment.details.length > 8 ? ` +${tooltip.segment.details.length - 8} more` : ""}</small> : null}
        </div> : null}
      </div>
      <div className="dap-chart-legend">
        {display.map((segment, index) => {
          const color = allocationColor(title, segment, index)
          return <div key={segment.label}><i style={{ background: color }} /><span><b>{segment.label}</b><small>{segment.holdings} holding{segment.holdings === 1 ? "" : "s"} · {formatMoney(segment.value.toFixed())}</small></span><strong>{segment.weight.toDecimalPlaces(1).toFixed(1)}%</strong></div>
        })}
      </div>
    </div>
  </section>
}

function PerformanceTable({ title, rows, empty, groupHoldings }: { title: string; rows: readonly GroupRow[]; empty: string; groupHoldings?: ReadonlyMap<string, readonly HoldingDetail[]> }) {
  const [sortKey, setSortKey] = useState<SortKey>("weight")
  const [direction, setDirection] = useState<Direction>("desc")
  const [popover, setPopover] = useState<HoldingsPopoverState | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sorted = useMemo(() => sortRows(rows, sortKey, direction), [rows, sortKey, direction])
  const choose = (key: SortKey) => {
    if (key === sortKey) setDirection((value) => value === "desc" ? "asc" : "desc")
    else { setSortKey(key); setDirection("desc") }
  }
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  const closeSoon = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setPopover(null), 140)
  }
  const openHoldings = (event: ReactMouseEvent<HTMLElement>, row: GroupRow) => {
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
    <div className="dap-table-scroll"><table><thead><tr><th>Group</th><th><button onClick={() => choose("holdings")}>Holdings</button></th><th><button onClick={() => choose("weight")}>Weight</button></th><th>Invested</th><th>Current value</th><th><button onClick={() => choose("pnl")}>Unrealised P&amp;L</button></th><th><button onClick={() => choose("return")}>Return</button></th><th><button onClick={() => choose("impact")}>Return contribution</button></th></tr></thead>
      <tbody>{sorted.map((row) => {
        const interactive = Boolean(groupHoldings?.get(row.label)?.length)
        return <tr key={row.label}>
          <td>{interactive ? <button className="dap-group-trigger" type="button" aria-haspopup="dialog" onMouseEnter={(event) => openHoldings(event, row)} onMouseLeave={closeSoon} onFocus={(event) => openHoldings(event, row)} onBlur={closeSoon} onClick={(event) => openHoldings(event, row)}>{row.label}</button> : <strong>{row.label}</strong>}<small>{row.priced}/{row.holdings} priced · {row.accountingCovered}/{row.holdings} accounting covered</small></td>
          <td>{interactive ? <button className="dap-holdings-trigger" type="button" aria-label={`Show ${row.holdings} holdings in ${row.label}`} onMouseEnter={(event) => openHoldings(event, row)} onMouseLeave={closeSoon} onFocus={(event) => openHoldings(event, row)} onBlur={closeSoon} onClick={(event) => openHoldings(event, row)}>{row.holdings}</button> : row.holdings}</td>
          <td>{row.weight.toDecimalPlaces(1).toFixed(1)}%</td><td>{formatMoney(row.accountingCovered ? row.totalCost.toFixed() : null)}</td><td>{formatMoney(row.priced ? row.currentValue.toFixed() : null)}</td><td className={row.coveredPnl.gt(0) ? "is-positive" : row.coveredPnl.lt(0) ? "is-negative" : ""}>{row.accountingCovered ? formatMoney(row.coveredPnl.toFixed()) : "—"}</td><td className={row.returnPct?.gt(0) ? "is-positive" : row.returnPct?.lt(0) ? "is-negative" : ""}>{signed(row.returnPct)}</td><td className={row.contributionPctPoints?.gt(0) ? "is-positive" : row.contributionPctPoints?.lt(0) ? "is-negative" : ""}>{signed(row.contributionPctPoints, " pp")}</td>
        </tr>
      })}</tbody></table></div>
    {popover ? <div className="dap-holdings-popover" role="dialog" aria-label={`${popover.label} holdings`} style={{ left: popover.x, top: popover.y }} onMouseEnter={cancelClose} onMouseLeave={closeSoon}>
      <div className="dap-holdings-popover-head"><div><strong>{popover.label}</strong><span>{popover.holdings.length} holdings · return descending</span></div><button type="button" aria-label="Close holdings popover" onClick={() => setPopover(null)}>×</button></div>
      <div className="dap-holdings-popover-scroll"><table><thead><tr><th>Stock</th><th>Return</th><th>P&amp;L</th><th>Current value</th></tr></thead><tbody>{popover.holdings.map((holding) => <tr key={holding.securityId}><td><b>{holding.symbol}</b><small>{holding.company}</small></td><td className={holding.returnPct?.gt(0) ? "is-positive" : holding.returnPct?.lt(0) ? "is-negative" : ""}>{signed(holding.returnPct)}</td><td className={holding.unrealisedPnl?.gt(0) ? "is-positive" : holding.unrealisedPnl?.lt(0) ? "is-negative" : ""}>{holding.unrealisedPnl === null ? "—" : formatMoney(holding.unrealisedPnl.toFixed())}</td><td>{holding.currentValue === null ? "—" : formatMoney(holding.currentValue.toFixed())}</td></tr>)}</tbody></table></div>
    </div> : null}
  </section>
}

export function DashboardAllocationPerformance() {
  const { portfolio, isLoading, error } = usePortfolioView()
  const enrichment = usePortfolioEnrichment(portfolio?.openPositions.map((p) => p.securityId) ?? [])
  if (isLoading || error || !portfolio) return null
  const positions = portfolio.openPositions
  const equityPositions = positions.filter((p) => p.assetClass !== "ETF")
  const sectorClassified = equityPositions.filter((p) => Boolean(enrichment.bySecurityId.get(p.securityId)?.sector?.trim())).length
  const marketCapClassifiedEquities = equityPositions.filter((p) => ["LARGE_CAP", "MID_CAP", "SMALL_CAP"].includes(enrichment.bySecurityId.get(p.securityId)?.marketCapCategory ?? "")).length
  const etfCount = positions.filter((p) => p.assetClass === "ETF").length
  const sectorRows = buildGroups(positions, enrichment.bySecurityId, "sector")
  const marketCapRows = buildGroups(positions, enrichment.bySecurityId, "marketCap")
  const sectorSegments = buildAllocationSegments(positions, enrichment.bySecurityId, "sector")
  const marketCapSegments = buildAllocationSegments(positions, enrichment.bySecurityId, "marketCap")
  const sectorGroupHoldings = buildGroupHoldings(positions, enrichment.bySecurityId, "sector")
  const sectorCoverage = coveragePct(sectorClassified, equityPositions.length)
  const marketCapCoverage = coveragePct(marketCapClassifiedEquities, equityPositions.length)
  const classificationIncomplete = sectorClassified < equityPositions.length || marketCapClassifiedEquities < equityPositions.length

  return <section className="dashboard-allocation-performance" aria-label="Sector and market-cap performance">
    <div className="dap-heading"><div><p className="eyebrow">Allocation &amp; performance</p><h2>Sector and market-cap performance</h2><p>Classification-backed allocation and supported return aggregation. Missing classifications are excluded rather than guessed.</p></div><span>Consolidated portfolio</span></div>
    <div className="dap-coverage-grid">
      <article><small>Sector classification</small><strong>{sectorCoverage}</strong><p>{sectorClassified}/{equityPositions.length} non-ETF holdings classified</p></article>
      <article><small>Market-cap classification</small><strong>{marketCapCoverage}</strong><p>{marketCapClassifiedEquities}/{equityPositions.length} non-ETF holdings classified</p></article>
      <article><small>ETF bucket</small><strong>{etfCount}</strong><p>ETFs are shown separately from equity market-cap categories</p></article>
      <article><small>Enrichment state</small><strong>{enrichment.state.replaceAll("_", " ")}</strong><p>Canonical stored enrichment only</p></article>
    </div>
    {classificationIncomplete ? <div className="dap-warning"><strong>Classification coverage is intentionally partial.</strong><span> PortfolioAI shows only canonical trusted evidence; unresolved or missing source identities remain Unclassified rather than being guessed.</span></div> : null}
    <div className="dap-chart-grid">
      <AllocationDonut title="Sector allocation" segments={sectorSegments} classifiedCoverage={sectorCoverage} empty="Sector allocation will appear when trusted sector classifications and current prices are available." />
      <AllocationDonut title="Market-cap allocation" segments={marketCapSegments} classifiedCoverage={marketCapCoverage} empty="Market-cap allocation will appear when trusted classifications and current prices are available." />
    </div>
    <div className="dap-table-grid">
      <PerformanceTable title="Sector performance" rows={sectorRows} groupHoldings={sectorGroupHoldings} empty="No trusted sector classifications are stored yet." />
      <PerformanceTable title="Market-cap performance" rows={marketCapRows} empty="No trusted market-cap categories are stored yet. ETFs will appear independently when present." />
    </div>
    <p className="dap-method">Allocation donuts use current priced value and explicitly retain ETF / Unclassified slices so missing evidence is visible. Sector donut slices are shown individually from 1.5% portfolio weight upward; smaller sectors are grouped into Other sectors. Hover a donut slice for its allocation details; hover a sector name or holdings count to inspect the constituent stocks sorted by return. Return = supported unrealised P&amp;L ÷ supported invested cost within that group. Return contribution is the group P&amp;L divided by total supported portfolio cost, expressed in percentage points. Coverage remains explicit.</p>
  </section>
}