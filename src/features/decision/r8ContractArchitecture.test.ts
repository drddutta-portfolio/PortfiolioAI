import { describe, expect, it } from "vitest"
import {
  PROGRAM_C_R8_AUTHORITY_REGISTRY,
} from "./r8AuthorityRegistry"
import {
  PROGRAM_C_R8_CORE_HEALTH_BOUNDARY,
  PROGRAM_C_R8_CORE_HEALTH_STATES,
} from "./r8CoreHealthContract"
import {
  PROGRAM_C_R8_DEPENDENCY_MATRIX,
  programCR8DependencyFor,
} from "./r8DependencyMatrix"
import {
  PROGRAM_C_R8_EXIT_INTELLIGENCE_BOUNDARY,
  PROGRAM_C_R8_EXIT_INTELLIGENCE_STATES,
} from "./r8ExitIntelligenceContract"
import {
  programCR8PortfolioContextSnapshotId,
} from "./r8PortfolioContext"
import {
  PROGRAM_C_R8_C1_SAFETY_BOUNDARY,
  PROGRAM_C_R8_OWNER_CONTROLLED_FIELDS,
  PROGRAM_C_R8_PROHIBITED_OUTPUT_FIELDS,
  programCR8DecisionRunIdentity,
} from "./r8PortfolioDecisionContract"
import {
  PROGRAM_C_R8_PORTFOLIO_FIT_BOUNDARY,
  PROGRAM_C_R8_PORTFOLIO_FIT_STATES,
} from "./r8PortfolioFitContract"
import {
  PROGRAM_C_R8_PORTFOLIO_RISK_BOUNDARY,
  PROGRAM_C_R8_PORTFOLIO_RISK_STATES,
} from "./r8PortfolioRiskContract"

