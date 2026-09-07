// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sql = readFileSync(new URL("../../migrations/20260907160000_create_stage5_manual_transactions.sql", import.meta.url), "utf8")

describe("Stage 5 trusted-write migration", () => {
  it("keeps the ledger browser read-only and narrows RPC execution", () => {
    expect(sql).toContain("security definer")
    expect(sql).toContain("set search_path = ''")
    expect(sql).toContain("revoke execute on function public.create_manual_transaction_v1")
    expect(sql).toContain("to authenticated")
    expect(sql).not.toMatch(/grant\s+insert[^;]+public\.transactions/iu)
  })

  it("derives ownership and validates account, security, oversell and idempotency", () => {
    expect(sql).toContain("v_user_id uuid := auth.uid()")
    expect(sql).toContain("a.portfolio_id = p_portfolio_id")
    expect(sql).toContain("s.id = p_security_id and s.is_active")
    expect(sql).toContain("p_quantity > v_available")
    expect(sql).toContain("idempotency_key")
    expect(sql).toContain("pg_advisory_xact_lock")
  })
})
