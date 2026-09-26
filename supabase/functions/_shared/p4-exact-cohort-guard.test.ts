import { describe, expect, it } from "vitest"
import {
  P4_CLASSIFICATION_CONFIRMATION,
  assertP4ExactCohortRequest,
  isApprovedP4DevelopmentSupabaseUrl,
  supabaseProjectRef,
} from "./p4-exact-cohort-guard"

const base = {
  supabaseUrl: "https://lrgpjimipfkyoqbpsqzz.supabase.co",
  portfolioId: "6193a4aa-3235-4057-bddc-209fcf443fc2",
  securityIds: ["a", "b"],
  securityNames: ["BEL", "BANKBARODA"],
  confirmation: P4_CLASSIFICATION_CONFIRMATION,
} as const

describe("P4 exact cohort guard", () => {
  it("recognises the approved Development project only", () => {
    expect(isApprovedP4DevelopmentSupabaseUrl(base.supabaseUrl)).toBe(true)
    expect(supabaseProjectRef(base.supabaseUrl)).toBe("lrgpjimipfkyoqbpsqzz")
  })

  it("accepts an exact one/two-security Development cohort", () => {
    expect(assertP4ExactCohortRequest(base)).toEqual({ ok: true })
  })

  it("refuses Production", () => {
    const result = assertP4ExactCohortRequest({ ...base, supabaseUrl: "https://uxiyufbsbgzzdujzcdxe.supabase.co" })
    expect(result).toMatchObject({ ok: false, code: "UNEXPECTED_PRODUCTION_DB_TARGET" })
  })

  it("refuses an unknown hosted project", () => {
    const result = assertP4ExactCohortRequest({ ...base, supabaseUrl: "https://aaaaaaaaaaaaaaaaaaaa.supabase.co" })
    expect(result).toMatchObject({ ok: false, code: "UNAPPROVED_DEVELOPMENT_DB_TARGET" })
  })

  it("refuses more than two securities", () => {
    const result = assertP4ExactCohortRequest({ ...base, securityIds: ["a", "b", "c"], securityNames: ["A", "B", "C"] })
    expect(result).toMatchObject({ ok: false, code: "CLASSIFICATION_IDENTITY_PREREQUISITE_MISSING" })
  })

  it("refuses the wrong confirmation", () => {
    const result = assertP4ExactCohortRequest({ ...base, confirmation: "WRONG" })
    expect(result).toMatchObject({ ok: false, code: "AUTH_OR_CONFIG_ERROR" })
  })
})
