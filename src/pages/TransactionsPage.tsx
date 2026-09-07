import Decimal from "decimal.js"
import { useEffect, useMemo, useRef, useState } from "react"
import { correctTransaction, createManualSecurity, createManualTransaction, loadTransactions, type TransactionListRow, type TransactionReferences } from "../data/transactionRepository"
import { formatMoney, formatQuantity } from "../features/portfolio/format"
import { displayError } from "../lib/displayError"

type TypeFilter = "ALL" | "BUY" | "SELL"
type SourceFilter = "ALL" | "MANUAL" | "IMPORTED" | "CORRECTION"
type SortKey = "date" | "security" | "type" | "quantity" | "price" | "gross" | "charges" | "broker"
type SortDirection = "asc" | "desc"

export function TransactionsPage() {
  const [rows, setRows] = useState<readonly TransactionListRow[]>([])
  const [references, setReferences] = useState<TransactionReferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(""); const [type, setType] = useState<TypeFilter>("ALL")
  const [account, setAccount] = useState("ALL"); const [source, setSource] = useState<SourceFilter>("ALL")
  const [missingDate, setMissingDate] = useState(false); const [missingBroker, setMissingBroker] = useState(false)
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [security, setSecurity] = useState("ALL")
  const [quality, setQuality] = useState("ALL"); const [showForm, setShowForm] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({ key: "date", direction: "desc" })
  const [correcting, setCorrecting] = useState<TransactionListRow | null>(null)
  const reload = async () => { setLoading(true); setError(null); try { const result = await loadTransactions(); setRows(result.rows); setReferences(result.references) } catch (failure) { setError(displayError(failure)) } finally { setLoading(false) } }
  useEffect(() => {
    let active = true
    void loadTransactions().then((result) => { if (active) { setRows(result.rows); setReferences(result.references) } })
      .catch((failure: unknown) => { if (active) setError(displayError(failure)) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const filtered = useMemo(() => {
    const query = search.trim().toUpperCase()
    const matches = rows.filter((row) => row.accountingStatus === "ACTIVE" && (!query || `${row.symbol} ${row.company} ${row.broker ?? ""} ${row.account ?? ""} ${row.sourceType} ${row.sourceProvider ?? ""}`.toUpperCase().includes(query))
      && (type === "ALL" || row.transactionType === type) && (account === "ALL" || row.brokerAccountId === account)
      && (security === "ALL" || row.securityId === security) && (quality === "ALL" || row.dataQualityStatus === quality)
      && (source === "ALL" || (source === "MANUAL" ? row.sourceType === "MANUAL" : source === "CORRECTION" ? row.sourceType === "CORRECTION" : !["MANUAL", "CORRECTION"].includes(row.sourceType)))
      && (!missingDate || row.transactionDate === null) && (!missingBroker || row.brokerAccountId === null)
      && (!from || (row.transactionDate !== null && row.transactionDate >= from)) && (!to || (row.transactionDate !== null && row.transactionDate <= to)))
    const nullableDecimal = (value: string | null) => value === null ? null : new Decimal(value)
    return [...matches].sort((left, right) => {
      let compared: number
      if (sort.key === "date") {
        if (left.transactionDate === null) return 1
        if (right.transactionDate === null) return -1
        compared = left.transactionDate.localeCompare(right.transactionDate)
      }
      else if (sort.key === "security") compared = `${left.symbol} ${left.company}`.localeCompare(`${right.symbol} ${right.company}`)
      else if (sort.key === "type") compared = left.transactionType.localeCompare(right.transactionType)
      else if (sort.key === "broker") compared = `${left.broker ?? ""} ${left.account ?? ""}`.localeCompare(`${right.broker ?? ""} ${right.account ?? ""}`)
      else {
        const a = nullableDecimal(sort.key === "quantity" ? left.quantity : sort.key === "price" ? left.unitPrice : sort.key === "gross" ? (left.grossAmount ?? (left.quantity && left.unitPrice ? new Decimal(left.quantity).times(left.unitPrice).toFixed() : null)) : left.charges)
        const b = nullableDecimal(sort.key === "quantity" ? right.quantity : sort.key === "price" ? right.unitPrice : sort.key === "gross" ? (right.grossAmount ?? (right.quantity && right.unitPrice ? new Decimal(right.quantity).times(right.unitPrice).toFixed() : null)) : right.charges)
        if (a === null) return 1
        if (b === null) return -1
        compared = a.comparedTo(b)
      }
      return sort.direction === "asc" ? compared : -compared
    })
  }, [account, from, missingBroker, missingDate, quality, rows, search, security, sort, source, to, type])
  const toggleSort = (key: SortKey) => setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }))
  const resetFilters = () => { setSearch(""); setType("ALL"); setAccount("ALL"); setSecurity("ALL"); setSource("ALL"); setQuality("ALL"); setMissingDate(false); setMissingBroker(false); setFrom(""); setTo("") }
  if (loading && !references) return <div className="portfolio-loading"><span className="loader" /><p>Loading transaction history…</p></div>
  if (error && !references) return <div className="notice notice-error" role="alert">{error}</div>
  return <section className="portfolio-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Source-of-truth ledger</p><h1>Transactions</h1><p>{rows.length} historical transactions, with missing evidence kept explicit.</p></div><button className="button button-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? "Close entry" : "Add transaction"}</button></div>
    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
    {showForm && references ? <ManualTransactionForm references={references} onCreated={async () => { setShowForm(false); await reload() }} /> : null}
    {correcting && references ? <CorrectionForm row={correcting} references={references} onClose={() => setCorrecting(null)} onCreated={async () => { setCorrecting(null); await reload() }} /> : null}
    <section className="panel holdings-panel">
      <div className="holdings-controls transaction-controls"><label className="search-control"><span>Search</span><input type="search" placeholder="Ticker, company, broker, account, source" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label><span>Security</span><select value={security} onChange={(event) => setSecurity(event.target.value)}><option value="ALL">All securities</option>{references?.securities.map((item) => <option key={item.id} value={item.id}>{item.symbol} — {item.name}</option>)}</select></label>
        <label><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as TypeFilter)}><option value="ALL">All</option><option>BUY</option><option>SELL</option></select></label>
        <label><span>Account</span><select value={account} onChange={(event) => setAccount(event.target.value)}><option value="ALL">All accounts</option>{references?.accounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)}><option value="ALL">All sources</option><option value="IMPORTED">Imported</option><option value="MANUAL">Manual</option><option value="CORRECTION">Corrections</option></select></label>
        <label><span>Data quality</span><select value={quality} onChange={(event) => setQuality(event.target.value)}><option value="ALL">All states</option>{[...new Set(rows.map((row) => row.dataQualityStatus))].map((item) => <option key={item}>{item.replaceAll("_", " ")}</option>)}</select></label>
        <label><span>From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label><span>To</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="check-control"><input type="checkbox" checked={missingDate} onChange={(event) => setMissingDate(event.target.checked)} /><span>Missing date</span></label><label className="check-control"><input type="checkbox" checked={missingBroker} onChange={(event) => setMissingBroker(event.target.checked)} /><span>Missing broker</span></label><button className="button button-secondary" onClick={resetFilters}>Reset filters</button>
      </div>
      <div className="holdings-caption"><strong>{filtered.length}</strong> matching transactions<span>Imported evidence and manual provenance remain distinguishable.</span></div>
      <div className="table-scroll"><table className="holdings-table transactions-table"><thead><tr>{([['date','Date'],['security','Security'],['type','Type'],['quantity','Quantity'],['price','Price'],['gross','Gross'],['charges','Charges'],['broker','Broker / account']] as const).map(([key,label]) => <th key={key}><button className="sort-header" onClick={() => toggleSort(key)}>{label}<span aria-hidden="true">{sort.key === key ? (sort.direction === "asc" ? " ▲" : " ▼") : " ↕"}</span></button></th>)}<th>Source</th><th>Data quality</th><th>Accounting</th><th>Actions</th></tr></thead><tbody>{filtered.map((row) => <TransactionRow key={row.id} row={row} original={row.correctedFromTransactionId ? rows.find((item) => item.id === row.correctedFromTransactionId) : undefined} onCorrect={() => setCorrecting(row)} />)}</tbody></table></div>
      {!filtered.length ? <div className="data-empty"><strong>No matching transactions</strong><p>Adjust the filters to see more ledger history.</p></div> : null}
    </section>
  </section>
}