describe("Program C C1 R8 contract and architecture", () => {
  it("freezes the four R8 state vocabularies", () => {
    expect(PROGRAM_C_R8_CORE_HEALTH_STATES).toEqual([
      "CORE_HEALTHY",
      "CORE_WATCH",
      "CORE_AT_RISK",
      "CORE_DEMOTION_REVIEW",
      "INSUFFICIENT_EVIDENCE",
      "REVIEW_REQUIRED",
      "BLOCKED_PREREQUISITE",
      "NOT_APPLICABLE",
    ])
    expect(PROGRAM_C_R8_PORTFOLIO_FIT_STATES).toContain("CONCENTRATION_REVIEW")
    expect(PROGRAM_C_R8_PORTFOLIO_RISK_STATES).toContain("RISK_CRITICAL_REVIEW")
    expect(PROGRAM_C_R8_EXIT_INTELLIGENCE_STATES).toContain("HARD_EXIT_REVIEW")
  })

  it("freezes exactly one dependency entry per R8 sub-engine", () => {
    expect(PROGRAM_C_R8_DEPENDENCY_MATRIX).toHaveLength(4)
    expect(new Set(PROGRAM_C_R8_DEPENDENCY_MATRIX.map((entry) => entry.subEngine)).size).toBe(4)

    expect(programCR8DependencyFor("CORE_HEALTH").r7Requirement).toBe("OPTIONAL_CONTEXT")
    expect(programCR8DependencyFor("PORTFOLIO_FIT").r7Requirement).toBe("NOT_REQUIRED")
    expect(programCR8DependencyFor("PORTFOLIO_RISK").r7Requirement).toBe("NOT_REQUIRED")
    expect(programCR8DependencyFor("EXIT_INTELLIGENCE").r7Requirement).toBe("OPTIONAL_CONTEXT")
  })

  it("does not make R7 a universal R8 prerequisite", () => {
    expect(
      PROGRAM_C_R8_DEPENDENCY_MATRIX.map((entry) => entry.r7Requirement),
    ).not.toContain("REQUIRED")
  })

  it("protects Core applicability and owner authority", () => {
    expect(PROGRAM_C_R8_CORE_HEALTH_BOUNDARY).toMatchObject({
      formalOwnerRole: "CORE",
      nonCoreState: "NOT_APPLICABLE",
      ownerRoleMutationAllowed: false,
      r6RecomputationAllowed: false,
      r7RecomputationAllowed: false,
    })

    expect(PROGRAM_C_R8_OWNER_CONTROLLED_FIELDS).toEqual([
      "portfolioRole",
      "targetPrice",
      "stopLossPrice",
      "targetWeight",
      "minimumAllocation",
      "maximumAllocation",
      "investmentHorizon",
      "freezeMonitoringPreference",
    ])
  })

  it("prevents Portfolio Fit from becoming a hidden sizing engine", () => {
    expect(PROGRAM_C_R8_PORTFOLIO_FIT_BOUNDARY).toMatchObject({
      inventedTargetWeightAllowed: false,
      inventedMinMaxAllocationAllowed: false,
      inventedCorrelationAllowed: false,
      inventedDiversificationThresholdAllowed: false,
      nearestProfileSizingFallbackAllowed: false,
    })

    expect(PROGRAM_C_R8_PROHIBITED_OUTPUT_FIELDS).toContain("exactAddPercentage")
    expect(PROGRAM_C_R8_PROHIBITED_OUTPUT_FIELDS).toContain("exactTrimPercentage")
    expect(PROGRAM_C_R8_PROHIBITED_OUTPUT_FIELDS).toContain("orderQuantity")
    expect(PROGRAM_C_R8_PROHIBITED_OUTPUT_FIELDS).toContain("opaquePortfolioDecisionScore")
  })

  it("fails closed on missing risk authority and keeps Exit advisory", () => {
    expect(PROGRAM_C_R8_PORTFOLIO_RISK_BOUNDARY.absenceOfRiskEvidenceCanBeAcceptable).toBe(false)
    expect(PROGRAM_C_R8_PORTFOLIO_RISK_BOUNDARY.missingEvidenceRenormalizationAllowed).toBe(false)

    expect(PROGRAM_C_R8_EXIT_INTELLIGENCE_BOUNDARY).toMatchObject({
      hardExitReviewIsAdvisoryOnly: true,
      priceWeaknessAloneCanTriggerExit: false,
      valuationAloneCanTriggerExit: false,
      overweightAloneCanTriggerExit: false,
      tradeInstructionAllowed: false,
    })
  })

  it("freezes cross-sector isolation in the dependency contract", () => {
    expect(programCR8DependencyFor("CORE_HEALTH").prohibitedFallbacks).toContain(
      "CROSS_SECTOR_RULE_BORROWING",
    )
    expect(programCR8DependencyFor("PORTFOLIO_RISK").prohibitedFallbacks).toContain(
      "CROSS_SECTOR_RISK_RULE_BORROWING",
    )
  })

  it("freezes authority registry entries as C2-not-authorized", () => {
    expect(PROGRAM_C_R8_AUTHORITY_REGISTRY).toHaveLength(4)
    for (const authority of PROGRAM_C_R8_AUTHORITY_REGISTRY) {
      expect(authority.executionAuthority).toBe("C2_NOT_AUTHORIZED")
      expect(authority.numericSizingAuthority).toBe("NONE")
      expect(authority.providerAuthority).toBe("NONE")
      expect(authority.aiDecisionAuthority).toBe("NONE")
      expect(authority.persistenceAuthority).toBe("NONE")
      expect(authority.ownerMutationAuthority).toBe("NONE")
    }
  })

  it("defines deterministic context and R8 run identities from semantic inputs", () => {
    const contextInput = {
      portfolioId: "portfolio-1",
      validationUniverseVersion: "PROGRAM_C_VALIDATION_UNIVERSE_V1",
      classificationSnapshotVersion: "K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22",
      ownerContextVersion: "owner-v1",
      holdingsFingerprint: "holdings-fp-1",
      snapshotFingerprint: "snapshot-fp-1",
    }
    const firstContextId = programCR8PortfolioContextSnapshotId(contextInput)
    const secondContextId = programCR8PortfolioContextSnapshotId(contextInput)
    expect(firstContextId).toBe(secondContextId)

    const runInput = {
      securityId: "security-1",
      portfolioId: "portfolio-1",
      portfolioContextSnapshotId: firstContextId,
      scoreRunId: "r6-run-1",
      recommendationRunId: "r7-run-1",
    }
    expect(programCR8DecisionRunIdentity(runInput)).toBe(
      programCR8DecisionRunIdentity(runInput),
    )
    expect(programCR8DecisionRunIdentity({
      ...runInput,
      scoreRunId: "r6-run-2",
    })).not.toBe(programCR8DecisionRunIdentity(runInput))
  })

  it("requires semantic identity inputs and does not accept timestamp-only identity", () => {
    expect(() => programCR8PortfolioContextSnapshotId({
      portfolioId: "portfolio-1",
      validationUniverseVersion: "PROGRAM_C_VALIDATION_UNIVERSE_V1",
      classificationSnapshotVersion: "K5_CURRENT_PORTFOLIO_ROUTING_SNAPSHOT_2026_09_22",
      ownerContextVersion: null,
      holdingsFingerprint: "",
      snapshotFingerprint: "snapshot-fp-1",
    })).toThrow(/holdingsFingerprint/)

    expect(() => programCR8DecisionRunIdentity({
      securityId: "",
      portfolioId: "portfolio-1",
      portfolioContextSnapshotId: "context-1",
      scoreRunId: "r6-run-1",
      recommendationRunId: null,
    })).toThrow(/securityId/)
  })

  it("keeps C1 contract-only with all prohibited operational authorities closed", () => {
    expect(PROGRAM_C_R8_C1_SAFETY_BOUNDARY).toEqual({
      contractArchitectureOnly: true,
      r8EvaluationExecuted: false,
      portfolioWideR8DispositionExecuted: false,
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      scoreRecomputation: false,
      recommendationRecomputation: false,
      numericSizingAuthority: false,
      opaquePortfolioDecisionScoreAllowed: false,
      ownerSettingsMutation: false,
      persistence: false,
      schemaMigration: false,
      productionMutation: false,
      deployment: false,
      merge: false,
      schedulerMutation: false,
      trading: false,
    })
  })
})
