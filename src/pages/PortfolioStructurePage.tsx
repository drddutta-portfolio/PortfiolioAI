import Decimal from "decimal.js"
import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { requestSecurityClassificationCorrection, savePositionSettings, saveTheme, saveThemeMemberships } from "../data/classificationRepository"
import { formatMoney, formatPercent } from "../features/portfolio/format"
import { ASSIGNABLE_ROLES, validatePositionSettings, type AssignableRole, type PositionSettingsDraft } from "../features/portfolio/positionSettings"
import type { PortfolioPosition, PortfolioRole, PortfolioTheme } from "../features/portfolio/types"
import { usePortfolioView } from "../features/portfolio/usePortfolioView"
import { displayError } from "../lib/displayError"

type StructureFilter = PortfolioRole | "IN_THEMES" | "ALL"

function labelRole(role: PortfolioRole) {
  return role === "UNCLASSIFIED" ? "Unclassified" : role[0] + role.slice(1).toLowerCase()
}

export function PortfolioStructurePage() {
  const { portfolio, error, isLoading, reload } = usePortfolioView()
  const [params, setParams] = useSearchParams()
  const [roleFilter, setRoleFilter] = useState<StructureFilter>("ALL")
  const [assetFilter, setAssetFilter] = useState<"ALL" | "EQUITY" | "ETF" | "OTHER">("ALL")
  const [search, setSearch] = useState("")
  const [themeOpen, setThemeOpen] = useState(false)
  const selectedId = params.get("security")
  const positions = useMemo(() => {
    if (!portfolio) return []
    const query = search.trim().toUpperCase()
    return portfolio.openPositions.filter((position) =>
      (roleFilter === "ALL" || (roleFilter === "IN_THEMES" ? position.themes.some((theme) => theme.isActive) : position.role === roleFilter))
      && (assetFilter === "ALL" || (assetFilter === "OTHER" ? !["EQUITY", "ETF"].includes(position.assetClass) : position.assetClass === assetFilter))
      && (!query || `${position.symbol} ${position.company}`.toUpperCase().includes(query)))
      .sort((left, right) => (left.settings.priority ?? Number.MAX_SAFE_INTEGER) - (right.settings.priority ?? Number.MAX_SAFE_INTEGER) || left.symbol.localeCompare(right.symbol))
  }, [assetFilter, portfolio, roleFilter, search])
  const selected = portfolio?.openPositions.find((position) => position.securityId === selectedId) ?? null
  if (isLoading) return <div className="portfolio-loading"><span className="loader" /><p>Loading portfolio structure…</p></div>
  if (error || !portfolio) return <div className="notice notice-error" role="alert">{error ?? "Portfolio structure could not be loaded."}</div>
  const roles: PortfolioRole[] = ["CORE", "SATELLITE", "THEMATIC", "ETF", "OTHER", "UNCLASSIFIED"]
  const summaryRoles: PortfolioRole[] = ["CORE", "SATELLITE", "ETF", "OTHER", "UNCLASSIFIED"]
  const holdingsInActiveThemes = portfolio.openPositions.filter((position) => position.themes.some((theme) => theme.isActive)).length
  return <section className="portfolio-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Portfolio management</p><h1>Portfolio Structure</h1><p>Human-controlled roles, themes, and position preferences. Classification never changes transaction history or analytical scores.</p></div><button className="button button-secondary" onClick={() => setThemeOpen((value) => !value)}>{themeOpen ? "Close theme manager" : "Manage themes"}</button></div>
    <div className="structure-summary">
      {summaryRoles.slice(0, 2).map((role) => <button key={role} className={roleFilter === role ? "structure-card active" : "structure-card"} onClick={() => setRoleFilter(role)}><span>{labelRole(role)}</span><strong>{portfolio.openPositions.filter((position) => position.role === role).length}</strong><small>open positions by primary role</small></button>)}
      <button className={roleFilter === "IN_THEMES" ? "structure-card active" : "structure-card"} onClick={() => setRoleFilter("IN_THEMES")}><span>In Themes</span><strong>{holdingsInActiveThemes}</strong><small>unique holdings in active themes</small></button>
      {summaryRoles.slice(2).map((role) => <button key={role} className={roleFilter === role ? "structure-card active" : "structure-card"} onClick={() => setRoleFilter(role)}><span>{labelRole(role)}</span><strong>{portfolio.openPositions.filter((position) => position.role === role).length}</strong><small>{role === "ETF" ? "Primary role; asset class remains separate" : "open positions by primary role"}</small></button>)}
    </div>
    {themeOpen ? <ThemeManager portfolioId={portfolio.portfolio.id} themes={portfolio.themes} positions={portfolio.openPositions} onSaved={reload} /> : null}
    <section className="panel structure-panel">
      <div className="holdings-controls"><label className="search-control"><span>Search</span><input type="search" placeholder="Ticker or company" value={search} onChange={(event) => setSearch(event.target.value)} /></label><label><span>Role</span><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as StructureFilter)}><option value="ALL">All roles</option>{roles.map((role) => <option key={role} value={role}>{labelRole(role)}</option>)}</select></label><label><span>Asset class</span><select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value as typeof assetFilter)}><option value="ALL">All assets</option><option value="EQUITY">Stocks</option><option value="ETF">ETFs</option><option value="OTHER">Other assets</option></select></label><button className="button button-secondary button-compact" onClick={() => { setRoleFilter("ALL"); setAssetFilter("ALL"); setSearch("") }}>Reset</button></div>
      <div className="structure-list">{positions.map((position) => <StructureRow key={position.securityId} position={position} currency={portfolio.portfolio.currency} onEdit={() => setParams({ security: position.securityId })} />)}</div>
      {!positions.length ? <div className="data-empty"><strong>No matching positions</strong><p>Adjust the role, asset-class, or search filter.</p></div> : null}
    </section>
    {selected ? <PositionEditor portfolioId={portfolio.portfolio.id} position={selected} themes={portfolio.themes.filter((theme) => theme.isActive)} onClose={() => setParams({})} onSaved={() => { setParams({}); reload() }} /> : null}
  </section>
}

