import { PharmaResearchReadinessPanel } from "./PharmaResearchReadinessPanel"
import { ResearchSectionScore } from "./ResearchSectionScore"
import { GROWTH_CODES, OWNERSHIP_CODES, QUALITY_CODES, VALUATION_CODES, coverageStatus, formatResearchMetric, latestByCode, metricLabel } from "./researchPolicy"
import { researchProfileUiContract, type ResearchWorkspaceSection } from "./researchProfileUiContract"
import type { ResearchEvidenceStatus, ResearchMetric, SecurityResearch } from "./types"
import type { SecurityScoringSnapshot } from "./scoringTypes"
import "./ResearchEvidenceWorkspace.css"

function title(value: string) { return value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase()) }
function date(value: string | null) { if (!value) return "—"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "—" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsed) }
function period(metric: ResearchMetric) { return [metric.periodType ? title(metric.periodType) : null, metric.periodEnd ? date(metric.periodEnd) : null].filter(Boolean).join(" · ") || "Period unavailable" }
function Status({ value }: { readonly value: ResearchEvidenceStatus }) { return <span className={`evidence-badge evidence-${value.toLocaleLowerCase()}`}>{value.replaceAll("_", " ")}</span> }

function latestPerCodePeriod(rows: readonly ResearchMetric[]) {
  const sorted = [...rows].sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt))
  const seen = new Set<string>()
  return sorted.filter((row) => {
    const key = `${row.code}|${row.periodType ?? ""}|${row.periodEnd ?? ""}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function latestCards(rows: readonly ResearchMetric[], empty: string) {
  const latest = latestByCode(rows)
  const cards = [...latest.values()].sort((a, b) => a.label.localeCompare(b.label))
  if (!cards.length) return <div className="data-empty"><strong>Unavailable</strong><p>{empty}</p></div>
  return <div className="professional-metric-grid">{cards.map((metric) => <article key={metric.code}>
    <div><span>{metric.label}</span><Status value={coverageStatus(metric)} /></div>
    <strong>{formatResearchMetric(metric)}</strong>
    <small>{period(metric)}</small>
    <em>{metric.provider}</em>
  </article>)}</div>
}

function profileSectionCards(section: ResearchWorkspaceSection, latest: ReadonlyMap<string, ResearchMetric>) {
  return <section className="professional-panel" key={section.title}>
    <header><div><h3>{section.title}</h3><p>{section.subtitle}</p></div><span>{section.codes.filter((code) => latest.has(code)).length}/{section.codes.length} available</span></header>
    <div className="professional-metric-grid compact">{section.codes.map((code) => {
      const metric = latest.get(code)
      return <article key={code} className={!metric ? "metric-missing" : ""}>
        <div><span>{metric?.label ?? metricLabel(code)}</span><Status value={coverageStatus(metric)} /></div>
        <strong>{metric ? formatResearchMetric(metric) : "—"}</strong>
        <small>{metric ? period(metric) : "No cached observation"}</small>
        {metric ? <em>{metric.provider}</em> : null}
      </article>
    })}</div>
  </section>
}

function HistoryTable({ rows, columns }: { readonly rows: readonly ResearchMetric[]; readonly columns?: readonly string[] }) {
  const clean = latestPerCodePeriod(rows)
  if (!clean.length) return null
  const filtered = columns?.length ? clean.filter((row) => columns.includes(row.code)) : clean
  if (!filtered.length) return null
  return <details className="evidence-history" open={false}>
    <summary><strong>Evidence history</strong><span>{filtered.length} period-qualified observations</span><b>Show history</b></summary>
    <div className="professional-table-wrap"><table className="professional-table"><thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Status</th><th>Source</th></tr></thead><tbody>{filtered.map((metric) => <tr key={`${metric.code}-${metric.periodType}-${metric.periodEnd}`}><td><strong>{metric.label}</strong><small>{metric.code}</small></td><td>{formatResearchMetric(metric)}</td><td>{period(metric)}</td><td><Status value={metric.status} /></td><td>{metric.provider}</td></tr>)}</tbody></table></div>
  </details>
}

function metricGroup(metric: ResearchMetric) {
  const code = metric.code.toUpperCase()
  if (/NPA|NIM|CET1|CAPITAL_ADEQUACY|TIER_1|TIER_2/u.test(code)) return "Asset quality & capital"
  if (/ROE|ROCE|OPM|MARGIN|PROFIT|EBITDA/u.test(code)) return "Profitability & returns"
  if (/GROWTH/u.test(code)) return "Growth"
  if (/EPS|REVENUE|CFO|CASH_FLOW/u.test(code)) return "Earnings & cash evidence"
  return "Other fundamentals"
}

export function FinancialsWorkspace({ research, snapshot }: { readonly research: SecurityResearch; readonly snapshot: SecurityScoringSnapshot | null }) {
  const ui = researchProfileUiContract(snapshot?.profileCode)
  const rows = research.metrics.filter((metric) => !OWNERSHIP_CODES.has(metric.code) && !VALUATION_CODES.has(metric.code))
  const latest = latestByCode(rows)

  if (ui.financialWorkspaceSections.length) {
    const sectionCodes = ui.financialWorkspaceSections.flatMap((section) => section.codes)
    return <><ResearchSectionScore snapshot={snapshot} section="FINANCIALS" />
      {ui.readinessPanel === "PHARMA_V1" ? <PharmaResearchReadinessPanel research={research} /> : null}
      <div className="workspace-heading"><div><p className="eyebrow">Profile-specific financial evidence</p><h2>{snapshot?.profileName ?? ui.profileCode} financial dashboard</h2><p>The page structure stays consistent while this profile selects the financial evidence that matters for its business model.</p></div></div>
      <div className="financial-group-grid">{ui.financialWorkspaceSections.map((section) => profileSectionCards(section, latest))}</div>
      <HistoryTable rows={rows} columns={sectionCodes} />
    </>
  }

  const groups = new Map<string, ResearchMetric[]>()
  for (const metric of latest.values()) {
    const group = metricGroup(metric)
    groups.set(group, [...(groups.get(group) ?? []), metric])
  }
  const order = ["Profitability & returns", "Asset quality & capital", "Growth", "Earnings & cash evidence", "Other fundamentals"]
  return <><ResearchSectionScore snapshot={snapshot} section="FINANCIALS" />
    <div className="workspace-heading"><div><p className="eyebrow">Financial evidence</p><h2>Financial strength dashboard</h2><p>Latest trusted observations are grouped by investment purpose; history remains available without cluttering the main view.</p></div></div>
    <div className="financial-group-grid">{order.flatMap((name) => { const metrics = groups.get(name) ?? []; return metrics.length ? [<section key={name} className="professional-panel"><h3>{name}</h3>{latestCards(metrics, "No evidence available")}</section>] : [] })}</div>
    <HistoryTable rows={rows} />
  </>
}

export function QualityGrowthWorkspace({ research, snapshot }: { readonly research: SecurityResearch; readonly snapshot: SecurityScoringSnapshot | null }) {
  const ui = researchProfileUiContract(snapshot?.profileCode)
  const latest = latestByCode(research.metrics)

  if (ui.qualityGrowthWorkspaceSections.length) {
    const sectionCodes = ui.qualityGrowthWorkspaceSections.flatMap((section) => section.codes)
    return <><ResearchSectionScore snapshot={snapshot} section="QUALITY_GROWTH" />
      <div className="workspace-heading"><div><p className="eyebrow">Profile-specific business performance</p><h2>Quality, Growth & Durability</h2><p>{snapshot?.profileName ?? ui.profileCode} uses its own evidence contract inside the same PortfolioAI Research workflow.</p></div></div>
      <div className="quality-growth-grid">{ui.qualityGrowthWorkspaceSections.map((section) => profileSectionCards(section, latest))}</div>
      <HistoryTable rows={research.metrics} columns={sectionCodes} />
    </>
  }

  const groups = [{ title: "Quality", subtitle: "Durability, profitability and operating strength", codes: [...QUALITY_CODES] }, { title: "Growth", subtitle: "Earnings and business expansion", codes: [...GROWTH_CODES] }]
  return <><ResearchSectionScore snapshot={snapshot} section="QUALITY_GROWTH" />
    <div className="workspace-heading"><div><p className="eyebrow">Business performance</p><h2>Quality & Growth</h2><p>Reviewed evidence is separated into quality and growth so a strong company is not confused with a fast-growing company.</p></div></div>
    <div className="quality-growth-grid">{groups.map((group) => <section className="professional-panel" key={group.title}><header><div><h3>{group.title}</h3><p>{group.subtitle}</p></div><span>{group.codes.filter((code) => latest.has(code)).length}/{group.codes.length} available</span></header><div className="professional-metric-grid compact">{group.codes.map((code) => { const metric = latest.get(code); return <article key={code} className={!metric ? "metric-missing" : ""}><div><span>{metric?.label ?? title(code)}</span><Status value={coverageStatus(metric)} /></div><strong>{metric ? formatResearchMetric(metric) : "—"}</strong><small>{metric ? period(metric) : "No cached observation"}</small>{metric ? <em>{metric.provider}</em> : null}</article> })}</div></section>)}</div>
    <HistoryTable rows={research.metrics.filter((metric) => QUALITY_CODES.has(metric.code) || GROWTH_CODES.has(metric.code))} />
  </>
}

const OWNERSHIP_ORDER = ["SHAREHOLDING_PROMOTER_PERCENT", "SHAREHOLDING_FII_FPI_PERCENT", "SHAREHOLDING_DII_PERCENT", "SHAREHOLDING_MUTUAL_FUND_PERCENT", "SHAREHOLDING_PUBLIC_PERCENT", "SHAREHOLDING_PROMOTER_PLEDGE_PERCENT"]

export function OwnershipWorkspace({ research, snapshot }: { readonly research: SecurityResearch; readonly snapshot: SecurityScoringSnapshot | null }) {
  const rows = latestPerCodePeriod(research.metrics.filter((metric) => OWNERSHIP_CODES.has(metric.code)))
  const latest = latestByCode(rows)
  const periods = [...new Set(rows.map((row) => row.periodEnd).filter((value): value is string => Boolean(value)))].sort((a, b) => b.localeCompare(a))
  const rowByPeriodCode = new Map(rows.map((row) => [`${row.periodEnd}|${row.code}`, row]))
  return <><ResearchSectionScore snapshot={snapshot} section="OWNERSHIP" />
    <div className="workspace-heading"><div><p className="eyebrow">Ownership & governance</p><h2>Shareholding structure</h2><p>Current ownership is shown first; the retained quarterly series below reveals whether institutional participation is strengthening or weakening.</p></div><div className="workspace-stat"><strong>{periods.length}</strong><span>reporting periods</span></div></div>
    <div className="ownership-snapshot">{OWNERSHIP_ORDER.map((code) => { const metric = latest.get(code); return <article key={code}><span>{metric?.label ?? title(code.replace("SHAREHOLDING_", ""))}</span><strong>{metric ? formatResearchMetric(metric) : "—"}</strong><small>{metric ? period(metric) : "Unavailable"}</small><Status value={coverageStatus(metric)} /></article> })}</div>
    {periods.length ? <section className="professional-panel ownership-trend"><header><div><h3>Quarterly ownership trend</h3><p>One selected observation per metric and reporting period; repeated ingestion copies are hidden here and remain in Evidence.</p></div></header><div className="professional-table-wrap"><table className="professional-table ownership-table"><thead><tr><th>Quarter</th>{OWNERSHIP_ORDER.map((code) => <th key={code}>{latest.get(code)?.label ?? title(code.replace("SHAREHOLDING_", ""))}</th>)}</tr></thead><tbody>{periods.map((periodEnd) => <tr key={periodEnd}><td><strong>{date(periodEnd)}</strong></td>{OWNERSHIP_ORDER.map((code) => { const metric = rowByPeriodCode.get(`${periodEnd}|${code}`); return <td key={code}>{metric ? formatResearchMetric(metric) : "—"}</td> })}</tr>)}</tbody></table></div></section> : null}
  </>
}

function valuationBucket(code: string) {
  if (/SELF_HISTORY|5Y|3Y/u.test(code)) return "Historical context"
  if (/PE|PBV|PRICE_TO|YIELD|EV_EBITDA/u.test(code)) return "Market multiples"
  if (/MARKET_CAP/u.test(code)) return "Market context"
  return "Other valuation evidence"
}

export function ValuationWorkspace({ research, snapshot }: { readonly research: SecurityResearch; readonly snapshot: SecurityScoringSnapshot | null }) {
  const ui = researchProfileUiContract(snapshot?.profileCode)
  const rows = research.metrics.filter((metric) => VALUATION_CODES.has(metric.code))
  const primaryRows = ui.profileCode === "PHARMA_V1" ? rows.filter((metric) => metric.code !== "PBV_ADJUSTED_PROVIDER") : rows
  const latest = [...latestByCode(primaryRows).values()]
  const buckets = new Map<string, ResearchMetric[]>()
  for (const metric of latest) { const bucket = valuationBucket(metric.code); buckets.set(bucket, [...(buckets.get(bucket) ?? []), metric]) }
  return <><ResearchSectionScore snapshot={snapshot} section="VALUATION" />
    <div className="workspace-heading"><div><p className="eyebrow">Valuation</p><h2>Price versus value context</h2><p>Verified valuation signals are separated from provider-only or conflicting observations. PortfolioAI does not treat an implied-upside field as a target price.</p></div></div>
    <div className="valuation-groups">{["Market multiples", "Historical context", "Market context", "Other valuation evidence"].flatMap((name) => { const metrics = buckets.get(name) ?? []; return metrics.length ? [<section key={name} className="professional-panel"><h3>{name}</h3>{latestCards(metrics, "No evidence available")}</section>] : [] })}</div>
    <HistoryTable rows={rows} />
  </>
}
