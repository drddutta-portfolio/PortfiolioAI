import { PROGRAM_C_R8_AUTHORITY_REGISTRY } from "./r8AuthorityRegistry"

export const PROGRAM_C_R8_C2_EXECUTION_AUTHORITY_VERSION =
  "PROGRAM_C_R8_C2_EXECUTION_AUTHORITY_V1" as const

export const PROGRAM_C_R8_C2_EXECUTION_AUTHORITY =
  PROGRAM_C_R8_AUTHORITY_REGISTRY.map((entry) => ({
    ...entry,
    c2AuthorityVersion: PROGRAM_C_R8_C2_EXECUTION_AUTHORITY_VERSION,
    executionAuthority: "C2_OWNER_AUTHORIZED_READ_ONLY" as const,
    persistenceAuthority: "NONE" as const,
    providerAuthority: "NONE" as const,
    aiDecisionAuthority: "NONE" as const,
    numericSizingAuthority: "NONE" as const,
    ownerMutationAuthority: "NONE" as const,
  }))
