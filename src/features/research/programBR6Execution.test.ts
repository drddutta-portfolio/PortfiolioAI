import { describe, expect, it } from "vitest"
import { AUROPHARMA_G10_2_FINAL_RESULT } from "./auropharmaG102FinalResult"
import { K5_CURRENT_PORTFOLIO_ROUTING_ROWS } from "./k5CurrentPortfolioRoutingSnapshot"
import {
  PROGRAM_B_B2_SAFETY_BOUNDARY,
  buildProgramB2ControlledCohort,
  buildProgramB2FrozenPortfolioDisposition,
  buildProgramB2ReferenceResults,
  canonicalProgramB2ReferencePayload,
  programBRoleScopedEvidenceKey,
} from "./programBR6Execution"
import { TORNTPHARM_GATE_H3_READ_ONLY_RESULT } from "./torntpharmGateH3ReadOnlyScore"

describe("Program B B2 R6 execution and validation", () => {
  it("executes only the already-authoritative read-only reference scores", () => {
    const results = buildProgramB2ReferenceResults()
    const torntpharm = results.find((row) => row.symbol === "TORNTPHARM")
    const alivus = results.find((row) => row.symbol === "ALIVUS")

    expect(torntpharm).toMatchObject({
      dispositionState: "SCORED",
      methodologyRole: "DOMESTIC_FORMULATIONS",
      overallScore: 75.1575,
      noRenormalization: true,
      readOnly: true,
      nonPersisting: true,
    })
    expect(torntpharm?.overallScore).toBe(TORNTPHARM_GATE_H3_READ_ONLY_RESULT.overallScore)

    expect(alivus?.dispositionState).toBe("SCORED")
    expect(alivus?.methodologyRole).toBe("API_BULK_DRUGS")
    expect(Number.isFinite(alivus?.overallScore ?? Number.NaN)).toBe(true)
    expect(Object.keys(alivus?.categoryScores ?? {})).toHaveLength(10)
  })

  it("keeps incomplete Pharma reference cases fail-closed without reconstruction", () => {
    const results = buildProgramB2ReferenceResults()
    for (const symbol of ["AUROPHARMA", "BIOCON", "SYNGENE"]) {
      const result = results.find((row) => row.symbol === symbol)
      expect(result?.dispositionState).toBe("INSUFFICIENT_EVIDENCE")
      expect(result?.overallScore).toBeNull()
      expect(result?.categoryScores).toEqual({})
      expect(result?.noRenormalization).toBe(true)
    }

    expect(AUROPHARMA_G10_2_FINAL_RESULT.noPartialScoreReconstruction).toBe(true)
    expect(AUROPHARMA_G10_2_FINAL_RESULT.noRenormalization).toBe(true)
  })

  it("includes HDFCBANK but does not fabricate a cache-pure B2 score snapshot", () => {
    expect(buildProgramB2ReferenceResults().find((row) => row.symbol === "HDFCBANK")).toMatchObject({
      methodologyRole: "BANK",
      dispositionState: "BLOCKED_PREREQUISITE",
      overallScore: null,
      reasonCodes: ["B2_CACHE_PURE_BANK_REFERENCE_INPUT_SNAPSHOT_NOT_MATERIALIZED"],
    })
  })

  it("replays deterministic business payloads identically", () => {
    const first = buildProgramB2ReferenceResults().map(canonicalProgramB2ReferencePayload)
    const second = buildProgramB2ReferenceResults().map(canonicalProgramB2ReferencePayload)
    expect(second).toEqual(first)
  })

  it("keeps role-keyed evidence company and assignment scoped", () => {
    const companyXPrimary = programBRoleScopedEvidenceKey({
      securityId: "company-x",
      methodologyRole: "GLOBAL_GENERICS_PRIMARY",
      assignmentId: "assignment-x",
      assignmentVersion: 3,
      effectiveFrom: "2026-09-01",
      evidenceId: "evidence-1",
    })
    const companyYOverlay = programBRoleScopedEvidenceKey({
      securityId: "company-y",
      methodologyRole: "GLOBAL_GENERICS_OVERLAY",
      assignmentId: "assignment-y",
      assignmentVersion: 2,
      effectiveFrom: "2026-09-01",
      evidenceId: "evidence-1",
    })
    expect(companyXPrimary).not.toBe(companyYOverlay)
  })

  it("selects a real frozen-portfolio unsupported-methodology control and an explicit non-equity control", () => {
    const cohort = buildProgramB2ControlledCohort()
    expect(cohort.unsupportedControl).not.toBeNull()
    expect(cohort.unsupportedControl?.dispositionState).toBe("METHODOLOGY_NOT_AVAILABLE")
    expect(cohort.nonEquityControl.dispositionState).toBe("NOT_APPLICABLE")
    expect(cohort.providerCalls).toBe(0)
  })

  it("produces a canonical disposition for every frozen current-portfolio equity", () => {
    const validation = buildProgramB2FrozenPortfolioDisposition()
    expect(validation.totalHoldings).toBe(K5_CURRENT_PORTFOLIO_ROUTING_ROWS.length)
    expect(validation.totalHoldings).toBe(238)
    expect(validation.rows).toHaveLength(238)
    expect(validation.dispositionComplete).toBe(true)
    expect(validation.scored + validation.failClosed).toBe(238)
    expect(validation.providerCalls).toBe(0)

    const allowed = new Set([
      "SCORED",
      "INSUFFICIENT_EVIDENCE",
      "STALE_REQUIRED_EVIDENCE",
      "CONFLICTING_EVIDENCE",
      "REVIEW_REQUIRED",
      "METHODOLOGY_NOT_AVAILABLE",
      "NOT_APPLICABLE",
      "BLOCKED_PREREQUISITE",
    ])
    for (const row of validation.rows) expect(allowed.has(row.dispositionState), row.symbol).toBe(true)
  })

  it("does not claim portfolio-wide numeric coverage when fail-closed rows remain", () => {
    const validation = buildProgramB2FrozenPortfolioDisposition()
    expect(validation.failClosed).toBeGreaterThan(0)
    expect(validation.numericCoverageComplete).toBe(false)
  })

  it("keeps B2 computation inert outside deterministic read-only scoring", () => {
    expect(PROGRAM_B_B2_SAFETY_BOUNDARY).toEqual({
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      scorePersistence: false,
      recommendationComputation: false,
      recommendationPersistence: false,
      positionSizing: false,
      productionMutation: false,
      migration: false,
      deployment: false,
      merge: false,
      schedulerMutation: false,
      trading: false,
    })
  })
})
