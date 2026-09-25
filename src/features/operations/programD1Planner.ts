import {
  PROGRAM_D_D0_CONTRACT_VERSION,
  PROGRAM_D_R11_DEPENDENCY_MATRIX,
  PROGRAM_D_R11_TRIGGER_TAXONOMY,
  type ProgramDR11Node,
} from "./programD0Contract"
import { programD1Sha256 } from "./programD1Identity"
import {
  PROGRAM_D_D1_VERSION,
  type ProgramD1Plan,
  type ProgramD1Trigger,
} from "./programD1Types"

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return [...new Set(values)].sort() as readonly T[]
}

function expandAffectedNodes(changedNodes: readonly ProgramDR11Node[]): readonly ProgramDR11Node[] {
  const affected = new Set<ProgramDR11Node>(changedNodes)
  let grew = true
  while (grew) {
    grew = false
    for (const entry of PROGRAM_D_R11_DEPENDENCY_MATRIX) {
      if (
        !affected.has(entry.node)
        && entry.dependsOnNodes.some((dependency) => affected.has(dependency))
      ) {
        affected.add(entry.node)
        grew = true
      }
    }
  }
  return uniqueSorted([...affected])
}

function dependencyMap(input: readonly { readonly node: ProgramDR11Node; readonly fingerprint: string }[]) {
  return Object.fromEntries(input.map((entry) => [entry.node, entry.fingerprint]))
}

export async function buildProgramD1Plan(
  trigger: ProgramD1Trigger,
): Promise<ProgramD1Plan> {
  const triggerContract = PROGRAM_D_R11_TRIGGER_TAXONOMY.find(
    (entry) => entry.type === trigger.type,
  )
  if (!triggerContract) throw new Error(`Unsupported Program D trigger: ${trigger.type}`)

  const current = dependencyMap(trigger.dependencyState)
  const previous = dependencyMap(trigger.previousDependencyState)
  const semanticChanges = uniqueSorted(
    trigger.changedNodes.filter((node) => current[node] !== previous[node]),
  )
  const affectedNodes = expandAffectedNodes(semanticChanges)

  const canonicalDependencyFingerprint = await programD1Sha256({
    contractVersion: PROGRAM_D_D0_CONTRACT_VERSION,
    dependencies: current,
  })

  const semanticJobId = await programD1Sha256({
    contractVersion: PROGRAM_D_D0_CONTRACT_VERSION,
    portfolioId: trigger.scope.portfolioId,
    normalizedSubjectScope: uniqueSorted(trigger.scope.subjectIds),
    triggerType: trigger.type,
    canonicalDependencyFingerprint,
    policyVersionSet: uniqueSorted(trigger.policyVersionSet),
    engineVersionSet: uniqueSorted(trigger.engineVersionSet),
  })

  const providerPlans = triggerContract.mayPlanProviderAcquisition
    ? trigger.providerRequirements.map((requirement) => ({
        ...requirement,
        subjectIds: uniqueSorted(requirement.subjectIds),
        physicalCallsExecuted: 0 as const,
        executionState: "DRY_RUN_ONLY" as const,
      }))
    : []

  return {
    version: PROGRAM_D_D1_VERSION,
    semanticJobId,
    trigger,
    canonicalDependencyFingerprint,
    affectedNodes,
    providerPlans,
    noOpReason: affectedNodes.length ? null : "UNCHANGED_CANONICAL_DEPENDENCY_FINGERPRINT",
    externalProviderCalls: 0,
    automaticDeterministicExecution: false,
  }
}
