import { describe, expect, it } from "vitest"
import {
  PROGRAM_B_B1_SAFETY_BOUNDARY,
  PROGRAM_B_SCORE_LINEAGE_REQUIRED_FIELDS,
  evaluateProgramBScoringReadiness,
  programBLineageIdentity,
  resolveProgramBMethodology,
  type ProgramBScoringReadinessInput,
} from "./programBR6Contract"

function bankMethodology() {
  return resolveProgramBMethodology({
    assetClass: "EQUITY",
    sector: "Banking",
    industry: "Banks",
    basicIndustry: "Private Sector Bank",
    classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
    classificationState: "READY",
  })
}

function readyInput(): ProgramBScoringReadinessInput {
  return {
    securityId: "security-hdfcbank",
    securityIdentityState: "READY",
    asOfDate: "2026-09-24",
    methodology: bankMethodology(),
    methodologyVersion: "BANK_NBFC_STAGE_8_BANK_V1",
    assignment: {
      required: false,
      state: "NOT_REQUIRED",
      assignmentId: null,
      assignmentVersion: null,
      methodologyRole: "BANK",
      activeReviewedAssignmentCount: null,
      effectiveFrom: null,
      effectiveTo: null,
    },
    evidence: [{
      blockingDomain: "FUNDAMENTALS",
      metricCode: "BANK_ASSET_QUALITY",
      required: true,
      applicability: "APPLICABLE",
      state: "FRESH",
      evidenceIds: ["evidence-1"],
      evidenceAsOfDates: ["2026-09-24"],
      recommendedNextEvidenceAction: null,
    }],
    marketHistory: {
      required: true,
      state: "FRESH",
      evidenceIds: ["market-1"],
      evidenceAsOfDates: ["2026-09-23"],
      recommendedNextEvidenceAction: null,
    },
  }
}