function StructureRow({ position, currency, onEdit }: { readonly position: PortfolioPosition; readonly currency: string; readonly onEdit: () => void }) {
  return <article className="structure-row"><div className="security-cell"><strong>{position.symbol}</strong><span>{position.company}</span><small>{position.exchange} · {position.assetClass}{position.series ? ` · ${position.series}` : ""}</small></div><div><span className={`role-badge role-${position.role.toLowerCase()}`}>{labelRole(position.role)}</span><small>{position.assetClass === "ETF" ? "ETF asset" : position.assetClass === "EQUITY" ? "Equity stock" : position.assetClass}</small></div><div><span className="structure-label">Current / target</span><strong>{formatPercent(position.portfolioWeightPercent)} / {formatPercent(position.settings.targetWeight)}</strong><small>{position.portfolioWeightPercent ? "Weight within priced subset" : "Current weight unavailable"}</small></div><div><span className="structure-label">Themes</span><strong>{position.themes.length ? position.themes.map((theme) => theme.name).join(", ") : "None"}</strong><small>{position.sector ?? "Sector unavailable"}{position.industry ? ` · ${position.industry}` : " · Industry unavailable"}</small></div><div><span className="structure-label">Market value</span><strong>{formatMoney(position.currentValue, currency)}</strong><small>{position.settings.isFrozen ? "Frozen" : position.settings.isWatchlisted ? "Watchlisted" : position.settings.investmentHorizon ?? "Horizon unset"}</small></div><button className="button button-secondary button-compact" onClick={onEdit}>Edit settings</button></article>
}

