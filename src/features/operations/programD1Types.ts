import type {
  ProgramDR11Node,
  ProgramDR11TriggerType,
} from "./programD0Contract"

export const PROGRAM_D_D1_VERSION = "PROGRAM_D_D1_LOCAL_ORCHESTRATION_V2" as const

export type ProgramD1ProviderCode = "TRENDLYNE" | "ANGEL_ONE"

export interface ProgramD1Scope {
  readonly portfolioId: string
  readonly subjectIds: readonly string[]
  readonly domains: readonly string[]
}

export interface ProgramD1DependencyState {
  readonly node: ProgramDR11Node
  readonly fingerprint: string
}

export interface ProgramD1ProviderRequirement {
  readonly provider: ProgramD1ProviderCode
  readonly domain: string
  readonly subjectIds: readonly string[]
  readonly estimatedPhysicalCalls: number
}

export interface ProgramD1Trigger {
  readonly type: ProgramDR11TriggerType
  readonly scope: ProgramD1Scope
  readonly changedNodes: readonly ProgramDR11Node[]
  readonly dependencyState: readonly ProgramD1DependencyState[]
  readonly previousDependencyState: readonly ProgramD1DependencyState[]
  readonly providerRequirements: readonly ProgramD1ProviderRequirement[]
  readonly policyVersionSet: readonly string[]
  readonly engineVersionSet: readonly string[]
}

export interface ProgramD1ProviderDryRunPlan {
  readonly provider: ProgramD1ProviderCode
  readonly domain: string
  readonly subjectIds: readonly string[]
  readonly estimatedPhysicalCalls: number
  readonly physicalCallsExecuted: 0
  readonly executionState: "DRY_RUN_ONLY"
}

export interface ProgramD1Plan {
  readonly version: typeof PROGRAM_D_D1_VERSION
  readonly semanticJobId: string
  readonly trigger: ProgramD1Trigger
  readonly canonicalDependencyFingerprint: string
  readonly affectedNodes: readonly ProgramDR11Node[]
  readonly providerPlans: readonly ProgramD1ProviderDryRunPlan[]
  readonly noOpReason: string | null
  readonly externalProviderCalls: 0
  readonly automaticDeterministicExecution: false
}

export type ProgramD1RunState =
  | "PLANNED"
  | "RUNNING"
  | "NO_OP"
  | "SUCCEEDED"
  | "PARTIAL"
  | "FAILED"
  | "BLOCKED_LEASE"
  | "REVIEW_REQUIRED"

export type ProgramD1StageState =
  | "PENDING"
  | "DRY_RUN_COMPLETED"
  | "SKIPPED_NO_OP"
  | "FAILED"

export interface ProgramD1StageCheckpoint {
  readonly node: ProgramDR11Node
  readonly state: ProgramD1StageState
  readonly detail: string
}

export interface ProgramD1RoutedEvent {
  readonly sourceNode: ProgramDR11Node
  readonly targetNode: ProgramDR11Node
  readonly semanticJobId: string
  readonly mode: "DRY_RUN_EVENT"
}

export interface ProgramD1RunRecord {
  readonly version: typeof PROGRAM_D_D1_VERSION
  readonly runId: string
  readonly semanticJobId: string
  readonly leaseKey: string
  readonly state: ProgramD1RunState
  readonly triggerType: ProgramDR11TriggerType
  readonly createdAt: string
  readonly updatedAt: string
  readonly checkpoints: readonly ProgramD1StageCheckpoint[]
  readonly providerPlans: readonly ProgramD1ProviderDryRunPlan[]
  readonly routedEvents: readonly ProgramD1RoutedEvent[]
  readonly externalProviderCalls: 0
  readonly automaticDeterministicExecution: false
  readonly reusedExistingSemanticRun: boolean
  readonly resumedFromCheckpoint: boolean
  readonly failureReason: string | null
}

export interface ProgramD1LocalState {
  readonly version: typeof PROGRAM_D_D1_VERSION
  readonly runs: readonly ProgramD1RunRecord[]
  readonly leases: Readonly<Record<string, { readonly ownerRunId: string; readonly acquiredAt: string }>>
}
