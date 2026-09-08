import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TransactionsPage } from "./TransactionsPage"

const loadTransactions = vi.fn()
const createManualTransaction = vi.fn()
const createManualSecurity = vi.fn()
const correctTransaction = vi.fn()
const voidTransaction = vi.fn()
const restoreTransaction = vi.fn()
vi.mock("../features/portfolio/usePortfolioView", () => ({ usePortfolioView: () => ({ portfolio: null, error: null, isLoading: false, reload: vi.fn() }) }))
vi.mock("../data/transactionRepository", () => ({
  // Mock functions are intentionally untyped at this module boundary.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  loadTransactions: () => loadTransactions(),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  createManualTransaction: (...args: unknown[]) => createManualTransaction(...args),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  createManualSecurity: (...args: unknown[]) => createManualSecurity(...args),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  correctTransaction: (...args: unknown[]) => correctTransaction(...args),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  voidTransaction: (...args: unknown[]) => voidTransaction(...args),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  restoreTransaction: (...args: unknown[]) => restoreTransaction(...args),
}))

const result = {
  auditFeaturesAvailable: true,
  rows: [
    { id: "t1", portfolioId: "p1", securityId: "s1", symbol: "ABC", company: "ABC Limited", brokerAccountId: "a1", broker: "Broker", account: "Primary", transactionType: "BUY", transactionDate: "2026-01-01", quantity: "2", unitPrice: "10", grossAmount: null, charges: null, taxes: null, sourceType: "MANUAL", sourceProvider: "PORTFOLIOAI", dataQualityStatus: "COMPLETE", accountingStatus: "ACTIVE", importBatchId: null, importSourceRowId: null, createdAt: "2026-01-01T00:00:00Z", notes: null, correctedFromTransactionId:null, correctionReason:null, supersededAt:null, accountingEvents:[] },
    { id: "t2", portfolioId: "p1", securityId: "s2", symbol: "XYZ", company: "XYZ Limited", brokerAccountId: null, broker: null, account: null, transactionType: "SELL", transactionDate: null, quantity: "1", unitPrice: "12", grossAmount: null, charges: null, taxes: null, sourceType: "PORTFOLIO_HISTORICAL_XLSX", sourceProvider: null, dataQualityStatus: "MISSING_DATE_AND_BROKER", accountingStatus: "ACTIVE", importBatchId: "b1", importSourceRowId: "r1", createdAt: "2026-01-02T00:00:00Z", notes: null, correctedFromTransactionId:null, correctionReason:null, supersededAt:null, accountingEvents:[] },
  ],
  references: { portfolios: [{ id: "p1", name: "Portfolio" }], accounts: [{ id: "a1", portfolioId: "p1", label: "Broker · Primary" }], securities: [{ id: "s1", symbol: "ABC", name: "ABC Limited", exchange: "NSE", isin: null, instrumentType: "STOCK" }] },
}

