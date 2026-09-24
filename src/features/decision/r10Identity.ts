import { programCR8SemanticFingerprint } from "./r8Determinism"
import {
  PROGRAM_C_R10_CONTRACT_VERSION,
  PROGRAM_C_R10_PRECEDENCE_VERSION,
} from "./r10ActionCenterContract"

export interface ProgramCR10IdentityInput {
  readonly securityId: string
  readonly portfolioId: string
  readonly r8DecisionRunId: string
  readonly r9CurrentObservedStateId: string | null
  readonly r9ChangeEventId: string | null
  readonly ownerContextVersion: string | null
  readonly ownerThresholdContextId: string
}

function required(value: string, field: string) {
  const clean = value.trim()
  if (!clean) throw new Error(`Program C R10 identity requires ${field}.`)
  return clean
}

export function programCR10IntegratedAttentionId(
  input: ProgramCR10IdentityInput,
) {
  return programCR8SemanticFingerprint("PROGRAM_C_R10_ATTENTION", {
    securityId: required(input.securityId, "securityId"),
    portfolioId: required(input.portfolioId, "portfolioId"),
    r8DecisionRunId: required(input.r8DecisionRunId, "r8DecisionRunId"),
    r9CurrentObservedStateId:
      input.r9CurrentObservedStateId?.trim() || "R9_CURRENT_STATE_NONE",
    r9ChangeEventId: input.r9ChangeEventId?.trim() || "R9_EVENT_NONE",
    ownerContextVersion:
      input.ownerContextVersion?.trim() || "OWNER_CONTEXT_VERSION_NONE",
    ownerThresholdContextId: required(
      input.ownerThresholdContextId,
      "ownerThresholdContextId",
    ),
    contractVersion: PROGRAM_C_R10_CONTRACT_VERSION,
    precedenceVersion: PROGRAM_C_R10_PRECEDENCE_VERSION,
  })
}
