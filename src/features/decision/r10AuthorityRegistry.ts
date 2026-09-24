import {
  PROGRAM_C_R10_CONTRACT_VERSION,
  PROGRAM_C_R10_PRECEDENCE_VERSION,
} from "./r10ActionCenterContract"

export const PROGRAM_C_R10_AUTHORITY_REGISTRY_VERSION =
  "PROGRAM_C_R10_AUTHORITY_REGISTRY_V1" as const

export const PROGRAM_C_R10_AUTHORITY = {
  registryVersion: PROGRAM_C_R10_AUTHORITY_REGISTRY_VERSION,
  contractVersion: PROGRAM_C_R10_CONTRACT_VERSION,
  precedenceVersion: PROGRAM_C_R10_PRECEDENCE_VERSION,
  executionAuthority: "C4_OWNER_AUTHORIZED_READ_ONLY",
  actionCenterAuthority: "ONE_CANONICAL_R10_COLLECTION",
  conflictAuthority: "EXPLICIT_PRESERVATION_NO_AVERAGING",
  addReviewAuthority: "NOT_PROMOTED",
  trimReviewAuthority: "NOT_PROMOTED",
  exitReviewAuthority: "R8_EXIT_INTELLIGENCE_ONLY",
  numericSizingAuthority: "NONE",
  aiDecisionAuthority: "NONE",
  providerAuthority: "NONE",
  persistenceAuthority: "NONE",
  ownerMutationAuthority: "NONE",
  schedulerAuthority: "NONE",
  tradingAuthority: "NONE",
} as const
