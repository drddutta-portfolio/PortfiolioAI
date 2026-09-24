import { describe, expect, it } from "vitest"
import { buildProgramCR8C2Validation } from "./r8C2Validation"
import { programCR9ChangeEventId } from "./r9EventIdentity"
import { buildProgramCR9FrozenPortfolioDisposition } from "./r9FrozenPortfolioDisposition"
import {
  deduplicateProgramCR9Events,
  PROGRAM_C_R9_C3_SAFETY_BOUNDARY,
} from "./r9MeaningfulChangeEngine"
import {
  PROGRAM_C_R9_IDEMPOTENCY_BOUNDARY,
  PROGRAM_C_R9_PROHIBITED_CAPABILITIES,
  PROGRAM_C_R9_RULE_REGISTRY_VERSION,
} from "./r9MeaningfulChangeContract"
import {
  PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES,
  PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY,
} from "./r9MeaningfulChangeRegistry"
import { buildProgramCR9C3Validation } from "./r9C3Validation"
import { buildProgramCR9ReferenceValidation } from "./r9ReferenceValidation"

describe("Program C C3 R9 meaningful change", () => {
  it("freezes explicit first-observation semantics distinct from no change", () => {
    const validation = buildProgramCR9ReferenceValidation()
    expect(validation.firstObservation).toMatchObject({
      baselineState: "BASELINE_ESTABLISHED",
      transitionState: "FIRST_OBSERVATION",
      previousObservedStateId: null,
      event: null,
    })
    expect(validation.firstObservation.transitionState).not.toBe("NO_CHANGE")
    expect(validation.noChange.transitionState).toBe("NO_CHANGE")
    expect(validation.noChange.event).toBeNull()
  })

  it("distinguishes raw but immaterial numeric movement without inventing a threshold", () => {
    const result = buildProgramCR9ReferenceValidation().immaterial
    expect(result.transitionState).toBe("RAW_IMMATERIAL_CHANGE")
    expect(result.rawChanges.map((change) => change.code)).toContain(
      "R6_SCORE_VALUE_CHANGED_WITHOUT_THRESHOLD",
    )
    expect(result.meaningfulChanges).toHaveLength(0)
    expect(result.event).toBeNull()
    expect(PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY.scoreDeltaThreshold).toBeNull()
  })

  it("creates deterministic meaningful events for categorical changes", () => {
    const first = buildProgramCR9ReferenceValidation()
    const second = buildProgramCR9ReferenceValidation()
    const result = first.coreHealthMeaningful

    expect(result.transitionState).toBe("MEANINGFUL_CHANGE")
    expect(result.event).not.toBeNull()
    expect(result.meaningfulChanges.map((change) => change.code)).toContain(
      "CORE_HEALTH_CHANGED",
    )
    expect(result.event?.eventId).toBe(second.coreHealthMeaningful.event?.eventId)
  })

  it("treats stale evidence, assignment changes and blocker changes as meaningful", () => {
    const validation = buildProgramCR9ReferenceValidation()

    expect(validation.evidenceMeaningful.meaningfulChanges.map((change) => change.code))
      .toContain("EVIDENCE_STATE_CHANGED")
    expect(validation.assignmentMeaningful.meaningfulChanges.map((change) => change.code))
      .toContain("ASSIGNMENT_VERSION_CHANGED")
    expect(validation.blockerCleared.meaningfulChanges.map((change) => change.code))
      .toContain("R8_BLOCKER_SET_CHANGED")
  })

  it("rejects out-of-order and incomparable observations without generating events", () => {
    const validation = buildProgramCR9ReferenceValidation()
    expect(validation.outOfOrder).toMatchObject({
      baselineState: "COMPARABLE_BASELINE",
      transitionState: "OUT_OF_ORDER",
      event: null,
    })
    expect(validation.incomparable).toMatchObject({
      baselineState: "NO_COMPARABLE_BASELINE",
      transitionState: "INCOMPARABLE",
      event: null,
    })
  })

  it("suppresses duplicate semantic events in memory", () => {
    const validation = buildProgramCR9ReferenceValidation()
    expect(validation.deduplicatedEvents).toHaveLength(2)
    expect(new Set(validation.deduplicatedEvents.map((event) => event.eventId)).size).toBe(2)

    const event = validation.coreHealthMeaningful.event
    expect(event).not.toBeNull()
    if (!event) throw new Error("C3 reference meaningful event missing.")
    expect(deduplicateProgramCR9Events([event, event, event])).toHaveLength(1)
  })

  it("derives event identity from exact before/after identities and rule version", () => {
    const input = {
      securityId: "security-1",
      portfolioId: "portfolio-1",
      previousObservedStateId: "observed-1",
      currentObservedStateId: "observed-2",
    }
    const first = programCR9ChangeEventId(input)
    const second = programCR9ChangeEventId(input)
    expect(first).toBe(second)
    expect(programCR9ChangeEventId({
      ...input,
      currentObservedStateId: "observed-3",
    })).not.toBe(first)
    expect(programCR9ChangeEventId({
      ...input,
      ruleVersion: `${PROGRAM_C_R9_RULE_REGISTRY_VERSION}:NEXT`,
    })).not.toBe(first)
  })

  it("keeps every meaningful-change rule versioned and numeric thresholds absent", () => {
    expect(PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES.length).toBeGreaterThan(0)
    for (const rule of PROGRAM_C_R9_MEANINGFUL_CHANGE_RULES) {
      expect(rule.registryVersion).toBe(PROGRAM_C_R9_RULE_REGISTRY_VERSION)
      expect(rule.approvedThreshold).toBeNull()
    }
    expect(PROGRAM_C_R9_NUMERIC_THRESHOLD_AUTHORITY).toEqual({
      scoreDeltaThreshold: null,
      valuationDeltaThreshold: null,
      momentumDeltaThreshold: null,
      concentrationDeltaThreshold: null,
      hysteresisThreshold: null,
      persistenceDurationRule: null,
      policy: "NO_NUMERIC_OR_DURATION_THRESHOLD_APPROVED",
    })
  })

  it("gives all 238 frozen holdings an explicit no-comparable-baseline disposition", () => {
    const disposition = buildProgramCR9FrozenPortfolioDisposition()
    expect(disposition.totalHoldings).toBe(238)
    expect(disposition.rows).toHaveLength(238)
    expect(disposition.dispositionComplete).toBe(true)
    expect(disposition.meaningfulEventCount).toBe(0)
    expect(disposition.rows.every((row) => (
      row.baselineState === "NO_COMPARABLE_BASELINE"
      && row.transitionState === "FIRST_OBSERVATION"
      && row.changeEventId === null
    ))).toBe(true)
  })

  it("retains semantic idempotency but does not claim durable notification state", () => {
    expect(PROGRAM_C_R9_IDEMPOTENCY_BOUNDARY).toEqual({
      deterministicEventIdentity: true,
      semanticIdempotency: true,
      sameInputReplayStability: true,
      inMemoryDuplicateSuppression: true,
      durableAcknowledgement: false,
      durableSnooze: false,
      persistentNotificationDeduplication: false,
      crossSessionSeenUnseenState: false,
    })
  })

  it("retains the closed R8 regression and the aggregate C3 audit", () => {
    expect(buildProgramCR8C2Validation().overallPass).toBe(true)
    const audit = buildProgramCR9C3Validation()
    expect(audit.overallPass).toBe(true)
    expect(audit.frozenHoldingCount).toBe(238)
    expect(audit.frozenMeaningfulEventCount).toBe(0)
  })

  it("retains zero provider, AI, persistence, sizing, owner mutation, scheduler and trading authority", () => {
    expect(PROGRAM_C_R9_C3_SAFETY_BOUNDARY).toMatchObject({
      readOnlyExecution: true,
      deterministicMateriality: true,
      aiMateriality: false,
      numericThresholdCreation: false,
      numericSizingAuthority: false,
      providerCalls: 0,
      angelOneCalls: 0,
      trendlyneCalls: 0,
      openAiDecisionCalls: 0,
      persistence: false,
      durableAcknowledgement: false,
      durableSnooze: false,
      persistentNotificationDeduplication: false,
      crossSessionSeenUnseenState: false,
      ownerSettingsMutation: false,
      schemaMigration: false,
      productionMutation: false,
      deployment: false,
      merge: false,
      schedulerMutation: false,
      trading: false,
    })
    expect(PROGRAM_C_R9_PROHIBITED_CAPABILITIES.numericSizingAuthority).toBe(false)
  })
})
