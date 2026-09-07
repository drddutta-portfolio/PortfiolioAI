import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { TransactionsPage } from "./TransactionsPage"

const loadTransactions = vi.fn()
const createManualTransaction = vi.fn()
vi.mock("../data/transactionRepository", () => ({
  // Mock functions are intentionally untyped at this module boundary.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  loadTransactions: () => loadTransactions(),
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  createManualTransaction: (...args: unknown[]) => createManualTransaction(...args),
}))

const result = {
  rows: [
    { id: "t1", portfolioId: "p1", securityId: "s1", symbol: "ABC", company: "ABC Limited", brokerAccountId: "a1", broker: "Broker", account: "Primary", transactionType: "BUY", transactionDate: "2026-01-01", quantity: "2", unitPrice: "10", grossAmount: null, charges: null, taxes: null, sourceType: "MANUAL", sourceProvider: "PORTFOLIOAI", dataQualityStatus: "COMPLETE", accountingStatus: "ACTIVE", importBatchId: null, importSourceRowId: null, createdAt: "2026-01-01T00:00:00Z", notes: null },
    { id: "t2", portfolioId: "p1", securityId: "s2", symbol: "XYZ", company: "XYZ Limited", brokerAccountId: null, broker: null, account: null, transactionType: "SELL", transactionDate: null, quantity: "1", unitPrice: "12", grossAmount: null, charges: null, taxes: null, sourceType: "PORTFOLIO_HISTORICAL_XLSX", sourceProvider: null, dataQualityStatus: "MISSING_DATE_AND_BROKER", accountingStatus: "ACTIVE", importBatchId: "b1", importSourceRowId: "r1", createdAt: "2026-01-02T00:00:00Z", notes: null },
  ],
  references: { portfolios: [{ id: "p1", name: "Portfolio" }], accounts: [{ id: "a1", portfolioId: "p1", label: "Broker · Primary" }], securities: [{ id: "s1", symbol: "ABC", name: "ABC Limited" }] },
}

describe("TransactionsPage", () => {
  beforeEach(() => { loadTransactions.mockResolvedValue(result); createManualTransaction.mockReset() })
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
})