function TransactionRow({ row, original, onCorrect }: { readonly row: TransactionListRow; readonly original?: TransactionListRow; readonly onCorrect: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return <><tr><td>{row.transactionDate ?? <span className="unavailable">Missing date</span>}</td><td><div className="security-cell"><strong>{row.symbol}</strong><span>{row.company}</span></div></td><td><span className={`transaction-badge ${row.transactionType.toLowerCase()}`}>{row.transactionType}</span></td><td className="numeric-cell">{row.quantity ? formatQuantity(row.quantity) : "Unavailable"}</td><td className="numeric-cell">{formatMoney(row.unitPrice)}</td><td className="numeric-cell">{formatMoney(row.grossAmount ?? (row.quantity && row.unitPrice ? new Decimal(row.quantity).times(row.unitPrice).toFixed() : null))}</td><td className="numeric-cell">{formatMoney(row.charges)}</td><td>{row.broker ? <>{row.broker}<small className="sector-label">{row.account}</small></> : <span className="unavailable">Missing broker</span>}</td><td><span className="source-badge">{row.sourceType === "MANUAL" ? "Manual" : row.sourceType === "CORRECTION" ? "Correction" : "Imported"}</span><small className="sector-label">{row.sourceProvider}</small></td><td><span className={row.dataQualityStatus === "COMPLETE" ? "price-status fresh" : "price-status stale"}>{row.dataQualityStatus.replaceAll("_", " ")}</span></td><td>{row.accountingStatus}</td><td><button className="text-button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Hide" : "View"}</button><button className="text-button" onClick={onCorrect}>Correct</button></td></tr>{expanded ? <tr className="transaction-detail-row"><td colSpan={12}><dl><div><dt>Transaction UUID</dt><dd>{row.id}</dd></div><div><dt>Import batch</dt><dd>{row.importBatchId ?? "Manual entry"}</dd></div><div><dt>Source-row lineage</dt><dd>{row.importSourceRowId ?? "Not applicable"}</dd></div><div><dt>Corrects transaction</dt><dd>{row.correctedFromTransactionId ?? "Not a correction"}</dd></div><div><dt>Correction reason</dt><dd>{row.correctionReason ?? "Not applicable"}</dd></div>{original ? <div><dt>Preserved original</dt><dd>{original.transactionDate ?? "Missing date"} · {original.transactionType} · {original.quantity ?? "Unavailable"} @ {formatMoney(original.unitPrice)} · {original.broker ?? "Missing broker"}</dd></div> : null}<div><dt>Recorded</dt><dd>{new Date(row.createdAt).toLocaleString("en-IN")}</dd></div>{row.notes ? <div><dt>Notes</dt><dd>{row.notes}</dd></div> : null}</dl></td></tr> : null}</>
}

