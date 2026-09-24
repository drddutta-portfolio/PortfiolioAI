import {
  compareProgramCR9ObservedStates,
  deduplicateProgramCR9Events,
} from "./r9MeaningfulChangeEngine"
import type { ProgramCR9MeaningfulChangeEvent } from "./r9MeaningfulChangeContract"
import type { ProgramCR9LiveObservedRow } from "./r9LivePortfolioAdapter"
import type { ProgramCR9ObservedState } from "./r9ObservedState"
import { projectProgramCR9Comparison } from "./r9Presentation"

export interface ProgramCR9LiveSessionComparison {
  readonly securityId: string
  readonly symbol: string
  readonly company: string
  readonly comparison: ReturnType<typeof compareProgramCR9ObservedStates>
  readonly presentation: ReturnType<typeof projectProgramCR9Comparison>
}

export interface ProgramCR9LiveSessionAdvance {
  readonly comparisons: readonly ProgramCR9LiveSessionComparison[]
  readonly newEvents: readonly ProgramCR9MeaningfulChangeEvent[]
  readonly nextObservedStates: ReadonlyMap<string, ProgramCR9ObservedState>
  readonly nextSeenEventIds: ReadonlySet<string>
}

export function advanceProgramCR9InMemorySession(
  previousStates: ReadonlyMap<string, ProgramCR9ObservedState>,
  currentRows: readonly ProgramCR9LiveObservedRow[],
  seenEventIds: ReadonlySet<string>,
): ProgramCR9LiveSessionAdvance {
  const sorted = [...currentRows].sort((left, right) => (
    left.securityId.localeCompare(right.securityId)
  ))
  const comparisons = sorted.map((row): ProgramCR9LiveSessionComparison => {
    const comparison = compareProgramCR9ObservedStates(
      previousStates.get(row.securityId) ?? null,
      row.observedState,
    )
    return {
      securityId: row.securityId,
      symbol: row.symbol,
      company: row.company,
      comparison,
      presentation: projectProgramCR9Comparison(comparison),
    }
  })

  const candidateEvents = comparisons
    .map((row) => row.comparison.event)
    .filter((event): event is ProgramCR9MeaningfulChangeEvent => event !== null)
  const uniqueEvents = deduplicateProgramCR9Events(candidateEvents)
  const newEvents = uniqueEvents.filter((event) => !seenEventIds.has(event.eventId))

  const nextObservedStates = new Map(
    sorted.map((row) => [row.securityId, row.observedState]),
  )
  const nextSeenEventIds = new Set(seenEventIds)
  for (const event of uniqueEvents) nextSeenEventIds.add(event.eventId)

  return {
    comparisons,
    newEvents,
    nextObservedStates,
    nextSeenEventIds,
  }
}
