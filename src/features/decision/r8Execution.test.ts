import { describe, expect, it } from "vitest"
import { buildProgramBFinalAudit } from "../research/programBFinalClosure"
import { buildProgramCR8C2Validation } from "./r8C2Validation"
import type { PortfolioViewModel } from "../portfolio/types"
import type { ResearchCoverageRow } from "../research/researchCoverage"
import { evaluateProgramCR8CoreHealth } from "./r8CoreHealth"
import { programCR8CanonicalJson } from "./r8Determinism"
import { evaluateProgramCR8ExitIntelligence } from "./r8ExitIntelligence"
import { PROGRAM_C_R8_C2_EXECUTION_AUTHORITY } from "./r8ExecutionAuthority"
import { buildProgramCR8FrozenPortfolioDisposition } from "./r8FrozenPortfolioDisposition"
import { buildProgramCR8LivePortfolioProjection } from "./r8LivePortfolioAdapter"
import { buildProgramCR8OwnerAuthorityRegression } from "./r8OwnerAuthority"
import { evaluateProgramCR8PortfolioFit } from "./r8PortfolioFit"
import { evaluateProgramCR8PortfolioRisk } from "./r8PortfolioRisk"
import {
  PROGRAM_C_R8_C2_SAFETY_BOUNDARY,
} from "./r8PortfolioDecisionEngine"
import { buildProgramCR8ReferenceValidationAssessments } from "./r8ReferenceValidation"

