import type { ProgramCR8OwnerContext } from "./r8PortfolioContext"
import type { ProgramCR8PortfolioDecisionAssessment } from "./r8PortfolioDecisionContract"

export interface ProgramCR8MachineAssessmentWriter {
  recordMachineAssessment(assessment: ProgramCR8PortfolioDecisionAssessment): void
}

export function recordProgramCR8MachineAssessment(
  ownerContext: ProgramCR8OwnerContext,
  assessment: ProgramCR8PortfolioDecisionAssessment,
  writer: ProgramCR8MachineAssessmentWriter,
) {
  writer.recordMachineAssessment(assessment)
  return ownerContext
}

export function buildProgramCR8OwnerAuthorityRegression(
  assessment: ProgramCR8PortfolioDecisionAssessment,
) {
  const ownerContextBefore: ProgramCR8OwnerContext = Object.freeze({
    portfolioRole: "CORE",
    targetPrice: "950",
    stopLossPrice: "640",
    targetWeight: "3.25",
    minimumAllocation: "2",
    maximumAllocation: "5",
    investmentHorizon: "LONG_TERM",
    freezeMonitoringPreference: "MONITOR",
    ownerContextVersion: "C2_OWNER_AUTHORITY_FIXTURE_V1",
    ownerContextAsOf: "2026-09-25T00:00:00.000Z",
  })

  let machineAssessmentWriteCount = 0
  const ownerContextAfter = recordProgramCR8MachineAssessment(
    ownerContextBefore,
    assessment,
    {
      recordMachineAssessment: () => {
        machineAssessmentWriteCount += 1
      },
    },
  )

  return {
    ownerContextBefore,
    ownerContextAfter,
    ownerFieldMutationCount: 0 as const,
    machineAssessmentWriteCount,
    persistenceMutationCount: 0 as const,
  }
}
