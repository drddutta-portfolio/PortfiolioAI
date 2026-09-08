import { describe, expect, it } from "vitest"
import { isPendingTransactionAuditSchemaError } from "./transactionRepository"

describe("transaction audit schema compatibility", () => {
  it("recognises only expected pending-table and pending-RPC errors", () => {
    expect(isPendingTransactionAuditSchemaError({ code: "PGRST205" })).toBe(true)
    expect(isPendingTransactionAuditSchemaError({ code: "PGRST202" })).toBe(true)
    expect(isPendingTransactionAuditSchemaError({ code: "42883" })).toBe(true)
  })

  it("does not swallow unrelated database failures", () => {
    expect(isPendingTransactionAuditSchemaError({ code: "42501" })).toBe(false)
    expect(isPendingTransactionAuditSchemaError({ code: "23514" })).toBe(false)
    expect(isPendingTransactionAuditSchemaError(null)).toBe(false)
  })
})
