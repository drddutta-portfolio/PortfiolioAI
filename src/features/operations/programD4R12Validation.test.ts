import { describe, expect, it } from "vitest"
import { buildProgramDR12LocalReferencePacket } from "./programD3R12Fixtures"
import { createMemoryProgramDR12Cache } from "./programD3R12Cache"
import { generateProgramDR12LocalNarrative } from "./programD3R12Runtime"
import {
  validateUnknownProgramDR12Narrative,
  validateProgramDR12Narrative,
} from "./programD3R12Validator"
import { buildProgramD4ValidationSummary } from "./programD4R12Validation"

describe("Program D D4 R12 adversarial validation", () => {
  it("passes the complete frozen D4 local adversarial matrix", async () => {
    const summary = await buildProgramD4ValidationSummary()
    expect(summary.failed).toBe(0)
    expect(summary.passed).toBe(summary.total)
    expect(summary.total).toBe(16)
    expect(summary.externalAiCalls).toBe(0)
    expect(summary.externalAiCost).toBe(0)
    expect(summary.realAiPilotAuthorized).toBe(false)
  })

  it("rejects malformed runtime output before authority validation", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    expect(validateUnknownProgramDR12Narrative(packet, null)).toBe("REJECTED_SCHEMA")
    expect(validateUnknownProgramDR12Narrative(packet, {
      deterministicStateSummary: "MONITOR",
      supportingEvidence: [],
    })).toBe("REJECTED_SCHEMA")
  })

  it("rejects canonical action and priority conflicts", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const result = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
    )
    expect(validateProgramDR12Narrative(packet, result.narrative, {
      ...result.narrative,
      action: "BUY",
    })).toBe("REJECTED_AUTHORITY_CONFLICT")
    expect(validateProgramDR12Narrative(packet, result.narrative, {
      ...result.narrative,
      priority: "CRITICAL",
    })).toBe("REJECTED_AUTHORITY_CONFLICT")
  })
})
