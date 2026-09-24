import { describe, expect, it } from "vitest"
import type { PortfolioViewModel } from "../portfolio/types"
import type { ResearchCoverageRow } from "../research/researchCoverage"
import { buildProgramCR8C2Validation } from "./r8C2Validation"
import { programCR8CanonicalJson } from "./r8Determinism"
import { buildProgramCR9C3Validation } from "./r9C3Validation"
import { evaluateProgramCR10Attention } from "./r10ActionCenterEngine"
import {
  PROGRAM_C_R10_DIRECTIONAL_CANDIDATES,
  PROGRAM_C_R10_PROHIBITED_OUTPUTS,
  PROGRAM_C_R10_SAFETY_BOUNDARY,
  PROGRAM_C_R10_STATES,
} from "./r10ActionCenterContract"
import { PROGRAM_C_R10_AUTHORITY } from "./r10AuthorityRegistry"
import { buildProgramCR10C4Validation } from "./r10C4Validation"
import { buildProgramCR10FrozenPortfolioDisposition } from "./r10FrozenPortfolioDisposition"
import { buildProgramCR10LiveActionCenter } from "./r10LiveActionCenter"
import { buildProgramCR10OwnerAuthorityRegression } from "./r10OwnerAuthority"
import { programCR10Precedence, selectProgramCR10State } from "./r10PrecedenceRegistry"
import { buildProgramCR10ReferenceValidation } from "./r10ReferenceValidation"

