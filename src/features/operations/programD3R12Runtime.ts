import { programD1Sha256 } from "./programD1Identity"
import {
  PROGRAM_D_R12_D3_COST_CEILING,
  PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION,
  PROGRAM_D_R12_PROMPT_VERSION,
  PROGRAM_D_R12_LOCAL_INTERPRETATION,
  PROGRAM_D_R12_LOCAL_MONITORING_QUESTIONS,
  type ProgramDR12FactPacket,
  type ProgramDR12Narrative,
  type ProgramDR12Result,
} from "./programD3R12Contract"
import type { ProgramDR12Cache } from "./programD3R12Cache"
import {
  parseProgramDR12Narrative,
  programDR12DeterministicSummary,
  programDR12GroundedClaimText,
  validateProgramDR12Narrative,
  validateProgramDR12PacketIntegrity,
} from "./programD3R12Validator"

const activeSubjects = new Set<string>()

function estimateTokens(value: unknown) {
  return Math.max(1, Math.ceil(JSON.stringify(value).length / 4))
}

function subjectKey(packet: ProgramDR12FactPacket) {
  return `${packet.portfolioId}::${packet.securityId ?? "PORTFOLIO"}::${packet.packetId}`
}

function localMockNarrative(packet: ProgramDR12FactPacket): ProgramDR12Narrative {
  const citations = packet.evidence.slice(0, 3).map((source) => source.citationId)

  return {
    deterministicStateSummary: programDR12DeterministicSummary(packet),
    factualClaims: [
      {
        claimId: "CLAIM_R10_STATE",
        text: programDR12GroundedClaimText(packet, ["r10_state"])!,
        claimType: "DETERMINISTIC_STATE",
        sourceFieldIds: ["r10_state"],
        citationIds: ["CIT_R10"],
      },
      {
        claimId: "CLAIM_EVIDENCE_FRESHNESS",
        text: programDR12GroundedClaimText(packet, ["evidence_freshness"])!,
        claimType: "FACT",
        sourceFieldIds: ["evidence_freshness"],
        citationIds: [],
      },
    ],
    supportingEvidence: packet.evidence.slice(0, 2).map((source) => source.label),
    contradictoryEvidence: [...packet.contradictions],
    uncertainties: [...packet.uncertainties],
    blockedQuestions: [...packet.blockers],
    aiInterpretation: PROGRAM_D_R12_LOCAL_INTERPRETATION,
    monitoringQuestions: PROGRAM_D_R12_LOCAL_MONITORING_QUESTIONS,
    citations,
  }
}

export async function generateProgramDR12LocalNarrative(
  packet: ProgramDR12FactPacket,
  cache: ProgramDR12Cache,
  now: () => string = () => new Date().toISOString(),
  generate: (packet: ProgramDR12FactPacket) => Promise<unknown> = (value) => Promise.resolve(localMockNarrative(value)),
): Promise<ProgramDR12Result> {
  if ((await validateProgramDR12PacketIntegrity(packet)).length) {
    throw new Error("R12_PACKET_INTEGRITY_FAILED")
  }
  const cacheKey = `${packet.packetId}::${PROGRAM_D_R12_PROMPT_VERSION}`
  const cached = cache.get(cacheKey)
  if (cached) {
    const parsed = parseProgramDR12Narrative(cached.narrative)
    const expectedId = parsed ? await programD1Sha256({
      packetId: packet.packetId,
      promptVersion: PROGRAM_D_R12_PROMPT_VERSION,
      provider: "LOCAL_MOCK",
      narrative: parsed,
    }) : null
    const validCached = cached.version === PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION
      && cached.validationStatus === "VALID"
      && cached.cacheKey === cacheKey
      && cached.promptVersion === PROGRAM_D_R12_PROMPT_VERSION
      && cached.provider === "LOCAL_MOCK"
      && cached.model === "PROGRAM_D_R12_LOCAL_MOCK_V1"
      && cached.inputPacketHash === packet.packetId
      && parsed !== null
      && validateProgramDR12Narrative(packet, parsed, cached.narrative) === "VALID"
      && cached.narrativeId === expectedId
    if (validCached) return { ...cached, narrative: parsed, cached: true }
  }

  const key = subjectKey(packet)
  if (activeSubjects.has(key)) {
    throw new Error("R12_GENERATION_ALREADY_ACTIVE")
  }
  if (activeSubjects.size >= PROGRAM_D_R12_D3_COST_CEILING.maximumConcurrentGenerations) {
    throw new Error("R12_LOCAL_CONCURRENCY_LIMIT")
  }

  activeSubjects.add(key)
  try {
    const rawNarrative = await generate(packet)
    const narrative = parseProgramDR12Narrative(rawNarrative)
    if (!narrative) throw new Error("R12_OUTPUT_SCHEMA_INVALID")
    const validationStatus = validateProgramDR12Narrative(packet, narrative, rawNarrative)
    const generatedAt = now()
    const narrativeId = await programD1Sha256({
      packetId: packet.packetId,
      promptVersion: PROGRAM_D_R12_PROMPT_VERSION,
      provider: "LOCAL_MOCK",
      narrative,
    })
    const result: ProgramDR12Result = {
      version: PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION,
      narrativeId,
      cacheKey,
      inputPacketHash: packet.packetId,
      promptVersion: PROGRAM_D_R12_PROMPT_VERSION,
      provider: "LOCAL_MOCK",
      model: "PROGRAM_D_R12_LOCAL_MOCK_V1",
      generatedAt,
      narrative,
      validationStatus,
      usage: {
        inputTokensEstimated: estimateTokens(packet),
        outputTokensEstimated: estimateTokens(narrative),
        externalCost: 0,
      },
      cached: false,
    }
    if (validationStatus === "VALID") cache.set(cacheKey, result)
    return result
  } finally {
    activeSubjects.delete(key)
  }
}