function PositionEditor({ portfolioId, position, themes, onClose, onSaved }: { readonly portfolioId: string; readonly position: PortfolioPosition; readonly themes: readonly PortfolioTheme[]; readonly onClose: () => void; readonly onSaved: () => void }) {
  const [draft, setDraft] = useState<PositionSettingsDraft>({ portfolioRole: position.settings.portfolioRole, targetWeight: position.settings.targetWeight ?? "", minimumWeight: position.settings.minimumWeight ?? "", maximumWeight: position.settings.maximumWeight ?? "", priority: position.settings.priority === null ? "" : String(position.settings.priority), isWatchlisted: position.settings.isWatchlisted, isFrozen: position.settings.isFrozen, investmentHorizon: position.settings.investmentHorizon ?? "", notes: position.settings.notes ?? "" })
  const [themeIds, setThemeIds] = useState(() => new Set(position.themes.map((theme) => theme.id)))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [classificationOpen,setClassificationOpen]=useState(false)
  const [proposedAsset,setProposedAsset]=useState(position.assetClass)
  const [proposedInstrument,setProposedInstrument]=useState(position.instrumentType)
  const [classificationReason,setClassificationReason]=useState("")
  const [classificationEvidence,setClassificationEvidence]=useState("")
  const update = <K extends keyof PositionSettingsDraft>(key: K, value: PositionSettingsDraft[K]) => setDraft((current) => ({ ...current, [key]: value }))
  const submit = async () => {
    setSaving(true); setSaveError(null)
    try { await savePositionSettings({ portfolioId, securityId: position.securityId, themeIds: [...themeIds], ...validatePositionSettings(draft) }); onSaved() }
    catch (failure) { setSaveError(displayError(failure)) }
    finally { setSaving(false) }
  }
  const reportClassification=async()=>{setSaving(true);setSaveError(null);try{if(classificationReason.trim().length<3||classificationEvidence.trim().length<3)throw new Error("Provide a reason and trusted evidence/reference.");await requestSecurityClassificationCorrection({portfolioId,securityId:position.securityId,assetClass:proposedAsset,instrumentType:proposedInstrument,reason:classificationReason,evidenceReference:classificationEvidence});setClassificationOpen(false)}catch(failure){setSaveError(displayError(failure))}finally{setSaving(false)}}
  return <div className="editor-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="position-editor" role="dialog" aria-modal="true" aria-label={`Position settings for ${position.symbol}`}><div className="editor-heading"><div><p className="eyebrow">Position settings</p><h2>{position.symbol}</h2><p>{position.company}</p></div><button className="icon-button" aria-label="Close" onClick={onClose}>×</button></div>{saveError ? <div className="notice notice-error" role="alert">{saveError}</div> : null}<div className="identity-strip"><span><small>Asset class</small><strong>{position.assetClass}</strong></span><span><small>Instrument</small><strong>{position.instrumentType}</strong></span><span><small>Sector</small><strong>{position.sector ?? "Unavailable"}</strong></span><span><small>Industry</small><strong>{position.industry ?? "Unavailable"}</strong></span></div><button className="text-button" onClick={()=>setClassificationOpen(value=>!value)}>Report / correct security classification</button>{classificationOpen?<div className="settings-form classification-request"><label><span>Proposed asset class</span><select value={proposedAsset} onChange={event=>setProposedAsset(event.target.value)}>{["EQUITY","ETF","MUTUAL_FUND","GOLD","SILVER","BOND","CASH","OTHER"].map(value=><option key={value}>{value}</option>)}</select></label><label><span>Proposed instrument type</span><input value={proposedInstrument} onChange={event=>setProposedInstrument(event.target.value.toUpperCase())}/></label><label><span>Reason</span><textarea value={classificationReason} onChange={event=>setClassificationReason(event.target.value)}/></label><label><span>Trusted evidence / source reference</span><textarea value={classificationEvidence} onChange={event=>setClassificationEvidence(event.target.value)} placeholder="Exchange, issuer, filing or reviewed reference"/></label><button className="button button-secondary" disabled={saving} onClick={()=>void reportClassification()}>Submit correction request</button><small>Requests do not directly mutate canonical identity. A trusted service review applies approved changes with immutable audit history.</small></div>:null}<div className="settings-form"><label><span>Portfolio role</span><select value={draft.portfolioRole ?? ""} onChange={(event) => update("portfolioRole", (event.target.value || null) as AssignableRole | null)}><option value="">Unclassified — choose a role</option>{ASSIGNABLE_ROLES.map((role) => <option key={role} value={role}>{labelRole(role)}</option>)}</select><small>Role is a portfolio decision, not a quality score.</small></label><div className="weight-grid"><label><span>Minimum weight %</span><input inputMode="decimal" value={draft.minimumWeight} onChange={(event) => update("minimumWeight", event.target.value)} placeholder="Unset" /></label><label><span>Target weight %</span><input inputMode="decimal" value={draft.targetWeight} onChange={(event) => update("targetWeight", event.target.value)} placeholder="Unset" /></label><label><span>Maximum weight %</span><input inputMode="decimal" value={draft.maximumWeight} onChange={(event) => update("maximumWeight", event.target.value)} placeholder="Unset" /></label></div><label><span>Priority</span><input inputMode="numeric" value={draft.priority} onChange={(event) => update("priority", event.target.value)} placeholder="Unset" /></label><label><span>Investment horizon</span><input value={draft.investmentHorizon} onChange={(event) => update("investmentHorizon", event.target.value)} placeholder="Unset" /></label><fieldset><legend>Themes</legend><div className="theme-checks">{themes.length ? themes.map((theme) => <label key={theme.id}><input type="checkbox" checked={themeIds.has(theme.id)} onChange={() => setThemeIds((current) => { const next = new Set(current); if (next.has(theme.id)) next.delete(theme.id); else next.add(theme.id); return next })} /><span>{theme.name}</span></label>) : <p>No active themes. Create one in the theme manager first.</p>}</div></fieldset><div className="toggle-row"><label><input type="checkbox" checked={draft.isWatchlisted} onChange={(event) => update("isWatchlisted", event.target.checked)} /><span>Watchlisted</span></label><label><input type="checkbox" checked={draft.isFrozen} onChange={(event) => update("isFrozen", event.target.checked)} /><span>Frozen</span></label></div><label><span>Notes</span><textarea rows={4} value={draft.notes} onChange={(event) => update("notes", event.target.value)} placeholder="Optional portfolio-specific notes" /></label></div><div className="editor-actions"><button className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={saving} onClick={() => void submit()}>{saving ? "Saving…" : "Save settings"}</button></div></section></div>
}

