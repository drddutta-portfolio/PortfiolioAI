import { describe, expect, it } from "vitest"
import { planBankMaintenance, type BankMaintenanceInput } from "./v14-bank-maintenance-plan.ts"

const A = "6771f493-c29a-477e-8cc8-2bede0941e44"
const B = "5760ce4e-97ac-40ef-af3b-d2a5dce596cf"
const base = (): BankMaintenanceInput => ({
  securityIds: [A, B],
  benchmarkCode: "NIFTY_BANK",
  calendarVerified: true,
  publicationReady: true,
  completedSessions: ["2026-10-07", "2026-10-08"],
  stockSessions: { [A]: ["2026-10-07"], [B]: ["2026-10-07", "2026-10-08"] },
  benchmarkSessions: ["2026-10-07"],
  requiredEvidenceFreshUntil: { [A]: "2026-10-09T00:00:00Z", [B]: "2026-10-10T00:00:00Z" },
  pendingReviewSecurityIds: [],
  inFlightSecurityIds: [],
  providerAvailable: true,
  budgetAvailable: true,
  evaluationAsOf: "2026-10-09T04:00:00Z",
})

describe("V1-4 banking continuing-freshness plan (no IO)", () => {
  it("requests only absent completed stock sessions and one shared NIFTY_BANK delta", () => {
    const plan = planBankMaintenance(base())
    expect(plan.executionAllowed).toBe(false)
    expect(plan.safeToAcquire).toBe(true)
    expect(plan.missingBenchmarkSessions).toEqual(["2026-10-08"])
    expect(plan.benchmarkFetchCount).toBe(1)
    expect(plan.stockDecisions[0]?.acquireStockSessions).toEqual(["2026-10-08"])
    expect(plan.stockDecisions[1]?.acquireStockSessions).toEqual([])
    expect(plan.stockDecisions[0]?.mustNotDisplayCurrentReady).toBe(true)
  })
  it("repeated discovery with qualified tail has no missing requests", () => {
    const input=base()
    const plan=planBankMaintenance({ ...input,
      stockSessions:{ [A]:["2026-10-07","2026-10-08"], [B]:["2026-10-07","2026-10-08"] },
      benchmarkSessions:["2026-10-07","2026-10-08"] })
    expect(plan.stockDecisions.every(d=>d.acquireStockSessions.length===0)).toBe(true)
    expect(plan.benchmarkFetchCount).toBe(0)
  })
  it("holidays and weekends never create gaps when omitted from verified sessions", () => {
    const plan=planBankMaintenance({...base(),completedSessions:["2026-10-08"],
      stockSessions:{[A]:["2026-10-08"],[B]:["2026-10-08"]},benchmarkSessions:["2026-10-08"]})
    expect(plan.missingBenchmarkSessions).toEqual([])
    expect(plan.stockDecisions.every(d=>d.acquireStockSessions.length===0)).toBe(true)
  })
  it("unpublished or unverified sessions fail closed without extending freshness", () => {
    const p=planBankMaintenance({...base(),calendarVerified:false,publicationReady:false})
    expect(p.safeToAcquire).toBe(false)
    expect(p.failureReasons).toEqual(["CALENDAR_UNVERIFIED","SESSION_UNPUBLISHED"])
    expect(p.stockDecisions.every(d=>d.mustNotDisplayCurrentReady)).toBe(true)
  })
  it("provider failure, exhaustion and in-flight bank block acquisition without cross-bank exclusion", () => {
    const p=planBankMaintenance({...base(),providerAvailable:false,budgetAvailable:false,inFlightSecurityIds:[A]})
    expect(p.safeToAcquire).toBe(false)
    expect(p.stockDecisions[0]?.reasons).toContain("IN_FLIGHT")
    expect(p.stockDecisions[1]?.reasons).not.toContain("IN_FLIGHT")
  })
  it("expiry must veto displayed current readiness even when no provider data arrives", () => {
    const p=planBankMaintenance({...base(),completedSessions:[],
      benchmarkSessions:[],stockSessions:{},pendingReviewSecurityIds:[]})
    expect(p.stockDecisions[0]?.reasons).toContain("EVIDENCE_EXPIRED")
    expect(p.stockDecisions[0]?.mustNotDisplayCurrentReady).toBe(true)
    expect(p.stockDecisions[1]?.mustNotDisplayCurrentReady).toBe(false)
  })
  it("missing expiry contract and pending documentary review are not READY", () => {
    const p=planBankMaintenance({...base(),requiredEvidenceFreshUntil:{[A]:null,[B]:"2026-10-10T00:00:00Z"},
      pendingReviewSecurityIds:[B]})
    expect(p.stockDecisions[0]?.reasons).toContain("EVIDENCE_EXPIRY_UNPROVEN")
    expect(p.stockDecisions[1]?.reasons).toContain("REVIEW_PENDING")
    expect(p.stockDecisions.every(d=>d.mustNotDisplayCurrentReady)).toBe(true)
  })
  it("rejects guessed dates, duplicate identities and wrong benchmark instead of relaxing limits", () => {
    expect(()=>planBankMaintenance({...base(),completedSessions:["2026-02-30"]})).toThrow("EXCHANGE_SESSIONS_INVALID")
    expect(()=>planBankMaintenance({...base(),securityIds:[A,A]})).toThrow("BANK_SECURITY_SCOPE_INVALID")
    expect(()=>planBankMaintenance({...base(),benchmarkCode:"NIFTY_500" as "NIFTY_BANK"})).toThrow("BANK_BENCHMARK_IDENTITY_INVALID")
  })
})
