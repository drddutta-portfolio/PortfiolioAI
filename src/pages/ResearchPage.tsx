import "../features/research/StockResearchShell.css"
import { StockSectionNavigator } from "../features/research/StockSectionNavigator"
import "../features/research/ResearchWorkspaceShell.css"
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { Link, useParams } from "react-router-dom"
import { ProgramCR10AttentionBadge } from "../components/ProgramCR10AttentionBadge"
import type { ProgramCR10AttentionView } from "../features/decision/r10ActionCenterViewModel"
import { useProgramCR10ActionCenter } from "../features/decision/useProgramCR10ActionCenter"
import { financialClass, financialTone, formatMoney, formatPercent, formatQuantity } from "../features/portfolio/format"
import type { PortfolioPosition } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { CompanyAboutPanel } from "../features/research/CompanyAboutPanel"
import { CompleteResearchRefreshPanel } from "../features/research/CompleteResearchRefreshPanel"
import { PharmaResearchWorkspacePanel } from "../features/research/PharmaResearchWorkspacePanel"
import { StockResearchClassification } from "../features/research/StockResearchClassification"
import { FinancialsWorkspace, OwnershipWorkspace, QualityGrowthWorkspace, ValuationWorkspace } from "../features/research/ResearchEvidenceWorkspace"
import { CanonicalEvidenceReadinessPanel } from "../features/research/CanonicalEvidenceReadinessPanel"
import { PositionDecisionControls } from "../features/research/PositionDecisionControls"
import { latestByCode, metricLabel, coverageStatus, formatSourceResearchMetric } from "../features/research/researchPolicy"
import { researchSnapshotGroups } from "../features/research/researchPresentationPolicy"
import { researchProfileDisplayName } from "../features/research/researchProfileUiContract"
import { isQualifiedResearchScore } from "../features/research/researchScoreEligibility"
import { buildProgramBR6ScoringPresentation, type ProgramBR6ScoringPresentation } from "../features/research/programBR6Presentation"
import { ResearchScorecardPanel } from "../features/research/ResearchScorecardPanel"
import type { ResearchEvidenceStatus, ResearchMetric, SecurityResearch } from "../features/research/types"
import { ResearchTrackingHistory } from "../features/research/ResearchTrackingHistory"
import { ResearchAssignmentSummary } from "../features/research/ResearchAssignmentSummary"
import { ProfileResearchBlocks } from "../features/research/ProfileResearchBlocks"
import { useExternalRatings } from "../features/research/useExternalRatings"
import { useSecurityResearch } from "../features/research/useSecurityResearch"
import { useStockResearchContext } from "../features/research/useStockResearchContext"
import { canonicalPharmaPrimary } from "../features/research/canonicalResearchAssignment"
import type { CanonicalEvidenceReadiness } from "../features/research/useCanonicalEvidenceReadiness"
import { useSecurityScoring } from "../features/research/useSecurityScoring"

import { STOCK_RESEARCH_TABS as TABS, STOCK_RESEARCH_TAB_TARGETS, stockResearchTabForHash, jumpToStockSection } from "../features/research/stockResearchNavigation"
type Tab = typeof TABS[number]

type ScoringHook = ReturnType<typeof useSecurityScoring>
type ResearchScoreContext = { readonly programB: ProgramBR6ScoringPresentation | null; readonly hasPharmaResolution: boolean; readonly evidence: CanonicalEvidenceReadiness }

