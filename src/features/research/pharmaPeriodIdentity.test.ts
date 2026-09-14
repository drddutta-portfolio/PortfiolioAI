import { describe, expect, it } from "vitest"
import { TORNTPHARM_PERIOD_IDENTITY, torntpharmPeriodEnd } from "./pharmaPeriodIdentity"

describe("TORNTPHARM period identity", () => {
  it("uses the issuer Apr-Mar reporting calendar", () => {
    expect(TORNTPHARM_PERIOD_IDENTITY.fiscalYear).toBe("01-Apr to 31-Mar")
    expect(torntpharmPeriodEnd("Y0")).toBe("2026-03-31")
    expect(torntpharmPeriodEnd("Y5")).toBe("2021-03-31")
  })

  it("maps latest and prior quarter offsets from the official Q1 FY27 anchor", () => {
    expect(torntpharmPeriodEnd("Q0")).toBe("2026-06-30")
    expect(torntpharmPeriodEnd("Q1")).toBe("2026-03-31")
    expect(torntpharmPeriodEnd("Q4")).toBe("2025-06-30")
    expect(torntpharmPeriodEnd("Q8")).toBe("2024-06-30")
  })

  it("requires issuer/exchange evidence rather than an inferred calendar", () => {
    expect(TORNTPHARM_PERIOD_IDENTITY.evidence).toHaveLength(3)
    expect(TORNTPHARM_PERIOD_IDENTITY.evidence.every((item) => item.sourceCode === "COMPANY_EXCHANGE_FILING")).toBe(true)
    expect(TORNTPHARM_PERIOD_IDENTITY.evidence.some((item) => item.statement.includes("30 June 2026"))).toBe(true)
  })
})