function ManualTransactionForm({ references, onCreated }: { readonly references: TransactionReferences; readonly onCreated: () => Promise<void> }) {
  const initialPortfolio = references.portfolios[0]?.id ?? ""
  const [portfolioId, setPortfolioId] = useState(initialPortfolio); const [accountId, setAccountId] = useState("")
  const [securityId, setSecurityId] = useState(""); const [transactionType, setTransactionType] = useState<"BUY" | "SELL">("BUY")
  const [date, setDate] = useState(""); const [quantity, setQuantity] = useState(""); const [price, setPrice] = useState("")
  const [charges, setCharges] = useState(""); const [notes, setNotes] = useState(""); const [submitting, setSubmitting] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false); const [securitySearch, setSecuritySearch] = useState("")
  const [newSecurity, setNewSecurity] = useState<{ readonly id: string; readonly label: string } | null>(null)
  const [securityNotice, setSecurityNotice] = useState<string | null>(null)
  const idempotencyKey = useRef(crypto.randomUUID())
  const [message, setMessage] = useState<string | null>(null); const accounts = references.accounts.filter((item) => item.portfolioId === portfolioId)
  const matchingSecurities = references.securities.filter((item) => `${item.symbol} ${item.name}`.toLowerCase().includes(securitySearch.trim().toLowerCase())).slice(0, 12)
  const selectedSecurity = newSecurity?.id === securityId ? newSecurity : references.securities.find((item) => item.id === securityId)
  const suggestedSymbol = securitySearch.trim().toUpperCase().replaceAll(" ", "")
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setMessage(null)
    try {
      if (!portfolioId || !accountId || !securityId || !date) throw new Error("Portfolio, account, security, and date are required.")
      if (!quantity || new Decimal(quantity).lte(0)) throw new Error("Quantity must be greater than zero.")
      if (!price || new Decimal(price).lt(0)) throw new Error("Execution price must be zero or greater.")
      if (charges && new Decimal(charges).lt(0)) throw new Error("Charges cannot be negative.")
      setSubmitting(true)
      await createManualTransaction({ portfolioId, brokerAccountId: accountId, securityId, transactionType, transactionDate: date,
        quantity: new Decimal(quantity).toFixed(), unitPrice: new Decimal(price).toFixed(), totalCharges: charges ? new Decimal(charges).toFixed() : null,
        notes: notes.trim() || null, idempotencyKey: idempotencyKey.current })
      idempotencyKey.current = crypto.randomUUID()
      await onCreated()
    } catch (failure) { setMessage(displayError(failure)); setSubmitting(false) }
  }
  return <section className="panel manual-entry-panel"><div className="panel-heading"><div><p className="eyebrow">Trusted ledger write</p><h2>Add BUY or SELL</h2><p>The server verifies ownership, prevents overselling, and makes retries idempotent.</p></div></div>{message ? <div className="notice notice-error" role="alert">{message}</div> : null}<form className="manual-transaction-form" onSubmit={(event) => void submit(event)}>
    <label><span>Portfolio</span><select required value={portfolioId} onChange={(event) => { setPortfolioId(event.target.value); setAccountId("") }}>{references.portfolios.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    <label><span>Broker / demat account</span><select required value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">Select account</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <div className="security-picker form-wide"><label><span>Security</span><input aria-label="Security" type="search" autoComplete="off" placeholder="Type ticker or company name" value={securitySearch} onChange={(event) => { setSecuritySearch(event.target.value); setSecurityId(""); setNewSecurity(null); setSecurityNotice(null) }} /></label>
      {selectedSecurity ? <div className="security-selection"><span>Selected</span><strong>{"label" in selectedSecurity ? selectedSecurity.label : `${selectedSecurity.symbol} — ${selectedSecurity.name}`}</strong></div> : securitySearch.trim() ? <div className="security-results" role="listbox" aria-label="Matching securities">{matchingSecurities.length ? matchingSecurities.map((item) => <button type="button" role="option" aria-selected="false" key={item.id} onClick={() => { setSecurityId(item.id); setSecuritySearch(`${item.symbol} — ${item.name}`); setShowSecurity(false) }}><strong>{item.symbol}</strong><span>{item.name}</span><small>{item.exchange}</small></button>) : <div className="security-no-results"><p>No existing security found.</p><button type="button" className="button button-secondary" onClick={() => setShowSecurity(true)}>+ Add {suggestedSymbol || "new security"} as a new security</button></div>}</div> : <small>Start typing to find an existing security or add a new one.</small>}
    </div>
    <label><span>Transaction type</span><select value={transactionType} onChange={(event) => setTransactionType(event.target.value as "BUY" | "SELL")}><option>BUY</option><option>SELL</option></select></label>
    <label><span>Transaction date</span><input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label>
    <label><span>Quantity</span><input required inputMode="decimal" placeholder="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
    <label><span>Execution price</span><input required inputMode="decimal" placeholder="0.00" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
    <label><span>Total charges (optional)</span><input inputMode="decimal" placeholder="Unknown if blank" value={charges} onChange={(event) => setCharges(event.target.value)} /></label>
    <label className="form-wide"><span>Notes (optional)</span><textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <div className="form-wide form-actions"><small>Blank charges remain unknown; they are never converted to zero.</small><button className="button button-primary" disabled={submitting}>{submitting ? "Recording…" : "Record transaction"}</button></div>
  </form>{showSecurity ? <NewSecurityForm portfolioId={portfolioId} initialSymbol={suggestedSymbol} existing={references.securities} onCreated={(id, status, label) => { setNewSecurity({ id, label }); setSecurityId(id); setSecuritySearch(label); setShowSecurity(false); setSecurityNotice(status === "VERIFIED" ? "Security added and market-data mapping verified." : "Security added and selected. Price mapping pending.") }} /> : null}{securityNotice ? <div className="notice">{securityNotice}</div> : null}</section>
}