export function ResearchPage() {
  const { security } = useParams()
  const { portfolio, error: portfolioError, isLoading: portfolioLoading, reload: reloadPortfolio } = usePortfolioView()
  const actionCenter = useProgramCR10ActionCenter(portfolio)
  const position = portfolio?.openPositions.find((item) => item.securityId === security || item.symbol.toLocaleUpperCase() === security?.toLocaleUpperCase()) ?? null
  const actionAttention = position
    ? actionCenter.data?.view.find((item) => item.securityId === position.securityId) ?? null
    : null
  const research = useSecurityResearch(position?.securityId ?? null)
  const context = useStockResearchContext({ securityId: position?.securityId ?? null, sector: research.data?.sector ?? position?.sector ?? null, industry: research.data?.industry ?? position?.industry ?? null, portfolioId: portfolio?.portfolio.id ?? null, assetClass: position?.assetClass ?? null })
  const { scoring, evidence } = context
  const programB = scoring.data && position ? buildProgramBR6ScoringPresentation({ securityId: position.securityId, snapshot: scoring.data, pharmaResolution: null }) : null
  const hasPharmaResolution = canonicalPharmaPrimary(scoring.data) !== null
  const [tab, setTab] = useState<Tab>(() => stockResearchTabForHash(window.location.hash))
  const focusPanel = useRef(false)
  const changeTab = useCallback((next: Tab) => {
    window.history.replaceState(window.history.state, "", `#${STOCK_RESEARCH_TAB_TARGETS[next]}`)
    setTab(next)
  }, [])
  useEffect(() => {
    if (focusPanel.current) {
      jumpToStockSection(STOCK_RESEARCH_TAB_TARGETS[tab], document.querySelector<HTMLElement>(".stock-section-navigator"), "research-panel")
      focusPanel.current = false
    }
  }, [tab])
  const viewTab = (next: Tab) => { focusPanel.current = true; changeTab(next) }
  if (portfolioLoading) return <Loading label="Loading cached portfolio context…" />
  if (portfolioError) return <div className="notice notice-error" role="alert">{portfolioError}</div>
  if (!position || !portfolio) return <ResearchNotFound />
  return <section className="research-page">
    <StockSectionNavigator activeTab={tab} onTabChange={changeTab} hasSpecialist hasResearch />
    <ResearchHeader programB={programB} position={position} research={research.data} scoring={scoring} currency={portfolio.portfolio.currency} portfolioId={portfolio.portfolio.id} actionAttention={actionAttention} onPositionSaved={reloadPortfolio} />
    <div id="stock-refresh" tabIndex={-1}><CompleteResearchRefreshPanel portfolioId={portfolio.portfolio.id} securityId={position.securityId} symbol={position.symbol} profileCode={scoring.data?.profileCode} onCompleted={() => { research.reload(); context.reload() }} /></div>
    <ResearchTabs value={tab} onChange={changeTab} />
    <div id="stock-workspace" tabIndex={-1}>
    <div id={tab === "Overview" ? undefined : STOCK_RESEARCH_TAB_TARGETS[tab]} tabIndex={-1}>
    {tab === "Evidence" ? <CanonicalEvidenceReadinessPanel evidence={evidence} portfolioId={portfolio.portfolio.id} securityId={position.securityId} assetClass={position.assetClass} /> : null}
    {research.isLoading ? <Loading label="Loading cached research evidence…" /> : research.error ? <div className="notice notice-error" role="alert"><strong>Cached research could not be loaded.</strong><span>{research.error}</span></div> : !research.data ? <Empty title="Cached research unavailable" detail="No retained research was returned for this security." /> : null}
    <TabPanel evidence={evidence} programB={programB} hasPharmaResolution={hasPharmaResolution} tab={tab} position={position} research={research.isLoading || research.error ? null : research.data} scoring={scoring} portfolioId={portfolio.portfolio.id} onTabChange={viewTab} />
    </div>
    </div>
  </section>
}

export function ResearchIndexPage() {
  const { portfolio, error, isLoading } = usePortfolioView()
  const [query, setQuery] = useState("")
  const positions = useMemo(() => (portfolio?.openPositions ?? []).filter((position) => `${position.symbol} ${position.company}`.toLocaleUpperCase().includes(query.trim().toLocaleUpperCase())), [portfolio, query])
  if (isLoading) return <Loading label="Loading research coverage…" />
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Research coverage could not be loaded."}</div>
  return <section className="research-page"><div className="portfolio-hero compact-hero"><div><p className="eyebrow">Cached evidence library</p><h1>Research</h1><p>Open a current holding to inspect its trusted cached research evidence. Browsing this workspace never refreshes a provider.</p></div></div><section className="panel"><label className="research-search"><span>Find a security</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ticker or company" /></label><div className="research-directory">{positions.map((position) => <Link key={position.securityId} to={`/app/research/${position.securityId}`}><span><strong>{position.symbol}</strong>{position.company}</span><small>{position.exchange} · {position.assetClass} · {position.sector ?? "Sector awaiting canonical classification"}</small></Link>)}</div>{!positions.length ? <Empty title="No matching securities" detail="Adjust the search to find a current holding." /> : null}</section></section>
}