describe("TransactionsPage", () => {
  beforeEach(() => { loadTransactions.mockResolvedValue(result); createManualTransaction.mockReset(); createManualSecurity.mockReset(); correctTransaction.mockReset(); voidTransaction.mockReset(); restoreTransaction.mockReset() })
  afterEach(cleanup)
  it("renders the ledger and filters missing-date evidence", async () => {
    render(<TransactionsPage />)
    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument()
    expect(screen.getByText("ABC Limited")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("Missing date"))
    expect(screen.queryByText("ABC Limited")).not.toBeInTheDocument()
    expect(screen.getAllByText("Missing date", { selector: "span" })).toHaveLength(2)
  })

  it("loads the pre-migration schema state without exposing PGRST205", async () => {
    loadTransactions.mockResolvedValueOnce({ ...result, auditFeaturesAvailable: false })
    render(<TransactionsPage />)
    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument()
    expect(screen.getByText("ABC Limited")).toBeInTheDocument()
    expect(screen.getByText(/Void\/restore audit history is not available/)).toBeInTheDocument()
    expect(screen.queryByText(/PGRST205/)).not.toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Correct" })).not.toHaveLength(0)
    expect(screen.queryByRole("button", { name: "Remove" })).not.toBeInTheDocument()
  })

  it("rejects incomplete manual entry before calling the trusted RPC", async () => {
    render(<TransactionsPage />)
    await screen.findByRole("heading", { name: "Transactions" })
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }))
    fireEvent.submit(screen.getByRole("button", { name: "Record transaction" }).closest("form")!)
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("required"))
    expect(createManualTransaction).not.toHaveBeenCalled()
  })

  it("sorts columns and resets combined filters", async () => {
    render(<TransactionsPage />)
    await screen.findByText("ABC Limited")
    fireEvent.click(screen.getByRole("button", { name: /Security/ }))
    expect(screen.getAllByRole("row")[1]).toHaveTextContent("ABC")
    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "SELL" } })
    expect(screen.queryByText("ABC Limited")).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Reset filters" }))
    expect(screen.getByText("ABC Limited")).toBeInTheDocument()
  })

  it("offers unknown ticker onboarding, preserves BUY fields, and selects the new security", async () => {
    createManualSecurity.mockResolvedValue({ security_id: "s-new", mapping_status: "UNRESOLVED" })
    createManualTransaction.mockResolvedValue({ transaction_id: "t-new" })
    render(<TransactionsPage />)
    await screen.findByRole("heading", { name: "Transactions" })
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }))
    fireEvent.change(screen.getByLabelText("Broker / demat account"), { target: { value: "a1" } })
    fireEvent.change(screen.getByLabelText("Transaction date"), { target: { value: "2026-09-07" } })
    fireEvent.change(screen.getByLabelText("Quantity"), { target: { value: "12" } })
    fireEvent.change(screen.getByLabelText("Execution price"), { target: { value: "221" } })
    fireEvent.change(screen.getByPlaceholderText("Type ticker or company name"), { target: { value: "V2RETAIL" } })
    expect(screen.getByText("No existing security found.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "+ Add V2RETAIL as a new security" }))
    expect(screen.getByLabelText("Trading symbol")).toHaveValue("V2RETAIL")
    fireEvent.change(screen.getByLabelText("Security name"), { target: { value: "New Company" } })
    fireEvent.submit(screen.getByRole("button", { name: "Verify and add" }).closest("form")!)
    await waitFor(() => expect(createManualSecurity).toHaveBeenCalledOnce())
    expect(screen.getByPlaceholderText("Type ticker or company name")).toHaveValue("V2RETAIL — New Company")
    expect(screen.getByText("Selected")).toBeInTheDocument()
    expect(screen.getByText(/price mapping pending/i)).toBeInTheDocument()
    fireEvent.submit(screen.getByRole("button", { name: "Record transaction" }).closest("form")!)
    await waitFor(() => expect(createManualTransaction).toHaveBeenCalledWith(expect.objectContaining({ securityId: "s-new", quantity: "12", unitPrice: "221" })))
  })

  it("selects an existing security from the same searchable control", async () => {
    render(<TransactionsPage />)
    await screen.findByRole("heading", { name: "Transactions" })
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }))
    fireEvent.change(screen.getByPlaceholderText("Type ticker or company name"), { target: { value: "ABC" } })
    fireEvent.click(within(screen.getByRole("listbox", { name: "Matching securities" })).getByRole("option", { name: /ABC Limited/ }))
    expect(screen.getByPlaceholderText("Type ticker or company name")).toHaveValue("ABC — ABC Limited")
    expect(screen.getByText("Selected")).toBeInTheDocument()
  })

  it("opens the actual Correct action in a visible dialog and submits every editable field", async () => {
    correctTransaction.mockResolvedValue({ transaction_id: "replacement" })
    render(<TransactionsPage />); await screen.findByText("ABC Limited")
    fireEvent.click(screen.getAllByRole("button", { name: "Correct" })[0]!)
    const dialog=screen.getByRole("dialog",{name:"Correct ABC transaction"})
    fireEvent.change(within(dialog).getByLabelText("Quantity"),{target:{value:"3"}})
    fireEvent.change(within(dialog).getByLabelText("Price"),{target:{value:"11"}})
    fireEvent.change(within(dialog).getByLabelText("Correction reason"),{target:{value:"Owner verified entry error"}})
    fireEvent.submit(within(dialog).getByRole("button",{name:"Confirm audited correction"}).closest("form")!)
    await waitFor(()=>expect(correctTransaction).toHaveBeenCalledWith(expect.objectContaining({ originalTransactionId:"t1",portfolioId:"p1",brokerAccountId:"a1",securityId:"s1",transactionType:"BUY",transactionDate:"2026-01-01",quantity:"3",unitPrice:"11",reason:"Owner verified entry error" })))
  })

  it("requires strong confirmation before audited removal", async () => {
    voidTransaction.mockResolvedValue({ transaction_id:"t1" })
    render(<TransactionsPage />); await screen.findByText("ABC Limited")
    fireEvent.click(screen.getAllByRole("button",{name:"Remove"})[0]!)
    const dialog=screen.getByRole("dialog",{name:"Remove ABC transaction"})
    fireEvent.change(within(dialog).getByLabelText("Removal reason"),{target:{value:"Erroneous imported transaction"}})
    fireEvent.submit(within(dialog).getByRole("button",{name:"Confirm audited removal"}).closest("form")!)
    await waitFor(()=>expect(screen.getByRole("alert")).toHaveTextContent("Confirm"))
    expect(voidTransaction).not.toHaveBeenCalled()
    fireEvent.click(within(dialog).getByRole("checkbox")); fireEvent.submit(within(dialog).getByRole("button",{name:"Confirm audited removal"}).closest("form")!)
    await waitFor(()=>expect(voidTransaction).toHaveBeenCalledOnce())
  })
})
