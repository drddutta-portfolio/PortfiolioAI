import {
  PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
} from "./r8CoreHealthContract"
import {
  PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
  type ProgramCR8R7Requirement,
  type ProgramCR8SubEngineCode,
} from "./r8DependencyMatrix"
import {
  PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
} from "./r8ExitIntelligenceContract"
import {
  PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
} from "./r8PortfolioFitContract"
import {
  PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
} from "./r8PortfolioRiskContract"

export const PROGRAM_C_R8_AUTHORITY_REGISTRY_VERSION =
  "PROGRAM_C_R8_AUTHORITY_REGISTRY_V1" as const

export interface ProgramCR8AuthorityRegistryEntry {
  readonly registryVersion: typeof PROGRAM_C_R8_AUTHORITY_REGISTRY_VERSION
  readonly subEngine: ProgramCR8SubEngineCode
  readonly contractVersion: string
  readonly dependencyMatrixVersion: typeof PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION
  readonly r7Requirement: ProgramCR8R7Requirement
  readonly executionAuthority: "C2_NOT_AUTHORIZED"
  readonly numericSizingAuthority: "NONE"
  readonly providerAuthority: "NONE"
  readonly aiDecisionAuthority: "NONE"
  readonly persistenceAuthority: "NONE"
  readonly ownerMutationAuthority: "NONE"
  readonly sourceAuthority: "PROGRAM_C_C1_OWNER_AUTHORIZED_CONTRACT_FREEZE"
}

export const PROGRAM_C_R8_AUTHORITY_REGISTRY:
  readonly ProgramCR8AuthorityRegistryEntry[] = [
    {
      registryVersion: PROGRAM_C_R8_AUTHORITY_REGISTRY_VERSION,
      subEngine: "CORE_HEALTH",
      contractVersion: PROGRAM_C_R8_CORE_HEALTH_CONTRACT_VERSION,
      dependencyMatrixVersion: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      r7Requirement: "OPTIONAL_CONTEXT",
      executionAuthority: "C2_NOT_AUTHORIZED",
      numericSizingAuthority: "NONE",
      providerAuthority: "NONE",
      aiDecisionAuthority: "NONE",
      persistenceAuthority: "NONE",
      ownerMutationAuthority: "NONE",
      sourceAuthority: "PROGRAM_C_C1_OWNER_AUTHORIZED_CONTRACT_FREEZE",
    },
    {
      registryVersion: PROGRAM_C_R8_AUTHORITY_REGISTRY_VERSION,
      subEngine: "PORTFOLIO_FIT",
      contractVersion: PROGRAM_C_R8_PORTFOLIO_FIT_CONTRACT_VERSION,
      dependencyMatrixVersion: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      r7Requirement: "NOT_REQUIRED",
      executionAuthority: "C2_NOT_AUTHORIZED",
      numericSizingAuthority: "NONE",
      providerAuthority: "NONE",
      aiDecisionAuthority: "NONE",
      persistenceAuthority: "NONE",
      ownerMutationAuthority: "NONE",
      sourceAuthority: "PROGRAM_C_C1_OWNER_AUTHORIZED_CONTRACT_FREEZE",
    },
    {
      registryVersion: PROGRAM_C_R8_AUTHORITY_REGISTRY_VERSION,
      subEngine: "PORTFOLIO_RISK",
      contractVersion: PROGRAM_C_R8_PORTFOLIO_RISK_CONTRACT_VERSION,
      dependencyMatrixVersion: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      r7Requirement: "NOT_REQUIRED",
      executionAuthority: "C2_NOT_AUTHORIZED",
      numericSizingAuthority: "NONE",
      providerAuthority: "NONE",
      aiDecisionAuthority: "NONE",
      persistenceAuthority: "NONE",
      ownerMutationAuthority: "NONE",
      sourceAuthority: "PROGRAM_C_C1_OWNER_AUTHORIZED_CONTRACT_FREEZE",
    },
    {
      registryVersion: PROGRAM_C_R8_AUTHORITY_REGISTRY_VERSION,
      subEngine: "EXIT_INTELLIGENCE",
      contractVersion: PROGRAM_C_R8_EXIT_INTELLIGENCE_CONTRACT_VERSION,
      dependencyMatrixVersion: PROGRAM_C_R8_DEPENDENCY_MATRIX_VERSION,
      r7Requirement: "OPTIONAL_CONTEXT",
      executionAuthority: "C2_NOT_AUTHORIZED",
      numericSizingAuthority: "NONE",
      providerAuthority: "NONE",
      aiDecisionAuthority: "NONE",
      persistenceAuthority: "NONE",
      ownerMutationAuthority: "NONE",
      sourceAuthority: "PROGRAM_C_C1_OWNER_AUTHORIZED_CONTRACT_FREEZE",
    },
  ] as const