function ResearchHeader({ programB, position, research, scoring, currency, portfolioId, actionAttention, onPositionSaved }: { readonly position: PortfolioPosition; readonly research: SecurityResearch | null; readonly scoring: ScoringHook; readonly currency: string; readonly portfolioId: string; readonly actionAttention: ProgramCR10AttentionView | null; readonly onPositionSaved: () => void; readonly programB: ProgramBR6ScoringPresentation | null }) {
  const marketCap = latestByCode(research?.metrics ?? []).get("MARKET_CAP_PROVIDER_RAW")
  const brokers = position.brokerExposure ?? []
  const sector = research?.sector ?? position.sector
  const industry = research?.industry ?? position.industry
  return <header id="stock-summary" tabIndex={-1} className="research-header">
    <div className="research-title"><Link to="/app/research" className="research-back">← Research</Link><h1>{research?.companyName ?? position.company}</h1><p className="security-identity-line"><strong>{position.symbol}</strong> · {position.exchange} · {titleCase(position.instrumentType)} · {titleCase(position.assetClass)}</p><StockResearchClassification sector={sector} industry={industry} snapshot={scoring.data} isLoading={scoring.isLoading} error={scoring.error} /><ResearchAssignmentSummary sector={sector} industry={industry} snapshot={scoring.data} isLoading={scoring.isLoading} error={scoring.error} /><p>{research?.marketCapCategory ? titleCase(research.marketCapCategory) : "Market-cap category unavailable"}</p><p><strong>Your portfolio role:</strong> {position.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(position.role)}</p><p className="raw-market-cap">Market cap: {formatSourceResearchMetric(marketCap)}</p><div className="identity-chips" aria-label="Themes">{position.themes.length ? position.themes.map((theme) => <span key={theme.id}>{theme.name}</span>) : <span>No themes</span>}</div></div>
    <CompanyAboutPanel portfolioId={portfolioId} securityId={position.securityId} symbol={position.symbol} companyName={research?.companyName ?? position.company} />
    <section id="stock-position" tabIndex={-1} className="position-dashboard" aria-labelledby="position-dashboard-title"><h2 id="position-dashboard-title">Your position</h2><div className="research-head-metrics">
      <MetricCard label="Current price / CMP" value={formatMoney(position.currentPrice, currency)} detail={position.currentPrice === null ? "Unavailable" : `${position.isPriceStale ? "Stale price" : "Current cache"} · ${position.priceProvider ?? "Provider unavailable"} · ${position.priceTimestamp ? dateTime(position.priceTimestamp) : "Timestamp unavailable"}`} />
      <MetricCard label="Total quantity" value={formatQuantity(position.quantity)} />
      <MetricCard label="Average cost" value={formatMoney(position.averageCost, currency)} detail={titleCase(position.accountingBasis)} />
      <MetricCard label="Portfolio weight" value={formatPercent(position.portfolioWeightPercent)} />
      <MetricCard label="Invested amount" value={formatMoney(position.investedAmount, currency)} detail="Cost basis" />
      <MetricCard label="Current value" value={formatMoney(position.currentValue, currency)} detail="At cached CMP" />
      <PnlCard position={position} currency={currency} />
      <article className="research-metric-card broker-card"><span>Brokers / demat</span><div className="broker-chips">{brokers.length ? brokers.map((broker) => <span key={broker.broker} title={`${formatQuantity(broker.quantity)} shares`}>{broker.broker}</span>) : <strong>Unavailable</strong>}</div><small>{brokers.length ? `${brokers.length} account${brokers.length === 1 ? "" : "s"}` : "Attribution incomplete"}</small></article>
    </div></section>
    <div className="research-decision-layout">
      <section id="stock-plan" tabIndex={-1} className="research-decision-workspace" aria-labelledby="decision-workspace-title">
        <div className="research-decision-heading">
          <div><p className="eyebrow">Decision controls</p><h2 id="decision-workspace-title">Decision Workspace</h2><p>Your saved investment plan and PortfolioAI current read-only decision state stay separate.</p></div>
        </div>
        <div className="research-decision-body">
          <PositionDecisionControls key={`${portfolioId}:${position.securityId}`} portfolioId={portfolioId} securityId={position.securityId} currentRole={position.role} currentWeight={position.portfolioWeightPercent} fallbackTargetWeight={position.settings.targetWeight} fallbackInvestmentHorizon={position.settings.investmentHorizon} currency={currency} onSaved={onPositionSaved} />
          <ResearchDecisionState programB={programB} position={position} scoring={scoring} attention={actionAttention} />
        </div>
      </section>
      <section className="research-interpretation" aria-label="AI Interpretation"><div><p className="eyebrow">AI Interpretation</p><h3>Explain a qualified recommendation</h3><p>Not ready: a qualified recommendation and authorized interpretation capability are required.</p></div><button type="button" className="button button-secondary" disabled>Generate AI interpretation</button></section>
      <ResearchKeyInsights key={`${portfolioId}:${position.securityId}`} portfolioId={portfolioId} position={position} scoring={scoring} attention={actionAttention} />
    </div>
  </header>
}

