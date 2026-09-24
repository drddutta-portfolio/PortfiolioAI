import { programCR8SemanticFingerprint } from "./r8Determinism"
import { PROGRAM_C_R9_RULE_REGISTRY_VERSION } from "./r9MeaningfulChangeContract"

export interface ProgramCR9EventIdentityInput {
  readonly securityId: string
  readonly portfolioId: string
  readonly previousObservedStateId: string
  readonly currentObservedStateId: string
  readonly ruleVersion?: string
}

function required(value: string, field: string) {
  const clean = value.trim()
  if (!clean) throw new Error(`Program C R9 event identity requires ${field}.`)
  return clean
}

export function programCR9ChangeEventId(input: ProgramCR9EventIdentityInput) {
  return programCR8SemanticFingerprint("PROGRAM_C_R9_EVENT", {
    securityId: required(input.securityId, "securityId"),
    portfolioId: required(input.portfolioId, "portfolioId"),
    previousObservedStateId: required(
      input.previousObservedStateId,
      "previousObservedStateId",
    ),
    currentObservedStateId: required(
      input.currentObservedStateId,
      "currentObservedStateId",
    ),
    ruleVersion: input.ruleVersion?.trim() || PROGRAM_C_R9_RULE_REGISTRY_VERSION,
  })
}
