// @vitest-environment node
import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const sql = readFileSync(new URL("../../migrations_legacy/20260915_pre_r4n_baseline/20260907190000_complete_stage5_1_transaction_management.sql", import.meta.url), "utf8")

describe("Stage 5.1 trusted transaction-management migration", () => {
  it("keeps security-master and ledger writes behind narrow RPCs", () => {
    expect(sql).toContain("security definer set search_path = ''")
    expect(sql).toContain("grant execute on function public.create_manual_security_v1")
    expect(sql).toContain("grant execute on function public.correct_transaction_v1")
    expect(sql).not.toMatch(/grant\s+insert[^;]+public\.(securities|transactions)/iu)
  })

  it("preserves correction lineage, prior evidence and active-only accounting", () => {
    expect(sql).toContain("corrected_from_transaction_id")
    expect(sql).toContain("accounting_status='SUPERSEDED'")
    expect(sql).toContain("accounting_status='ACTIVE'")
    expect(sql).not.toMatch(/update\s+public\.import_source_rows/iu)
  })

  it("does not fabricate provider mappings", () => {
    expect(sql).toContain("'UNRESOLVED'")
    expect(sql).toContain("PENDING_TRUSTED_INSTRUMENT_MASTER_MATCH")
  })
})