function ResearchDecisionState({ programB, position, scoring, attention }: { readonly programB: ProgramBR6ScoringPresentation | null; readonly position: PortfolioPosition; readonly scoring: ScoringHook; readonly attention: ProgramCR10AttentionView | null }) {
  const snapshot = scoring.data
  const profileDisplayName = scoring.isLoading ? "Loading…" : scoring.error ? "Unavailable" : snapshot ? researchProfileDisplayName(snapshot) : "Unavailable"
  const currentScore = isQualifiedResearchScore(snapshot, scoring.isLoading, scoring.error, programB) ? snapshot!.overallScore!.toFixed(0) : null
  const evidence = snapshot?.evidenceCoverage == null ? "Unavailable" : `${Math.round(snapshot.evidenceCoverage * 100)}%`
  const readiness = snapshot?.scoreReadyCoverage == null ? "Unavailable" : `${Math.round(snapshot.scoreReadyCoverage * 100)}%`
  const advisoryState = attention?.stateLabel ?? "Unavailable"
  return <section className="portfolioai-state-panel" aria-label="PortfolioAI current decision state">
    <div className="portfolioai-state-heading">
      <div className="portfolioai-state-title-wrap">
        <span className="portfolioai-state-icon" aria-hidden="true">✦</span>
        <div><span>PortfolioAI suggestion</span><h3>{advisoryState}</h3><p>{snapshot ? `${profileDisplayName} · current canonical research state` : scoring.isLoading ? "Evaluating canonical research state…" : "Canonical research state unavailable"}</p></div>
      </div>
      <ProgramCR10AttentionBadge attention={attention} compact />
    </div>
    <div className="portfolioai-primary-state">
      <div><span>Current advisory state</span><strong>{advisoryState}</strong><small>{attention?.primaryReason ?? "Awaiting a complete, validated decision state."}</small></div>
      <div><span>Canonical score</span><strong>{currentScore ?? "Not ready"}</strong><small>{currentScore ? "Current authoritative run" : "No current score run"}</small></div>
    </div>
    <div className="portfolioai-state-grid">
      <article><span>Verified evidence</span><strong>{evidence}</strong><small>Current research coverage</small></article>
      <article><span>Score readiness</span><strong>{readiness}</strong><small>Validated score-ready coverage</small></article>
      <article><span>Methodology</span><strong>{snapshot?.methodologyState === "AVAILABLE" ? "Available" : snapshot?.methodologyState ? titleCase(snapshot.methodologyState) : scoring.isLoading ? "Loading…" : "Unavailable"}</strong><small>{snapshot?.profileName ?? (scoring.isLoading ? "Canonical profile loading" : "Canonical profile unavailable")}</small></article>
      <article><span>Profile</span><strong>{profileDisplayName}</strong><small>{snapshot?.profileSource === "REVIEWED_ASSIGNMENT" ? "Reviewed assignment" : snapshot?.profileSource === "SECTOR_RULE" ? "Sector resolved" : "Canonical profile"}</small></article>
    </div>
    <div className="portfolioai-advisory-slots"><article><span>Suggested role</span><strong>Not ready</strong><small>No qualified role recommendation supplied</small></article><article><span>Suggested weight range</span><strong>Not available</strong><small>Numeric sizing capability is not approved</small></article><article><span>Current weight / Your target</span><strong>{formatPercent(position.portfolioWeightPercent)} / {position.settings.targetWeight === null ? "Not set" : formatPercent(position.settings.targetWeight)}</strong></article><article><span>Portfolio context</span><strong>{attention?.stateLabel ?? "Unavailable"}</strong><small>{attention?.primaryReason ?? "No qualified portfolio context"}</small></article></div>
    <details className="advisory-reasons"><summary>Why is this advisory state shown?</summary><p>{attention?.primaryReason ?? "No current qualified recommendation is available."}</p>{attention?.reasonLabels.map(reason => <p key={reason}>{reason}</p>)}{attention?.conflictLabels.map(reason => <p key={reason}>{reason}</p>)}</details>
    <details className="advisory-reasons"><summary>Weight range prerequisites</summary><p>A qualified portfolio-aware sizing output is required. Owner targets are independent saved settings.</p></details>
    <p className="portfolioai-state-note">Read-only advisory. PortfolioAI never overwrites your saved role, target weight, target price, stop-loss reference, or investment horizon.</p>
  </section>
}