describe("Program C C2 R8 execution and validation", () => {
  it("executes hand-verifiable reference holdings with exact Program B lineage", () => {
    const validation = buildProgramCR8ReferenceValidationAssessments()
    expect(validation.fixtureOnly).toBe(true)
    expect(validation.rows).toHaveLength(2)

    const tornt = validation.rows.find((row) => row.symbol === "TORNTPHARM")
    const alivus = validation.rows.find((row) => row.symbol === "ALIVUS")
    expect(tornt).toBeDefined()
    expect(alivus).toBeDefined()

    expect(tornt?.assessment.upstreamLineage.scoreRunId).toBeTruthy()
    expect(tornt?.assessment.upstreamLineage.recommendationRunId).toBeTruthy()
    expect(tornt?.assessment.coreHealth.state).toBe("CORE_HEALTHY")
    expect(tornt?.assessment.portfolioRisk.state).toBe("RISK_ACCEPTABLE")
    expect(tornt?.assessment.exitIntelligence.state).toBe("NO_EXIT_SIGNAL")

    expect(alivus?.assessment.coreHealth.state).toBe("NOT_APPLICABLE")
    expect(alivus?.assessment.portfolioRisk.state).toBe("RISK_MONITOR")
    expect(alivus?.assessment.exitIntelligence.state).toBe("NO_EXIT_SIGNAL")
  })

  it("replays the same canonical reference inputs deterministically", () => {
    const first = buildProgramCR8ReferenceValidationAssessments()
    const second = buildProgramCR8ReferenceValidationAssessments()
    expect(programCR8CanonicalJson(first)).toBe(programCR8CanonicalJson(second))
  })

  it("keeps Portfolio Fit independently evaluable without R7", () => {
    const result = evaluateProgramCR8PortfolioFit({
      assetClass: "EQUITY",
      portfolioContextSnapshotId: "context-1",
      ownerRole: "CORE",
      currentWeight: "4",
      minimumAllocation: "2",
      maximumAllocation: "5",
      r7: null,
    })
    expect(result.state).toBe("FIT_SUPPORTED")
  })

  it("uses only owner-authored limits for concentration review", () => {
    expect(evaluateProgramCR8PortfolioFit({
      assetClass: "EQUITY",
      portfolioContextSnapshotId: "context-1",
      ownerRole: "CORE",
      currentWeight: "6",
      minimumAllocation: "2",
      maximumAllocation: "5",
      r7: null,
    })).toMatchObject({
      state: "CONCENTRATION_REVIEW",
      reasonCodes: ["CURRENT_WEIGHT_ABOVE_OWNER_MAXIMUM"],
    })
  })

  it("treats a non-Core holding as Core Health not applicable", () => {
    const result = evaluateProgramCR8CoreHealth({
      ownerRole: "SATELLITE",
      r6: {
        readinessState: "READY",
        scoreRunId: "r6-run",
        researchProfileCode: "PHARMA_V1",
        methodologyId: "PHARMA_V1",
        methodologyVersion: "v1",
        methodologyRole: "API_BULK_DRUGS",
        assignmentId: "assignment-1",
        assignmentVersion: 1,
        classificationVersion: "classification-v1",
        evidenceSnapshotId: "evidence-v1",
        evidenceAsOfDates: ["2026-09-24"],
        reasonCodes: [],
      },
      r7: null,
      healthSignal: "HEALTHY",
    })
    expect(result.state).toBe("NOT_APPLICABLE")
  })

  it("never maps missing risk evidence to RISK_ACCEPTABLE", () => {
    expect(evaluateProgramCR8PortfolioRisk({
      assetClass: "EQUITY",
      portfolioContextSnapshotId: "context-1",
      sourceScoreRunId: "r6-run",
      riskSignal: "MISSING",
      evidenceIds: [],
      concentrationReasonCodes: [],
    }).state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("does not allow a positive risk state without canonical evidence identity", () => {
    expect(evaluateProgramCR8PortfolioRisk({
      assetClass: "EQUITY",
      portfolioContextSnapshotId: "context-1",
      sourceScoreRunId: "r6-run",
      riskSignal: "ACCEPTABLE",
      evidenceIds: [],
      concentrationReasonCodes: [],
    }).state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("does not infer an exit from price weakness alone", () => {
    const result = evaluateProgramCR8ExitIntelligence({
      assetClass: "EQUITY",
      sourceScoreRunId: "r6-run",
      sourceRecommendationRunId: "r7-run",
      exitSignal: "MISSING",
      thesisEvidenceIds: [],
      priceWeaknessObserved: true,
    })
    expect(result.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(result.reasonCodes).toContain("PRICE_WEAKNESS_CONTEXT_ONLY")
  })

  it("does not allow NO_EXIT_SIGNAL without thesis evidence identity", () => {
    expect(evaluateProgramCR8ExitIntelligence({
      assetClass: "EQUITY",
      sourceScoreRunId: "r6-run",
      sourceRecommendationRunId: "r7-run",
      exitSignal: "NO_SIGNAL",
      thesisEvidenceIds: [],
    }).state).toBe("INSUFFICIENT_EVIDENCE")
  })

  it("gives all 238 frozen K5 holdings an explicit fail-closed R8 disposition", () => {
    const disposition = buildProgramCR8FrozenPortfolioDisposition()
    expect(disposition.totalHoldings).toBe(238)
    expect(disposition.rows).toHaveLength(238)
    expect(disposition.dispositionComplete).toBe(true)
    expect(disposition.numericActionCoverageComplete).toBe(false)
    expect(disposition.providerCalls).toBe(0)
    expect(disposition.persistedWrites).toBe(0)
    expect(disposition.rows.every((row) => Boolean(row.overallDisposition))).toBe(true)
  })

  it("builds a live read-only projection where Fit can evaluate while missing R6/risk/thesis authority fails closed", () => {
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

    const projection = buildProgramCR8LivePortfolioProjection(portfolio, coverage)
    expect(projection.rows).toHaveLength(1)
    expect(projection.rows[0]?.assessment.portfolioFit.state).toBe("FIT_SUPPORTED")
    expect(projection.rows[0]?.assessment.coreHealth.state).toBe("BLOCKED_PREREQUISITE")
    expect(projection.rows[0]?.assessment.portfolioRisk.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(projection.rows[0]?.assessment.exitIntelligence.state).toBe("INSUFFICIENT_EVIDENCE")
    expect(projection.rows[0]?.assessment.overallDisposition).toBe("ASSESSMENT_PARTIAL")
  })

  it("proves the mock machine-assessment writer cannot mutate owner fields", () => {
    const firstReference = buildProgramCR8ReferenceValidationAssessments().rows[0]
    expect(firstReference).toBeDefined()
    if (!firstReference) throw new Error("C2 owner-authority reference missing.")
    const regression = buildProgramCR8OwnerAuthorityRegression(firstReference.assessment)
    expect(regression.ownerContextAfter).toBe(regression.ownerContextBefore)
    expect(regression.ownerFieldMutationCount).toBe(0)
    expect(regression.machineAssessmentWriteCount).toBe(1)
    expect(regression.persistenceMutationCount).toBe(0)
  })

  it("retains the closed Program B regression", () => {
    expect(buildProgramBFinalAudit().overallPass).toBe(true)
  })

  it("produces an aggregate C2 validation audit that passes", () => {
    const audit = buildProgramCR8C2Validation()
    expect(audit.overallPass).toBe(true)
    expect(audit.frozenHoldingCount).toBe(238)
    expect(audit.numericActionCoverageComplete).toBe(false)
    expect(audit.providerCalls).toBe(0)
    expect(audit.persistedWrites).toBe(0)
  })

  it("promotes only read-only C2 execution authority while retaining all other prohibitions", () => {
    expect(PROGRAM_C_R8_C2_EXECUTION_AUTHORITY).toHaveLength(4)
    for (const authority of PROGRAM_C_R8_C2_EXECUTION_AUTHORITY) {
      expect(authority.executionAuthority).toBe("C2_OWNER_AUTHORIZED_READ_ONLY")
      expect(authority.persistenceAuthority).toBe("NONE")
      expect(authority.providerAuthority).toBe("NONE")
      expect(authority.aiDecisionAuthority).toBe("NONE")
      expect(authority.numericSizingAuthority).toBe("NONE")
      expect(authority.ownerMutationAuthority).toBe("NONE")
    }
  })

  it("retains zero provider, AI, persistence, sizing, scheduler and trading authority", () => {
    expect(PROGRAM_C_R8_C2_SAFETY_BOUNDARY).toEqual({
      readOnlyExecution: true,
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      scoreRecomputation: false,
      recommendationRecomputation: false,
      numericSizingAuthority: false,
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
