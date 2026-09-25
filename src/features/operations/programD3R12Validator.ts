import {
  PROGRAM_D_R12_PACKET_VERSION,
  PROGRAM_D_R12_LOCAL_INTERPRETATION,
  PROGRAM_D_R12_LOCAL_MONITORING_QUESTIONS,
  recomputeProgramDR12PacketId,
  type ProgramDR12FactPacket,
  type ProgramDR12Narrative,
  type ProgramDR12ValidationStatus,
} from "./programD3R12Contract"

export async function validateProgramDR12PacketIntegrity(
  packet: ProgramDR12FactPacket,
): Promise<readonly string[]> {
  const errors = [...validateProgramDR12FactPacket(packet)]
  if (await recomputeProgramDR12PacketId(packet) !== packet.packetId) {
    errors.push("PACKET_IDENTITY_MISMATCH")
  }
  return [...new Set(errors)]
}

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
    ...narrative.factualClaims.map((claim) => claim.text),
    ...narrative.supportingEvidence,
    ...narrative.contradictoryEvidence,
    ...narrative.uncertainties,
    ...narrative.blockedQuestions,
    narrative.aiInterpretation,
    ...narrative.monitoringQuestions,
  ]
}

export function programDR12DeterministicSummary(packet: ProgramDR12FactPacket): string {
  return `The canonical R10 state is ${packet.r10.state ?? "not available"}. The current R9 comparison state is ${packet.r9.state ?? "not available"}.`
}

export function programDR12GroundedClaimText(
  packet: ProgramDR12FactPacket,
  sourceFieldIds: readonly string[],
): string | null {
  const byId = new Map(packet.fields.map((field) => [field.id, field]))
  const fields = sourceFieldIds.map((id) => byId.get(id))
  if (!fields.length || fields.some((field) => !field)) return null
  return fields.map((field) => `${field!.label}: ${String(field!.value ?? "Not available")}`).join("; ")
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

export function parseProgramDR12Narrative(raw: unknown): ProgramDR12Narrative | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const row = raw as Record<string, unknown>
  const stringArray = (value: unknown): value is readonly string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string")

  if (typeof row.deterministicStateSummary !== "string") return null
  if (!Array.isArray(row.factualClaims)) return null
  const factualClaims = row.factualClaims.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null
    const claim = value as Record<string, unknown>
    if (typeof claim.claimId !== "string" || typeof claim.text !== "string") return null
    if (!["FACT", "DETERMINISTIC_STATE", "OWNER_CONTEXT"].includes(String(claim.claimType))) return null
    if (!stringArray(claim.sourceFieldIds) || !stringArray(claim.citationIds)) return null
    return {
      claimId: claim.claimId,
      text: claim.text,
      claimType: claim.claimType as "FACT" | "DETERMINISTIC_STATE" | "OWNER_CONTEXT",
      sourceFieldIds: claim.sourceFieldIds,
      citationIds: claim.citationIds,
    }
  })
  if (factualClaims.some((claim) => !claim)) return null
  if (!stringArray(row.supportingEvidence)) return null
  if (!stringArray(row.contradictoryEvidence)) return null
  if (!stringArray(row.uncertainties)) return null
  if (!stringArray(row.blockedQuestions)) return null
  if (typeof row.aiInterpretation !== "string") return null
  if (!stringArray(row.monitoringQuestions)) return null
  if (!stringArray(row.citations)) return null

  return {
    deterministicStateSummary: row.deterministicStateSummary,
    factualClaims: factualClaims as ProgramDR12Narrative["factualClaims"],
    supportingEvidence: row.supportingEvidence,
    contradictoryEvidence: row.contradictoryEvidence,
    uncertainties: row.uncertainties,
    blockedQuestions: row.blockedQuestions,
    aiInterpretation: row.aiInterpretation,
    monitoringQuestions: row.monitoringQuestions,
    citations: row.citations,
  }
}

export function validateUnknownProgramDR12Narrative(
  packet: ProgramDR12FactPacket,
  rawOutput: unknown,
): ProgramDR12ValidationStatus {
  const narrative = parseProgramDR12Narrative(rawOutput)
  if (!narrative) return "REJECTED_SCHEMA"
  return validateProgramDR12Narrative(packet, narrative, rawOutput)
}

export function validateProgramDR12Narrative(
  packet: ProgramDR12FactPacket,
  narrative: ProgramDR12Narrative,
  rawOutput: unknown = narrative,
): ProgramDR12ValidationStatus {
  if (validateProgramDR12FactPacket(packet).length) return "REJECTED_SCHEMA"
  if (containsAuthorityConflict(rawOutput)) return "REJECTED_AUTHORITY_CONFLICT"

  if (narrative.deterministicStateSummary !== programDR12DeterministicSummary(packet)) {
    return "REJECTED_UNSUPPORTED_FACT"
  }
  if (narrative.aiInterpretation !== PROGRAM_D_R12_LOCAL_INTERPRETATION) {
    return "REJECTED_UNSUPPORTED_FACT"
  }
  if (JSON.stringify(narrative.monitoringQuestions) !== JSON.stringify(PROGRAM_D_R12_LOCAL_MONITORING_QUESTIONS)) {
    return "REJECTED_UNSUPPORTED_FACT"
  }
  if (JSON.stringify(narrative.contradictoryEvidence) !== JSON.stringify(packet.contradictions)
    || JSON.stringify(narrative.uncertainties) !== JSON.stringify(packet.uncertainties)
    || JSON.stringify(narrative.blockedQuestions) !== JSON.stringify(packet.blockers)) {
    return "REJECTED_UNSUPPORTED_FACT"
  }
  if (JSON.stringify(narrative.supportingEvidence)
    !== JSON.stringify(packet.evidence.slice(0, 2).map((source) => source.label))) {
    return "REJECTED_UNSUPPORTED_FACT"
  }
  if (JSON.stringify(narrative.citations)
    !== JSON.stringify(packet.evidence.slice(0, 3).map((source) => source.citationId))) {
    return "REJECTED_UNSUPPORTED_CITATION"
  }

  const fieldById = new Map(packet.fields.map((field) => [field.id, field]))
  const claimIds = new Set<string>()
  for (const claim of narrative.factualClaims) {
    if (!claim.claimId || claimIds.has(claim.claimId) || !claim.sourceFieldIds.length) {
      return "REJECTED_UNSUPPORTED_FACT"
    }
    claimIds.add(claim.claimId)
    const groundedText = programDR12GroundedClaimText(packet, claim.sourceFieldIds)
    if (!groundedText || claim.text !== groundedText) return "REJECTED_UNSUPPORTED_FACT"
    const fields = claim.sourceFieldIds.map((id) => fieldById.get(id))
    if (fields.some((field) => !field || field.type !== claim.claimType)) {
      return "REJECTED_UNSUPPORTED_FACT"
    }
    for (const citationId of claim.citationIds) {
      const citation = packet.evidence.find((entry) => entry.citationId === citationId)
      if (!citation || !fields.some((field) => field?.provenanceId === citation.provenanceId)) {
        return "REJECTED_UNSUPPORTED_CITATION"
      }
    }
  }

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