function ResearchKeyInsights({ position, scoring, attention, portfolioId }: { readonly position: PortfolioPosition; readonly scoring: ScoringHook; readonly attention: ProgramCR10AttentionView | null; readonly portfolioId: string }) {
  const snapshot = scoring.data
  const evidence = snapshot?.evidenceCoverage == null ? "Unavailable" : `${Math.round(snapshot.evidenceCoverage * 100)}%`
  const readiness = snapshot?.scoreReadyCoverage == null ? "Unavailable" : `${Math.round(snapshot.scoreReadyCoverage * 100)}%`
  const role = position.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(position.role)
  return <aside id="stock-insights" tabIndex={-1} className="research-key-insights" aria-labelledby="key-insights-title">
    <div className="research-key-insights-title"><span aria-hidden="true">▣</span><div><h2 id="key-insights-title">Key Insights</h2><p>Quick view of the most important current research signals.</p></div></div>
    <div className="research-key-insight-list">
      <article><span>Role</span><strong>{role}</strong><small>Your saved portfolio role</small></article>
      <article><span>Action state</span><strong>{attention?.stateLabel ?? "Unavailable"}</strong><small>{attention?.primaryReason ?? "No current action state available"}</small></article>
      <article><span>Primary research caution</span><strong>{attention?.primaryReason ?? "No caution assessment available"}</strong><small>Research status is not an investment opinion</small></article><article><span>Evidence / score readiness</span><strong>{evidence} / {readiness}</strong><small>Independent coverage measures; not evidence confidence</small></article>
      <article><span>Methodology</span><strong>{snapshot?.methodologyState === "AVAILABLE" ? "Available" : snapshot?.methodologyState ? titleCase(snapshot.methodologyState) : scoring.isLoading ? "Loading…" : "Unavailable"}</strong><small>{snapshot?.profileName ?? (scoring.isLoading ? "Canonical profile loading" : "Canonical profile unavailable")}</small></article>
    </div>
    <p className="assessment-note">Tracking status and evidence confidence require a qualified current assessment; retained history is available below.</p>
    <ResearchTrackingHistory portfolioId={portfolioId} securityId={position.securityId} />
    <div className="research-readonly-advisory"><strong>Read-only advisory</strong><p>Your selected role, holdings, target weight, target price and stop-loss remain under your control.</p></div>
  </aside>
}

function ResearchTabs({ value, onChange }: { readonly value: Tab; readonly onChange: (tab: Tab) => void }) {
  const activate = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
    event.preventDefault()
    const next = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length
    onChange(TABS[next]!)
    const target = document.getElementById(`research-tab-${next}`)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView?.({ block: "nearest", inline: "nearest" })
  }
  return <div className="research-tabs" role="tablist" aria-label="Research sections">{TABS.map((tab, index) => <button id={`research-tab-${index}`} key={tab} type="button" role="tab" aria-selected={value === tab} aria-controls="research-panel" tabIndex={value === tab ? 0 : -1} onClick={() => onChange(tab)} onKeyDown={(event) => activate(event, index)}>{tab}</button>)}</div>
}