function NewSecurityForm({ portfolioId, initialSymbol, existing, onCreated }: { readonly portfolioId: string; readonly initialSymbol: string; readonly existing: TransactionReferences["securities"]; readonly onCreated: (id: string, status: string, label: string) => void }) {
  const [exchange, setExchange] = useState<"NSE" | "BSE">("NSE"); const [symbol, setSymbol] = useState(initialSymbol); const [name, setName] = useState("")
  const [assetClass, setAssetClass] = useState<"EQUITY" | "ETF">("EQUITY"); const [isin, setIsin] = useState(""); const [series, setSeries] = useState("EQ")
  const [message, setMessage] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const key = useRef(crypto.randomUUID())
  const duplicate = existing.find((item) => item.exchange === exchange && item.symbol.replaceAll(" ", "").toUpperCase() === symbol.replaceAll(" ", "").toUpperCase())
    ?? existing.find((item) => isin.trim() && item.isin === isin.trim().toUpperCase())
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setMessage(null)
    if (duplicate) { setMessage(`Possible duplicate: ${duplicate.symbol} — ${duplicate.name}. Select the existing security instead.`); return }
    try { setSubmitting(true); const result = await createManualSecurity({ portfolioId, exchange, symbol, name, assetClass,
      instrumentType: assetClass === "ETF" ? "ETF" : "STOCK", isin: isin.trim() || null, series: series.trim() || null, idempotencyKey: key.current })
      onCreated(result.security_id, result.mapping_status, `${symbol.trim().toUpperCase()} — ${name.trim()}`)
    } catch (failure) { setMessage(displayError(failure)); setSubmitting(false) }
  }
  return <form className="manual-transaction-form nested-form" onSubmit={(event) => void submit(event)}><div className="form-wide"><h3>Add / resolve new security</h3><p>PortfolioAI checks canonical identity before creation. Provider mapping is never guessed.</p></div>{message ? <div className="notice notice-error form-wide" role="alert">{message}</div> : null}
    <label><span>Exchange</span><select value={exchange} onChange={(event) => setExchange(event.target.value as "NSE" | "BSE")}><option>NSE</option><option>BSE</option></select></label>
    <label><span>Trading symbol</span><input required maxLength={40} value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} /></label>
    <label><span>Security name</span><input required maxLength={200} value={name} onChange={(event) => setName(event.target.value)} /></label>
    <label><span>Asset class</span><select value={assetClass} onChange={(event) => setAssetClass(event.target.value as "EQUITY" | "ETF")}><option value="EQUITY">Equity</option><option value="ETF">ETF</option></select></label>
    <label><span>ISIN (optional)</span><input maxLength={12} value={isin} onChange={(event) => setIsin(event.target.value.toUpperCase())} /></label>
    <label><span>Series (optional)</span><input maxLength={12} value={series} onChange={(event) => setSeries(event.target.value.toUpperCase())} /></label>
    <div className="form-wide form-actions"><small>An unresolved mapping does not block the transaction; CMP remains unavailable pending review.</small><button className="button button-secondary" disabled={submitting}>{submitting ? "Verifying…" : "Verify and add"}</button></div>
  </form>
}

