import { programD1Sha256 } from "./programD1Identity"
import {
  PROGRAM_D_R12_D3_COST_CEILING,
  PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION,
  PROGRAM_D_R12_PROMPT_VERSION,
  type ProgramDR12FactPacket,
  type ProgramDR12Narrative,
  type ProgramDR12Result,
} from "./programD3R12Contract"
import type { ProgramDR12Cache } from "./programD3R12Cache"
import { validateProgramDR12Narrative } from "./programD3R12Validator"

const activeSubjects = new Set<string>()

function estimateTokens(value: unknown) {
  return Math.max(1, Math.ceil(JSON.stringify(value).length / 4))
}

function subjectKey(packet: ProgramDR12FactPacket) {
  return `${packet.portfolioId}::${packet.securityId ?? "PORTFOLIO"}::${packet.packetId}`
}

function localMockNarrative(packet: ProgramDR12FactPacket): ProgramDR12Narrative {
  const citations = packet.evidence.slice(0, 3).map((source) => source.citationId)
  const r10State = packet.r10.state ?? "not available"
  const r9State = packet.r9.state ?? "not available"

  return {
    deterministicStateSummary:
      `The canonical R10 state is ${r10State}. The current R9 comparison state is ${r9State}.`,
    supportingEvidence: packet.evidence.slice(0, 2).map((source) => source.label),
    contradictoryEvidence: [...packet.contradictions],
    uncertainties: [...packet.uncertainties],
    blockedQuestions: [...packet.blockers],
    aiInterpretation:
      "This local mock interpretation explains the supplied deterministic packet only. It does not change scoring, recommendation, materiality, Action Center precedence, sizing, or trading authority.",
    monitoringQuestions: [
      "Has any canonical evidence changed since this packet was created?",
      "Have the deterministic R9 or R10 states changed since this packet was created?",
    ],
    citations,
  }
}

export async function generateProgramDR12LocalNarrative(
  packet: ProgramDR12FactPacket,
  cache: ProgramDR12Cache,
  now: () => string = () => new Date().toISOString(),
): Promise<ProgramDR12Result> {
  const cacheKey = `${packet.packetId}::${PROGRAM_D_R12_PROMPT_VERSION}`
  const cached = cache.get(cacheKey)
  if (cached?.validationStatus === "VALID") {
    return { ...cached, cached: true }
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
    const narrative = localMockNarrative(packet)
    const validationStatus = validateProgramDR12Narrative(packet, narrative)
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