function TabPanel({ programB, hasPharmaResolution, evidence, tab, position, research, scoring, portfolioId, onTabChange }: { readonly tab: Tab; readonly position: PortfolioPosition; readonly research: SecurityResearch | null; readonly scoring: ScoringHook; readonly portfolioId: string; readonly onTabChange: (tab: Tab) => void } & ResearchScoreContext) {
  return <div id="research-panel" role="tabpanel" tabIndex={0} aria-labelledby={`research-tab-${TABS.indexOf(tab)}`} className="research-panel">
    {tab !== "Overview" && !research ? <Empty title={`${tab} unavailable`} detail="Retained research must finish loading successfully before these records can be displayed." /> : null}
    {tab === "Overview" ? <Overview evidence={evidence} programB={programB} hasPharmaResolution={hasPharmaResolution} portfolioId={portfolioId} position={position} research={research} scoring={scoring} onViewEvidence={() => onTabChange("Evidence")} /> : null}
    {(["Financials", "Quality & Growth", "Valuation"] as readonly string[]).includes(tab) ? <ProfileResearchBlocks evidence={evidence} snapshot={scoring.data} section={tab as "Financials" | "Quality & Growth" | "Valuation"} industry={research?.industry ?? position.industry} sector={research?.sector ?? position.sector} portfolioId={portfolioId} securityId={position.securityId} assetClass={position.assetClass} onViewEvidence={() => onTabChange("Evidence")} /> : null}
    {tab === "Financials" && research ? <details><summary>Retained financial source observations</summary><FinancialsWorkspace research={research} snapshot={scoring.data} /></details> : null}
    {tab === "Quality & Growth" && research ? <details><summary>Retained quality and growth source observations</summary><QualityGrowthWorkspace research={research} snapshot={scoring.data} /></details> : null}
    {tab === "Ownership" && research ? <OwnershipWorkspace research={research} snapshot={scoring.data} /> : null}
    {tab === "Valuation" && research ? <details><summary>Retained valuation source observations</summary><ValuationWorkspace research={research} snapshot={scoring.data} /></details> : null}
    {tab === "Documents" && research ? <Documents research={research} /> : null}
    {tab === "Evidence" && research ? <Evidence research={research} /> : null}
  </div>
}

function Overview({ programB, hasPharmaResolution, evidence, position, research, scoring, portfolioId, onViewEvidence }: { readonly position: PortfolioPosition; readonly research: SecurityResearch | null; readonly scoring: ScoringHook; readonly portfolioId: string; readonly onViewEvidence: () => void } & ResearchScoreContext) {
  const ratings = useExternalRatings(position.securityId)
  const metrics = latestByCode(research?.metrics ?? [])
  const profileDisplayName = scoring.isLoading ? "Loading…" : scoring.error ? "Unavailable" : scoring.data ? researchProfileDisplayName(scoring.data) : "Unavailable"
  const groups = researchSnapshotGroups(scoring.data?.profileCode)
  const conflicts = research?.metrics.filter((metric) => metric.status === "CONFLICTING").length
  const provisional = research?.metrics.filter((metric) => metric.status === "PROVISIONAL").length
  const reviewRequired = research?.documents.filter((document) => document.status === "REVIEW_REQUIRED").length
  const stale = research?.metrics.filter((metric) => metric.status === "STALE").length
  const coverage = research?.metrics.length ? "Partial" : "Unavailable"
  return <>
    <SectionHeading title="Research at a glance" detail="Designed to give investment clarity first, with the detailed tabs preserving the evidence behind every conclusion." />
    <section className="context-strip" aria-label="Research and portfolio context"><div><span>Business / research context</span><strong>{profileDisplayName}</strong><small>{research?.industry ?? position.industry ?? (scoring.data?.profileSource === "REVIEWED_ASSIGNMENT" ? "Reviewed profile · industry pending" : "Industry unavailable")}</small></div><div><span>Your portfolio role</span><strong>{position.role === "UNCLASSIFIED" ? "Unclassified" : titleCase(position.role)}</strong><small>{formatPercent(position.portfolioWeightPercent)} current weight · role remains your choice</small></div><div><span>Classification</span><strong>{research?.sector ?? position.sector ?? "Sector unavailable"}</strong><small>{research?.industry ?? position.industry ?? "Industry unavailable"} · {research?.marketCapCategory ? titleCase(research?.marketCapCategory) : "Cap class unavailable"}</small></div></section>
    <div id="stock-assessment" tabIndex={-1}><ResearchScorecardPanel snapshot={scoring.data} isLoading={scoring.isLoading} error={scoring.error} programB={programB} retainedRatings={ratings.data} ratingsError={ratings.error} ratingsLoading={ratings.isLoading} /></div>
    <div id="stock-readiness" tabIndex={-1}><CanonicalEvidenceReadinessPanel evidence={evidence} portfolioId={portfolioId} securityId={position.securityId} assetClass={position.assetClass} compact /></div>
    <p className="assessment-note">Source snapshots below retain provider observations. Source status is separate from canonical validation and score readiness.</p>
    <div id="stock-snapshots" tabIndex={-1} className="research-cockpit">{groups.map((group) => <section className="cockpit-panel" key={group.title}><h2>{group.title}</h2>{group.title.includes("Ownership") ? <p className="assessment-note">Mutual funds may be included in DII holdings; these categories are not additive.</p> : null}<div className="snapshot-list">{!group.codes.length ? <p className="assessment-note">Presentation mapping unavailable for this profile. Its applicable retained results are in the stock-specific workspace and Evidence.</p> : null}{group.codes.map((code) => { const metric = metrics.get(code); return <div key={code}><span>{metric?.label ?? metricLabelForCode(code)}</span><strong>{formatSourceResearchMetric(metric)}</strong><small>{metric ? `${period(metric)} · ${metric.scope ?? "Scope unavailable"} · ${metric.unit ?? "Unit unavailable"}` : "Unavailable"}</small><span className={`evidence-badge evidence-${coverageStatus(metric).toLocaleLowerCase()}`}>Source: {coverageStatus(metric) === "VERIFIED" ? "Retained available" : coverageStatus(metric).replaceAll("_", " ")}</span></div> })}</div></section>)}</div>
    <section id="stock-health" tabIndex={-1} className="research-health"><div><p className="eyebrow">Research health</p><h2>{coverage} coverage</h2><p>{research ? research.metrics.length : "Unavailable"} cached observations · {stale ? "mixed freshness" : research?.metrics.length ? "current cache" : "freshness unavailable"}</p></div><dl><div><dt>Conflicts</dt><dd>{conflicts ?? "Unavailable"}</dd></div><div><dt>Review required</dt><dd>{reviewRequired ?? "Unavailable"}</dd></div><div><dt>Provisional</dt><dd>{provisional ?? "Unavailable"}</dd></div></dl><button type="button" className="button button-secondary" onClick={onViewEvidence}>View Evidence</button></section>
    <div id="stock-specialist" tabIndex={-1}><ProfileResearchBlocks snapshot={scoring.data} industry={research?.industry ?? position.industry} sector={research?.sector ?? position.sector} evidence={evidence} portfolioId={portfolioId} securityId={position.securityId} assetClass={position.assetClass} onViewEvidence={onViewEvidence} />
    {research && (scoring.data?.profileCode === "PHARMA_V1" || hasPharmaResolution) ? <PharmaResearchWorkspacePanel evidence={evidence} snapshot={scoring.data} securityId={position.securityId} symbol={position.symbol} research={research} /> : null}</div>
  </>
}

