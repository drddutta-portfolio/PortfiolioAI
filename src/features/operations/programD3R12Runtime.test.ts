import { describe, expect, it } from "vitest"
import {
  PROGRAM_D_R12_BROWSER_CACHE_KEY,
  createBrowserProgramDR12Cache,
  createMemoryProgramDR12Cache,
} from "./programD3R12Cache"
import type { ProgramDR12Cache } from "./programD3R12Cache"
import {
  PROGRAM_D_R12_D3_COST_CEILING,
  PROGRAM_D_R12_PROMPT_VERSION,
  buildProgramDR12FactPacket,
  type ProgramDR12Result,
} from "./programD3R12Contract"
import { buildProgramDR12LocalReferencePacket } from "./programD3R12Fixtures"
import { generateProgramDR12LocalNarrative } from "./programD3R12Runtime"
import {
  validateProgramDR12FactPacket,
  validateProgramDR12PacketIntegrity,
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
    expect(Object.isFrozen(first.fields)).toBe(true)
    expect(Object.isFrozen(first.fields[0])).toBe(true)
    expect(Object.isFrozen(first.evidence)).toBe(true)
    expect(Object.isFrozen(first.r6.lineage)).toBe(true)
    expect(Object.isFrozen(first.blockers)).toBe(true)
    expect(await validateProgramDR12PacketIntegrity(first)).toEqual([])
  })

  it("rejects forged or mutated packet contents by independently rehashing", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const forged = structuredClone(packet)
    ;(forged as { packetId: string }).packetId = "a".repeat(64)
    expect(await validateProgramDR12PacketIntegrity(forged)).toContain("PACKET_IDENTITY_MISMATCH")

    for (const mutate of [
      (value: typeof packet) => { (value.fields[0] as { value: number }).value = 1 },
      (value: typeof packet) => { (value.evidence[0] as { label: string }).label = "Altered" },
      (value: typeof packet) => { (value.r6.lineage as Record<string, string>).scoreRunId = "ALTERED" },
      (value: typeof packet) => { (value.blockers as string[])[0] = "Altered" },
      (value: typeof packet) => { (value.uncertainties as string[])[0] = "Altered" },
      (value: typeof packet) => { (value.contradictions as string[])[0] = "Altered" },
    ]) {
      const changed = structuredClone(packet)
      mutate(changed)
      expect(await validateProgramDR12PacketIntegrity(changed)).toContain("PACKET_IDENTITY_MISMATCH")
    }
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
    expect(valid.validationStatus).toBe("VALID")
    expect(valid.narrative.deterministicStateSummary).toContain("R10")
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

  it.each([
    "The company defaulted on its debt.",
    "Promoter pledge increased.",
    "Revenue fell sharply.",
    "Management guidance was cut.",
  ])("rejects unsupported textual factual output: %s", async (claim) => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(packet, createMemoryProgramDR12Cache())
    expect(validateProgramDR12Narrative(packet, {
      ...valid.narrative,
      aiInterpretation: claim,
    })).toBe("REJECTED_UNSUPPORTED_FACT")
    expect(validateProgramDR12Narrative(packet, {
      ...valid.narrative,
      factualClaims: [{
        ...valid.narrative.factualClaims[0]!,
        text: claim,
      }],
    })).toBe("REJECTED_UNSUPPORTED_FACT")
  })

  it("never trusts a cached VALID marker without complete revalidation", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(packet, createMemoryProgramDR12Cache())
    const attacks: readonly Partial<ProgramDR12Result>[] = [
      { validationStatus: "FORGED" as ProgramDR12Result["validationStatus"] },
      { inputPacketHash: "b".repeat(64) },
      { promptVersion: "FORGED" as typeof valid.promptVersion },
      { provider: "FORGED" as typeof valid.provider },
      { model: "FORGED" as typeof valid.model },
      { cacheKey: "FORGED" },
      { narrative: { ...valid.narrative, aiInterpretation: "The company defaulted on its debt." } },
      { narrative: { ...valid.narrative, citations: ["CIT_UNKNOWN"] } },
      { narrative: { ...valid.narrative, aiInterpretation: "Unsupported 999." } },
      { narrative: { ...valid.narrative, factualClaims: [] }, narrativeId: "c".repeat(64) },
    ]
    for (const attack of attacks) {
      const forged = { ...valid, ...attack } as ProgramDR12Result
      const cache: ProgramDR12Cache = { get: () => forged, set: () => undefined, clear: () => undefined }
      const regenerated = await generateProgramDR12LocalNarrative(packet, cache)
      expect(regenerated.cached).toBe(false)
      expect(regenerated.validationStatus).toBe("VALID")
      expect(regenerated.narrative.aiInterpretation).not.toContain("defaulted")
    }
  })

  it("treats serialized browser storage as untrusted input", async () => {
    const packet = await buildProgramDR12LocalReferencePacket()
    const valid = await generateProgramDR12LocalNarrative(packet, createMemoryProgramDR12Cache())
    const cacheKey = `${packet.packetId}::${PROGRAM_D_R12_PROMPT_VERSION}`
    const values = new Map<string, string>([[
      PROGRAM_D_R12_BROWSER_CACHE_KEY,
      JSON.stringify({
        [cacheKey]: {
          ...valid,
          narrative: {
            ...valid.narrative,
            aiInterpretation: "The company defaulted on its debt.",
          },
        },
      }),
    ]])
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value) },
      removeItem: (key: string) => { values.delete(key) },
    } as Storage

    const regenerated = await generateProgramDR12LocalNarrative(
      packet,
      createBrowserProgramDR12Cache(storage),
    )
    expect(regenerated.cached).toBe(false)
    expect(regenerated.validationStatus).toBe("VALID")
    expect(regenerated.narrative.aiInterpretation).not.toContain("defaulted")
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