describe("Program B B1 R6 contract and architecture", () => {
  it("resolves methodology only through the Gate K industry-first authority", () => {
    expect(bankMethodology()).toMatchObject({
      state: "RESOLVED",
      engineCode: "BANK_NBFC",
      routedProfileCode: "BANK",
      methodologyAuthority: "BANK_NBFC_STAGE_8_BANK_V1",
      fallbackPolicy: "NONE_FAIL_CLOSED",
    })

    expect(resolveProgramBMethodology({
      assetClass: "EQUITY",
      sector: "Financial Services",
      industry: "NBFC",
      basicIndustry: "Non Banking Financial Company",
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "READY",
    })).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: "BANK_NBFC",
      routedProfileCode: "NBFC_LENDING",
    })

    expect(resolveProgramBMethodology({
      assetClass: "EQUITY",
      sector: "Telecommunication",
      industry: "Telecom Services",
      basicIndustry: null,
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "READY",
    })).toMatchObject({
      state: "METHODOLOGY_NOT_AVAILABLE",
      engineCode: null,
    })
  })

  it("keeps non-equities and unresolved classification out of scoring", () => {
    expect(resolveProgramBMethodology({
      assetClass: "ETF",
      sector: null,
      industry: null,
      basicIndustry: null,
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "READY",
    }).state).toBe("NOT_APPLICABLE")

    expect(resolveProgramBMethodology({
      assetClass: "EQUITY",
      sector: "Banking",
      industry: "Banks",
      basicIndustry: null,
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "CONFLICTING",
    }).state).toBe("REVIEW_REQUIRED")
  })

  it("allows only READY to reach numeric scoring", () => {
    const ready = evaluateProgramBScoringReadiness(readyInput())
    expect(ready.state).toBe("READY")
    expect(ready.canScore).toBe(true)
    expect(ready.blockers).toEqual([])
    expect(ready.reasonCodes).toEqual(["SCORING_READINESS_READY"])
  })

  it("distinguishes missing, stale, conflicting and review-required evidence", () => {
    const base = readyInput()
    const states = [
      ["MISSING", "INSUFFICIENT_EVIDENCE"],
      ["STALE", "STALE_REQUIRED_EVIDENCE"],
      ["CONFLICTING", "CONFLICTING_EVIDENCE"],
      ["REVIEW_REQUIRED", "REVIEW_REQUIRED"],
    ] as const

    for (const [evidenceState, expected] of states) {
      const result = evaluateProgramBScoringReadiness({
        ...base,
        evidence: [{
          ...base.evidence[0]!,
          state: evidenceState,
          recommendedNextEvidenceAction: "REFRESH_OR_REVIEW_FUNDAMENTALS",
        }],
      })
      expect(result.state).toBe(expected)
      expect(result.canScore).toBe(false)
      expect(result.blockers[0]).toMatchObject({
        securityId: base.securityId,
        blockingDomain: "FUNDAMENTALS",
        blockingMetric: "BANK_ASSET_QUALITY",
        requiredState: "FRESH",
        observedState: evidenceState,
        methodologyId: "BANK_NBFC_STAGE_8_BANK_V1",
        methodologyRole: "BANK",
        asOfDate: "2026-09-24",
        recommendedNextEvidenceAction: "REFRESH_OR_REVIEW_FUNDAMENTALS",
      })
    }
  })

  it("treats explicit N/A as distinct from missing mandatory evidence", () => {
    const base = readyInput()
    const result = evaluateProgramBScoringReadiness({
      ...base,
      evidence: [{
        ...base.evidence[0]!,
        applicability: "NOT_APPLICABLE",
        state: "NOT_APPLICABLE",
        evidenceIds: [],
        evidenceAsOfDates: [],
      }],
    })
    expect(result.state).toBe("READY")
    expect(result.canScore).toBe(true)
  })

  it("blocks missing methodology versions and required assignment lineage before scoring", () => {
    const base = readyInput()
    const versionBlocked = evaluateProgramBScoringReadiness({
      ...base,
      methodologyVersion: null,
    })
    expect(versionBlocked.state).toBe("BLOCKED_PREREQUISITE")
    expect(versionBlocked.reasonCodes).toContain("METHODOLOGY_VERSION_MISSING")

    const pharmaMethodology = resolveProgramBMethodology({
      assetClass: "EQUITY",
      sector: "Pharma",
      industry: "Pharmaceuticals",
      basicIndustry: "Pharmaceuticals",
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "READY",
    })
    const assignmentBlocked = evaluateProgramBScoringReadiness({
      ...base,
      methodology: pharmaMethodology,
      methodologyVersion: "PHARMA_V1",
      assignment: {
        required: true,
        state: "MISSING",
        assignmentId: null,
        assignmentVersion: null,
        methodologyRole: null,
        activeReviewedAssignmentCount: 0,
        effectiveFrom: null,
        effectiveTo: null,
      },
    })
    expect(assignmentBlocked.state).toBe("BLOCKED_PREREQUISITE")
    expect(assignmentBlocked.canScore).toBe(false)
    expect(assignmentBlocked.reasonCodes).toContain("ASSIGNMENT_MISSING")
  })

  it("derives the Pharma Primary requirement from PHARMA_V1 and rejects invalid assignment variants", () => {
    const base = readyInput()
    const methodology = resolveProgramBMethodology({
      assetClass: "EQUITY",
      sector: "Pharma",
      industry: "Pharmaceuticals",
      basicIndustry: "Pharmaceuticals",
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "READY",
    })
    const validAssignment = {
      required: false,
      state: "VALID" as const,
      assignmentId: "assignment-torntpharm",
      assignmentVersion: 1,
      methodologyRole: "DOMESTIC_FORMULATIONS",
      activeReviewedAssignmentCount: 1,
      effectiveFrom: "2026-03-31",
      effectiveTo: null,
    }
    const input = { ...base, methodology, methodologyVersion: "PHARMA_V1", assignment: validAssignment }
    expect(evaluateProgramBScoringReadiness(input).state).toBe("READY")

    const invalid = [
      { assignmentId: null },
      { assignmentVersion: null },
      { methodologyRole: "PHARMA" },
      { methodologyRole: "BANK" },
      { methodologyRole: "UNREVIEWED_PHARMA_ROLE" },
      { state: "PROVISIONAL" as const },
      { state: "DISPUTED" as const },
      { state: "CONFLICTING" as const, activeReviewedAssignmentCount: 2 },
      { state: "MISSING" as const, assignmentId: null, methodologyRole: null, activeReviewedAssignmentCount: 0 },
    ]
    for (const change of invalid) {
      const result = evaluateProgramBScoringReadiness({
        ...input,
        assignment: { ...validAssignment, ...change },
      })
      expect(result.state, JSON.stringify(change)).not.toBe("READY")
      expect(result.canScore).toBe(false)
    }
  })

  it("rejects contradictory applicable evidence and required market history marked not applicable", () => {
    const base = readyInput()
    const evidence = evaluateProgramBScoringReadiness({
      ...base,
      evidence: [{ ...base.evidence[0]!, state: "NOT_APPLICABLE" }],
    })
    expect(evidence.state).toBe("REVIEW_REQUIRED")
    expect(evidence.reasonCodes).toContain("FUNDAMENTALS_APPLICABILITY_CONTRADICTION")

    const market = evaluateProgramBScoringReadiness({
      ...base,
      marketHistory: { ...base.marketHistory, state: "NOT_APPLICABLE" },
    })
    expect(market.state).toBe("REVIEW_REQUIRED")
    expect(market.reasonCodes).toContain("MARKET_HISTORY_APPLICABILITY_CONTRADICTION")
  })

  it("fails closed on pending methodology before evidence state can matter", () => {
    const base = readyInput()
    const methodology = resolveProgramBMethodology({
      assetClass: "EQUITY",
      sector: "Financial Services",
      industry: "NBFC",
      basicIndustry: "Non Banking Financial Company",
      classificationVersion: "K1_CANONICAL_CLASSIFICATION_V1",
      classificationState: "READY",
    })
    const result = evaluateProgramBScoringReadiness({
      ...base,
      methodology,
      methodologyVersion: null,
    })
    expect(result.state).toBe("METHODOLOGY_NOT_AVAILABLE")
    expect(result.canScore).toBe(false)
  })

  it("keeps market-history readiness inside the same fail-closed contract", () => {
    const base = readyInput()
    const result = evaluateProgramBScoringReadiness({
      ...base,
      marketHistory: {
        ...base.marketHistory,
        state: "MISSING",
        evidenceIds: [],
        evidenceAsOfDates: [],
        recommendedNextEvidenceAction: "REFRESH_MARKET_HISTORY",
      },
    })
    expect(result.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.blockers[0]).toMatchObject({
      blockingDomain: "MARKET_HISTORY",
      observedState: "MISSING",
      recommendedNextEvidenceAction: "REFRESH_MARKET_HISTORY",
    })
  })

  it("defines complete score-lineage fields without performing a score", () => {
    expect(PROGRAM_B_SCORE_LINEAGE_REQUIRED_FIELDS).toEqual([
      "securityId",
      "asOfDate",
      "classificationVersion",
      "assignmentId",
      "assignmentVersion",
      "methodologyRole",
      "methodologyId",
      "methodologyVersion",
      "evidenceSnapshotId",
      "evidenceIds",
      "evidenceAsOfDates",
      "evidenceFreshness",
      "metricValues",
      "metricApplicability",
      "metricComponentScores",
      "metricWeights",
      "categoryScores",
      "overallScore",
      "readinessState",
      "reasonCodes",
      "calculationVersion",
      "runId",
      "createdAt",
    ])
  })

  it("uses role plus versioned assignment, methodology, as-of date and run identity for lineage", () => {
    const base = {
      securityId: "security-hdfcbank",
      methodologyRole: "BANK",
      assignmentId: null,
      assignmentVersion: null,
      methodologyId: "BANK_NBFC_STAGE_8_BANK_V1",
      methodologyVersion: "BANK_NBFC_STAGE_8_BANK_V1",
      asOfDate: "2026-09-24",
      runId: "run-1",
    } as const

    const first = programBLineageIdentity(base)
    const second = programBLineageIdentity({ ...base, runId: "run-2" })
    const third = programBLineageIdentity({ ...base, asOfDate: "2026-09-25" })

    expect(first).not.toBe(second)
    expect(first).not.toBe(third)
    expect(first).not.toBe(`${base.securityId}::${base.methodologyRole}`)
  })

  it("keeps B1 architecture inert", () => {
    expect(PROGRAM_B_B1_SAFETY_BOUNDARY).toEqual({
      cacheOnly: true,
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      numericScoringExecuted: false,
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