function CorrectionForm({ row, references, onClose, onCreated }: { readonly row: TransactionListRow; readonly references: TransactionReferences; readonly onClose: () => void; readonly onCreated: () => Promise<void> }) {
  const [accountId, setAccountId] = useState(row.brokerAccountId ?? ""); const [securityId, setSecurityId] = useState(row.securityId)
  const [type, setType] = useState<"BUY" | "SELL">(row.transactionType as "BUY" | "SELL"); const [date, setDate] = useState(row.transactionDate ?? "")
  const [quantity, setQuantity] = useState(row.quantity ?? ""); const [price, setPrice] = useState(row.unitPrice ?? ""); const [charges, setCharges] = useState(row.charges ?? "")
  const [notes, setNotes] = useState(row.notes ?? ""); const [reason, setReason] = useState(""); const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false); const key = useRef(crypto.randomUUID())
  const highImpact = securityId !== row.securityId || type !== row.transactionType || date !== row.transactionDate || quantity !== row.quantity
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setMessage(null)
    try { if (!securityId || !quantity || !price) throw new Error("Security, quantity, and price are required.")
      if (new Decimal(quantity).lte(0) || new Decimal(price).lt(0) || (charges && new Decimal(charges).lt(0))) throw new Error("Enter valid non-negative values and a quantity greater than zero.")
      if (reason.trim().length < 3) throw new Error("Explain why this correction is needed.")
      setSubmitting(true); await correctTransaction({ originalTransactionId: row.id, portfolioId: row.portfolioId, brokerAccountId: accountId || null,
        securityId, transactionType: type, transactionDate: date || null, quantity: new Decimal(quantity).toFixed(), unitPrice: new Decimal(price).toFixed(),
        totalCharges: charges ? new Decimal(charges).toFixed() : null, notes: notes.trim() || null, reason: reason.trim(), idempotencyKey: key.current })
      await onCreated()
    } catch (failure) { setMessage(displayError(failure)); setSubmitting(false) }
  }
  return <section className="panel manual-entry-panel"><div className="panel-heading"><div><p className="eyebrow">Audited correction</p><h2>Correct {row.symbol} transaction</h2><p>The original remains preserved; this creates the new effective ledger entry.</p></div><button className="text-button" onClick={onClose}>Close</button></div>{message ? <div className="notice notice-error" role="alert">{message}</div> : null}<form className="manual-transaction-form" onSubmit={(event) => void submit(event)}>
    <label><span>Broker / account</span><select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">Unknown / missing</option>{references.accounts.filter((item) => item.portfolioId === row.portfolioId).map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
    <label><span>Security</span><select value={securityId} onChange={(event) => setSecurityId(event.target.value)}>{references.securities.map((item) => <option key={item.id} value={item.id}>{item.symbol} — {item.name}</option>)}</select></label>
    <label><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as "BUY" | "SELL")}><option>BUY</option><option>SELL</option></select></label>
    <label><span>Date</span><input type="date" max={new Date().toISOString().slice(0,10)} value={date} onChange={(event) => setDate(event.target.value)} /><small>Leave blank only when the source date is genuinely unknown.</small></label>
    <label><span>Quantity</span><input required inputMode="decimal" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><label><span>Price</span><input required inputMode="decimal" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
    <label><span>Charges (optional)</span><input inputMode="decimal" value={charges} onChange={(event) => setCharges(event.target.value)} /></label><label className="form-wide"><span>Notes</span><textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <label className="form-wide"><span>Correction reason</span><textarea required minLength={3} maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} /></label>
    {highImpact ? <div className="notice form-wide">This change can alter holdings, FIFO order, realised P&amp;L, and whether the position is open or closed.</div> : null}
    <div className="form-wide form-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" disabled={submitting}>{submitting ? "Correcting…" : "Confirm audited correction"}</button></div>
  </form></section>
}
