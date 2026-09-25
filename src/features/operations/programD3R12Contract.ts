import { programD1Sha256 } from "./programD1Identity"

export const PROGRAM_D_R12_PACKET_VERSION = "PROGRAM_D_R12_FACT_PACKET_V1" as const
export const PROGRAM_D_R12_PROMPT_VERSION = "PROGRAM_D_R12_PROMPT_V1" as const
export const PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION = "PROGRAM_D_D3_R12_LOCAL_V1" as const

export type ProgramDR12InputType =
  | "FACT"
  | "DETERMINISTIC_STATE"
  | "OWNER_CONTEXT"
  | "UNCERTAINTY"
  | "SOURCE_EXCERPT"

export type ProgramDR12NarrativeType =
  | "COMPANY_REVIEW"
  | "R9_CHANGE_EXPLANATION"
  | "R10_ACTION_EXPLANATION"
  | "BOUNDED_PORTFOLIO_BRIEF"

export interface ProgramDR12TypedField {
  readonly id: string
  readonly type: ProgramDR12InputType
  readonly label: string
  readonly value: string | number | boolean | null
  readonly provenanceId: string | null
}

export interface ProgramDR12EvidenceReference {
  readonly citationId: string
  readonly provenanceId: string
  readonly label: string
  readonly retrievedAt: string | null
  readonly freshUntil: string | null
  readonly displaySafeExcerpt: string | null
}

export interface ProgramDR12StageState {
  readonly state: string | null
  readonly lineage: Readonly<Record<string, string | number | null>>
}

export interface ProgramDR12FactPacket {
  readonly version: typeof PROGRAM_D_R12_PACKET_VERSION
  readonly packetId: string
  readonly portfolioId: string
  readonly securityId: string | null
  readonly symbol: string | null
  readonly company: string | null
  readonly narrativeType: ProgramDR12NarrativeType
  readonly asOf: string
  readonly fields: readonly ProgramDR12TypedField[]
  readonly evidence: readonly ProgramDR12EvidenceReference[]
  readonly r6: ProgramDR12StageState
  readonly r7: ProgramDR12StageState
  readonly r8: ProgramDR12StageState
  readonly r9: ProgramDR12StageState
  readonly r10: ProgramDR12StageState
  readonly blockers: readonly string[]
  readonly uncertainties: readonly string[]
  readonly contradictions: readonly string[]
}

export type ProgramDR12FactPacketInput = Omit<
  ProgramDR12FactPacket,
  "version" | "packetId"
>

export async function buildProgramDR12FactPacket(
  input: ProgramDR12FactPacketInput,
): Promise<ProgramDR12FactPacket> {
  const safeInput = structuredClone(input)
  const packetId = await programD1Sha256({
    version: PROGRAM_D_R12_PACKET_VERSION,
    ...safeInput,
  })
  return deepFreeze({
    version: PROGRAM_D_R12_PACKET_VERSION,
    packetId,
    ...safeInput,
  })
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) deepFreeze(nested)
    Object.freeze(value)
  }
  return value
}

export async function recomputeProgramDR12PacketId(
  packet: ProgramDR12FactPacket,
): Promise<string> {
  const payload: Record<string, unknown> = { ...packet }
  delete payload.packetId
  return programD1Sha256(payload)
}

export interface ProgramDR12FactualClaim {
  readonly claimId: string
  readonly text: string
  readonly claimType: "FACT" | "DETERMINISTIC_STATE" | "OWNER_CONTEXT"
  readonly sourceFieldIds: readonly string[]
  readonly citationIds: readonly string[]
}

export interface ProgramDR12Narrative {
  readonly deterministicStateSummary: string
  readonly factualClaims: readonly ProgramDR12FactualClaim[]
  readonly supportingEvidence: readonly string[]
  readonly contradictoryEvidence: readonly string[]
  readonly uncertainties: readonly string[]
  readonly blockedQuestions: readonly string[]
  readonly aiInterpretation: string
  readonly monitoringQuestions: readonly string[]
  readonly citations: readonly string[]
}

export const PROGRAM_D_R12_LOCAL_INTERPRETATION =
  "This local mock interpretation explains the supplied deterministic packet only. It does not change scoring, recommendation, materiality, Action Center precedence, sizing, or trading authority." as const

export const PROGRAM_D_R12_LOCAL_MONITORING_QUESTIONS = [
  "Has any canonical evidence changed since this packet was created?",
  "Have the deterministic R9 or R10 states changed since this packet was created?",
] as const

export type ProgramDR12ValidationStatus =
  | "VALID"
  | "REJECTED_SCHEMA"
  | "REJECTED_UNSUPPORTED_FACT"
  | "REJECTED_UNSUPPORTED_CITATION"
  | "REJECTED_AUTHORITY_CONFLICT"

export interface ProgramDR12Result {
  readonly version: typeof PROGRAM_D_R12_LOCAL_IMPLEMENTATION_VERSION
  readonly narrativeId: string
  readonly cacheKey: string
  readonly inputPacketHash: string
  readonly promptVersion: typeof PROGRAM_D_R12_PROMPT_VERSION
  readonly provider: "LOCAL_MOCK"
  readonly model: "PROGRAM_D_R12_LOCAL_MOCK_V1"
  readonly generatedAt: string
  readonly narrative: ProgramDR12Narrative
  readonly validationStatus: ProgramDR12ValidationStatus
  readonly usage: {
    readonly inputTokensEstimated: number
    readonly outputTokensEstimated: number
    readonly externalCost: 0
  }
  readonly cached: boolean
}

export const PROGRAM_D_R12_D3_COST_CEILING = {
  mode: "LOCAL_MOCK_ONLY",
  externalCallsPerRun: 0,
  externalDailyCalls: 0,
  externalWeeklyCalls: 0,
  externalCostPerRun: 0,
  externalDailyCost: 0,
  externalWeeklyCost: 0,
  maximumConcurrentGenerations: 1,
  maximumTransientRetries: 1,
  scheduledGenerationAllowed: false,
  portfolioWideEventDrivenAllowed: false,
} as const