function ThemeManager({ portfolioId, themes, positions, onSaved }: { readonly portfolioId: string; readonly themes: readonly PortfolioTheme[]; readonly positions: readonly PortfolioPosition[]; readonly onSaved: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [themeSearch, setThemeSearch] = useState("")
  const [stockSearch, setStockSearch] = useState("")
  const [showRetired, setShowRetired] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [maxAllocation, setMaxAllocation] = useState("")
  const [priority, setPriority] = useState("")
  const [memberIds, setMemberIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const selected = themes.find((theme) => theme.id === selectedId) ?? null
  const visibleThemes = themes.filter((theme) => (showRetired || theme.isActive) && (!themeSearch.trim() || `${theme.name} ${theme.description ?? ""}`.toUpperCase().includes(themeSearch.trim().toUpperCase())))
  const visiblePositions = positions.filter((position) => !stockSearch.trim() || `${position.symbol} ${position.company}`.toUpperCase().includes(stockSearch.trim().toUpperCase()))

  const edit = (theme: PortfolioTheme) => {
    setSelectedId(theme.id)
    setName(theme.name)
    setDescription(theme.description ?? "")
    setMaxAllocation(theme.maxAllocation ?? "")
    setPriority(theme.priority === null ? "" : String(theme.priority))
    setMemberIds(new Set(positions.filter((position) => position.themes.some((candidate) => candidate.id === theme.id)).map((position) => position.securityId)))
  }
  const clear = () => { setSelectedId(null); setName(""); setDescription(""); setMaxAllocation(""); setPriority(""); setMemberIds(new Set()); setStockSearch("") }
  const persist = async () => {
    setSaving(true); setError(null)
    try {
      const allocation = maxAllocation.trim() ? new Decimal(maxAllocation.trim()) : null
      if (!name.trim()) throw new Error("Theme name is required.")
      if (allocation && (allocation.lt(0) || allocation.gt(100) || allocation.decimalPlaces() > 6)) throw new Error("Maximum allocation must be between 0 and 100 with at most 6 decimals.")
      const parsedPriority = priority.trim() ? Number(priority) : null
      if (parsedPriority !== null && (!Number.isSafeInteger(parsedPriority) || parsedPriority < 0)) throw new Error("Priority must be a non-negative whole number.")
      await saveTheme({ id: selected?.id, portfolioId, name, description: description || null, maxAllocation: allocation?.toFixed() ?? null, priority: parsedPriority, isActive: selected?.isActive ?? true })
      if (selected) await saveThemeMemberships(portfolioId, selected.id, [...memberIds])
      clear(); onSaved()
    } catch (failure) { setError(displayError(failure)) } finally { setSaving(false) }
  }
  const toggle = async (theme: PortfolioTheme) => {
    setSaving(true); setError(null)
    try { await saveTheme({ id: theme.id, portfolioId, name: theme.name, description: theme.description, maxAllocation: theme.maxAllocation, priority: theme.priority, isActive: !theme.isActive }); if (selectedId === theme.id) clear(); onSaved() }
    catch (failure) { setError(displayError(failure)) } finally { setSaving(false) }
  }
  return <section className="panel theme-manager">
    <div className="panel-heading"><div><p className="eyebrow">User-controlled themes</p><h2>Theme manager</h2><p>Create and edit themes, then assign any number of consolidated holdings. Primary roles remain unchanged.</p></div></div>
    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
    <div className="theme-toolbar"><input type="search" placeholder="Search themes" value={themeSearch} onChange={(event) => setThemeSearch(event.target.value)} /><label><input type="checkbox" checked={showRetired} onChange={(event) => setShowRetired(event.target.checked)} /> Show retired</label><button className="button button-secondary button-compact" onClick={clear}>New theme</button></div>
    <div className="theme-manager-grid"><div className="theme-list">{visibleThemes.length ? visibleThemes.map((theme) => {
      const holdings = positions.filter((position) => position.themes.some((candidate) => candidate.id === theme.id))
      return <article key={theme.id} className={selectedId === theme.id ? "selected" : ""}><div><strong>{theme.name}</strong><p>{theme.description ?? "No description"}</p><small>{holdings.length ? holdings.map((position) => position.symbol).join(", ") : "No holdings assigned"}</small></div><span className={theme.isActive ? "price-status fresh" : "price-status stale"}>{theme.isActive ? "Active" : "Retired"}</span><small>{holdings.length} holdings · {theme.maxAllocation ? `Maximum ${formatPercent(theme.maxAllocation)}` : "Maximum unset"}</small><div className="theme-actions"><button className="text-button" onClick={() => edit(theme)}>Edit / add stocks</button><button className="text-button" disabled={saving} onClick={() => void toggle(theme)}>{theme.isActive ? "Retire" : "Reactivate"}</button></div></article>
    }) : <div className="data-empty"><strong>No matching themes</strong><p>Create a custom theme or adjust the search.</p></div>}</div>
      <div className="theme-form"><p className="eyebrow">{selected ? "Edit theme" : "Create theme"}</p><label><span>Name</span><input value={name} onChange={(event) => setName(event.target.value)} /></label><label><span>Description</span><textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} /></label><div className="weight-grid"><label><span>Maximum allocation %</span><input inputMode="decimal" value={maxAllocation} onChange={(event) => setMaxAllocation(event.target.value)} placeholder="Unset" /></label><label><span>Priority</span><input inputMode="numeric" value={priority} onChange={(event) => setPriority(event.target.value)} placeholder="Unset" /></label></div>
        {selected ? <fieldset><legend>Holdings in {selected.name}</legend><input type="search" placeholder="Search ticker or company" value={stockSearch} onChange={(event) => setStockSearch(event.target.value)} /><div className="theme-stock-list">{visiblePositions.map((position) => <label key={position.securityId}><input type="checkbox" checked={memberIds.has(position.securityId)} onChange={() => setMemberIds((current) => { const next = new Set(current); if (next.has(position.securityId)) next.delete(position.securityId); else next.add(position.securityId); return next })} /><span><strong>{position.symbol}</strong> {position.company}<small>{labelRole(position.role)} · {position.assetClass}{position.sector ? ` · ${position.sector}` : " · Sector unavailable"}</small></span></label>)}</div></fieldset> : <p className="form-help">Create the theme first, then choose Edit / add stocks to assign holdings.</p>}
        <div className="editor-actions"><button className="button button-secondary" onClick={clear}>Cancel</button><button className="button button-primary" disabled={saving} onClick={() => void persist()}>{saving ? "Saving…" : selected ? "Save theme and stocks" : "Create theme"}</button></div></div>
    </div>
  </section>
}
