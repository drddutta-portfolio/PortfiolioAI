import Decimal from "decimal.js"
import { useEffect, useMemo, useRef, useState } from "react"
import { createManualTransaction, loadTransactions, type TransactionListRow, type TransactionReferences } from "../data/transactionRepository"
import { formatMoney, formatQuantity } from "../features/portfolio/format"
import { displayError } from "../lib/displayError"

type TypeFilter = "ALL" | "BUY" | "SELL"
type SourceFilter = "ALL" | "MANUAL" | "IMPORTED"

export function TransactionsPage() {
  const [rows, setRows] = useState<readonly TransactionListRow[]>([])
  const [references, setReferences] = useState<TransactionReferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState(""); const [type, setType] = useState<TypeFilter>("ALL")
  const [account, setAccount] = useState("ALL"); const [source, setSource] = useState<SourceFilter>("ALL")
  const [missingDate, setMissingDate] = useState(false); const [missingBroker, setMissingBroker] = useState(false)
  const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [showForm, setShowForm] = useState(false)
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
    return rows.filter((row) => (!query || `${row.symbol} ${row.company} ${row.broker ?? ""} ${row.account ?? ""}`.toUpperCase().includes(query))
      && (type === "ALL" || row.transactionType === type) && (account === "ALL" || row.brokerAccountId === account)
      && (source === "ALL" || (source === "MANUAL" ? row.sourceType === "MANUAL" : row.sourceType !== "MANUAL"))
      && (!missingDate || row.transactionDate === null) && (!missingBroker || row.brokerAccountId === null)
      && (!from || (row.transactionDate !== null && row.transactionDate >= from)) && (!to || (row.transactionDate !== null && row.transactionDate <= to)))
  }, [account, from, missingBroker, missingDate, rows, search, source, to, type])
  if (loading && !references) return <div className="portfolio-loading"><span className="loader" /><p>Loading transaction history…</p></div>
  if (error && !references) return <div className="notice notice-error" role="alert">{error}</div>
  return <section className="portfolio-page">
    <div className="portfolio-hero compact-hero"><div><p className="eyebrow">Source-of-truth ledger</p><h1>Transactions</h1><p>{rows.length} historical transactions, with missing evidence kept explicit.</p></div><button className="button button-primary" onClick={() => setShowForm((value) => !value)}>{showForm ? "Close entry" : "Add transaction"}</button></div>
    {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
    {showForm && references ? <ManualTransactionForm references={references} onCreated={async () => { setShowForm(false); await reload() }} /> : null}
    <section className="panel holdings-panel">
      <div className="holdings-controls transaction-controls"><label className="search-control"><span>Search</span><input type="search" placeholder="Security, broker, account" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        <label><span>Type</span><select value={type} onChange={(event) => setType(event.target.value as TypeFilter)}><option value="ALL">All</option><option>BUY</option><option>SELL</option></select></label>
        <label><span>Account</span><select value={account} onChange={(event) => setAccount(event.target.value)}><option value="ALL">All accounts</option>{references?.accounts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label><span>Source</span><select value={source} onChange={(event) => setSource(event.target.value as SourceFilter)}><option value="ALL">All sources</option><option value="IMPORTED">Imported</option><option value="MANUAL">Manual</option></select></label>
        <label><span>From</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label><span>To</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
        <label className="check-control"><input type="checkbox" checked={missingDate} onChange={(event) => setMissingDate(event.target.checked)} /><span>Missing date</span></label><label className="check-control"><input type="checkbox" checked={missingBroker} onChange={(event) => setMissingBroker(event.target.checked)} /><span>Missing broker</span></label>
      </div>
      <div className="holdings-caption"><strong>{filtered.length}</strong> matching transactions<span>Imported evidence and manual provenance remain distinguishable.</span></div>
      <div className="table-scroll"><table className="holdings-table transactions-table"><thead><tr><th>Date</th><th>Security</th><th>Type</th><th>Quantity</th><th>Price</th><th>Gross</th><th>Charges</th><th>Broker / account</th><th>Source</th><th>Data quality</th><th>Accounting</th><th>Details</th></tr></thead><tbody>{filtered.map((row) => <TransactionRow key={row.id} row={row} />)}</tbody></table></div>
      {!filtered.length ? <div className="data-empty"><strong>No matching transactions</strong><p>Adjust the filters to see more ledger history.</p></div> : null}
    </section>
  </section>
}

function TransactionRow({ row }: { readonly row: TransactionListRow }) {
  const [expanded, setExpanded] = useState(false)
  return <><tr><td>{row.transactionDate ?? <span className="unavailable">Missing date</span>}</td><td><div className="security-cell"><strong>{row.symbol}</strong><span>{row.company}</span></div></td><td><span className={`transaction-badge ${row.transactionType.toLowerCase()}`}>{row.transactionType}</span></td><td className="numeric-cell">{row.quantity ? formatQuantity(row.quantity) : "Unavailable"}</td><td className="numeric-cell">{formatMoney(row.unitPrice)}</td><td className="numeric-cell">{formatMoney(row.grossAmount ?? (row.quantity && row.unitPrice ? new Decimal(row.quantity).times(row.unitPrice).toFixed() : null))}</td><td className="numeric-cell">{formatMoney(row.charges)}</td><td>{row.broker ? <>{row.broker}<small className="sector-label">{row.account}</small></> : <span className="unavailable">Missing broker</span>}</td><td><span className="source-badge">{row.sourceType === "MANUAL" ? "Manual" : "Imported"}</span><small className="sector-label">{row.sourceProvider}</small></td><td><span className={row.dataQualityStatus === "COMPLETE" ? "price-status fresh" : "price-status stale"}>{row.dataQualityStatus.replaceAll("_", " ")}</span></td><td>{row.accountingStatus}</td><td><button className="text-button" onClick={() => setExpanded((value) => !value)}>{expanded ? "Hide" : "View"}</button></td></tr>{expanded ? <tr className="transaction-detail-row"><td colSpan={12}><dl><div><dt>Transaction UUID</dt><dd>{row.id}</dd></div><div><dt>Import batch</dt><dd>{row.importBatchId ?? "Manual entry"}</dd></div><div><dt>Source-row lineage</dt><dd>{row.importSourceRowId ?? "Not applicable"}</dd></div><div><dt>Recorded</dt><dd>{new Date(row.createdAt).toLocaleString("en-IN")}</dd></div>{row.notes ? <div><dt>Notes</dt><dd>{row.notes}</dd></div> : null}</dl></td></tr> : null}</>
}

function ManualTransactionForm({ references, onCreated }: { readonly references: TransactionReferences; readonly onCreated: () => Promise<void> }) {
  const initialPortfolio = references.portfolios[0]?.id ?? ""
  const [portfolioId, setPortfolioId] = useState(initialPortfolio); const [accountId, setAccountId] = useState("")
  const [securityId, setSecurityId] = useState(""); const [transactionType, setTransactionType] = useState<"BUY" | "SELL">("BUY")
  const [date, setDate] = useState(""); const [quantity, setQuantity] = useState(""); const [price, setPrice] = useState("")
  const [charges, setCharges] = useState(""); const [notes, setNotes] = useState(""); const [submitting, setSubmitting] = useState(false)
  const idempotencyKey = useRef(crypto.randomUUID())
  const [message, setMessage] = useState<string | null>(null); const accounts = references.accounts.filter((item) => item.portfolioId === portfolioId)
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
    <label><span>Security</span><select required value={securityId} onChange={(event) => setSecurityId(event.target.value)}><option value="">Select security</option>{references.securities.map((item) => <option key={item.id} value={item.id}>{item.symbol} — {item.name}</option>)}</select></label>
    <label><span>Transaction type</span><select value={transactionType} onChange={(event) => setTransactionType(event.target.value as "BUY" | "SELL")}><option>BUY</option><option>SELL</option></select></label>
    <label><span>Transaction date</span><input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={(event) => setDate(event.target.value)} /></label>
    <label><span>Quantity</span><input required inputMode="decimal" placeholder="0" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
    <label><span>Execution price</span><input required inputMode="decimal" placeholder="0.00" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
    <label><span>Total charges (optional)</span><input inputMode="decimal" placeholder="Unknown if blank" value={charges} onChange={(event) => setCharges(event.target.value)} /></label>
    <label className="form-wide"><span>Notes (optional)</span><textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <div className="form-wide form-actions"><small>Blank charges remain unknown; they are never converted to zero.</small><button className="button button-primary" disabled={submitting}>{submitting ? "Recording…" : "Record transaction"}</button></div>
  </form></section>
}
