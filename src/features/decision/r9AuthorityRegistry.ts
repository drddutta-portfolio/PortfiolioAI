import {
  PROGRAM_C_R9_CONTRACT_VERSION,
  PROGRAM_C_R9_RULE_REGISTRY_VERSION,
} from "./r9MeaningfulChangeContract"
import { PROGRAM_C_R9_OBSERVED_STATE_VERSION } from "./r9ObservedState"

export const PROGRAM_C_R9_AUTHORITY_REGISTRY_VERSION =
  "PROGRAM_C_R9_AUTHORITY_REGISTRY_V1" as const

export const PROGRAM_C_R9_AUTHORITY = {
  registryVersion: PROGRAM_C_R9_AUTHORITY_REGISTRY_VERSION,
  contractVersion: PROGRAM_C_R9_CONTRACT_VERSION,
  observedStateVersion: PROGRAM_C_R9_OBSERVED_STATE_VERSION,
  ruleRegistryVersion: PROGRAM_C_R9_RULE_REGISTRY_VERSION,
  executionAuthority: "C3_OWNER_AUTHORIZED_READ_ONLY",
  materialityAuthority: "VERSIONED_DETERMINISTIC_RULES_ONLY",
  numericThresholdAuthority: "NONE",
  aiDecisionAuthority: "NONE",
  providerAuthority: "NONE",
  persistenceAuthority: "NONE",
  durableNotificationStateAuthority: "NONE",
  ownerMutationAuthority: "NONE",
  sizingAuthority: "NONE",
  schedulerAuthority: "NONE",
  tradingAuthority: "NONE",
} as const
