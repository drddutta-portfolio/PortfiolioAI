import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

const sql = readFileSync(
  resolve(process.cwd(), "scripts/r4n/auropharma-local-research-target.sql"),
  "utf8",
)
const runner = readFileSync(
  resolve(process.cwd(), "scripts/r4n/run-auropharma-local-research-target.sh"),
  "utf8",
)

describe("AUROPHARMA local G8 Research target fixture", () => {
  it("uses the verified canonical NSE identity", () => {
    expect(sql).toContain("'AUROPHARMA'")
    expect(sql).toContain("'INE406A01037'")
    expect(sql).toContain("'Aurobindo Pharma Limited'")
    expect(sql).toContain("'NSE'")
    expect(sql).toContain("'EQ'")
  })

  it("targets exactly the same active portfolio the application loads", () => {
    expect(sql).toContain("FROM public.portfolios")
    expect(sql).toContain("WHERE is_active")
    expect(sql).toContain("ORDER BY created_at, id")
    expect(sql).toContain("LOCAL_FIXTURE_APP_PORTFOLIO_EXPECTED_TWO_HOLDINGS")
    expect(sql).toContain("LOCAL_FIXTURE_APP_PORTFOLIO_REFERENCE_HOLDINGS_MISMATCH")
    expect(sql).toContain("HDFCBANK_HOLDING_CHANGED")
    expect(sql).toContain("TORNTPHARM_HOLDING_CHANGED")
  })

  it("creates only a synthetic ownership link with no fabricated financial values", () => {
    expect(sql).toContain("'OPENING_POSITION'")
    expect(sql).toContain("'LOCAL_G8_FIXTURE'")
    expect(sql).toContain("'NEEDS_REVIEW'")
    expect(sql).toContain("Synthetic ownership link")
    expect(sql).toMatch(/'OPENING_POSITION',[\s\S]*?NULL,[\s\S]*?NULL,[\s\S]*?1,[\s\S]*?NULL,[\s\S]*?NULL,[\s\S]*?NULL,[\s\S]*?NULL,[\s\S]*?NULL,/)
  })

  it("does not fabricate research, identity, assignment, score or recommendation evidence", () => {
    expect(sql).not.toMatch(/INSERT INTO public\.fundamental_observations/i)
    expect(sql).not.toMatch(/INSERT INTO public\.research_documents/i)
    expect(sql).not.toMatch(/INSERT INTO public\.security_identity_observations/i)
    expect(sql).not.toMatch(/INSERT INTO public\.research_subprofile_assignments/i)
    expect(sql).not.toMatch(/INSERT INTO public\.security_score_runs/i)
    expect(sql).not.toMatch(/INSERT INTO public\.recommendation_runs/i)
  })

  it("cleans up only misplaced synthetic AUROPHARMA fixture transactions", () => {
    expect(sql).toContain("DELETE FROM public.transactions")
    expect(sql).toContain("source_type = 'LOCAL_G8_FIXTURE'")
    expect(sql).toContain("deduplication_key = 'LOCAL_G8_FIXTURE:AUROPHARMA'")
    expect(sql).toContain("portfolio_id <> v_portfolio_id")
  })

  it("is idempotent for security, listing and current-holding creation", () => {
    expect(sql).toContain("AUROPHARMA_EXISTING_SECURITY_CONFLICT")
    expect(sql).toContain("WHERE NOT EXISTS")
    expect(sql).toContain("AUROPHARMA_CURRENT_HOLDING_NOT_CREATED")
  })

  it("uses an explicit transaction boundary", () => {
    expect(sql).toMatch(/\bBEGIN;/)
    expect(sql).toMatch(/\bCOMMIT;/)
  })

  it("refuses a non-local database URL in the runner", () => {
    expect(runner).toContain("127.0.0.1")
    expect(runner).toContain("localhost")
    expect(runner).toContain("REFUSING: AUROPHARMA G8 fixture is local-only")
  })
})