function Documents({ research }: { readonly research: SecurityResearch }) {
  return <><SectionHeading title="Research documents" detail="Metadata and source appearances only; document bodies are not stored here." />{research.documents.length ? <div className="document-list">{research.documents.map((document) => <article key={document.id}><div><p className="eyebrow">{document.type.replaceAll("_", " ")}</p><h2>{document.title ?? "Title unavailable"}</h2><p>{document.periodEnd ? `Period ending ${date(document.periodEnd)}` : "Reporting period unavailable"} · {document.publishedAt ? `Published ${date(document.publishedAt)}` : "Publication date unavailable"}</p></div><div><Status value={document.status} /><small>{document.provider} · retrieved {dateTime(document.retrievedAt)}</small>{document.externalReference ? <details className="document-reference"><summary>Retained archive reference</summary><p>{document.externalReference}</p></details> : <span className="unavailable">No lawful retained open reference</span>}</div></article>)}</div> : <Empty title="No cached document appearances" detail="No document metadata has been retained for this security." />}</>
}

function Evidence({ research }: { readonly research: SecurityResearch }) {
  const [filter, setFilter] = useState("ALL")
  const rows = filter === "ALL" ? research.metrics : research.metrics.filter((metric) => metric.status === filter)
  return <><SectionHeading title="Evidence ledger" detail="Selected and competing observations remain visible with their original semantics." /><label className="evidence-filter"><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">All evidence</option>{["VERIFIED", "PROVISIONAL", "CONFLICTING", "AMBIGUOUS", "REVIEW_REQUIRED", "STALE"].map((value) => <option key={value}>{value}</option>)}</select></label><MetricTable rows={rows} detailed empty="No evidence matches this filter." /></>
}

