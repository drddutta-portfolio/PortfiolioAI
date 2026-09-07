import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TransactionsPage } from "./TransactionsPage"

const loadTransactions = vi.fn()
const createManualTransaction = vi.fn()
const createManualSecurity = vi.fn()
const correctTransaction = vi.fn()
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
}))

const result = {
  rows: [
    { id: "t1", portfolioId: "p1", securityId: "s1", symbol: "ABC", company: "ABC Limited", brokerAccountId: "a1", broker: "Broker", account: "Primary", transactionType: "BUY", transactionDate: "2026-01-01", quantity: "2", unitPrice: "10", grossAmount: null, charges: null, taxes: null, sourceType: "MANUAL", sourceProvider: "PORTFOLIOAI", dataQualityStatus: "COMPLETE", accountingStatus: "ACTIVE", importBatchId: null, importSourceRowId: null, createdAt: "2026-01-01T00:00:00Z", notes: null },
    { id: "t2", portfolioId: "p1", securityId: "s2", symbol: "XYZ", company: "XYZ Limited", brokerAccountId: null, broker: null, account: null, transactionType: "SELL", transactionDate: null, quantity: "1", unitPrice: "12", grossAmount: null, charges: null, taxes: null, sourceType: "PORTFOLIO_HISTORICAL_XLSX", sourceProvider: null, dataQualityStatus: "MISSING_DATE_AND_BROKER", accountingStatus: "ACTIVE", importBatchId: "b1", importSourceRowId: "r1", createdAt: "2026-01-02T00:00:00Z", notes: null },
  ],
  references: { portfolios: [{ id: "p1", name: "Portfolio" }], accounts: [{ id: "a1", portfolioId: "p1", label: "Broker · Primary" }], securities: [{ id: "s1", symbol: "ABC", name: "ABC Limited", exchange: "NSE", isin: null, instrumentType: "STOCK" }] },
}

describe("TransactionsPage", () => {
  beforeEach(() => { loadTransactions.mockResolvedValue(result); createManualTransaction.mockReset(); createManualSecurity.mockReset(); correctTransaction.mockReset() })
  afterEach(cleanup)
  it("renders the ledger and filters missing-date evidence", async () => {
    render(<TransactionsPage />)
    expect(await screen.findByRole("heading", { name: "Transactions" })).toBeInTheDocument()
    expect(screen.getByText("ABC Limited")).toBeInTheDocument()
    fireEvent.click(screen.getByLabelText("Missing date"))
    expect(screen.queryByText("ABC Limited")).not.toBeInTheDocument()
    expect(screen.getAllByText("Missing date", { selector: "span" })).toHaveLength(2)
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

  it("keeps a newly resolved security selected in the transaction workflow", async () => {
    createManualSecurity.mockResolvedValue({ security_id: "s-new", mapping_status: "UNRESOLVED" })
    render(<TransactionsPage />)
    await screen.findByRole("heading", { name: "Transactions" })
    fireEvent.click(screen.getByRole("button", { name: "Add transaction" }))
    fireEvent.click(screen.getByRole("button", { name: "Add / resolve new security" }))
    fireEvent.change(screen.getByLabelText("Trading symbol"), { target: { value: "NEWCO" } })
    fireEvent.change(screen.getByLabelText("Security name"), { target: { value: "New Company" } })
    fireEvent.submit(screen.getByRole("button", { name: "Verify and add" }).closest("form")!)
    await waitFor(() => expect(createManualSecurity).toHaveBeenCalledOnce())
    expect(screen.getAllByLabelText("Security").find((element) => element.hasAttribute("required"))).toHaveValue("s-new")
    expect(screen.getByText(/pending trusted mapping review/i)).toBeInTheDocument()
  })
})
