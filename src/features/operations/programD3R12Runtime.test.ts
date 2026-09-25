import { describe, expect, it } from "vitest"
import { createMemoryProgramDR12Cache } from "./programD3R12Cache"
import {
  PROGRAM_D_R12_D3_COST_CEILING,
  PROGRAM_D_R12_PROMPT_VERSION,
  buildProgramDR12FactPacket,
} from "./programD3R12Contract"
import { buildProgramDR12LocalReferencePacket } from "./programD3R12Fixtures"
import { generateProgramDR12LocalNarrative } from "./programD3R12Runtime"
import {
  validateProgramDR12FactPacket,
  validateProgramDR12Narrative,
} from "./programD3R12Validator"

describe("Program D D3 bounded local R12", () => {
  it("builds a deterministic immutable fact packet", async () => {
    const first = await buildProgramDR12LocalReferencePacket()
    const second = await buildProgramDR12LocalReferencePacket()
    expect(first.packetId).toMatch(/^[a-f0-9]{64}$/)
    expect(second.packetId).toBe(first.packetId)
    expect(validateProgramDR12FactPacket(first)).toEqual([])
    expect(Object.isFrozen(first)).toBe(true)
  })

  it("generates only local mock output with zero external cost", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const result = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
      () => "2026-09-25T13:10:00+05:30",
    )
    expect(result.provider).toBe("LOCAL_MOCK")
    expect(result.validationStatus).toBe("VALID")
    expect(result.usage.externalCost).toBe(0)
    expect(PROGRAM_D_R12_D3_COST_CEILING.externalCallsPerRun).toBe(0)
    expect(PROGRAM_D_R12_D3_COST_CEILING.scheduledGenerationAllowed).toBe(false)
  })

  it("reuses unchanged packet hash plus prompt version from cache", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const cache = createMemoryProgramDR12Cache()
    const first = await generateProgramDR12LocalNarrative(packet, cache)
    const second = await generateProgramDR12LocalNarrative(packet, cache)
    expect(first.cached).toBe(false)
    expect(second.cached).toBe(true)
    expect(second.narrativeId).toBe(first.narrativeId)
    expect(second.promptVersion).toBe(PROGRAM_D_R12_PROMPT_VERSION)
  })

  it("rejects unresolved citations", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
    )
    expect(validateProgramDR12Narrative(packet, {
      ...valid.narrative,
      citations: ["CIT_DOES_NOT_EXIST"],
    })).toBe("REJECTED_UNSUPPORTED_CITATION")
  })

  it("does not treat digits embedded in deterministic identifiers as unsupported numbers", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
    )
    expect(validateProgramDR12Narrative(packet, {
      ...valid.narrative,
      aiInterpretation:
        "R6, R9, R10, R12, D3 and PROGRAM_C_R10_PRECEDENCE_V1 are identifiers, not numeric claims.",
    })).toBe("VALID")
  })

  it("rejects unsupported numbers", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
    )
    expect(validateProgramDR12Narrative(packet, {
      ...valid.narrative,
      aiInterpretation: "An unsupported figure is 999.",
    })).toBe("REJECTED_UNSUPPORTED_FACT")
  })

  it("rejects competing action or trade authority", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
    )
    expect(validateProgramDR12Narrative(
      packet,
      valid.narrative,
      { ...valid.narrative, action: "BUY" },
    )).toBe("REJECTED_AUTHORITY_CONFLICT")
    expect(validateProgramDR12Narrative(
      packet,
      valid.narrative,
      { ...valid.narrative, tradeInstruction: "SELL" },
    )).toBe("REJECTED_AUTHORITY_CONFLICT")
  })

  it("rejects malformed packet provenance", async () => {
    const base = await buildProgramDR12LocalReferencePacket()
    const malformed = await buildProgramDR12FactPacket({
      portfolioId: base.portfolioId,
      securityId: base.securityId,
      symbol: base.symbol,
      company: base.company,
      narrativeType: base.narrativeType,
      asOf: base.asOf,
      fields: [{
        id: "source",
        type: "SOURCE_EXCERPT",
        label: "Unsafe source",
        value: "text",
        provenanceId: null,
      }],
      evidence: [],
      r6: base.r6,
      r7: base.r7,
      r8: base.r8,
      r9: base.r9,
      r10: base.r10,
      blockers: [],
      uncertainties: [],
      contradictions: [],
    })
    expect(validateProgramDR12FactPacket(malformed)).toContain(
      "SOURCE_EXCERPT_MISSING_PROVENANCE",
    )
  })

  it("does not expose numeric sizing or trade authority in the D3 output contract", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const result = await generateProgramDR12LocalNarrative(
      packet,
      createMemoryProgramDR12Cache(),
    )
    expect(result.narrative).not.toHaveProperty("targetWeight")
    expect(result.narrative).not.toHaveProperty("quantity")
    expect(result.narrative).not.toHaveProperty("tradeInstruction")
    expect(result.narrative).not.toHaveProperty("action")
    expect(result.narrative).not.toHaveProperty("priority")
  })
})