describe("Program C C4 R10 integrated Action Center", () => {
  it("freezes one review-oriented canonical state vocabulary without ADD/TRIM promotion", () => {
    const states: readonly string[] = PROGRAM_C_R10_STATES
    expect(states).toContain("EXIT_REVIEW")
    expect(states).toContain("REVIEW_REQUIRED")
    expect(states).toContain("CONCENTRATION_REVIEW")
    expect(states).toContain("ROLE_REVIEW")
    expect(states).not.toContain("ADD_REVIEW")
    expect(states).not.toContain("TRIM_REVIEW")
    expect(PROGRAM_C_R10_DIRECTIONAL_CANDIDATES.ADD_REVIEW.canonical).toBe(false)
    expect(PROGRAM_C_R10_DIRECTIONAL_CANDIDATES.TRIM_REVIEW.canonical).toBe(false)
  })

  it("uses deterministic precedence with exit review above conflict and blocked states", () => {
    expect(programCR10Precedence("EXIT_REVIEW").rank)
      .toBeGreaterThan(programCR10Precedence("REVIEW_REQUIRED").rank)
    expect(programCR10Precedence("REVIEW_REQUIRED").rank)
      .toBeGreaterThan(programCR10Precedence("BLOCKED_PREREQUISITE").rank)
    expect(selectProgramCR10State([
      "CONCENTRATION_REVIEW",
      "BLOCKED_PREREQUISITE",
      "EXIT_REVIEW",
      "REVIEW_REQUIRED",
    ]).state).toBe("EXIT_REVIEW")
  })

  it("preserves a favourable-recommendation versus hard-exit conflict without averaging it away", () => {
    const result = buildProgramCR10ReferenceValidation().exitConflict
    expect(result.state).toBe("EXIT_REVIEW")
    expect(result.severity).toBe("CRITICAL")
    expect(result.conflicts.map((row) => row.code)).toContain(
      "FAVOURABLE_RECOMMENDATION_VS_EXIT_RISK",
    )
    expect(result.supportingStates).toContain("CORE_CANDIDATE")
    expect(result.counterSignals).toContain("HARD_EXIT_REVIEW")
  })

  it("selects review-oriented states from canonical upstream conditions", () => {
    const validation = buildProgramCR10ReferenceValidation()
    expect(validation.noAction.state).toBe("NO_ACTION_REQUIRED")
    expect(validation.firstObservation.state).toBe("MONITOR")
    expect(validation.concentration.state).toBe("CONCENTRATION_REVIEW")
    expect(validation.roleReview.state).toBe("ROLE_REVIEW")
    expect(validation.blocked.state).toBe("BLOCKED_PREREQUISITE")
    expect(validation.evidenceReview.state).toBe("EVIDENCE_REVIEW")
    expect(validation.stopThreshold.state).toBe("REVIEW_REQUIRED")
    expect(validation.stopThreshold.reasons).toContain(
      "OWNER_STOP_LOSS_THRESHOLD_REACHED",
    )
  })

  it("keeps owner stop/target thresholds as review context rather than trade instructions", () => {
    const result = buildProgramCR10ReferenceValidation().stopThreshold
    expect(result.state).toBe("REVIEW_REQUIRED")
    expect(result.reasons).toContain("OWNER_STOP_LOSS_THRESHOLD_REACHED")
    const serialized = JSON.stringify(result)
    for (const field of PROGRAM_C_R10_PROHIBITED_OUTPUTS) {
      expect(serialized).not.toContain(`"${field}"`)
    }
  })

  it("changes deterministic attention identity when owner threshold context changes", () => {
    const input = buildProgramCR10ReferenceValidation().inputs.noAction
    const first = evaluateProgramCR10Attention(input)
    const second = evaluateProgramCR10Attention({
      ...input,
      ownerThresholds: {
        ...input.ownerThresholds,
        targetPrice: "900",
      },
    })
    expect(second.integratedAttentionId).not.toBe(first.integratedAttentionId)
    expect(second.upstreamLineage.ownerThresholdContextId)
      .not.toBe(first.upstreamLineage.ownerThresholdContextId)
  })

  it("rejects an R9 current observed state that does not reference the same R8 decision run", () => {
    const input = buildProgramCR10ReferenceValidation().inputs.noAction
    expect(() => evaluateProgramCR10Attention({
      ...input,
      r9CurrentR8DecisionRunId: "DIFFERENT_R8_RUN",
    })).toThrow(/same R8 decision run/)
  })

  it("builds one deterministic live Action Center collection for shared surface consumption", () => {
    const portfolio = {
      portfolio: { id: "portfolio-live", name: "Live", currency: "INR" },
      themes: [],
      openPositions: [{
        securityId: "security-live",
        symbol: "LIVE",
        company: "Live Ltd",
        sector: "Pharma",
        industry: "Pharmaceuticals",
        assetClass: "EQUITY",
        role: "CORE",
        settings: {
          id: "setting-live",
          portfolioRole: "CORE",
          targetWeight: "4",
          minimumWeight: "2",
          maximumWeight: "5",
          priority: null,
          isWatchlisted: false,
          isFrozen: false,
          investmentHorizon: "LONG_TERM",
          notes: null,
        },
        themes: [],
        quantity: "10",
        averageCost: "100",
        currentPrice: "120",
        currentValue: "1200",
        portfolioWeightPercent: "4",
        priceRetrievedAt: "2026-09-25T00:00:00.000Z",
      }],
      closedPositions: [],
    } as unknown as PortfolioViewModel

    const coverage: ResearchCoverageRow[] = [{
      securityId: "security-live",
      symbol: "LIVE",
      company: "Live Ltd",
      assetClass: "EQUITY",
      role: "CORE",
      themes: [],
      sector: "Pharma",
      marketCapCategory: null,
      equityEligible: true,
      providerIdentity: "FRESH",
      fundamentals: "FRESH",
      ownership: "FRESH",
      valuation: "FRESH",
      documents: "FRESH",
      overall: "FRESH",
      conflictCount: 0,
      reviewRequiredCount: 0,
      latestEvidenceAt: "2026-09-24T00:00:00.000Z",
    }]

    const monitoring = new Map([["security-live", {
      targetPrice: null,
      stopLossPrice: null,
      targetPriceAlertEnabled: true,
      stopLossAlertEnabled: true,
    }]])

    const first = buildProgramCR10LiveActionCenter(portfolio, coverage, monitoring)
    const second = buildProgramCR10LiveActionCenter(portfolio, coverage, monitoring)
    expect(first.attentions).toHaveLength(1)
    expect(first.view).toHaveLength(1)
    expect(first.attentions[0]?.state).toBe("BLOCKED_PREREQUISITE")
    expect(programCR8CanonicalJson(first)).toBe(programCR8CanonicalJson(second))
  })

  it("gives all 238 frozen holdings an explicit R10 disposition without directional sizing states", () => {
    const disposition = buildProgramCR10FrozenPortfolioDisposition()
    expect(disposition.totalHoldings).toBe(238)
    expect(disposition.rows).toHaveLength(238)
    expect(disposition.dispositionComplete).toBe(true)
    expect(disposition.directionalAddReviewCount).toBe(0)
    expect(disposition.directionalTrimReviewCount).toBe(0)
    expect(disposition.providerCalls).toBe(0)
    expect(disposition.persistedWrites).toBe(0)
    expect(disposition.rows.every((row) => Boolean(row.state))).toBe(true)
  })

  it("proves the mock R10 writer does not mutate owner-controlled fields", () => {
    const attention = buildProgramCR10ReferenceValidation().noAction
    const regression = buildProgramCR10OwnerAuthorityRegression(attention)
    expect(regression.ownerContextAfter).toBe(regression.ownerContextBefore)
    expect(regression.ownerFieldMutationCount).toBe(0)
    expect(regression.attentionWriteCount).toBe(1)
    expect(regression.persistenceMutationCount).toBe(0)
  })

  it("freezes R10 authority as one read-only canonical Action Center", () => {
    expect(PROGRAM_C_R10_AUTHORITY).toMatchObject({
      executionAuthority: "C4_OWNER_AUTHORIZED_READ_ONLY",
      actionCenterAuthority: "ONE_CANONICAL_R10_COLLECTION",
      conflictAuthority: "EXPLICIT_PRESERVATION_NO_AVERAGING",
      addReviewAuthority: "NOT_PROMOTED",
      trimReviewAuthority: "NOT_PROMOTED",
      numericSizingAuthority: "NONE",
      aiDecisionAuthority: "NONE",
      providerAuthority: "NONE",
      persistenceAuthority: "NONE",
      ownerMutationAuthority: "NONE",
      schedulerAuthority: "NONE",
      tradingAuthority: "NONE",
    })
  })

  it("retains all C4 safety boundaries and upstream regressions", () => {
    expect(PROGRAM_C_R10_SAFETY_BOUNDARY).toEqual({
      reviewOrientedOnly: true,
      addReviewPromoted: false,
      trimReviewPromoted: false,
      numericSizingAuthority: false,
      tradeInstructionAllowed: false,
      ownerSettingsMutation: false,
      aiDecisionAuthority: false,
      providerCalls: 0,
      persistence: false,
      schemaMigration: false,
      productionMutation: false,
      deployment: false,
      merge: false,
      schedulerMutation: false,
      trading: false,
    })
    expect(buildProgramCR8C2Validation().overallPass).toBe(true)
    expect(buildProgramCR9C3Validation().overallPass).toBe(true)
    expect(buildProgramCR10C4Validation().overallPass).toBe(true)
  })
})
