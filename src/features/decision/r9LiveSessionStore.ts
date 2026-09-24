import type { ProgramCR9LiveObservedProjection } from "./r9LivePortfolioAdapter"
import {
  advanceProgramCR9InMemorySession,
  type ProgramCR9LiveSessionAdvance,
} from "./r9LiveSession"
import type { ProgramCR9ObservedState } from "./r9ObservedState"

export interface ProgramCR9LiveSessionStore {
  readonly getSnapshot: () => ProgramCR9LiveSessionAdvance | null
  readonly subscribe: (listener: () => void) => () => void
  readonly ingest: (projection: ProgramCR9LiveObservedProjection | null) => void
}

export function createProgramCR9LiveSessionStore(): ProgramCR9LiveSessionStore {
  let snapshot: ProgramCR9LiveSessionAdvance | null = null
  let previousStates: ReadonlyMap<string, ProgramCR9ObservedState> = new Map()
  let seenEventIds: ReadonlySet<string> = new Set()
  let lastProjection: ProgramCR9LiveObservedProjection | null = null
  const listeners = new Set<() => void>()

  const emit = () => {
    for (const listener of listeners) listener()
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    ingest: (projection) => {
      if (projection === lastProjection) return
      lastProjection = projection

      if (!projection) {
        if (snapshot !== null) {
          snapshot = null
          emit()
        }
        return
      }

      const nextSession = advanceProgramCR9InMemorySession(
        previousStates,
        projection.rows,
        seenEventIds,
      )
      previousStates = nextSession.nextObservedStates
      seenEventIds = nextSession.nextSeenEventIds
      snapshot = nextSession
      emit()
    },
  }
}