function MetricTable({ rows, empty, detailed = false }: { readonly rows: readonly ResearchMetric[]; readonly empty: string; readonly detailed?: boolean }) {
  if (!rows.length) return <Empty title="Unavailable" detail={empty} />
  return <div className="research-table-wrap" tabIndex={0} aria-label="Scrollable research evidence"><table className="research-table"><thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Status</th>{detailed ? <><th>Provider / field</th><th>Scope / unit</th><th>Retrieved / freshness</th><th>Selection</th></> : <th>Source</th>}</tr></thead><tbody>{rows.map((metric) => <tr key={metric.id}><td><strong>{metric.label}</strong><small>{metric.code}</small></td><td>{formatSourceResearchMetric(metric)}<details><summary>Original source value</summary><p>{metric.value ?? "Unavailable"}</p></details></td><td>{period(metric)}</td><td><Status value={metric.status} /></td>{detailed ? <><td>{metric.provider}<small>{metric.sourceField ?? "Source field unavailable"}</small></td><td>{metric.scope ?? "Scope unavailable"}<small>{[metric.unit, metric.currency].filter(Boolean).join(" · ") || "Unit unavailable"}</small></td><td>{dateTime(metric.retrievedAt)}<small>Fresh through {dateTime(metric.freshUntil)}</small></td><td>{metric.selected ? "Selected" : "Competing / unselected"}</td></> : <td>{metric.provider}<small>{dateTime(metric.retrievedAt)}</small></td>}</tr>)}</tbody></table></div>
}

function Status({ value }: { readonly value: ResearchEvidenceStatus }) { return <span className={`evidence-badge evidence-${value.toLocaleLowerCase()}`}>{value.replaceAll("_", " ")}</span> }
function PnlCard({ position, currency }: { readonly position: PortfolioPosition; readonly currency: string }) {
  const sign = position.unrealisedPnl === null ? "" : financialTone(position.unrealisedPnl) === "gain" ? "+" : ""
  const percentSign = position.unrealisedPnlPercent === null ? "" : financialTone(position.unrealisedPnlPercent) === "gain" ? "+" : ""
  const tone = financialTone(position.unrealisedPnl)
  const direction = tone === "gain" ? "Gain" : tone === "loss" ? "Loss" : tone === "neutral" ? "No change" : "Unavailable"
  return <article className={`research-metric-card pnl-card pnl-${tone}`}><span>P/L</span><strong className={financialClass(position.unrealisedPnl)}>{position.unrealisedPnl === null ? "Unavailable" : `${sign}${formatMoney(position.unrealisedPnl, currency)}`}</strong><small className={financialClass(position.unrealisedPnlPercent)}>{position.unrealisedPnlPercent === null ? "Unavailable" : `${percentSign}${formatPercent(position.unrealisedPnlPercent)} · ${direction}`}</small></article>
}
function MetricCard({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail?: string }) { return <article className="research-metric-card"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</article> }
function SectionHeading({ title, detail }: { readonly title: string; readonly detail: string }) { return <div className="research-section-heading"><h2>{title}</h2><p>{detail}</p></div> }
function Empty({ title, detail }: { readonly title: string; readonly detail: string }) { return <div className="data-empty"><strong>{title}</strong><p>{detail}</p></div> }
function Loading({ label }: { readonly label: string }) { return <div className="portfolio-loading" aria-live="polite"><span className="loader" /><p>{label}</p></div> }
function ResearchNotFound() { return <section className="research-page"><div className="notice notice-error" role="alert"><strong>Security unavailable</strong><span>This security is not available in the current open portfolio.</span></div><Link className="button button-secondary" to="/app/research">Return to Research</Link></section> }
function date(value: string) { const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "Unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(parsed) }
function dateTime(value: string) { if (!value) return "Unavailable"; const parsed = new Date(value); return Number.isNaN(parsed.valueOf()) ? "Unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(parsed) }
function period(metric: ResearchMetric) { return [metric.periodType?.replaceAll("_", " "), metric.periodEnd ? date(metric.periodEnd) : null].filter(Boolean).join(" · ") || "Period unavailable" }
function titleCase(value: string) { return value.replaceAll("_", " ").toLocaleLowerCase().replace(/(^|\s)\S/gu, (match) => match.toLocaleUpperCase()) }
function metricLabelForCode(code: string) { return metricLabel(code) }
