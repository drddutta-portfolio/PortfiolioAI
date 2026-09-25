import {
  PROGRAM_D_R12_PACKET_VERSION,
  type ProgramDR12FactPacket,
  type ProgramDR12Narrative,
  type ProgramDR12ValidationStatus,
} from "./programD3R12Contract"

const INPUT_TYPES = new Set([
  "FACT",
  "DETERMINISTIC_STATE",
  "OWNER_CONTEXT",
  "UNCERTAINTY",
  "SOURCE_EXCERPT",
])

const FORBIDDEN_KEYS = new Set([
  "score",
  "recommendation",
  "materiality",
  "action",
  "priority",
  "quantity",
  "targetWeight",
  "minimumWeight",
  "maximumWeight",
  "exactAddPercentage",
  "exactTrimPercentage",
  "order",
  "tradeInstruction",
  "buy",
  "sell",
  "add",
  "trim",
  "exit",
])

export function validateProgramDR12FactPacket(packet: ProgramDR12FactPacket): readonly string[] {
  const errors: string[] = []
  if (packet.version !== PROGRAM_D_R12_PACKET_VERSION) errors.push("INVALID_PACKET_VERSION")
  if (!/^[a-f0-9]{64}$/u.test(packet.packetId)) errors.push("INVALID_PACKET_ID")
  if (!packet.portfolioId) errors.push("MISSING_PORTFOLIO_ID")
  if (!packet.asOf) errors.push("MISSING_AS_OF")
  if (!packet.fields.length) errors.push("EMPTY_TYPED_FIELDS")

  const fieldIds = new Set<string>()
  for (const field of packet.fields) {
    if (!field.id || fieldIds.has(field.id)) errors.push("INVALID_OR_DUPLICATE_FIELD_ID")
    fieldIds.add(field.id)
    if (!INPUT_TYPES.has(field.type)) errors.push("INVALID_FIELD_TYPE")
    if (!field.label) errors.push("MISSING_FIELD_LABEL")
    if (field.type === "SOURCE_EXCERPT" && !field.provenanceId) {
      errors.push("SOURCE_EXCERPT_MISSING_PROVENANCE")
    }
  }

  const citationIds = new Set<string>()
  for (const source of packet.evidence) {
    if (!source.citationId || citationIds.has(source.citationId)) {
      errors.push("INVALID_OR_DUPLICATE_CITATION_ID")
    }
    citationIds.add(source.citationId)
    if (!source.provenanceId) errors.push("MISSING_PROVENANCE_ID")
  }

  return [...new Set(errors)]
}

function textParts(narrative: ProgramDR12Narrative): readonly string[] {
  return [
    narrative.deterministicStateSummary,
    ...narrative.supportingEvidence,
    ...narrative.contradictoryEvidence,
    ...narrative.uncertainties,
    ...narrative.blockedQuestions,
    narrative.aiInterpretation,
    ...narrative.monitoringQuestions,
  ]
}

function packetNumbers(packet: ProgramDR12FactPacket) {
  return new Set(
    packet.fields
      .filter((field) => typeof field.value === "number")
      .map((field) => String(field.value)),
  )
}

function narrativeNumbers(narrative: ProgramDR12Narrative) {
  const values = new Set<string>()
  for (const part of textParts(narrative)) {
    for (const match of part.matchAll(/(?<![A-Za-z0-9])[-+]?\d+(?:\.\d+)?%?(?![A-Za-z0-9])/gu)) {
      values.add(match[0].replace(/%$/u, ""))
    }
  }
  return values
}

function containsAuthorityConflict(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (FORBIDDEN_KEYS.has(key)) return true
    if (typeof value === "object" && value !== null && containsAuthorityConflict(value)) return true
  }
  return false
}

export function validateProgramDR12Narrative(
  packet: ProgramDR12FactPacket,
  narrative: ProgramDR12Narrative,
  rawOutput: unknown = narrative,
): ProgramDR12ValidationStatus {
  if (validateProgramDR12FactPacket(packet).length) return "REJECTED_SCHEMA"
  if (containsAuthorityConflict(rawOutput)) return "REJECTED_AUTHORITY_CONFLICT"

  const allowedCitations = new Set(packet.evidence.map((source) => source.citationId))
  if (narrative.citations.some((citation) => !allowedCitations.has(citation))) {
    return "REJECTED_UNSUPPORTED_CITATION"
  }

  const allowedNumbers = packetNumbers(packet)
  for (const value of narrativeNumbers(narrative)) {
    if (!allowedNumbers.has(value)) return "REJECTED_UNSUPPORTED_FACT"
  }

  return "VALID"
}
